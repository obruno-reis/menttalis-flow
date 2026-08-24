import { useEffect, useRef } from 'react'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { subscribeSpotlight } from '../../lib/spotlight'

/**
 * A grid that only exists where the cursor is — as if the whole surface were
 * built on a lattice that the pointer uncovers. The position comes from the
 * shared eased spotlight, so the reveal trails the cursor instead of pinning
 * to it, and repaints stay confined to this one fixed layer.
 */
export function GridReveal() {
  const reduced = useReducedMotion()
  const layerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (reduced) return
    return subscribeSpotlight(({ x, y, active }) => {
      const layer = layerRef.current
      if (!layer) return
      layer.dataset.active = String(active)
      layer.style.setProperty('--mx', `${x}px`)
      layer.style.setProperty('--my', `${y}px`)
    })
  }, [reduced])

  if (reduced) return null

  return <div ref={layerRef} className="grid-reveal" aria-hidden="true" />
}
