export type ClockId = 'digital' | 'analog' | 'ring'

export type ViewMode = 'watch' | 'focus'

export type SessionPhase = 'idle' | 'running' | 'paused' | 'break' | 'done'

export type SoundMode = 'mute' | 'system' | 'chime'

export type Theme = 'light' | 'dark'

export interface FocusSettings {
  clock: ClockId
  duration: number /* seconds */
  breakDuration: number /* seconds */
  intention: string
  soundMode: SoundMode
  volume: number /* 0..1 */
  cyclesUntilLongBreak: number
}

export interface SessionRecord {
  id: string
  kind: 'focus' | 'break'
  intention: string
  plannedSeconds: number
  actualSeconds: number
  completedAt: number /* epoch ms */
}

export interface TimerSnapshot {
  phase: SessionPhase
  remainingMs: number
  totalMs: number
  /** epoch ms the current phase is scheduled to end at, null when paused/idle */
  endAt: number | null
}
