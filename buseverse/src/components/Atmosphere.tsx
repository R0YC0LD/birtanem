import { useEffect, useRef, useState } from 'react'
import { useGame } from '../store/useGame'
import { trailById } from '../data/themes'
import { createLoop, randFloat } from '../utils'

/**
 * Arkaplan atmosferi: yavas suzulen bokeh parcaciklari + ince vinyet.
 * Canvas tek katman; DOM'a yuzlerce parcacik basmiyoruz.
 */
export function Atmosphere() {
  const reduced = useGame((s) => s.save.settings.reducedMotion)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let w = 0
    let h = 0
    let dpr = 1

    const isSmall = window.innerWidth < 768
    const count = reduced ? 8 : isSmall ? 16 : 30

    type P = { x: number; y: number; r: number; vy: number; vx: number; a: number; hue: number }
    let parts: P[] = []

    const seed = () => {
      parts = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: randFloat(14, 62),
        vy: randFloat(-0.11, -0.03),
        vx: randFloat(-0.05, 0.05),
        a: randFloat(0.04, 0.16),
        hue: Math.random(),
      }))
    }

    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1)
      w = window.innerWidth
      h = window.innerHeight
      // Boyutu CSS veriyor (absolute inset-0); burada sadece arka tampon olceklenir.
      // Boylece resize gecikse bile canvas asla tasma yaratmaz.
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      seed()
    }

    resize()
    window.addEventListener('resize', resize)

    const readVar = (name: string) => {
      const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
      return raw || '227 106 133'
    }

    let accentRgb = readVar('--accent')
    let lavRgb = readVar('--lav')
    let varTick = 0

    const loop = createLoop((dt) => {
      varTick += dt
      if (varTick > 1000) {
        varTick = 0
        accentRgb = readVar('--accent')
        lavRgb = readVar('--lav')
      }
      ctx.clearRect(0, 0, w, h)
      const k = dt / 16.67
      for (const p of parts) {
        p.y += p.vy * k
        p.x += p.vx * k
        if (p.y + p.r < 0) {
          p.y = h + p.r
          p.x = Math.random() * w
        }
        if (p.x < -p.r) p.x = w + p.r
        if (p.x > w + p.r) p.x = -p.r

        const rgb = p.hue > 0.55 ? lavRgb : accentRgb
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r)
        g.addColorStop(0, `rgb(${rgb} / ${p.a})`)
        g.addColorStop(1, `rgb(${rgb} / 0)`)
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fill()
      }
    })

    if (!reduced) loop.start()
    else {
      // Hareket azaltmada tek kare ciz, animasyon yok
      ctx.clearRect(0, 0, w, h)
    }

    const onVisibility = () => {
      if (document.hidden) loop.stop()
      else if (!reduced) loop.start()
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      loop.stop()
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [reduced])

  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_0%,transparent_45%,rgb(0_0_0/0.5)_100%)]" />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Ozel imlec + iz                                                     */
/* ------------------------------------------------------------------ */

interface TrailDot {
  id: number
  x: number
  y: number
  glyph: string
}

export function CursorLayer() {
  const enabled = useGame((s) => s.save.settings.customCursor)
  const reduced = useGame((s) => s.save.settings.reducedMotion)
  const trailId = useGame((s) => s.save.activeTrail)
  const [pos, setPos] = useState({ x: -100, y: -100 })
  const [big, setBig] = useState(false)
  const [dots, setDots] = useState<TrailDot[]>([])
  const idRef = useRef(0)
  const lastRef = useRef(0)
  const [finePointer, setFinePointer] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(pointer: fine)')
    const update = () => setFinePointer(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  const active = enabled && finePointer
  const trail = trailById.get(trailId)
  const trailOn = !!trail && trail.glyphs.length > 0 && !reduced && finePointer

  useEffect(() => {
    if (!active && !trailOn) return
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      setPos({ x: e.clientX, y: e.clientY })

      const target = e.target as HTMLElement | null
      setBig(!!target?.closest('button, a, [role="button"], input, select'))

      if (trailOn && trail) {
        const now = performance.now()
        if (now - lastRef.current > 70) {
          lastRef.current = now
          const id = ++idRef.current
          const glyph = trail.glyphs[Math.floor(Math.random() * trail.glyphs.length)]
          setDots((d) => [...d.slice(-11), { id, x: e.clientX, y: e.clientY, glyph }])
          window.setTimeout(() => setDots((d) => d.filter((x) => x.id !== id)), 720)
        }
      }
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [active, trailOn, trail])

  useEffect(() => {
    document.documentElement.dataset.cursor = active ? 'custom' : 'default'
    return () => {
      document.documentElement.dataset.cursor = 'default'
    }
  }, [active])

  if (!active && !trailOn) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-[200]" aria-hidden>
      {trailOn &&
        dots.map((d) => (
          <span
            key={d.id}
            className="absolute select-none text-[13px]"
            style={{
              left: d.x,
              top: d.y,
              color: trail!.color,
              transform: 'translate(-50%,-50%)',
              animation: 'floaty 0.72s ease-out forwards',
              opacity: 0.75,
            }}
          >
            {d.glyph}
          </span>
        ))}
      {active && (
        <>
          <div
            className="absolute rounded-full border border-accent/70 transition-[width,height] duration-200 ease-out"
            style={{
              left: pos.x,
              top: pos.y,
              width: big ? 34 : 20,
              height: big ? 34 : 20,
              transform: 'translate(-50%,-50%)',
            }}
          />
          <div
            className="absolute h-1.5 w-1.5 rounded-full bg-accent"
            style={{ left: pos.x, top: pos.y, transform: 'translate(-50%,-50%)' }}
          />
        </>
      )}
    </div>
  )
}
