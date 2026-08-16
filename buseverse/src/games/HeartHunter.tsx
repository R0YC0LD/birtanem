import { useEffect, useRef, useState } from 'react'
import type { MiniGameProps } from '../components/GameShell'
import { ComboBadge, CountdownOverlay, GameArea, GameHud, HudStat, PopLayer, TimeBar, fitCanvas, pointerPos, usePops, useCountdown } from './shared'
import { audio } from '../systems/audio'
import { clamp, randFloat } from '../utils'
import { useGame } from '../store/useGame'

const DURATION = 55_000

type Kind = 'normal' | 'gold' | 'rainbow' | 'broken' | 'bomb'

interface Entity {
  id: number
  kind: Kind
  x: number
  y: number
  vy: number
  vx: number
  r: number
  rot: number
  vr: number
  dead: boolean
  bornAt: number
}

const CONFIG: Record<Kind, { points: number; color: string; glyph: string; radius: number; weight: number }> = {
  normal: { points: 1, color: '#E36A85', glyph: '♥', radius: 22, weight: 62 },
  gold: { points: 5, color: '#E9C79A', glyph: '♥', radius: 20, weight: 15 },
  rainbow: { points: 10, color: '#B79BE8', glyph: '❈', radius: 19, weight: 6 },
  broken: { points: -3, color: '#7A5A66', glyph: '♡', radius: 21, weight: 11 },
  bomb: { points: 0, color: '#4A4450', glyph: '✖', radius: 20, weight: 6 },
}

const KINDS = Object.keys(CONFIG) as Kind[]
const TOTAL_WEIGHT = KINDS.reduce((a, k) => a + CONFIG[k].weight, 0)

function rollKind(): Kind {
  let r = Math.random() * TOTAL_WEIGHT
  for (const k of KINDS) {
    r -= CONFIG[k].weight
    if (r <= 0) return k
  }
  return 'normal'
}

function multiplierFor(combo: number): number {
  if (combo >= 30) return 6
  if (combo >= 20) return 5
  if (combo >= 12) return 4
  if (combo >= 8) return 3
  if (combo >= 4) return 2
  return 1
}

