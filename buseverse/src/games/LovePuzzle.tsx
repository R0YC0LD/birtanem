import { motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { MiniGameProps } from '../components/GameShell'
import { GameArea, GameHud, HudStat } from './shared'
import { audio } from '../systems/audio'
import { clamp } from '../utils'
import { useGame } from '../store/useGame'

const SIZE: Record<string, number> = { easy: 3, normal: 4, hard: 5 }

/** Cozulebilir bir karisim uretir: hedeften baslayip gecerli hamleler yapariz. */
function scramble(n: number, moves: number): number[] {
  const tiles = Array.from({ length: n * n }, (_, i) => i)
  let blank = n * n - 1
  let lastBlank = -1
  for (let i = 0; i < moves; i++) {
    const options: number[] = []
    const r = Math.floor(blank / n)
    const c = blank % n
    if (r > 0) options.push(blank - n)
    if (r < n - 1) options.push(blank + n)
    if (c > 0) options.push(blank - 1)
    if (c < n - 1) options.push(blank + 1)
    const valid = options.filter((o) => o !== lastBlank)
    const pick = (valid.length ? valid : options)[Math.floor(Math.random() * (valid.length || options.length))]
    ;[tiles[blank], tiles[pick]] = [tiles[pick], tiles[blank]]
    lastBlank = blank
    blank = pick
  }
  return tiles
}

function isSolved(tiles: number[]): boolean {
  return tiles.every((t, i) => t === i)
}

export function LovePuzzle({ difficulty, onFinish }: MiniGameProps) {
  const n = SIZE[difficulty] ?? 4
  const blankValue = n * n - 1
  const buzz = useGame((s) => s.buzz)

  const [tiles, setTiles] = useState<number[]>(() => scramble(n, n * n * 12))
  const [moves, setMoves] = useState(0)
  const [elapsed, setElapsed] = useState(0)

  const startedAt = useRef(Date.now())
  const finished = useRef(false)
  const finishRef = useRef(onFinish)
  finishRef.current = onFinish

  useEffect(() => {
    const t = window.setInterval(() => setElapsed(Date.now() - startedAt.current), 250)
    return () => window.clearInterval(t)
  }, [])

  useEffect(() => {
    if (finished.current) return
    if (!isSolved(tiles) || moves === 0) return
    finished.current = true
    const duration = Date.now() - startedAt.current
    audio.play('achievement')
    buzz([12, 40, 12])

    const parMoves = n * n * 4
    const efficiency = clamp(parMoves / Math.max(1, moves), 0, 1)
    const timeScore = clamp(1 - duration / (n * n * 6000), 0, 1)
    const score = Math.round((efficiency * 600 + timeScore * 400) * (n === 5 ? 1.4 : n === 3 ? 0.75 : 1))

    window.setTimeout(() => {
      finishRef.current({
        score,
        bestValue: n === 5 ? moves : score,
        performance: clamp(efficiency * 0.55 + timeScore * 0.45, 0, 1),
        durationMs: duration,
        difficulty,
        detail: [
          { label: 'Hamle', value: String(moves) },
          { label: 'Süre', value: `${(duration / 1000).toFixed(1)}s` },
          { label: 'Izgara', value: `${n}x${n}` },
        ],
        counters: {
          pzPlays: 1,
          pzSolved: 1,
          pzHardSolved: n === 5 ? 1 : 0,
        },
        minStats: {
          pzBestTimeMs: duration,
          ...(n === 5 ? { pzBestMoves5: moves } : {}),
        },
      })
    }, 520)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tiles])

  const move = (index: number) => {
    if (finished.current) return
    const blank = tiles.indexOf(blankValue)
    const r1 = Math.floor(index / n)
    const c1 = index % n
    const r2 = Math.floor(blank / n)
    const c2 = blank % n
    if (Math.abs(r1 - r2) + Math.abs(c1 - c2) !== 1) return
    const next = tiles.slice()
    ;[next[index], next[blank]] = [next[blank], next[index]]
    setTiles(next)
    setMoves((m) => m + 1)
    audio.play('click')
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const blank = tiles.indexOf(blankValue)
      const r = Math.floor(blank / n)
      const c = blank % n
      let idx = -1
      if (e.key === 'ArrowUp' && r < n - 1) idx = blank + n
      if (e.key === 'ArrowDown' && r > 0) idx = blank - n
      if (e.key === 'ArrowLeft' && c < n - 1) idx = blank + 1
      if (e.key === 'ArrowRight' && c > 0) idx = blank - 1
      if (idx >= 0) {
        e.preventDefault()
        move(idx)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const glyphs = useMemo(() => {
    const base = ['♥', '☾', '✦', '✿', '✉', '☕', '❈', '☄', '⌗', '∞', '▧', '✧', '⛭', '◈', '⌾', '✵', '❖', '⊙', '✜', '⌖', '◎', '✳', '⚜', '❋']
    return base
  }, [])

  return (
    <GameArea className="flex flex-col">
      <GameHud
        left={<HudStat label="Hamle" value={moves} />}
        center={<HudStat label="Izgara" value={`${n}×${n}`} />}
        right={<HudStat label="Süre" value={`${(elapsed / 1000).toFixed(0)}s`} />}
      />

      <div className="flex min-h-0 flex-1 items-center justify-center p-4 pt-24">
        <div
          className="grid w-full max-w-[min(88vw,26rem)] gap-1.5 rounded-lg border border-line/60 bg-bg-2/40 p-2"
          style={{ gridTemplateColumns: `repeat(${n}, minmax(0,1fr))`, aspectRatio: '1' }}
        >
          {tiles.map((tile, i) => {
            if (tile === blankValue) return <div key={`b-${i}`} aria-hidden />
            const correct = tile === i
            return (
              <motion.button
                key={tile}
                layout
                transition={{ type: 'spring', stiffness: 520, damping: 34 }}
                onClick={() => move(i)}
                aria-label={`Taş ${tile + 1}`}
                className={`grid place-items-center rounded-sm border text-lg font-semibold transition-colors sm:text-xl ${
                  correct
                    ? 'border-accent/50 bg-accent/12 text-accent'
                    : 'border-line/70 bg-bg-3 text-ink-dim hover:border-line'
                }`}
              >
                <span className="text-[clamp(0.9rem,4.4vw,1.4rem)]">{glyphs[tile % glyphs.length]}</span>
              </motion.button>
            )
          })}
        </div>
      </div>

      <p className="pointer-events-none absolute inset-x-0 bottom-3 text-center text-[11px] text-ink-mute">
        Boşluğun yanındaki taşa dokun · masaüstünde ok tuşları
      </p>
    </GameArea>
  )
}
