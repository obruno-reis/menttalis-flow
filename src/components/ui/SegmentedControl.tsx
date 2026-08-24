import { motion } from 'motion/react'
import { useId } from 'react'
import { useReducedMotion } from '../../hooks/useReducedMotion'

interface Option<T extends string> {
  value: T
  label: string
}

interface Props<T extends string> {
  options: Option<T>[]
  value: T
  onChange: (value: T) => void
  label: string
  size?: 'sm' | 'md'
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  size = 'md',
}: Props<T>) {
  const reduced = useReducedMotion()
  const groupId = useId()
  const height = size === 'sm' ? 'h-8' : 'h-10'
  const pad = size === 'sm' ? 'px-3 text-[12px]' : 'px-4 text-[13px]'

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={`inline-flex items-center rounded-full p-1 ${height}`}
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={`relative inline-flex h-full items-center rounded-full font-medium whitespace-nowrap ${pad}`}
            style={{
              color: active ? 'var(--accent-ink)' : 'var(--text-secondary)',
              transition: 'color var(--motion-fast) var(--ease-standard)',
            }}
          >
            {active && (
              <motion.span
                layoutId={`segment-${groupId}`}
                className="absolute inset-0 rounded-full"
                style={{ background: 'var(--accent)' }}
                transition={
                  reduced ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 34, mass: 0.6 }
                }
              />
            )}
            <span className="relative z-10">{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}
