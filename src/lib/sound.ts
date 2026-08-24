import type { SoundMode } from '../types'

type ToneEvent = 'start' | 'pause' | 'complete' | 'breakStart'

/**
 * Lazily-created singleton AudioContext. Browsers require a user gesture
 * before audio can play, so this is only ever instantiated from inside an
 * event handler (see `primeAudio`).
 */
let ctx: AudioContext | null = null

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    ctx = new Ctor()
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

/** Call from a click/keydown handler to unlock audio on first interaction. */
export function primeAudio(): void {
  getContext()
}

interface Note {
  freq: number
  delay: number
  duration: number
  gain: number
}

const PATTERNS: Record<ToneEvent, { system: Note[]; chime: Note[] }> = {
  start: {
    system: [{ freq: 660, delay: 0, duration: 0.14, gain: 0.5 }],
    chime: [
      { freq: 523.25, delay: 0, duration: 0.32, gain: 0.42 },
      { freq: 783.99, delay: 0.06, duration: 0.4, gain: 0.32 },
    ],
  },
  pause: {
    system: [{ freq: 440, delay: 0, duration: 0.12, gain: 0.4 }],
    chime: [{ freq: 392, delay: 0, duration: 0.28, gain: 0.34 }],
  },
  complete: {
    system: [
      { freq: 587.33, delay: 0, duration: 0.16, gain: 0.5 },
      { freq: 880, delay: 0.12, duration: 0.22, gain: 0.45 },
    ],
    chime: [
      { freq: 523.25, delay: 0, duration: 0.4, gain: 0.4 },
      { freq: 659.25, delay: 0.1, duration: 0.4, gain: 0.36 },
      { freq: 987.77, delay: 0.22, duration: 0.55, gain: 0.3 },
    ],
  },
  breakStart: {
    system: [{ freq: 494, delay: 0, duration: 0.18, gain: 0.4 }],
    chime: [
      { freq: 392, delay: 0, duration: 0.36, gain: 0.32 },
      { freq: 587.33, delay: 0.08, duration: 0.42, gain: 0.26 },
    ],
  },
}

export function playTone(event: ToneEvent, mode: SoundMode, volume: number): void {
  if (mode === 'mute' || volume <= 0) return
  const audio = getContext()
  if (!audio) return

  const notes = PATTERNS[event][mode === 'chime' ? 'chime' : 'system']
  const now = audio.currentTime

  for (const note of notes) {
    const osc = audio.createOscillator()
    const gainNode = audio.createGain()
    osc.type = mode === 'chime' ? 'sine' : 'triangle'
    osc.frequency.value = note.freq

    const startAt = now + note.delay
    const endAt = startAt + note.duration
    const peak = note.gain * volume

    gainNode.gain.setValueAtTime(0, startAt)
    gainNode.gain.linearRampToValueAtTime(peak, startAt + 0.012)
    gainNode.gain.exponentialRampToValueAtTime(Math.max(peak * 0.001, 0.0001), endAt)

    osc.connect(gainNode)
    gainNode.connect(audio.destination)
    osc.start(startAt)
    osc.stop(endAt + 0.02)
  }
}
