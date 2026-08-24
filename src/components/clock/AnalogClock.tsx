import type { CSSProperties } from 'react'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { formatClock } from '../../lib/time'
import { RollingNumber } from './RollingNumber'
import type { ClockProps } from './types'
import { DIAL_SIZE, toneAccent } from './types'

const SIZE = 400
const CENTER = SIZE / 2
const DIAL_RADIUS = 176

function Ticks() {
  const marks = []
  for (let i = 0; i < 60; i += 1) {
    const isHour = i % 5 === 0
    const angle = (i / 60) * 360
    const inner = DIAL_RADIUS - (isHour ? 13 : 6)
    marks.push(
      <line
        key={i}
        x1={0}
        y1={-DIAL_RADIUS}
        x2={0}
        y2={-inner}
        stroke={isHour ? 'var(--text-secondary)' : 'var(--border-strong)'}
        strokeWidth={isHour ? 2.5 : 1.25}
        strokeLinecap="round"
        transform={`rotate(${angle})`}
      />,
    )
  }
  return <g transform={`translate(${CENTER} ${CENTER})`}>{marks}</g>
}

function Numerals() {
  const labels = [
    { text: '12', x: CENTER, y: CENTER - DIAL_RADIUS + 46 },
    { text: '3', x: CENTER + DIAL_RADIUS - 42, y: CENTER },
    { text: '6', x: CENTER, y: CENTER + DIAL_RADIUS - 42 },
    { text: '9', x: CENTER - DIAL_RADIUS + 42, y: CENTER },
  ]
  return (
    <g>
      {labels.map((label) => (
        <text
          key={label.text}
          x={label.x}
          y={label.y}
          textAnchor="middle"
          dominantBaseline="central"
          fill="var(--text-muted)"
          fontSize={26}
          fontWeight={500}
        >
          {label.text}
        </text>
      ))}
    </g>
  )
}

export function AnalogClock({ data, tone, size }: ClockProps) {
  const reduced = useReducedMotion()
  const color = toneAccent(tone)
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
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="absolute inset-0 h-full w-full">
        <circle
          cx={CENTER}
          cy={CENTER}
          r={DIAL_RADIUS + 14}
          fill="var(--surface)"
          stroke="var(--border)"
          strokeWidth={1}
        />
        <Ticks />
        {data.mode === 'watch' && <Numerals />}

        {data.mode === 'watch' ? (
          <WatchHands date={data.date} />
        ) : (
          <SessionHand progress={data.progress} accent={color} reduced={reduced} />
        )}

        {data.mode === 'watch' && (
          <>
            <circle cx={CENTER} cy={CENTER} r={5.5} fill="var(--text-primary)" />
            <circle cx={CENTER} cy={CENTER} r={2} fill="var(--background)" />
          </>
        )}
      </svg>

      {data.mode === 'focus' && (
        <div
          className="clock-numerals font-display tabular-nums leading-none"
          style={
            {
              /* Proportional to the dial so it never collides with the rim. */
              fontSize: '15cqw',
              fontWeight: 500,
              letterSpacing: '-0.04em',
              '--clock-ink': 'var(--text-primary)',
            } as CSSProperties
          }
        >
          <RollingNumber
            value={`${formatClock(data.remainingMs).minutes}:${formatClock(data.remainingMs).seconds}`}
            snapKey={data.mode}
            secondsTail={2}
          />
        </div>
      )}
    </div>
  )
}

interface HandProps {
  angle: number
  /** Omitted for the watch hands, which tick rather than sweep. */
  transition?: string
  children: React.ReactNode
}

/**
 * Rotation lives on the SVG `transform` attribute so the hand is painted at the
 * right angle immediately, whether or not any animation frames run.
 */
function Hand({ angle, transition, children }: HandProps) {
  return (
    <g
      transform={`rotate(${((angle % 360) + 360) % 360} ${CENTER} ${CENTER})`}
      style={transition ? { transition } : undefined}
    >
      {children}
    </g>
  )
}

/**
 * The hands step to each new position the way a quartz movement does. Stepping
 * also means resuming from sleep snaps straight to the right time instead of
 * unwinding through the laps it missed.
 */
function WatchHands({ date }: { date: Date }) {
  const secondsToday = date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds()

  return (
    <>
      <Hand angle={secondsToday / 120}>
        <line
          x1={CENTER}
          y1={CENTER + 18}
          x2={CENTER}
          y2={CENTER - 98}
          stroke="var(--text-primary)"
          strokeWidth={9}
          strokeLinecap="round"
        />
      </Hand>
      <Hand angle={secondsToday * 0.1}>
        <line
          x1={CENTER}
          y1={CENTER + 22}
          x2={CENTER}
          y2={CENTER - 146}
          stroke="var(--text-primary)"
          strokeWidth={5.5}
          strokeLinecap="round"
        />
      </Hand>
      {/* The accent second hand is the one deliberate flash of brand colour. */}
      <Hand angle={secondsToday * 6}>
        <line
          x1={CENTER}
          y1={CENTER + 36}
          x2={CENTER}
          y2={CENTER - 158}
          stroke="var(--accent-line)"
          strokeWidth={2}
          strokeLinecap="round"
        />
        <circle cx={CENTER} cy={CENTER + 36} r={4} fill="var(--accent-line)" />
      </Hand>
    </>
  )
}

function SessionHand({
  progress,
  accent,
  reduced,
}: {
  progress: number
  accent: string
  reduced: boolean
}) {
  const radius = DIAL_RADIUS - 26
  const circumference = 2 * Math.PI * radius
  const transition = reduced ? 'none' : 'stroke-dashoffset 480ms var(--ease-out)'

  return (
    <>
      <g transform={`rotate(-90 ${CENTER} ${CENTER})`}>
        <circle
          cx={CENTER}
          cy={CENTER}
          r={radius}
          fill="none"
          stroke={accent}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * progress}
          style={{ transition, filter: `drop-shadow(0 0 14px ${accent}44)` }}
        />
      </g>
      {/* Sits in the outer band only, so it never crosses the countdown text. */}
      <Hand angle={progress * 360} transition={reduced ? undefined : 'transform 480ms var(--ease-out)'}>
        <line
          x1={CENTER}
          y1={CENTER - radius * 0.62}
          x2={CENTER}
          y2={CENTER - (DIAL_RADIUS - 6)}
          stroke={accent}
          strokeWidth={2}
          strokeLinecap="round"
          opacity={0.5}
        />
      </Hand>
    </>
  )
}
