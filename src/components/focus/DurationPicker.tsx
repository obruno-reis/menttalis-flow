import { motion } from 'motion/react'
import { useReducedMotion } from '../../hooks/useReducedMotion'

const PRESETS = [5, 10, 15, 25, 30, 45, 50, 60]
const MIN_MINUTES = 1
const MAX_MINUTES = 180

interface Props {
  seconds: number
  onChange: (seconds: number) => void
}

export function DurationPicker({ seconds, onChange }: Props) {
  const reduced = useReducedMotion()
  const minutes = Math.round(seconds / 60)

  const step = (delta: number) => {
    const next = Math.min(MAX_MINUTES, Math.max(MIN_MINUTES, minutes + delta))
    onChange(next * 60)
  }

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <div
        className="flex w-full flex-wrap items-center justify-center gap-1.5"
        role="radiogroup"
        aria-label="Duração da sessão"
      >
        {PRESETS.map((preset) => {
          const active = preset === minutes
          return (
            <motion.button
              key={preset}
              role="radio"
              aria-checked={active}
              onClick={() => onChange(preset * 60)}
              whileHover={reduced ? undefined : { y: -2 }}
              whileTap={reduced ? undefined : { scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 480, damping: 26, mass: 0.4 }}
              className="relative h-9 shrink-0 rounded-full px-3.5 text-[13px] font-medium"
              style={{
                color: active ? 'var(--accent-ink)' : 'var(--text-secondary)',
                background: active ? 'var(--accent)' : 'var(--surface)',
                border: `1px solid ${active ? 'transparent' : 'var(--border)'}`,
                transition:
                  'background var(--motion-fast) var(--ease-standard), color var(--motion-fast) var(--ease-standard)',
              }}
            >
              {preset}
            </motion.button>
          )
        })}
      </div>

      <div className="flex items-center gap-2">
        <Stepper label="Diminuir um minuto" onClick={() => step(-1)} disabled={minutes <= MIN_MINUTES}>
          −
        </Stepper>
        <span className="tabular-nums text-[13px] w-[74px] text-center" style={{ color: 'var(--text-muted)' }}>
          {minutes} min
        </span>
        <Stepper label="Aumentar um minuto" onClick={() => step(1)} disabled={minutes >= MAX_MINUTES}>
          +
        </Stepper>
      </div>
    </div>
  )
}

function Stepper({
  children,
  onClick,
  label,
  disabled,
}: {
  children: React.ReactNode
  onClick: () => void
  label: string
  disabled?: boolean
}) {
  const reduced = useReducedMotion()
  return (
    <motion.button
      onClick={onClick}
      aria-label={label}
      disabled={disabled}
      whileHover={reduced || disabled ? undefined : { y: -2 }}
      whileTap={reduced || disabled ? undefined : { scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 480, damping: 26, mass: 0.4 }}
      className="grid h-9 w-9 place-items-center rounded-full text-base disabled:opacity-30 disabled:pointer-events-none"
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
