import { useEffect, useRef, useState } from 'react'
import type { MiniGameProps } from '../components/GameShell'
import { CountdownOverlay, GameArea, GameHud, HudStat, fitCanvas, useCountdown } from './shared'
import { audio } from '../systems/audio'
import { clamp } from '../utils'
import { useGame } from '../store/useGame'

const COLS = 17
const ROWS = 21
const BASE_TICK = 165

interface Cell {
  x: number
  y: number
}

export function LoveSnake({ onFinish }: MiniGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const buzz = useGame((s) => s.buzz)
  const [hud, setHud] = useState({ score: 0, len: 3 })

  const started = useRef(false)
  const count = useCountdown(3, () => {
    started.current = true
  })

  const finishRef = useRef(onFinish)
  finishRef.current = onFinish
  const buzzRef = useRef(buzz)
  buzzRef.current = buzz

  const dirRef = useRef<Cell>({ x: 1, y: 0 })
  const queuedRef = useRef<Cell[]>([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let dims = fitCanvas(canvas)
    if (!dims) return

    let snake: Cell[] = [
      { x: 5, y: 10 },
      { x: 4, y: 10 },
      { x: 3, y: 10 },
    ]
    let food: Cell & { golden: boolean } = { x: 12, y: 10, golden: false }
    let score = 0
    let eaten = 0
    let selfHit = false
    let finished = false
    let acc = 0
    let last = 0
    let raf = 0
    const startedAt = Date.now()

    const onResize = () => {
      const d = fitCanvas(canvas)
      if (d) dims = d
    }
    window.addEventListener('resize', onResize)

    const cellSize = () => {
      if (!dims) return 16
      return Math.min(dims.w / COLS, dims.h / ROWS)
    }

    const placeFood = () => {
      let c: Cell
      let guard = 0
      do {
        c = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) }
        guard++
      } while (guard < 200 && snake.some((s) => s.x === c.x && s.y === c.y))
      food = { ...c, golden: Math.random() < 0.16 }
    }

    const tickMs = () => clamp(BASE_TICK - eaten * 2.6, 78, BASE_TICK)

    const setDir = (x: number, y: number) => {
      const last2 = queuedRef.current.length ? queuedRef.current[queuedRef.current.length - 1] : dirRef.current
      if (last2.x === -x && last2.y === -y) return
      if (last2.x === x && last2.y === y) return
      queuedRef.current.push({ x, y })
      if (queuedRef.current.length > 2) queuedRef.current.shift()
    }

    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      if (['arrowup', 'w'].includes(k)) { e.preventDefault(); setDir(0, -1) }
      else if (['arrowdown', 's'].includes(k)) { e.preventDefault(); setDir(0, 1) }
      else if (['arrowleft', 'a'].includes(k)) { e.preventDefault(); setDir(-1, 0) }
      else if (['arrowright', 'd'].includes(k)) { e.preventDefault(); setDir(1, 0) }
    }
    window.addEventListener('keydown', onKey)

    // Dokunmatik: kaydirma yonu
    let touchStart: { x: number; y: number } | null = null
    const onPointerDown = (e: PointerEvent) => {
      touchStart = { x: e.clientX, y: e.clientY }
    }
    const onPointerUp = (e: PointerEvent) => {
      if (!touchStart) return
      const dx = e.clientX - touchStart.x
      const dy = e.clientY - touchStart.y
      touchStart = null
      if (Math.abs(dx) < 18 && Math.abs(dy) < 18) return
      if (Math.abs(dx) > Math.abs(dy)) setDir(dx > 0 ? 1 : -1, 0)
      else setDir(0, dy > 0 ? 1 : -1)
    }
    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointerup', onPointerUp)

    const finish = () => {
      if (finished) return
      finished = true
      audio.play('lose')
      buzzRef.current([20, 50, 20])
      finishRef.current({
        score,
        bestValue: score,
        performance: clamp(score / 90, 0, 1),
        durationMs: Date.now() - startedAt,
        failed: true,
        detail: [
          { label: 'Uzunluk', value: String(snake.length) },
          { label: 'Yenen', value: String(eaten) },
          { label: 'Bitiş', value: selfHit ? 'Kendine çarptın' : 'Duvara çarptın' },
        ],
        counters: { snPlays: 1, snSelfHits: selfHit ? 1 : 0 },
        maxStats: { snScore: score, snLength: snake.length },
      })
    }

    const advance = () => {
      const next = queuedRef.current.shift()
      if (next) dirRef.current = next
      const head = snake[0]
      const nh = { x: head.x + dirRef.current.x, y: head.y + dirRef.current.y }

      if (nh.x < 0 || nh.y < 0 || nh.x >= COLS || nh.y >= ROWS) {
        finish()
        return
      }
      if (snake.some((s) => s.x === nh.x && s.y === nh.y)) {
        selfHit = true
        finish()
        return
      }

      snake.unshift(nh)
      if (nh.x === food.x && nh.y === food.y) {
        eaten += 1
        score += food.golden ? 5 : 1
        audio.play(food.golden ? 'coin' : 'pop')
        if (food.golden) buzzRef.current(12)
        placeFood()
      } else {
        snake.pop()
      }
      setHud({ score, len: snake.length })
    }

    const draw = () => {
      if (!dims) return
      const { ctx, w, h } = dims
      const cs = cellSize()
      const ox = (w - cs * COLS) / 2
      const oy = (h - cs * ROWS) / 2

      ctx.clearRect(0, 0, w, h)

      // izgara
      ctx.strokeStyle = 'rgb(var(--line) / 0.28)'
      ctx.lineWidth = 1
      ctx.strokeRect(ox, oy, cs * COLS, cs * ROWS)

      // yem
      ctx.save()
      ctx.shadowColor = food.golden ? 'rgb(var(--gold))' : 'rgb(var(--accent))'
      ctx.shadowBlur = food.golden ? 22 : 12
      ctx.fillStyle = food.golden ? 'rgb(var(--gold))' : 'rgb(var(--accent))'
      ctx.font = `${cs * 0.92}px "Segoe UI Symbol", system-ui, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('♥', ox + food.x * cs + cs / 2, oy + food.y * cs + cs / 2)
      ctx.restore()

      // yilan
      snake.forEach((s, i) => {
        const t = i / Math.max(1, snake.length - 1)
        const alpha = 1 - t * 0.55
        ctx.fillStyle = i === 0 ? 'rgb(var(--accent))' : `rgb(var(--accent-soft) / ${alpha})`
        const pad = cs * 0.1
        ctx.beginPath()
        const r = cs * 0.26
        const x = ox + s.x * cs + pad
        const y = oy + s.y * cs + pad
        const size = cs - pad * 2
        ctx.moveTo(x + r, y)
        ctx.arcTo(x + size, y, x + size, y + size, r)
        ctx.arcTo(x + size, y + size, x, y + size, r)
        ctx.arcTo(x, y + size, x, y, r)
        ctx.arcTo(x, y, x + size, y, r)
        ctx.closePath()
        ctx.fill()
      })
    }

    const step = (now: number) => {
      const dt = last ? Math.min(80, now - last) : 16
      last = now
      if (started.current && !finished) {
        acc += dt
        while (acc >= tickMs()) {
          acc -= tickMs()
          advance()
          if (finished) break
        }
      }
      draw()
      if (!finished) raf = requestAnimationFrame(step)
    }

    placeFood()
    raf = requestAnimationFrame(step)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('keydown', onKey)
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointerup', onPointerUp)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const nudge = (x: number, y: number) => {
    const last = queuedRef.current.length ? queuedRef.current[queuedRef.current.length - 1] : dirRef.current
    if (last.x === -x && last.y === -y) return
    queuedRef.current.push({ x, y })
    if (queuedRef.current.length > 2) queuedRef.current.shift()
  }

  return (
    <GameArea className="flex flex-col">
      <canvas ref={canvasRef} className="min-h-0 w-full flex-1 touch-none-y" />
      <GameHud
        left={<HudStat label="Skor" value={hud.score} />}
        right={<HudStat label="Uzunluk" value={hud.len} />}
      />

      {/* Mobil kontrol pedi */}
      <div className="grid shrink-0 grid-cols-3 gap-2 p-4 sm:hidden" aria-label="Yön kontrolleri">
        <div />
        <PadButton label="▲" onPress={() => nudge(0, -1)} />
        <div />
        <PadButton label="◀" onPress={() => nudge(-1, 0)} />
        <PadButton label="▼" onPress={() => nudge(0, 1)} />
        <PadButton label="▶" onPress={() => nudge(1, 0)} />
      </div>

      <p className="pointer-events-none hidden text-center text-[11px] text-ink-mute sm:block sm:pb-3">
        Ok tuşları veya WASD · kaydırmak da çalışıyor
      </p>

      <CountdownOverlay n={count} />
    </GameArea>
  )
}

function PadButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <button
      onPointerDown={(e) => {
        e.preventDefault()
        onPress()
      }}
      className="h-14 rounded-md border border-line/70 bg-bg-2/70 text-lg text-ink-dim active:bg-accent/20 active:text-accent"
      aria-label={label}
    >
      {label}
    </button>
  )
}
