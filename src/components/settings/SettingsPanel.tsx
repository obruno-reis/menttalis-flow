import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef } from 'react'
import type { HistorySummary } from '../../hooks/useHistory'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { formatHoursMinutes } from '../../lib/time'
import type { ClockId, FocusSettings, SoundMode } from '../../types'
import { CLOCKS } from '../clock/types'
import { SegmentedControl } from '../ui/SegmentedControl'
import { Wordmark } from '../ui/Wordmark'

interface Props {
  open: boolean
  onClose: () => void
  settings: FocusSettings
  onChange: (patch: Partial<FocusSettings>) => void
  summary: HistorySummary
  onClearHistory: () => void
}

export function SettingsPanel({ open, onClose, settings, onChange, summary, onClearHistory }: Props) {
  const reduced = useReducedMotion()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40"
            style={{ background: 'var(--scrim)', backdropFilter: 'blur(2px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.24 }}
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Preferências"
            className="fixed z-50 flex flex-col gap-7 overflow-y-auto p-6 sm:p-7"
            style={{
              top: 0,
              left: 0,
              bottom: 0,
              width: 'min(340px, 90vw)',
              background: 'var(--surface)',
              borderRight: '1px solid var(--border)',
              boxShadow: 'var(--shadow-md)',
            }}
            initial={reduced ? { opacity: 0 } : { x: '-100%' }}
            animate={reduced ? { opacity: 1 } : { x: 0 }}
            exit={reduced ? { opacity: 0 } : { x: '-100%' }}
            transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 340, damping: 34 }}
          >
            <div className="flex items-center justify-between">
              <Wordmark />
              <button
                onClick={onClose}
                aria-label="Fechar preferências"
                className="grid h-8 w-8 place-items-center rounded-full text-sm"
                style={{
                  background: 'var(--surface-elevated)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                }}
              >
                ✕
              </button>
            </div>

            <Section title="Relógio">
              <SegmentedControl<ClockId>
                label="Layout do relógio"
                size="sm"
                options={CLOCKS.map((c) => ({ value: c.id, label: c.label }))}
                value={settings.clock}
                onChange={(clock) => onChange({ clock })}
              />
            </Section>

            <Section title="Som">
              <SegmentedControl<SoundMode>
                label="Modo de som"
                size="sm"
                options={[
                  { value: 'mute', label: 'Silêncio' },
                  { value: 'system', label: 'Sutil' },
                  { value: 'chime', label: 'Sino' },
                ]}
                value={settings.soundMode}
                onChange={(soundMode) => onChange({ soundMode })}
              />
              <div className="flex items-center gap-3 pt-1">
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={Math.round(settings.volume * 100)}
                  disabled={settings.soundMode === 'mute'}
                  onChange={(event) => onChange({ volume: Number(event.target.value) / 100 })}
                  aria-label="Volume"
                  className="flow-slider flex-1"
                />
                <span
                  className="tabular-nums w-9 text-right text-[12px]"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {Math.round(settings.volume * 100)}%
                </span>
              </div>
            </Section>

            <Section title="Pausa">
              <Stepper
                value={Math.round(settings.breakDuration / 60)}
                unit="min"
                min={1}
                max={30}
                onChange={(minutes) => onChange({ breakDuration: minutes * 60 })}
                label="Duração da pausa"
              />
              <Stepper
                value={settings.cyclesUntilLongBreak}
                unit="sessões"
                min={2}
                max={8}
                onChange={(cyclesUntilLongBreak) => onChange({ cyclesUntilLongBreak })}
                label="Sessões até uma pausa longa"
              />
            </Section>

            <Section title="Seu foco">
              <div className="flex flex-col gap-3">
                <Stat label="Hoje" sessions={summary.todaySessions} seconds={summary.todaySeconds} />
                <Stat label="Esta semana" sessions={summary.weekSessions} seconds={summary.weekSeconds} />
              </div>
              {summary.weekSessions > 0 && (
                <button
                  onClick={onClearHistory}
                  className="self-start text-[12px] underline underline-offset-4"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Limpar histórico
                </button>
              )}
            </Section>

            <div className="mt-auto flex flex-col gap-2 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
              <p className="text-[12px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Attention is a limited cognitive resource.
              </p>
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                Tudo fica salvo apenas neste navegador.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col items-start gap-3">
      <h2
        className="text-[10px] font-semibold tracking-[0.18em] uppercase"
        style={{ color: 'var(--text-muted)' }}
      >
        {title}
      </h2>
      {children}
    </section>
  )
}

function Stat({ label, sessions, seconds }: { label: string; sessions: number; seconds: number }) {
  return (
    <div className="flex w-full items-baseline justify-between gap-3">
      <span className="shrink-0 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </span>
      <span className="tabular-nums text-right text-[13px]" style={{ color: 'var(--text-primary)' }}>
        {sessions === 0 ? '—' : `${sessions} ${sessions === 1 ? 'sessão' : 'sessões'} · ${formatHoursMinutes(seconds)}`}
      </span>
    </div>
  )
}

function Stepper({
  value,
  unit,
  min,
  max,
  onChange,
  label,
}: {
  value: number
  unit: string
  min: number
  max: number
  onChange: (value: number) => void
  label: string
}) {
  return (
    <div className="flex items-center gap-2" role="group" aria-label={label}>
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label={`Diminuir: ${label}`}
        className="grid h-8 w-8 place-items-center rounded-full disabled:opacity-30"
        style={{
          background: 'var(--surface-elevated)',
          border: '1px solid var(--border)',
          color: 'var(--text-secondary)',
        }}
      >
        −
      </button>
      <span
        className="tabular-nums min-w-[86px] text-center text-[13px]"
        style={{ color: 'var(--text-primary)' }}
      >
        {value} {unit}
      </span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label={`Aumentar: ${label}`}
        className="grid h-8 w-8 place-items-center rounded-full disabled:opacity-30"
        style={{
          background: 'var(--surface-elevated)',
          border: '1px solid var(--border)',
          color: 'var(--text-secondary)',
        }}
      >
        +
      </button>
    </div>
  )
}
