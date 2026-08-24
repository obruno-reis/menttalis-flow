import { useEffect, useState } from 'react'
import { useReducedMotion } from '../../hooks/useReducedMotion'

const HOLD_MS = 1250
const FADE_MS = 750

/**
 * Opening beat: the phrase alone, then it clears to reveal the app.
 *
 * Both the fade and the unmount are driven by timers rather than by animation
 * callbacks, so the overlay always goes away even if no animation frames run.
 * It is `pointer-events: none` throughout, so it can never trap a click.
 */
export function Intro() {
  const reduced = useReducedMotion()
  const [fading, setFading] = useState(false)
  /* Skipped outright when motion is reduced, so it never even mounts visibly. */
  const [done, setDone] = useState(reduced)

  useEffect(() => {
    if (reduced) return
    const fadeAt = window.setTimeout(() => setFading(true), HOLD_MS)
    const doneAt = window.setTimeout(() => setDone(true), HOLD_MS + FADE_MS)
    return () => {
      window.clearTimeout(fadeAt)
      window.clearTimeout(doneAt)
    }
  }, [reduced])

  if (done) return null

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50 grid place-items-center px-6"
      style={{
        background: 'var(--background)',
        opacity: fading ? 0 : 1,
        transition: `opacity ${FADE_MS}ms var(--ease-standard)`,
      }}
    >
      <p
        className="text-center text-[15px] sm:text-[17px]"
        style={{
          color: 'var(--text-secondary)',
          letterSpacing: '0.01em',
          opacity: fading ? 0 : 1,
          transform: fading ? 'translateY(-6px)' : 'none',
          transition: `opacity ${FADE_MS}ms var(--ease-standard), transform ${FADE_MS}ms var(--ease-out)`,
        }}
      >
        Presença antes de performance.
      </p>
    </div>
  )
}
