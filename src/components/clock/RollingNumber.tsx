import { useReducedMotion } from '../../hooks/useReducedMotion'

interface Props {
  value: string
  className?: string
  /**
   * Changing this remounts the digit columns so they snap to the new value
   * instead of rolling through every cell — used when the clock switches
   * between wall time and a countdown, where a long roll reads as a slot machine.
   */
  snapKey?: string
  /**
   * How many trailing digit columns advance once per second. Those have to
   * finish rolling inside their own tick, so they keep the quick transition;
   * every column ahead of them changes at most once a minute and gets the slow,
   * gliding one. `MM:SS` passes 2, `HH:MM` passes 0.
   */
  secondsTail?: number
}

const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
/**
 * Cell height in em. The strip is 10 cells tall, so one cell is 10% of it.
 * Must exceed the font's content area (ascender + descender) or neighbouring
 * digits bleed into the clip window.
 */
const CELL = 1.3

/**
 * Odometer-style numerals: each digit column holds 0–9 and slides to the
 * current value, so the clock reads as time moving rather than digits blinking.
 * Driven by a CSS transition rather than an animation loop, so the correct
 * digit is painted even when the page gets no animation frames.
 *
 * The glyphs are drawn twice: a solid layer, and an outlined copy on top that
 * is masked down to a disc around the cursor. Moving the pointer across the
 * clock therefore dissolves the fill into a brand-green outline locally, the
 * same way the background grid is uncovered.
 */
export function RollingNumber({ value, className, snapKey = '', secondsTail = 0 }: Props) {
  const reduced = useReducedMotion()

  return (
    <span
      className={className}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'flex-start',
        lineHeight: CELL,
        /* The clip window is taller than the glyphs to stop neighbouring digits
           bleeding in; this pulls the extra leading back out of the layout box. */
        marginBlock: `${(1 - CELL) / 2}em`,
      }}
    >
      {/* Each column holds all ten digits, so the strips are hidden from
          assistive tech and the real value exposed as plain text instead. */}
      <span className="sr-only">{value}</span>
      <Digits value={value} snapKey={snapKey} reduced={reduced} layer="fill" secondsTail={secondsTail} />
      {!reduced && (
        <span className="numerals-outline" aria-hidden="true">
          <Digits value={value} snapKey={snapKey} reduced={reduced} layer="outline" secondsTail={secondsTail} />
        </span>
      )}
    </span>
  )
}

function Digits({
  value,
  snapKey,
  reduced,
  layer,
  secondsTail,
}: {
  value: string
  snapKey: string
  reduced: boolean
  /* Only the solid layer gets punched out under the cursor; the outlined copy
     must keep its own glyphs intact or the two masks cancel each other. */
  layer: 'fill' | 'outline'
  secondsTail: number
}) {
  /* Resolved up front, over digit columns only, so separators never shift the
     tail and nothing has to be counted while rendering. */
  const digitIndices = value
    .split('')
    .map((char, index) => (DIGITS.includes(char) ? index : -1))
    .filter((index) => index >= 0)
  const ticksEverySecond = new Set(digitIndices.slice(digitIndices.length - secondsTail))

  return (
    <span
      aria-hidden="true"
      className={layer === 'fill' ? 'numerals-fill' : undefined}
      style={{ display: 'inline-flex', alignItems: 'flex-start' }}
    >
      {value.split('').map((char, index) => {
        if (!DIGITS.includes(char)) {
          return (
            <span
              key={index}
              style={{
                display: 'inline-block',
                height: `${CELL}em`,
                lineHeight: CELL,
                width: '0.34em',
                textAlign: 'center',
              }}
            >
              {char}
            </span>
          )
        }
        return (
          <DigitColumn
            key={`${snapKey}-${index}`}
            digit={Number(char)}
            reduced={reduced}
            ticksEverySecond={ticksEverySecond.has(index)}
          />
        )
      })}
    </span>
  )
}

function DigitColumn({
  digit,
  reduced,
  ticksEverySecond,
}: {
  digit: number
  reduced: boolean
  ticksEverySecond: boolean
}) {
  /*
   * The seconds column snaps and settles (ease-out): it has under a second to
   * land, so it should get out of the way. The slower columns use the symmetric
   * curve instead, which accelerates and decelerates like a physical drum —
   * with ease-out at this duration most of the travel happened in the first
   * 140ms and the rest was just a long settle, which still reads as abrupt.
   */
  const roll = ticksEverySecond
    ? 'var(--motion-roll-fast) var(--ease-out)'
    : 'var(--motion-roll-slow) var(--ease-standard)'

  return (
    <span
      className="digit-column"
      style={{
        display: 'inline-block',
        height: `${CELL}em`,
        width: '0.62em',
        overflow: 'hidden',
        verticalAlign: 'top',
      }}
    >
      <span
        style={{
          display: 'block',
          transform: `translateY(${-digit * 10}%)`,
          transition: reduced ? 'none' : `transform ${roll}`,
        }}
      >
        {DIGITS.map((d) => (
          <span
            key={d}
            style={{
              display: 'block',
              height: `${CELL}em`,
              lineHeight: CELL,
              textAlign: 'center',
            }}
          >
            {d}
          </span>
        ))}
      </span>
    </span>
  )
}
