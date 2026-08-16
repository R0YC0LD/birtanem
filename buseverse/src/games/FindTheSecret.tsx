import { motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { MiniGameProps } from '../components/GameShell'
import { GameArea, GameHud, HudStat, PopLayer, usePops } from './shared'
import { audio } from '../systems/audio'
import { clamp, randFloat, shuffle } from '../utils'
import { useGame } from '../store/useGame'

const TARGETS = [
  { id: 'heart', glyph: '♥', name: 'minik kalp' },
  { id: 'star', glyph: '✦', name: 'yıldız' },
  { id: 'b', glyph: 'B', name: 'B harfi' },
  { id: 'key', glyph: '🗝', name: 'anahtar' },
  { id: 'moon', glyph: '☾', name: 'ay' },
  { id: 'rose', glyph: '✿', name: 'gül' },
  { id: 'kiss', glyph: '💋', name: 'öpücük' },
  { id: 'note', glyph: '✉', name: 'gizli mesaj' },
]

const DECOR = ['·', '˙', '◦', '∘', '⋅', '✧', '✳', '⁘', '⁙', '⌁', '⋆', '∙', '◌', '❍']

interface Placed {
  id: string
  glyph: string
  name: string
  x: number
  y: number
  size: number
  rot: number
  opacity: number
  found: boolean
}

interface Decor {
  x: number
  y: number
  glyph: string
  size: number
  opacity: number
  rot: number
}

const PENALTY_MS = 3000

export function FindTheSecret({ onFinish }: MiniGameProps) {
  const buzz = useGame((s) => s.buzz)
  const { pops, push } = usePops()
  const [elapsed, setElapsed] = useState(0)
  const [penalty, setPenalty] = useState(0)
  const [misses, setMisses] = useState(0)
  const [found, setFound] = useState<string[]>([])
  const startedAt = useRef(Date.now())
  const finished = useRef(false)
  const finishRef = useRef(onFinish)
  finishRef.current = onFinish

  const [items, setItems] = useState<Placed[]>(() => placeTargets())
  const decor = useMemo(() => makeDecor(), [])

  useEffect(() => {
    const t = window.setInterval(() => setElapsed(Date.now() - startedAt.current), 200)
    return () => window.clearInterval(t)
  }, [])

  useEffect(() => {
    if (finished.current) return
    if (found.length !== TARGETS.length) return
    finished.current = true
    const duration = Date.now() - startedAt.current + penalty
    audio.play('achievement')
    buzz([10, 30, 10])
    const perf = clamp(1 - duration / 90_000, 0.05, 1)
    const score = Math.round(perf * 1000 + (misses === 0 ? 220 : 0))

    window.setTimeout(() => {
      finishRef.current({
        score,
        bestValue: duration,
        performance: perf,
        durationMs: duration,
        detail: [
          { label: 'Süre', value: `${(duration / 1000).toFixed(1)}s` },
          { label: 'Yanlış', value: String(misses) },
          { label: 'Ceza', value: `${(penalty / 1000).toFixed(0)}s` },
        ],
        counters: {
          fsPlays: 1,
          fsSolved: 1,
          fsObjects: TARGETS.length,
          fsPerfectRuns: misses === 0 ? 1 : 0,
        },
        minStats: { fsBestTimeMs: duration },
      })
    }, 520)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [found])

  const hit = (item: Placed, e: React.MouseEvent) => {
    e.stopPropagation()
    if (item.found || finished.current) return
    setItems((list) => list.map((i) => (i.id === item.id ? { ...i, found: true } : i)))
    setFound((f) => [...f, item.id])
    push(e.clientX, e.clientY - 40, item.name, 'rgb(var(--accent))')
    audio.play('perfect')
    buzz(10)
  }

  const missClick = () => {
    if (finished.current) return
    setMisses((m) => m + 1)
    setPenalty((p) => p + PENALTY_MS)
    audio.play('error')
  }

  const total = elapsed + penalty

  return (
    <GameArea>
      <div
        onClick={missClick}
        className="absolute inset-0 overflow-hidden bg-[radial-gradient(60rem_40rem_at_30%_20%,rgb(var(--lav)/0.16),transparent_60%),radial-gradient(50rem_40rem_at_80%_80%,rgb(var(--accent)/0.14),transparent_60%)]"
      >
        {decor.map((d, i) => (
          <span
            key={i}
            className="pointer-events-none absolute select-none text-ink"
            style={{
              left: `${d.x}%`,
              top: `${d.y}%`,
              fontSize: d.size,
              opacity: d.opacity,
              transform: `rotate(${d.rot}deg)`,
            }}
            aria-hidden
          >
            {d.glyph}
          </span>
        ))}

        {items.map((item) => (
          <button
            key={item.id}
            onClick={(e) => hit(item, e)}
            aria-label={item.found ? `${item.name} bulundu` : 'gizli obje'}
            className="absolute grid place-items-center"
            style={{
              left: `${item.x}%`,
              top: `${item.y}%`,
              width: item.size + 18,
              height: item.size + 18,
              transform: `translate(-50%,-50%) rotate(${item.rot}deg)`,
            }}
          >
            <motion.span
              animate={
                item.found
                  ? { scale: [1, 1.7, 1.2], opacity: 1, color: 'rgb(var(--accent))' }
                  : { scale: 1 }
              }
              transition={{ duration: 0.4 }}
              className="select-none leading-none"
              style={{
                fontSize: item.size,
                opacity: item.found ? 1 : item.opacity,
                color: item.found ? 'rgb(var(--accent))' : 'rgb(var(--ink))',
                textShadow: item.found ? '0 0 18px rgb(var(--accent)/0.8)' : undefined,
              }}
            >
              {item.glyph}
            </motion.span>
          </button>
        ))}
      </div>

      <GameHud
        left={<HudStat label="Bulunan" value={`${found.length}/${TARGETS.length}`} />}
        center={<HudStat label="Süre" value={`${(total / 1000).toFixed(1)}s`} />}
        right={<HudStat label="Yanlış" value={misses} tone={misses > 0 ? 'text-accent' : ''} />}
      />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-bg-0 to-transparent px-4 pb-4 pt-8">
        <div className="mx-auto flex max-w-md flex-wrap items-center justify-center gap-1.5">
          {TARGETS.map((t) => {
            const isFound = found.includes(t.id)
            return (
              <span
                key={t.id}
                className={`rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
                  isFound
                    ? 'border-accent/50 bg-accent/12 text-accent line-through'
                    : 'border-line/60 text-ink-mute'
                }`}
              >
                {t.name}
              </span>
            )
          })}
        </div>
        <p className="mt-2 text-center text-[11px] text-ink-mute">Yanlış tıklama +3 saniye</p>
      </div>

      <PopLayer pops={pops} />
    </GameArea>
  )
}

function placeTargets(): Placed[] {
  const placed: Placed[] = []
  const order = shuffle(TARGETS)
  for (const t of order) {
    let x = 0
    let y = 0
    let tries = 0
    do {
      x = randFloat(8, 92)
      y = randFloat(14, 78)
      tries++
    } while (tries < 40 && placed.some((p) => Math.hypot(p.x - x, p.y - y) < 12))
    placed.push({
      id: t.id,
      glyph: t.glyph,
      name: t.name,
      x,
      y,
      size: randFloat(13, 21),
      rot: randFloat(-40, 40),
      // Bazilari gercekten iyi saklanir
      opacity: randFloat(0.14, 0.42),
      found: false,
    })
  }
  // En az iki tanesi cok zor olsun
  placed[0].opacity = 0.1
  placed[0].size = 11
  placed[1].opacity = 0.12
  placed[1].size = 12
  return placed
}

function makeDecor(): Decor[] {
  return Array.from({ length: 120 }, () => ({
    x: randFloat(2, 98),
    y: randFloat(6, 88),
    glyph: DECOR[Math.floor(Math.random() * DECOR.length)],
    size: randFloat(9, 20),
    opacity: randFloat(0.08, 0.34),
    rot: randFloat(-50, 50),
  }))
}
