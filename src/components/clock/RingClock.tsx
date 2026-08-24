import type { CSSProperties } from 'react'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { formatClock } from '../../lib/time'
import { RollingNumber } from './RollingNumber'
import type { ClockProps } from './types'
import { DIAL_SIZE, toneAccent } from './types'

const SIZE = 400
const STROKE = 6
const RADIUS = (SIZE - STROKE) / 2 - 12
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export function RingClock({ data, tone, size }: ClockProps) {
  const reduced = useReducedMotion()
  const color = toneAccent(tone)

  const isWatch = data.mode === 'watch'
  /* Watch: the ring traces the current minute. Focus: it drains as time is spent. */
  const fraction = isWatch ? data.date.getSeconds() / 60 : 1 - data.progress

  const primary = isWatch
    ? `${String(data.date.getHours()).padStart(2, '0')}:${String(data.date.getMinutes()).padStart(2, '0')}`
    : (() => {
        const { minutes, seconds } = formatClock(data.remainingMs)
        return `${minutes}:${seconds}`
      })()

  const dimension = DIAL_SIZE[size]

  return (
    <div
      className="relative grid place-items-center"
      style={{
        width: dimension,
        height: dimension,
        containerType: 'size',
        transition:
          'width var(--motion-normal) var(--ease-out), height var(--motion-normal) var(--ease-out)',
      }}
    >
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="absolute inset-0 h-full w-full -rotate-90">
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="var(--border-strong)"
          strokeWidth={STROKE}
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - fraction)}
          style={{
            transition: reduced ? 'none' : 'stroke-dashoffset 480ms var(--ease-out)',
            filter: `drop-shadow(0 0 12px ${color}55)`,
          }}
        />
      </svg>

      <div
        className="clock-numerals font-display tabular-nums leading-none"
        style={
          {
            /* Proportional to the dial so it never outgrows the ring. */
            fontSize: '19cqw',
            fontWeight: 500,
            letterSpacing: '-0.04em',
            '--clock-ink': 'var(--text-primary)',
          } as CSSProperties
        }
      >
        <RollingNumber value={primary} snapKey={data.mode} />
      </div>
    </div>
  )
}
