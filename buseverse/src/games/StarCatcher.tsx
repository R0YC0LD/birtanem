import { useEffect, useRef, useState } from 'react'
import type { MiniGameProps } from '../components/GameShell'
import { CountdownOverlay, GameArea, GameHud, HudStat, PopLayer, TimeBar, fitCanvas, usePops, useCountdown } from './shared'
import { audio } from '../systems/audio'
import { clamp, randFloat } from '../utils'
import { useGame } from '../store/useGame'

const DURATION = 60_000

type StarKind = 'normal' | 'blue' | 'purple' | 'gold' | 'shooting'

const STAR: Record<StarKind, { points: number; color: string; size: number; weight: number; glyph: string }> = {
  normal: { points: 1, color: '#DCE4F5', size: 15, weight: 60, glyph: '✦' },
  blue: { points: 3, color: '#8FA8E0', size: 16, weight: 22, glyph: '✦' },
  purple: { points: 8, color: '#B79BE8', size: 17, weight: 11, glyph: '✧' },
  gold: { points: 18, color: '#E9C79A', size: 19, weight: 6, glyph: '✵' },
  shooting: { points: 60, color: '#FFF3D0', size: 22, weight: 1, glyph: '☄' },
}

const KINDS = Object.keys(STAR) as StarKind[]
const TOTAL = KINDS.reduce((a, k) => a + STAR[k].weight, 0)

function roll(): StarKind {
  let r = Math.random() * TOTAL
  for (const k of KINDS) {
    r -= STAR[k].weight
    if (r <= 0) return k
  }
  return 'normal'
}

interface Star {
  kind: StarKind
  x: number
  y: number
  vx: number
  vy: number
  dead: boolean
  twinkle: number
}

