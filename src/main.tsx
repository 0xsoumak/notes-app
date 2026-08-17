import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'

/*
 * Stylesheet order is load-bearing and follows this import order:
 *   1. the Inter webfont the design tokens name
 *   2. our Tailwind preflight + design tokens
 *   3. the note body's own styles, which override preflight's element resets
 */
import '@fontsource-variable/inter'
import './styles/index.css'
import './styles/editor.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
