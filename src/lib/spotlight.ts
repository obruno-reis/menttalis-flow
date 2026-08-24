export interface SpotlightState {
  /** Eased position — trails the cursor, used by the reveals. */
  x: number
  y: number
  /** Unsmoothed pointer position, for anything that must sit exactly under it. */
  rawX: number
  rawY: number
  active: boolean
  /** True while the pointer is over something clickable or typable. */
  overInteractive: boolean
}

type Listener = (state: SpotlightState) => void

/** Fraction of the remaining distance covered each frame — the sense of lag. */
const EASE = 0.12
/** Below this gap the spotlight snaps and the loop stops, to idle at zero cost. */
const SETTLE_PX = 0.4

const INTERACTIVE =
  'a, button, input, textarea, select, label, [role="radio"], [role="button"], [contenteditable]'

const listeners = new Set<Listener>()

let targetX = 0
let targetY = 0
let currentX = 0
let currentY = 0
let active = false
let overInteractive = false
let lastTarget: Element | null = null
let frame = 0
let bound = false

/** Pointer-driven decoration: pointless without a real cursor to follow. */
export function supportsSpotlight(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches
}

function notify() {
  const state: SpotlightState = {
    x: currentX,
    y: currentY,
    rawX: targetX,
    rawY: targetY,
    active,
    overInteractive,
  }
  for (const listener of listeners) listener(state)
}

function step() {
  frame = 0
  const dx = targetX - currentX
  const dy = targetY - currentY
  const settled = Math.abs(dx) < SETTLE_PX && Math.abs(dy) < SETTLE_PX

  if (settled) {
    currentX = targetX
    currentY = targetY
  } else {
    currentX += dx * EASE
    currentY += dy * EASE
  }

  notify()
  if (!settled) frame = requestAnimationFrame(step)
}

function onMove(event: PointerEvent) {
  targetX = event.clientX
  targetY = event.clientY

  /* `closest` only re-runs when the element under the pointer changes. */
  const target = event.target as Element | null
  if (target !== lastTarget) {
    lastTarget = target
    overInteractive = Boolean(target?.closest?.(INTERACTIVE))
  }

  /* First sighting of the cursor snaps, so the light doesn't fly in from 0,0. */
  if (!active) {
    currentX = targetX
    currentY = targetY
    active = true
  }
  if (!frame) frame = requestAnimationFrame(step)
}

function onLeave() {
  active = false
  notify()
}

function bind() {
  bound = true
  window.addEventListener('pointermove', onMove, { passive: true })
  document.documentElement.addEventListener('pointerleave', onLeave)
  window.addEventListener('blur', onLeave)
}

function unbind() {
  bound = false
  if (frame) cancelAnimationFrame(frame)
  frame = 0
  window.removeEventListener('pointermove', onMove)
  document.documentElement.removeEventListener('pointerleave', onLeave)
  window.removeEventListener('blur', onLeave)
}

/**
 * A single eased cursor position shared by everything that reveals itself
 * around the pointer, so the grid, the numerals and the cursor dot all track
 * from one listener and one animation frame.
 */
export function subscribeSpotlight(listener: Listener): () => void {
  if (!supportsSpotlight()) return () => {}

  listeners.add(listener)
  if (!bound) bind()

  return () => {
    listeners.delete(listener)
    if (listeners.size === 0 && bound) unbind()
  }
}
