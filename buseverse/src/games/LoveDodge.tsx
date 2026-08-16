import { useEffect, useRef, useState } from 'react'
import type { MiniGameProps } from '../components/GameShell'
import { CountdownOverlay, GameArea, GameHud, HudStat, PopLayer, fitCanvas, usePops, useCountdown } from './shared'
import { audio } from '../systems/audio'
import { clamp, randFloat } from '../utils'
import { useGame } from '../store/useGame'

interface Obstacle {
  x: number
  y: number
  w: number
  h: number
  vy: number
  passed: boolean
  near: boolean
}

interface Heart {
  x: number
  y: number
  vy: number
  dead: boolean
}

export function LoveDodge({ onFinish }: MiniGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { pops, push } = usePops()
  const buzz = useGame((s) => s.buzz)
  const [hud, setHud] = useState({ score: 0, time: 0, hearts: 0 })

  const started = useRef(false)
  const count = useCountdown(3, () => {
    started.current = true
  })

  const finishRef = useRef(onFinish)
  finishRef.current = onFinish
  const buzzRef = useRef(buzz)
  buzzRef.current = buzz

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let dims = fitCanvas(canvas)
    if (!dims) return

    const state = {
      px: 0.5,
      targetX: 0.5,
      elapsed: 0,
      score: 0,
      hearts: 0,
      near: 0,
      finished: false,
    }

    let obstacles: Obstacle[] = []
    let hearts: Heart[] = []
    let raf = 0
    let last = 0
    let spawnTimer = 0
    let heartTimer = 0
    let hudTimer = 0

    const onResize = () => {
      const d = fitCanvas(canvas)
      if (d) dims = d
    }
    window.addEventListener('resize', onResize)

    const playerY = () => (dims?.h ?? 400) - 78
    const playerR = 15

    const move = (clientX: number) => {
      if (!dims) return
      const rect = canvas.getBoundingClientRect()
      state.targetX = clamp((clientX - rect.left) / rect.width, 0.05, 0.95)
    }
    const onPointerMove = (e: PointerEvent) => move(e.clientX)
    const onPointerDown = (e: PointerEvent) => {
      canvas.setPointerCapture?.(e.pointerId)
      move(e.clientX)
    }
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerdown', onPointerDown)

    const keys = new Set<string>()
    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      if (['arrowleft', 'arrowright', 'a', 'd'].includes(k)) {
        e.preventDefault()
        keys.add(k)
      }
    }
    const onKeyUp = (e: KeyboardEvent) => keys.delete(e.key.toLowerCase())
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)

    const difficulty = () => clamp(state.elapsed / 90_000, 0, 1)

    const spawnObstacle = () => {
      if (!dims) return
      const d = difficulty()
      const w = randFloat(46, 100 + d * 60)
      obstacles.push({
        x: randFloat(0, dims.w - w),
        y: -40,
        w,
        h: randFloat(16, 26),
        vy: 0.16 + d * 0.26 + randFloat(0, 0.05),
        passed: false,
        near: false,
      })
    }

    const spawnHeart = () => {
      if (!dims) return
      hearts.push({ x: randFloat(20, dims.w - 20), y: -20, vy: 0.14 + difficulty() * 0.12, dead: false })
    }

    const finish = () => {
      if (state.finished) return
      state.finished = true
      const perf = clamp(state.elapsed / 110_000, 0, 1)
      audio.play('lose')
      buzzRef.current([20, 60, 20])
      finishRef.current({
        score: Math.round(state.score),
        bestValue: Math.round(state.elapsed),
        performance: perf,
        durationMs: Math.round(state.elapsed),
        failed: true,
        detail: [
          { label: 'Hayatta kalma', value: `${(state.elapsed / 1000).toFixed(1)}s` },
          { label: 'Kalp', value: String(state.hearts) },
          { label: 'Kıl payı', value: String(state.near) },
        ],
        counters: {
          ldPlays: 1,
          ldHearts: state.hearts,
          ldNearMisses: state.near,
        },
        maxStats: { ldScore: Math.round(state.score), ldBestTimeMs: Math.round(state.elapsed) },
      })
    }

    const step = (now: number) => {
      if (!dims) return
      const dt = last ? Math.min(50, now - last) : 16
      last = now
      const { ctx, w, h } = dims

      if (keys.size) {
        const dir = (keys.has('arrowright') || keys.has('d') ? 1 : 0) - (keys.has('arrowleft') || keys.has('a') ? 1 : 0)
        state.targetX = clamp(state.targetX + dir * 0.0018 * dt, 0.05, 0.95)
      }
      state.px += (state.targetX - state.px) * Math.min(1, dt * 0.018)

      if (started.current && !state.finished) {
        state.elapsed += dt
        state.score += dt * 0.012 * (1 + difficulty())
        spawnTimer += dt
        heartTimer += dt
        const interval = clamp(900 - difficulty() * 520, 340, 900)
        while (spawnTimer >= interval) {
          spawnTimer -= interval
          spawnObstacle()
        }
        if (heartTimer > 1500) {
          heartTimer = 0
          if (Math.random() < 0.7) spawnHeart()
        }
      }

      ctx.clearRect(0, 0, w, h)

      const px = state.px * w
      const py = playerY()

      // engeller
      for (const o of obstacles) {
        if (started.current && !state.finished) o.y += o.vy * dt

        const hitX = px + playerR > o.x && px - playerR < o.x + o.w
        const hitY = py + playerR > o.y && py - playerR < o.y + o.h
        if (hitX && hitY && !state.finished) {
          finish()
          return
        }
        if (!o.near && hitX === false && Math.abs(o.y + o.h / 2 - py) < 26) {
          const gapL = Math.abs(px - o.x)
          const gapR = Math.abs(px - (o.x + o.w))
          if (Math.min(gapL, gapR) < playerR + 14) {
            o.near = true
            state.near += 1
            state.score += 12
            push(px, py - 34, 'kıl payı +12', '#E9C79A')
            audio.play('combo')
          }
        }
        if (!o.passed && o.y > py + playerR) {
          o.passed = true
          state.score += 18
        }

        ctx.fillStyle = 'rgb(var(--wine))'
        ctx.strokeStyle = 'rgb(var(--accent) / 0.55)'
        ctx.lineWidth = 1.5
        roundRect(ctx, o.x, o.y, o.w, o.h, 6)
        ctx.fill()
        ctx.stroke()
      }
      obstacles = obstacles.filter((o) => o.y < h + 60)

      // kalpler
      for (const hrt of hearts) {
        if (hrt.dead) continue
        if (started.current && !state.finished) hrt.y += hrt.vy * dt
        const dx = hrt.x - px
        const dy = hrt.y - py
        if (dx * dx + dy * dy < (playerR + 15) * (playerR + 15)) {
          hrt.dead = true
          state.hearts += 1
          state.score += 25
          push(hrt.x, hrt.y, '+25', '#E36A85')
          audio.play('pop')
          continue
        }
        ctx.fillStyle = '#E36A85'
        ctx.font = '26px "Segoe UI Symbol", system-ui, sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('♥', hrt.x, hrt.y)
      }
      hearts = hearts.filter((hrt) => !hrt.dead && hrt.y < h + 30)

      // oyuncu
      ctx.save()
      ctx.shadowColor = 'rgb(var(--accent))'
      ctx.shadowBlur = 18
      ctx.fillStyle = 'rgb(var(--accent))'
      ctx.beginPath()
      ctx.arc(px, py, playerR, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
      ctx.fillStyle = 'rgb(var(--bg-0))'
      ctx.font = 'bold 15px system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('B', px, py + 1)

      hudTimer += dt
      if (hudTimer > 100) {
        hudTimer = 0
        setHud({ score: Math.round(state.score), time: state.elapsed, hearts: state.hearts })
      }

      raf = requestAnimationFrame(step)
    }

    raf = requestAnimationFrame(step)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerdown', onPointerDown)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <GameArea>
      <canvas ref={canvasRef} className="h-full w-full touch-none-y" />
      <GameHud
        left={<HudStat label="Skor" value={hud.score} />}
        center={<HudStat label="Süre" value={`${(hud.time / 1000).toFixed(1)}s`} />}
        right={<HudStat label="Kalp" value={hud.hearts} />}
      />
      <PopLayer pops={pops} />
      <CountdownOverlay n={count} />
      <p className="pointer-events-none absolute inset-x-0 bottom-4 text-center text-[11px] text-ink-mute">
        Parmağını sürükle veya A / D · engele değmeden sıyırmak puan veriyor
      </p>
    </GameArea>
  )
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}
