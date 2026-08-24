import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Clock } from './components/clock/Clock'
import type { ClockData, ClockSize, ClockTone } from './components/clock/types'
import { DurationPicker } from './components/focus/DurationPicker'
import { IntentionInput } from './components/focus/IntentionInput'
import { SettingsPanel } from './components/settings/SettingsPanel'
import { Button } from './components/ui/Button'
import { CursorDot } from './components/ui/CursorDot'
import { GridReveal } from './components/ui/GridReveal'
import { InstagramIcon, SettingsIcon } from './components/ui/icons'
import { Intro } from './components/ui/Intro'
import { SegmentedControl } from './components/ui/SegmentedControl'
import { SvgFilters } from './components/ui/SvgFilters'
import { Wordmark } from './components/ui/Wordmark'
import { useFocusSession } from './hooks/useFocusSession'
import { useFullscreen } from './hooks/useFullscreen'
import { useNow } from './hooks/useNow'
import { usePersistentState } from './hooks/usePersistentState'
import { useReducedMotion } from './hooks/useReducedMotion'
import { useTheme } from './hooks/useTheme'
import { primeAudio } from './lib/sound'
import { formatDuration } from './lib/time'
import type { FocusSettings, Theme, ViewMode } from './types'

const DEFAULT_SETTINGS: FocusSettings = {
  clock: 'digital',
  duration: 25 * 60,
  breakDuration: 5 * 60,
  intention: '',
  soundMode: 'system',
  volume: 0.4,
  cyclesUntilLongBreak: 4,
}

