import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App.tsx'
import './index.css'
import { purgeLegacyStorage, readStorage } from './lib/storage'
import type { Theme } from './types'

purgeLegacyStorage()

/* Applied before the first paint so a dark-mode user never sees a light flash. */
document.documentElement.dataset.theme = readStorage<Theme>('theme', 'light')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

registerSW({ immediate: true })
