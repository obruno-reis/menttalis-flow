import { useEffect, useRef, useState } from 'react'
import { subscribeSpotlight, supportsSpotlight } from '../../lib/spotlight'

/**
 * Replaces the pointer with a dot — brand green on light, white on dark.
 *
 * It follows the *raw* pointer position rather than the eased one: a cursor
 * that lags behind the hand reads as a bug, not as a flourish. The dot swells
 * over anything clickable or typable, which is what keeps the affordance the
 * hidden arrow used to carry.
 */
export function CursorDot() {
  /* Decided once: a touch device has no pointer to replace. */
  const [enabled] = useState(supportsSpotlight)
  const dotRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!enabled) return
    /* Hiding the native cursor is scoped to this attribute, so it is never
       left behind if the dot is not rendered. */
    document.documentElement.dataset.cursor = 'dot'
    return () => {
      delete document.documentElement.dataset.cursor
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled) return
    return subscribeSpotlight(({ rawX, rawY, active, overInteractive }) => {
      const dot = dotRef.current
      if (!dot) return
      dot.style.transform = `translate3d(${rawX}px, ${rawY}px, 0)`
      dot.dataset.active = String(active)
      dot.dataset.over = String(overInteractive)
    })
  }, [enabled])

  if (!enabled) return null

  return (
    <div ref={dotRef} className="cursor-dot" aria-hidden="true">
      <span className="cursor-dot__ball" />
    </div>
  )
}
