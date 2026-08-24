import { useCallback } from 'react'

/**
 * Thin wrapper over the Fullscreen API. Fullscreen can be refused (no user
 * gesture, or an unsupported browser), so `enter` reports whether it took —
 * callers keep their in-page immersive view working either way.
 */
export function useFullscreen() {
  const enter = useCallback(async (): Promise<boolean> => {
    if (document.fullscreenElement) return true
    try {
      await document.documentElement.requestFullscreen()
      return true
    } catch {
      return false
    }
  }, [])

  const exit = useCallback(async () => {
    if (!document.fullscreenElement) return
    try {
      await document.exitFullscreen()
    } catch {
      /* already left, or the browser refused — nothing to recover */
    }
  }, [])

  return { enter, exit }
}
