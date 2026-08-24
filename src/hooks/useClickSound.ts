import { useEffect, useRef } from 'react'
import { playClick } from '../lib/sound'
import type { SoundMode } from '../types'

/** Everything in the app that can be pressed is one of these three. */
const PRESSABLE = 'button, a[href], input[type="range"]'

/**
 * Plays the press sound for every control, from one delegated listener rather
 * than a handler wired into each component — so a control added later is
 * covered without anyone remembering to opt it in.
 *
 * Bound on `pointerdown`, not `click`: the sound belongs to the moment of
 * pressing, and waiting for the release feels detached. Keyboard activation
 * emits no pointer event, so `click` is handled too, but only when it came from
 * the keyboard (`detail === 0`) — otherwise every mouse press would sound twice.
 */
export function useClickSound(soundMode: SoundMode, volume: number): void {
  /* Held in a ref so changing the volume doesn't rebind the listeners. */
  const settings = useRef({ soundMode, volume })
  useEffect(() => {
    settings.current = { soundMode, volume }
  }, [soundMode, volume])

  useEffect(() => {
    const soundFor = (target: EventTarget | null) => {
      const element = target as Element | null
      if (!element?.closest?.(PRESSABLE)) return
      const current = settings.current
      if (current.soundMode === 'mute') return
      playClick(current.volume)
    }

    const onPointerDown = (event: PointerEvent) => {
      /* Primary button only: a right-click opens a menu, it isn't a press. */
      if (event.button !== 0) return
      soundFor(event.target)
    }

    const onClick = (event: MouseEvent) => {
      if (event.detail !== 0) return
      soundFor(event.target)
    }

    /* Capture phase, so a control that stops propagation still sounds. */
    document.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('click', onClick, true)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
      document.removeEventListener('click', onClick, true)
    }
  }, [])
}
