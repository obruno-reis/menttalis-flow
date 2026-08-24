export function formatClock(ms: number): { minutes: string; seconds: string } {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return {
    minutes: String(minutes).padStart(2, '0'),
    seconds: String(seconds).padStart(2, '0'),
  }
}

export function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest === 0 ? `${hours} h` : `${hours}h${String(rest).padStart(2, '0')}`
}

export function formatHoursMinutes(totalSeconds: number): string {
  const totalMinutes = Math.round(totalSeconds / 60)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours === 0) return `${minutes} min`
  return `${hours}h${String(minutes).padStart(2, '0')}`
}

export function startOfDay(ts: number): number {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export function startOfWeek(ts: number): number {
  const d = new Date(ts)
  const day = (d.getDay() + 6) % 7 /* Monday = 0 */
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - day)
  return d.getTime()
}
