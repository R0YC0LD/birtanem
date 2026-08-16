import { useEffect, useRef } from 'react'
import { useGame } from '../store/useGame'
import { audio } from '../systems/audio'

const KONAMI = [
  'arrowup',
  'arrowup',
  'arrowdown',
  'arrowdown',
  'arrowleft',
  'arrowright',
  'arrowleft',
  'arrowright',
  'b',
  'a',
]

const KONAMI_SWIPE = ['up', 'up', 'down', 'down', 'left', 'right', 'left', 'right']

const NAME = 'buse'

/**
 * Klavye ve dokunmatik easter eggler.
 * Klavye gerektiren her sirrin dokunmatik karsiligi var:
 *  - Konami  -> ekranda kaydirma dizisi
 *  - "BUSE"  -> ana sayfadaki harflere sirayla dokunma (Home icinde)
 */
export function useSecrets() {
  const setFlag = useGame((s) => s.setFlag)
  const unlockMessage = useGame((s) => s.unlockMessage)
  const noteTabReturn = useGame((s) => s.noteTabReturn)
  const addPlaytime = useGame((s) => s.addPlaytime)

  const keyBuf = useRef<string[]>([])
  const swipeBuf = useRef<string[]>([])
  const touchStart = useRef<{ x: number; y: number } | null>(null)

  /* ---------------- klavye ---------------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return

      const k = e.key.toLowerCase()
      keyBuf.current = [...keyBuf.current, k].slice(-12)

      if (KONAMI.every((v, i) => keyBuf.current[keyBuf.current.length - KONAMI.length + i] === v)) {
        setFlag('secret-konami')
        unlockMessage('msg-konami')
        keyBuf.current = []
        return
      }
      const tail = keyBuf.current.slice(-NAME.length).join('')
      if (tail === NAME) {
        setFlag('secret-name')
        unlockMessage('msg-name')
        keyBuf.current = []
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setFlag, unlockMessage])

  /* ---------------- dokunmatik konami ---------------- */
  useEffect(() => {
    const onStart = (e: TouchEvent) => {
      const t = e.touches[0]
      if (!t) return
      touchStart.current = { x: t.clientX, y: t.clientY }
    }
    const onEnd = (e: TouchEvent) => {
      const start = touchStart.current
      touchStart.current = null
      const t = e.changedTouches[0]
      if (!start || !t) return
      const dx = t.clientX - start.x
      const dy = t.clientY - start.y
      if (Math.abs(dx) < 55 && Math.abs(dy) < 55) return
      const dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up'
      swipeBuf.current = [...swipeBuf.current, dir].slice(-KONAMI_SWIPE.length)
      if (
        swipeBuf.current.length === KONAMI_SWIPE.length &&
        swipeBuf.current.every((v, i) => v === KONAMI_SWIPE[i])
      ) {
        setFlag('secret-konami')
        unlockMessage('msg-konami')
        swipeBuf.current = []
      }
    }
    window.addEventListener('touchstart', onStart, { passive: true })
    window.addEventListener('touchend', onEnd, { passive: true })
    return () => {
      window.removeEventListener('touchstart', onStart)
      window.removeEventListener('touchend', onEnd)
    }
  }, [setFlag, unlockMessage])

  /* ---------------- bosta bekleme ---------------- */
  useEffect(() => {
    let timer = window.setTimeout(() => setFlag('secret-idle'), 120_000)
    const reset = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => setFlag('secret-idle'), 120_000)
    }
    const events: (keyof WindowEventMap)[] = ['pointerdown', 'keydown', 'wheel', 'touchstart']
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }))
    return () => {
      window.clearTimeout(timer)
      events.forEach((e) => window.removeEventListener(e, reset))
    }
  }, [setFlag])

  /* ---------------- sekme donusleri ---------------- */
  useEffect(() => {
    const onVis = () => {
      if (!document.hidden) noteTabReturn()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [noteTabReturn])

  /* ---------------- oynama suresi ---------------- */
  useEffect(() => {
    let lastTick = Date.now()
    const id = window.setInterval(() => {
      if (document.hidden) {
        lastTick = Date.now()
        return
      }
      const now = Date.now()
      const delta = Math.min(60_000, now - lastTick)
      lastTick = now
      addPlaytime(delta)
    }, 30_000)
    return () => window.clearInterval(id)
  }, [addPlaytime])

  /* ---------------- ilk etkilesimde ses motorunu ac ---------------- */
  useEffect(() => {
    const unlock = () => {
      audio.unlock()
      const s = useGame.getState().save.settings
      audio.setEnabled(s.sfx)
      audio.setVolume(s.volume)
      audio.setMusic(s.music)
    }
    window.addEventListener('pointerdown', unlock, { once: true })
    window.addEventListener('keydown', unlock, { once: true })
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [])
}

/**
 * Nadiren beliren kucuk surprizler. Spam yapmamasi icin ~%4 sansla,
 * en erken 90 saniyede bir.
 */
export function useRandomDelight() {
  const pushFloater = useGame((s) => s.pushFloater)
  const setFlag = useGame((s) => s.setFlag)

  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.hidden) return
      if (Math.random() > 0.04) return
      const lines = ['✦ bir yıldız geçti', '♥ kalp göz kırptı', '+1 şans', '☾ ay seni gördü']
      pushFloater(lines[Math.floor(Math.random() * lines.length)], 'plain')
      setFlag('secret-lucky')
    }, 90_000)
    return () => window.clearInterval(id)
  }, [pushFloater, setFlag])
}
