import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'

/*
 * Stylesheet order is load-bearing and follows this import order:
 *   1. our Tailwind preflight + design tokens
 *   2. BlockNote's stylesheets, so the editor's resets survive preflight
 *   3. our overrides on top of BlockNote
 */
import './styles/index.css'
import '@blocknote/core/fonts/inter.css'
import '@blocknote/mantine/style.css'
import './styles/editor.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
