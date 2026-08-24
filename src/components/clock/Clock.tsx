import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef } from 'react'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { subscribeSpotlight } from '../../lib/spotlight'
import type { ClockId } from '../../types'
import { AnalogClock } from './AnalogClock'
import { DigitalClock } from './DigitalClock'
import { RingClock } from './RingClock'
import type { ClockProps } from './types'

const REGISTRY: Record<ClockId, (props: ClockProps) => React.ReactElement> = {
  digital: DigitalClock,
  ring: RingClock,
  analog: AnalogClock,
}

interface Props extends ClockProps {
  clock: ClockId
}

/**
 * Swapping layouts is a presentation change only — the timer state lives above
 * this component, so a session is never interrupted by changing the clock.
 */
export function Clock({ clock, ...rest }: Props) {
  const reduced = useReducedMotion()
  const Component = REGISTRY[clock]
  const spotRef = useRef<HTMLDivElement>(null)

  /* The numerals' outline layer is masked in this element's own coordinates,
     so the shared viewport-space spotlight is rebased onto its box here. */
  useEffect(() => {
    if (reduced) return
    return subscribeSpotlight(({ x, y, active }) => {
      const el = spotRef.current
      if (!el) return
      el.dataset.active = String(active)
      if (!active) return
      const rect = el.getBoundingClientRect()
      el.style.setProperty('--lx', `${x - rect.left}px`)
      el.style.setProperty('--ly', `${y - rect.top}px`)
    })
  }, [reduced])

  return (
    <div ref={spotRef} className="clock-spot grid place-items-center">
      <AnimatePresence mode="popLayout">
        <motion.div
          key={clock}
          initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.94 }}
          animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 1.04 }}
          transition={{ duration: reduced ? 0 : 0.42, ease: [0.16, 1, 0.3, 1] }}
          className="grid place-items-center"
        >
          <Component {...rest} />
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
