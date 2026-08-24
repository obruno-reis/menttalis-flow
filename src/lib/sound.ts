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

/**
 * White noise, generated once and reused. Regenerated only if the context
 * comes back at a different sample rate (device or output change).
 */
let noise: AudioBuffer | null = null

function getNoise(audio: AudioContext): AudioBuffer {
  if (!noise || noise.sampleRate !== audio.sampleRate) {
    const length = Math.floor(audio.sampleRate * 0.1)
    noise = audio.createBuffer(1, length, audio.sampleRate)
    const data = noise.getChannelData(0)
    for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1
  }
  return noise
}

/**
 * The press of a button — soft, close and short.
 *
 * Two layers: a low sine that drops in pitch, which gives the press its weight,
 * and a very brief noise transient rolled off above ~1.5kHz, which supplies the
 * sense of material without the sharp edge a raw click would have. Each press is
 * detuned slightly at random, so a run of them doesn't sound machine-stamped.
 *
 * Deliberately quieter than the session tones: it is texture, not a signal.
 */
export function playClick(volume: number): void {
  if (volume <= 0) return
  const audio = getContext()
  if (!audio) return

  /* A hair of lookahead: on the very first press the context is still resuming,
     and scheduling exactly at currentTime can drop the sound. */
  const at = audio.currentTime + 0.005
  const level = 0.34 * volume
  const detune = 0.94 + Math.random() * 0.12

  const out = audio.createGain()
  out.gain.value = 1
  out.connect(audio.destination)

  /* Body — the weight of the press. */
  const body = audio.createOscillator()
  const bodyGain = audio.createGain()
  body.type = 'sine'
  body.frequency.setValueAtTime(220 * detune, at)
  body.frequency.exponentialRampToValueAtTime(120 * detune, at + 0.055)
  bodyGain.gain.setValueAtTime(0, at)
  bodyGain.gain.linearRampToValueAtTime(level * 0.62, at + 0.006)
  bodyGain.gain.exponentialRampToValueAtTime(0.0001, at + 0.08)
  body.connect(bodyGain)
  bodyGain.connect(out)
  body.start(at)
  body.stop(at + 0.1)

  /* Tick — the material, softened by the low-pass. */
  const tick = audio.createBufferSource()
  tick.buffer = getNoise(audio)
  const lowpass = audio.createBiquadFilter()
  lowpass.type = 'lowpass'
  lowpass.frequency.value = 1500 * detune
  lowpass.Q.value = 0.7
  const tickGain = audio.createGain()
  tickGain.gain.setValueAtTime(0, at)
  tickGain.gain.linearRampToValueAtTime(level * 0.5, at + 0.004)
  tickGain.gain.exponentialRampToValueAtTime(0.0001, at + 0.032)
  tick.connect(lowpass)
  lowpass.connect(tickGain)
  tickGain.connect(out)
  tick.start(at)
  tick.stop(at + 0.06)
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
