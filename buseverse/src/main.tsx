import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { applyTheme } from './data/themes'
import { SAVE_KEY } from './systems/save'

/**
 * Tema, React mount olmadan once uygulanir; boylece renk sicramasi olmuyor.
 * Kayit bozuksa sessizce varsayilan temaya duser.
 */
try {
  const raw = localStorage.getItem(SAVE_KEY)
  if (raw) {
    const parsed = JSON.parse(raw) as { activeTheme?: string }
    if (parsed?.activeTheme) applyTheme(parsed.activeTheme)
  }
} catch {
  /* varsayilan tema kalir */
}

const root = document.getElementById('root')
if (root) {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
