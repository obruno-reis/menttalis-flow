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
export function RollingNumber({ value, className, snapKey = '' }: Props) {
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
      <Digits value={value} snapKey={snapKey} reduced={reduced} layer="fill" />
      {!reduced && (
        <span className="numerals-outline" aria-hidden="true">
          <Digits value={value} snapKey={snapKey} reduced={reduced} layer="outline" />
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
}: {
  value: string
  snapKey: string
  reduced: boolean
  /* Only the solid layer gets punched out under the cursor; the outlined copy
     must keep its own glyphs intact or the two masks cancel each other. */
  layer: 'fill' | 'outline'
}) {
  return (
    <span
      aria-hidden="true"
      className={layer === 'fill' ? 'numerals-fill' : undefined}
      style={{ display: 'inline-flex', alignItems: 'flex-start' }}
    >
      {value.split('').map((char, index) =>
        DIGITS.includes(char) ? (
          <DigitColumn key={`${snapKey}-${index}`} digit={Number(char)} reduced={reduced} />
        ) : (
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
        ),
      )}
    </span>
  )
}

function DigitColumn({ digit, reduced }: { digit: number; reduced: boolean }) {
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
          transition: reduced ? 'none' : 'transform 240ms var(--ease-out)',
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
