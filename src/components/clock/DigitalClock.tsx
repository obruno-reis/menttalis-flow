import type { CSSProperties } from 'react'
import { formatClock } from '../../lib/time'
import { RollingNumber } from './RollingNumber'
import type { ClockProps } from './types'
import { toneInk } from './types'

/**
 * The vw term keeps "00:00" (roughly 3em wide) inside a narrow screen, while
 * the vh term is what binds on a wide one.
 */
const FONT_SIZE: Record<ClockProps['size'], string> = {
  compact: 'min(18vh, 28vw, 11rem)',
  normal: 'min(26vh, 30vw, 15rem)',
  immersive: 'min(34vh, 30vw, 18rem)',
}

export function DigitalClock({ data, tone, size }: ClockProps) {
  const isWatch = data.mode === 'watch'

  const primary = isWatch
    ? `${String(data.date.getHours()).padStart(2, '0')}:${String(data.date.getMinutes()).padStart(2, '0')}`
    : (() => {
        const { minutes, seconds } = formatClock(data.remainingMs)
        return `${minutes}:${seconds}`
      })()

  const trailing = isWatch ? String(data.date.getSeconds()).padStart(2, '0') : null

  return (
    <div className="flex flex-col items-center">
      <div
        className="clock-numerals font-display tabular-nums flex items-baseline leading-none"
        style={
          {
            fontSize: FONT_SIZE[size],
            fontWeight: 500,
            letterSpacing: '-0.045em',
            '--clock-ink': toneInk(tone),
            transition: 'font-size var(--motion-normal) var(--ease-out)',
          } as CSSProperties
        }
      >
        <RollingNumber value={primary} snapKey={data.mode} />
        {trailing !== null && (
          <span
            className="clock-numerals tabular-nums"
            style={
              {
                fontSize: '0.3em',
                marginLeft: '0.14em',
                fontWeight: 500,
                letterSpacing: '-0.02em',
                '--clock-ink': 'var(--text-muted)',
              } as CSSProperties
            }
          >
            <RollingNumber value={trailing} snapKey={data.mode} />
          </span>
        )}
      </div>
    </div>
  )
}
