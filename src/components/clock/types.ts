import type { ClockId } from '../../types'

export type ClockTone = 'neutral' | 'focus' | 'break'

export type ClockData =
  | { mode: 'watch'; date: Date }
  | { mode: 'focus'; remainingMs: number; totalMs: number; progress: number; isRunning: boolean }

/**
 * How much room the clock is allowed to take. `compact` leaves space for the
 * setup controls, `normal` is a running session where only a few buttons
 * remain, `immersive` is the focus room where the clock is all there is.
 */
export type ClockSize = 'compact' | 'normal' | 'immersive'

export interface ClockProps {
  data: ClockData
  tone: ClockTone
  size: ClockSize
}

export const CLOCKS: { id: ClockId; label: string }[] = [
  { id: 'digital', label: 'Digital' },
  { id: 'ring', label: 'Anel' },
  { id: 'analog', label: 'Analógico' },
]

/** Dial diameter per size tier — height-aware so controls never fall below the fold. */
export const DIAL_SIZE: Record<ClockSize, string> = {
  compact: 'min(34vh, 72vw, 400px)',
  normal: 'min(52vh, 74vw, 520px)',
  immersive: 'min(72vh, 76vw, 660px)',
}

/**
 * Ink for the numerals. Light mode resolves every state to the brand navy, so
 * the digits stay monochrome and colour is reserved for fills and arcs; dark
 * mode tints them by state. The outline copy inherits this same ink.
 */
export function toneInk(tone: ClockTone): string {
  if (tone === 'focus') return 'var(--ink-focus)'
  if (tone === 'break') return 'var(--ink-break)'
  return 'var(--text-primary)'
}

/**
 * Colour for progress arcs and hands. These keep signalling focus vs. break in
 * both themes — it is the only place the session state is carried by colour
 * once the numerals go monochrome.
 */
export function toneAccent(tone: ClockTone): string {
  if (tone === 'focus') return 'var(--accent-line)'
  if (tone === 'break') return 'var(--break-line)'
  return 'var(--text-primary)'
}
