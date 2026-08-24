import { useEffect } from 'react'
import type { Theme } from '../types'
import { usePersistentState } from './usePersistentState'

const THEME_COLOR: Record<Theme, string> = {
  light: '#edeef1',
  dark: '#0a141f',
}

/**
 * Light is the default rather than the system preference: the app is meant to
 * open the same calm way every time, and the choice stays explicit.
 */
export function useTheme() {
  const [theme, setTheme] = usePersistentState<Theme>('theme', 'light')

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    /* Keeps the browser/PWA chrome in step with the page. */
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[theme])
  }, [theme])

  return [theme, setTheme] as const
}
