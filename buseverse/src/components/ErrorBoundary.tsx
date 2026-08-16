import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { SAVE_KEY } from '../systems/save'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/**
 * Bir oyun ya da sayfa cokerse butun site kararmasin.
 * Kullaniciya net bir cikis yolu ve son care olarak kaydi sifirlama secenegi verilir.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[buseverse] beklenmeyen hata', error, info)
  }

  reload = () => {
    this.setState({ error: null })
    window.location.reload()
  }

  hardReset = () => {
    try {
      localStorage.removeItem(SAVE_KEY)
    } catch {
      /* yok say */
    }
    window.location.reload()
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="grid min-h-screen place-items-center bg-bg-0 px-6 text-center">
        <div className="max-w-sm">
          <p className="text-4xl" aria-hidden>
            ✖
          </p>
          <h1 className="display mt-5 text-2xl">Bir şey ters gitti</h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-dim">
            Sayfayı yenilemek genelde çözüyor. İlerlemen kayıtlı, endişelenme.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <button
              onClick={this.reload}
              className="h-11 rounded-md bg-accent font-semibold text-bg-0 transition-opacity hover:opacity-90"
            >
              Yenile
            </button>
            <button
              onClick={this.hardReset}
              className="h-11 rounded-md border border-line text-sm text-ink-mute transition-colors hover:text-ink"
            >
              Kaydı sil ve baştan başla
            </button>
          </div>
        </div>
      </div>
    )
  }
}