export function StarCatcher({ onFinish }: MiniGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { pops, push } = usePops()
  const buzz = useGame((s) => s.buzz)
  const [hud, setHud] = useState({ score: 0, time: DURATION, stars: 0 })

  const started = useRef(false)
  const count = useCountdown(3, () => {
    started.current = true
  })

  const state = useRef({
    score: 0,
    stars: 0,
    gold: 0,
    purple: 0,
    shooting: 0,
    missed: 0,
    elapsed: 0,
    finished: false,
    basketX: 0.5,
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

    let stars: Star[] = []
    let raf = 0
    let last = 0
    let spawnTimer = 0
    let hudTimer = 0
    let bgStars: { x: number; y: number; r: number; a: number }[] = []

    const seedBg = () => {
      if (!dims) return
      bgStars = Array.from({ length: 46 }, () => ({
        x: Math.random() * dims!.w,
        y: Math.random() * dims!.h,
        r: randFloat(0.5, 1.6),
        a: randFloat(0.15, 0.6),
      }))
    }
    seedBg()

    const onResize = () => {
      const d = fitCanvas(canvas)
      if (d) {
        dims = d
        seedBg()
      }
    }
    window.addEventListener('resize', onResize)

    const basketW = () => Math.min(140, (dims?.w ?? 300) * 0.28)
    const basketY = () => (dims?.h ?? 400) - 54

    const movePointer = (clientX: number) => {
      if (!dims) return
      const rect = canvas.getBoundingClientRect()
      state.current.basketX = clamp((clientX - rect.left) / rect.width, 0.06, 0.94)
    }

    const onPointerMove = (e: PointerEvent) => movePointer(e.clientX)
    const onPointerDown = (e: PointerEvent) => {
      canvas.setPointerCapture?.(e.pointerId)
      movePointer(e.clientX)
    }
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerdown', onPointerDown)

    const keys = new Set<string>()
    const onKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'a', 'd', 'A', 'D'].includes(e.key)) {
        e.preventDefault()
        keys.add(e.key.toLowerCase())
      }
    }
    const onKeyUp = (e: KeyboardEvent) => keys.delete(e.key.toLowerCase())
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)

    const spawnInterval = () => clamp(560 - (state.current.elapsed / DURATION) * 300, 200, 560)

    const spawn = () => {
      if (!dims) return
      const kind = roll()
      const isShooting = kind === 'shooting'
      stars.push({
        kind,
        x: randFloat(20, dims.w - 20),
        y: -20,
        vx: isShooting ? randFloat(-0.13, 0.13) : randFloat(-0.02, 0.02),
        vy: isShooting ? randFloat(0.34, 0.44) : randFloat(0.1, 0.17) + (state.current.elapsed / DURATION) * 0.06,
        dead: false,
        twinkle: Math.random() * Math.PI * 2,
      })
    }

    const step = (now: number) => {
      if (!dims) return
      const dt = last ? Math.min(50, now - last) : 16
      last = now
      const s = state.current
      const { ctx, w, h } = dims

      if (keys.size) {
        const dir = (keys.has('arrowright') || keys.has('d') ? 1 : 0) - (keys.has('arrowleft') || keys.has('a') ? 1 : 0)
        s.basketX = clamp(s.basketX + dir * 0.0016 * dt, 0.06, 0.94)
      }

      if (started.current && !s.finished) {
        s.elapsed += dt
        spawnTimer += dt
        while (spawnTimer >= spawnInterval()) {
          spawnTimer -= spawnInterval()
          spawn()
        }
      }

      ctx.clearRect(0, 0, w, h)

      // arka plan yildizlari
      for (const b of bgStars) {
        ctx.fillStyle = `rgb(220 228 245 / ${b.a})`
        ctx.beginPath()
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2)
        ctx.fill()
      }

      const bw = basketW()
      const by = basketY()
      const bx = s.basketX * w

      for (const st of stars) {
        if (st.dead) continue
        if (started.current && !s.finished) {
          st.y += st.vy * dt
          st.x += st.vx * dt
          st.twinkle += dt * 0.004
        }

        // yakalama kontrolu
        if (st.y >= by - 14 && st.y <= by + 22 && Math.abs(st.x - bx) < bw / 2 + 10) {
          st.dead = true
          const cfg = STAR[st.kind]
          s.score += cfg.points
          s.stars += 1
          if (st.kind === 'gold') s.gold += 1
          if (st.kind === 'purple') s.purple += 1
          if (st.kind === 'shooting') s.shooting += 1
          push(st.x, by - 26, `+${cfg.points}`, cfg.color)
          audio.play(st.kind === 'shooting' ? 'secret' : st.kind === 'gold' ? 'coin' : 'pop')
          if (st.kind !== 'normal') buzzRef.current(st.kind === 'shooting' ? [10, 30, 10, 30, 10] : 10)
          continue
        }

        if (st.y > h + 24) {
          st.dead = true
          s.missed += 1
          continue
        }

        const cfg = STAR[st.kind]
        const tw = 0.75 + Math.sin(st.twinkle) * 0.25
        ctx.save()
        ctx.translate(st.x, st.y)
        if (st.kind !== 'normal') {
          ctx.shadowColor = cfg.color
          ctx.shadowBlur = st.kind === 'shooting' ? 28 : 14
        }
        ctx.fillStyle = cfg.color
        ctx.globalAlpha = tw
        ctx.font = `${cfg.size * 2}px "Segoe UI Symbol", system-ui, sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(cfg.glyph, 0, 0)
        ctx.restore()
      }
      stars = stars.filter((st) => !st.dead)

      // sepet
      ctx.save()
      ctx.strokeStyle = 'rgb(var(--accent))'
      ctx.lineWidth = 4
      ctx.lineCap = 'round'
      ctx.shadowColor = 'rgb(var(--accent))'
      ctx.shadowBlur = 16
      ctx.beginPath()
      ctx.moveTo(bx - bw / 2, by)
      ctx.quadraticCurveTo(bx, by + 22, bx + bw / 2, by)
      ctx.stroke()
      ctx.restore()

      hudTimer += dt
      if (hudTimer > 90) {
        hudTimer = 0
        setHud({ score: s.score, time: Math.max(0, DURATION - s.elapsed), stars: s.stars })
      }

      if (s.elapsed >= DURATION && !s.finished) {
        s.finished = true
        const perf = clamp(s.score / 1400, 0, 1)
        finishRef.current({
          score: s.score,
          bestValue: s.score,
          performance: perf,
          durationMs: DURATION,
          detail: [
            { label: 'Yıldız', value: String(s.stars) },
            { label: 'Altın', value: String(s.gold) },
            { label: 'Mor', value: String(s.purple) },
            { label: 'Kayan', value: String(s.shooting) },
          ],
          counters: {
            scPlays: 1,
            scStars: s.stars,
            scGolden: s.gold,
            scPurple: s.purple,
            scShooting: s.shooting,
          },
          maxStats: { scScore: s.score },
        })
        return
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
      <TimeBar value={hud.time / DURATION} />
      <canvas ref={canvasRef} className="h-full w-full touch-none-y" />
      <GameHud
        left={<HudStat label="Skor" value={hud.score} />}
        center={<HudStat label="Yıldız" value={hud.stars} />}
        right={<HudStat label="Süre" value={`${Math.ceil(hud.time / 1000)}s`} tone={hud.time < 10000 ? 'text-accent' : ''} />}
      />
      <PopLayer pops={pops} />
      <CountdownOverlay n={count} />
      <p className="pointer-events-none absolute inset-x-0 bottom-4 text-center text-[11px] text-ink-mute">
        Sepeti sürükle veya ok tuşlarını kullan · ☄ çok nadir
      </p>
    </GameArea>
  )
}
