/* Versioned: bumping it retires previously stored shapes rather than trying to
   migrate them, so defaults always apply cleanly after a settings change. */
const PREFIX = 'menttalis-flow:v2:'

const NAMESPACE = 'menttalis-flow:'

/** Drops entries written under an earlier PREFIX so they don't linger unused. */
export function purgeLegacyStorage(): void {
  if (typeof window === 'undefined') return
  try {
    const stale = Object.keys(window.localStorage).filter(
      (key) => key.startsWith(NAMESPACE) && !key.startsWith(PREFIX),
    )
    for (const key of stale) window.localStorage.removeItem(key)
  } catch {
    /* storage unavailable — nothing to clean up */
  }
}

export function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(PREFIX + key)
    if (raw === null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function writeStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    /* storage unavailable (private mode, quota) — fail silently */
  }
}