export default function App() {
  const [settings, setSettings] = usePersistentState<FocusSettings>('settings', DEFAULT_SETTINGS)
  const [mode, setMode] = usePersistentState<ViewMode>('mode', 'focus')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [focusRoom, setFocusRoom] = useState(false)

  const reduced = useReducedMotion()
  const [theme, setTheme] = useTheme()
  const fullscreen = useFullscreen()
  const now = useNow(1000)

  const session = useFocusSession({
    durationSeconds: settings.duration,
    breakSeconds: settings.breakDuration,
    intention: settings.intention,
    soundMode: settings.soundMode,
    volume: settings.volume,
    cyclesUntilLongBreak: settings.cyclesUntilLongBreak,
  })

  const { stage, timer } = session
  const isSessionActive = stage === 'focus' || stage === 'break'

  const patchSettings = useCallback(
    (patch: Partial<FocusSettings>) => setSettings((prev) => ({ ...prev, ...patch })),
    [setSettings],
  )

  /* Audio can only start after a gesture, so unlock on the first interaction. */
  useEffect(() => {
    const unlock = () => primeAudio()
    window.addEventListener('pointerdown', unlock, { once: true })
    window.addEventListener('keydown', unlock, { once: true })
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [])

  /* If the browser drops out of fullscreen on its own (Esc, F11), leave the
     focus room with it — but only when fullscreen was what we entered. */
  const usedFullscreen = useRef(false)
  useEffect(() => {
    const onChange = () => {
      if (!document.fullscreenElement && usedFullscreen.current) {
        usedFullscreen.current = false
        setFocusRoom(false)
      }
    }
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const enterFocusRoom = useCallback(async () => {
    setFocusRoom(true)
    usedFullscreen.current = await fullscreen.enter()
  }, [fullscreen])

  const exitFocusRoom = useCallback(() => {
    setFocusRoom(false)
    usedFullscreen.current = false
    void fullscreen.exit()
  }, [fullscreen])

  /* Keyboard shortcuts — inert while typing in a field. */
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      ) {
        return
      }
      if (event.metaKey || event.ctrlKey || event.altKey) return

      if (event.code === 'Space') {
        event.preventDefault()
        if (mode !== 'focus') return
        if (stage === 'setup') session.startFocus()
        else if (stage === 'focus-complete') session.startBreak()
        else session.togglePause()
        return
      }

      if (event.key === 'Escape') {
        if (focusRoom) exitFocusRoom()
        return
      }

      if (event.key === 'r' || event.key === 'R') {
        if (isSessionActive) session.restart()
        return
      }

      if (event.key === 'f' || event.key === 'F') {
        if (focusRoom) exitFocusRoom()
        else void enterFocusRoom()
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [enterFocusRoom, exitFocusRoom, focusRoom, isSessionActive, mode, session, stage])

  const tone: ClockTone = useMemo(() => {
    if (mode === 'watch') return 'neutral'
    if (stage === 'break') return 'break'
    if (stage === 'focus' || stage === 'focus-complete') return 'focus'
    return 'neutral'
  }, [mode, stage])

  const clockData: ClockData = useMemo(() => {
    if (mode === 'watch') return { mode: 'watch', date: now }
    return {
      mode: 'focus',
      remainingMs: timer.remainingMs,
      totalMs: timer.totalMs,
      progress: timer.progress,
      isRunning: timer.isRunning,
    }
  }, [mode, now, timer.isRunning, timer.progress, timer.remainingMs, timer.totalMs])

  /* Reflect session state in the tab title so a backgrounded tab still informs. */
  useEffect(() => {
    if (mode !== 'focus' || stage === 'setup') {
      document.title = 'Menttalis Flow'
      return
    }
    if (stage === 'focus-complete') {
      document.title = 'Sessão concluída · Menttalis Flow'
      return
    }
    const totalSeconds = Math.ceil(timer.remainingMs / 1000)
    const mm = String(Math.floor(totalSeconds / 60)).padStart(2, '0')
    const ss = String(totalSeconds % 60).padStart(2, '0')
    const label = stage === 'break' ? 'pausa' : 'foco'
    document.title = `${mm}:${ss} · ${label}`
  }, [mode, stage, timer.remainingMs])

  const immersive = focusRoom
  /* The clock expands as the controls around it recede. */
  const clockSize: ClockSize = immersive
    ? 'immersive'
    : mode === 'watch' || isSessionActive || stage === 'focus-complete'
      ? 'normal'
      : 'compact'

  return (
    <>
      <SvgFilters />
      <div className="ambient-field" aria-hidden="true" />
      <GridReveal />
      <CursorDot />
      <Intro />

      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:px-4 focus:py-2"
        style={{ background: 'var(--accent)', color: 'var(--accent-ink)' }}
      >
        Ir para o conteúdo
      </a>

      {/* Live region: keeps the timer legible to screen readers without spamming */}
      <p aria-live="polite" className="sr-only">
        {mode === 'focus' && stage === 'focus' && timer.isRunning
          ? 'Sessão de foco em andamento.'
          : ''}
        {mode === 'focus' && stage === 'focus-complete'
          ? 'Sessão de foco concluída. Hora da pausa.'
          : ''}
        {mode === 'focus' && stage === 'break' ? 'Pausa em andamento.' : ''}
      </p>

      <div className="relative z-10 flex min-h-[100svh] flex-col">
        {/* ---------------- Top bar ---------------- */}
        <AnimatePresence>
          {!immersive && (
            <motion.header
              className="relative flex flex-col items-center gap-3 px-4 py-4 sm:flex-row sm:justify-between sm:px-6"
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: -12 }}
              animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, y: -12 }}
              transition={{
                duration: reduced ? 0 : 0.32,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              {/*
                The mark stays on the page centre at every width. A phone cannot
                fit the mode switch, the mark and the utilities on one line
                without them colliding, so there the header stacks: the mark on
                its own row, the two control groups sharing the row below. From
                `sm` up the wrapper becomes `display: contents`, its groups
                rejoin the header's own flex row, and the mark is centred
                absolutely over them.
              */}
              <img
                src="/brand/menttalis-m.png"
                alt="Menttalis"
                width={30}
                height={30}
                className="rounded-[9px] select-none sm:absolute sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2"
                style={{ boxShadow: 'var(--shadow-sm)' }}
              />

              <div className="flex w-full items-center justify-between gap-3 sm:contents">
                <div className="flex items-center gap-2">
                  <SegmentedControl<ViewMode>
                    label="Modo"
                    options={[
                      { value: 'focus', label: 'Foco' },
                      { value: 'watch', label: 'Relógio' },
                    ]}
                    value={mode}
                    onChange={setMode}
                  />
                  <IconButton label="Preferências" onClick={() => setSettingsOpen(true)}>
                    <SettingsIcon size={17} />
                  </IconButton>
                </div>

                <div className="flex items-center gap-2.5">
                  <span
                    className="hidden text-[12px] sm:block"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {now.toLocaleDateString('pt-BR', {
                      weekday: 'short',
                      day: '2-digit',
                      month: 'short',
                    })}
                  </span>
                  <a
                    href="https://www.instagram.com/menttalis"
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label="Menttalis no Instagram (abre em nova aba)"
                    title="@menttalis"
                    className="grid h-8 w-8 place-items-center rounded-full"
                    style={{
                      color: 'var(--text-muted)',
                      transition: 'color var(--motion-fast) var(--ease-standard)',
                    }}
                    onMouseEnter={(event) => {
                      event.currentTarget.style.color = 'var(--accent-line)'
                    }}
                    onMouseLeave={(event) => {
                      event.currentTarget.style.color = 'var(--text-muted)'
                    }}
                  >
                    <InstagramIcon size={16} />
                  </a>
                  <IconButton
                    label="Entrar no modo foco em tela cheia"
                    onClick={() => void enterFocusRoom()}
                  >
                    <ExpandIcon />
                  </IconButton>
                </div>
              </div>
            </motion.header>
          )}
        </AnimatePresence>

        {/* ---------------- Clock stage ---------------- */}
        <main
          id="main"
          className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-6"
        >
          <AnimatePresence mode="popLayout">
            {mode === 'focus' && settings.intention.trim() !== '' && stage !== 'setup' && (
              <motion.p
                key="intention-active"
                className="max-w-[520px] text-center text-[14px] sm:text-[15px]"
                style={{ color: 'var(--text-secondary)' }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{
                  duration: reduced ? 0 : 0.4,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                {settings.intention}
              </motion.p>
            )}
          </AnimatePresence>

          <Clock clock={settings.clock} data={clockData} tone={tone} size={clockSize} />

          <AnimatePresence mode="popLayout">
            {mode === 'focus' && (
              <motion.div
                key={stage}
                className="flex w-full flex-col items-center gap-5"
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: 14 }}
                animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
                exit={reduced ? { opacity: 0 } : { opacity: 0, y: -14 }}
                transition={{
                  duration: reduced ? 0 : 0.38,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                {stage === 'setup' && !immersive && (
                  <>
                    <IntentionInput
                      value={settings.intention}
                      onChange={(intention) => patchSettings({ intention })}
                    />
                    <DurationPicker
                      seconds={settings.duration}
                      onChange={(duration) => patchSettings({ duration })}
                    />
                    <Button variant="primary" size="lg" onClick={session.startFocus}>
                      Começar
                    </Button>
                    <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                      Uma coisa de cada vez.
                    </p>
                  </>
                )}

                {isSessionActive && (
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="primary"
                        size="lg"
                        tone={stage === 'break' ? 'break' : 'accent'}
                        onClick={session.togglePause}
                      >
                        {timer.isRunning ? 'Pausar' : 'Continuar'}
                      </Button>
                      <Button variant="ghost" onClick={session.restart} aria-label="Reiniciar">
                        Reiniciar
                      </Button>
                      <Button variant="quiet" onClick={session.endSession}>
                        {stage === 'break' ? 'Encerrar pausa' : 'Encerrar'}
                      </Button>
                    </div>
                    {stage === 'break' && (
                      <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
                        Deixe sua atenção descansar.
                      </p>
                    )}
                    {stage === 'focus' && !timer.isRunning && (
                      <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
                        Pausado. Volte quando estiver pronto.
                      </p>
                    )}
                  </div>
                )}

                {stage === 'focus-complete' && (
                  <div className="flex flex-col items-center gap-5">
                    <div className="flex flex-col items-center gap-1.5">
                      <p
                        className="text-[19px] font-medium"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        Respire.
                      </p>
                      <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
                        {session.isLongBreakDue
                          ? `Você encadeou ${session.completedCycles} sessões. Uma pausa maior faz bem.`
                          : 'Afaste-se por um momento.'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="primary" size="lg" tone="break" onClick={session.startBreak}>
                        Pausar {formatDuration(session.nextBreakSeconds)}
                      </Button>
                      <Button variant="quiet" onClick={session.skipBreak}>
                        Voltar ao início
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {mode === 'watch' && !immersive && (
              <motion.div
                key="watch-controls"
                className="flex flex-col items-center gap-3"
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: 14 }}
                animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
                exit={reduced ? { opacity: 0 } : { opacity: 0, y: -14 }}
                transition={{
                  duration: reduced ? 0 : 0.38,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                <SegmentedControl
                  label="Layout do relógio"
                  options={[
                    { value: 'digital', label: 'Digital' },
                    { value: 'ring', label: 'Anel' },
                    { value: 'analog', label: 'Analógico' },
                  ]}
                  value={settings.clock}
                  onChange={(clock) => patchSettings({ clock })}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* ---------------- Bottom bar ---------------- */}
        <AnimatePresence>
          {!immersive && (
            <motion.footer
              className="flex flex-col items-center gap-3 px-4 py-4 sm:flex-row sm:px-6"
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
              animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
              transition={{
                duration: reduced ? 0 : 0.32,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              {/* Equal flex-1 flanks put the toggle on the page centre; on a phone
                  they collapse away and `mx-auto` centres it instead. */}
              <div className="flex flex-col items-center gap-1 sm:flex-1 sm:items-start">
                <Wordmark muted />
                <a
                  href="https://www.brunoreis.cc"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-[11px] underline-offset-4 hover:underline"
                  style={{
                    color: 'var(--text-muted)',
                    transition: 'color var(--motion-fast) var(--ease-standard)',
                  }}
                  onMouseEnter={(event) => {
                    event.currentTarget.style.color = 'var(--accent-line)'
                  }}
                  onMouseLeave={(event) => {
                    event.currentTarget.style.color = 'var(--text-muted)'
                  }}
                >
                  Designed &amp; built by BR
                </a>
              </div>

              <div className="mx-auto sm:mx-0">
                <SegmentedControl<Theme>
                  label="Tema"
                  size="sm"
                  options={[
                    { value: 'light', label: 'Claro' },
                    { value: 'dark', label: 'Escuro' },
                  ]}
                  value={theme}
                  onChange={setTheme}
                />
              </div>

              <div className="hidden flex-1 justify-end sm:flex">
                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  Espaço inicia e pausa · F entra no foco
                </p>
              </div>
            </motion.footer>
          )}
        </AnimatePresence>

        {/* ---------------- Focus room exit ---------------- */}
        <AnimatePresence>
          {immersive && (
            <motion.div
              className="fixed inset-x-0 bottom-0 flex justify-center pb-7"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduced ? 0 : 0.4 }}
            >
              <div className="flex items-center gap-2 opacity-25 transition-opacity duration-500 hover:opacity-100 focus-within:opacity-100">
                {mode === 'focus' && isSessionActive && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={session.togglePause}
                    tone={stage === 'break' ? 'break' : 'accent'}
                  >
                    {timer.isRunning ? 'Pausar' : 'Continuar'}
                  </Button>
                )}
                {mode === 'focus' && stage === 'setup' && (
                  <Button variant="ghost" size="sm" onClick={session.startFocus}>
                    Começar
                  </Button>
                )}
                {mode === 'focus' && stage === 'focus-complete' && (
                  <Button variant="ghost" size="sm" tone="break" onClick={session.startBreak}>
                    Pausar
                  </Button>
                )}
                <Button variant="quiet" size="sm" onClick={exitFocusRoom}>
                  Sair
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onChange={patchSettings}
        summary={session.history.summary}
        onClearHistory={session.history.clear}
      />
    </>
  )
}

function IconButton({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode
  label: string
  onClick: () => void
}) {
  const reduced = useReducedMotion()
  return (
    <motion.button
      onClick={onClick}
      aria-label={label}
      title={label}
      whileHover={reduced ? undefined : { y: -2, scale: 1.04 }}
      whileTap={reduced ? undefined : { scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 480, damping: 26, mass: 0.4 }}
      className="grid h-10 w-10 place-items-center rounded-full"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        color: 'var(--text-secondary)',
      }}
    >
      {children}
    </motion.button>
  )
}

function ExpandIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M4 10V4h6M20 14v6h-6M4 4l6 6M20 20l-6-6" />
    </svg>
  )
}