export function HeartHunter({ onFinish, reduced }: MiniGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { pops, push } = usePops()
  const buzz = useGame((s) => s.buzz)

  const [hud, setHud] = useState({ score: 0, time: DURATION, combo: 0 })
  const started = useRef(false)
  const count = useCountdown(3, () => {
    started.current = true
  })

  // Oyun durumu ref'te tutuluyor; her karede setState yapmiyoruz.
  const state = useRef({
    score: 0,
    combo: 0,
    bestCombo: 0,
    hearts: 0,
    gold: 0,
    rainbow: 0,
    broken: 0,
    bombs: 0,
    elapsed: 0,
    finished: false,
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

    let entities: Entity[] = []
    let nextId = 1
    let spawnTimer = 0
    let raf = 0
    let last = 0
    let hudTimer = 0

    const onResize = () => {
      const d = fitCanvas(canvas)
      if (d) dims = d
    }
    window.addEventListener('resize', onResize)

    const spawnInterval = () => {
      const t = state.current.elapsed / DURATION
      return clamp(520 - t * 260, 210, 520)
    }

    const spawn = () => {
      if (!dims) return
      const kind = rollKind()
      const cfg = CONFIG[kind]
      const r = cfg.radius
      entities.push({
        id: nextId++,
        kind,
        x: randFloat(r + 8, dims.w - r - 8),
        y: -r - 10,
        vy: randFloat(0.09, 0.16) + (state.current.elapsed / DURATION) * 0.07,
        vx: randFloat(-0.015, 0.015),
        r,
        rot: randFloat(-0.3, 0.3),
        vr: randFloat(-0.0016, 0.0016),
        dead: false,
        bornAt: performance.now(),
      })
    }

    const hit = (e: Entity, x: number, y: number) => {
      const dx = e.x - x
      const dy = e.y - y
      // Dokunmatikte biraz cömert hit alani
      const pad = window.matchMedia('(pointer: coarse)').matches ? 12 : 4
      return dx * dx + dy * dy <= (e.r + pad) * (e.r + pad)
    }

    const onPointer = (ev: PointerEvent) => {
      if (!started.current || state.current.finished) return
      const p = pointerPos(canvas, ev)
      // En üstteki (en yeni) nesneyi önce dene
      for (let i = entities.length - 1; i >= 0; i--) {
        const e = entities[i]
        if (e.dead) continue
        if (!hit(e, p.x, p.y)) continue
        e.dead = true
        collect(e, p.x, p.y)
        return
      }
    }

    const collect = (e: Entity, x: number, y: number) => {
      const s = state.current
      const cfg = CONFIG[e.kind]

      if (e.kind === 'bomb') {
        s.bombs += 1
        s.combo = 0
        s.score = Math.max(0, s.score - 12)
        push(x, y, '−12', '#C46A6A')
        audio.play('error')
        buzzRef.current([18, 40, 18])
        return
      }
      if (e.kind === 'broken') {
        s.broken += 1
        s.combo = 0
        s.score = Math.max(0, s.score + cfg.points)
        push(x, y, `${cfg.points}`, '#B08894')
        audio.play('error')
        return
      }

      s.combo += 1
      s.bestCombo = Math.max(s.bestCombo, s.combo)
      const mult = multiplierFor(s.combo)
      const gained = cfg.points * mult
      s.score += gained
      s.hearts += 1
      if (e.kind === 'gold') s.gold += 1
      if (e.kind === 'rainbow') s.rainbow += 1

      push(x, y, `+${gained}`, cfg.color)
      audio.play(e.kind === 'normal' ? 'pop' : e.kind === 'gold' ? 'coin' : 'perfect')
      if (e.kind !== 'normal') buzzRef.current(12)
    }

    canvas.addEventListener('pointerdown', onPointer)

    const drawHeart = (ctx: CanvasRenderingContext2D, e: Entity, now: number) => {
      const cfg = CONFIG[e.kind]
      const age = now - e.bornAt
      const pop = age < 220 ? 0.7 + 0.3 * (age / 220) : 1
      ctx.save()
      ctx.translate(e.x, e.y)
      ctx.rotate(e.rot)
      ctx.scale(pop, pop)

      if (e.kind === 'gold' || e.kind === 'rainbow') {
        ctx.shadowColor = cfg.color
        ctx.shadowBlur = e.kind === 'rainbow' ? 26 : 18
      }
      ctx.fillStyle = cfg.color
      ctx.font = `${e.r * 2}px "Segoe UI Symbol", system-ui, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(cfg.glyph, 0, 1)
      ctx.restore()
    }

    const step = (now: number) => {
      if (!dims) return
      const dt = last ? Math.min(50, now - last) : 16
      last = now
      const s = state.current

      if (started.current && !s.finished) {
        s.elapsed += dt
        spawnTimer += dt
        while (spawnTimer >= spawnInterval()) {
          spawnTimer -= spawnInterval()
          spawn()
        }
      }

      const { ctx, w, h } = dims
      ctx.clearRect(0, 0, w, h)

      for (const e of entities) {
        if (e.dead) continue
        if (started.current && !s.finished) {
          e.y += e.vy * dt
          e.x += e.vx * dt
          e.rot += e.vr * dt
        }
        if (e.y - e.r > h) {
          e.dead = true
          // Kacirilan normal kalp comboyu bozar (bomba/kirik kacirmak serbest)
          if (e.kind === 'normal' || e.kind === 'gold' || e.kind === 'rainbow') s.combo = 0
          continue
        }
        drawHeart(ctx, e, now)
      }
      entities = entities.filter((e) => !e.dead)

      hudTimer += dt
      if (hudTimer > 90) {
        hudTimer = 0
        setHud({ score: s.score, time: Math.max(0, DURATION - s.elapsed), combo: s.combo })
      }

      if (s.elapsed >= DURATION && !s.finished) {
        s.finished = true
        finish()
        return
      }
      raf = requestAnimationFrame(step)
    }

    const finish = () => {
      const s = state.current
      const clean = s.broken === 0 && s.bombs === 0
      const performance01 = clamp(s.score / 1500, 0, 1)
      finishRef.current({
        score: s.score,
        bestValue: s.score,
        performance: performance01,
        durationMs: DURATION,
        detail: [
          { label: 'Kalp', value: String(s.hearts) },
          { label: 'En iyi combo', value: `x${s.bestCombo}` },
          { label: 'Altın', value: String(s.gold) },
          { label: 'Gökkuşağı', value: String(s.rainbow) },
        ],
        counters: {
          hhPlays: 1,
          hhHearts: s.hearts,
          hhGolden: s.gold,
          hhRainbow: s.rainbow,
          hhBroken: s.broken,
          hhBombs: s.bombs,
          hhCleanRuns: clean && s.hearts > 10 ? 1 : 0,
        },
        maxStats: { hhScore: s.score, hhCombo: s.bestCombo },
      })
    }

    raf = requestAnimationFrame(step)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      canvas.removeEventListener('pointerdown', onPointer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const mult = multiplierFor(hud.combo)

  return (
    <GameArea>
      <TimeBar value={hud.time / DURATION} />
      <canvas ref={canvasRef} className="h-full w-full touch-none-y" />
      <GameHud
        left={<HudStat label="Skor" value={hud.score} />}
        right={<HudStat label="Süre" value={`${Math.ceil(hud.time / 1000)}s`} tone={hud.time < 10000 ? 'text-accent' : ''} />}
      />
      {!reduced && <ComboBadge combo={hud.combo} mult={mult} />}
      <PopLayer pops={pops} />
      <CountdownOverlay n={count} />
      <p className="pointer-events-none absolute inset-x-0 bottom-4 text-center text-[11px] text-ink-mute">
        Kalplere dokun · bomba ve kırık kalp comboyu bozar
      </p>
    </GameArea>
  )
}
