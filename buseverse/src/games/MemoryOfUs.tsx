import { motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { MiniGameProps } from '../components/GameShell'
import { GameArea, GameHud, HudStat } from './shared'
import { audio } from '../systems/audio'
import { clamp, shuffle } from '../utils'
import { useGame } from '../store/useGame'

const SYMBOLS = ['☾', '✦', '✿', '✉', '⌾', '☕', '❈', '♥', '☄', '⌗', '∞', '▧', '✧', '⛭', '◈']

const GRID: Record<string, { pairs: number; cols: number }> = {
  easy: { pairs: 6, cols: 3 },
  normal: { pairs: 8, cols: 4 },
  hard: { pairs: 12, cols: 4 },
}

interface CardState {
  id: number
  symbol: string
  flipped: boolean
  matched: boolean
}

export function MemoryOfUs({ difficulty, onFinish }: MiniGameProps) {
  const conf = GRID[difficulty]
  const buzz = useGame((s) => s.buzz)

  const [cards, setCards] = useState<CardState[]>(() => build(conf.pairs))
  const [selected, setSelected] = useState<number[]>([])
  const [moves, setMoves] = useState(0)
  const [mistakes, setMistakes] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [locked, setLocked] = useState(false)

  const startedAt = useRef(Date.now())
  const finishedRef = useRef(false)
  const timeoutRef = useRef<number | undefined>(undefined)
  const finishRef = useRef(onFinish)
  finishRef.current = onFinish

  const matchedCount = cards.filter((c) => c.matched).length / 2

  useEffect(() => {
    const t = window.setInterval(() => setElapsed(Date.now() - startedAt.current), 200)
    return () => window.clearInterval(t)
  }, [])

  useEffect(
    () => () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    },
    [],
  )

  useEffect(() => {
    if (finishedRef.current) return
    if (matchedCount !== conf.pairs) return
    finishedRef.current = true
    const duration = Date.now() - startedAt.current

    // Skor: az hamle + hizli bitirme odullendirilir
    const perfectMoves = conf.pairs
    const moveEfficiency = clamp(perfectMoves / Math.max(1, moves), 0, 1)
    const timeScore = clamp(1 - duration / (conf.pairs * 9000), 0, 1)
    const score = Math.round((moveEfficiency * 620 + timeScore * 380) * (difficulty === 'hard' ? 1.35 : difficulty === 'easy' ? 0.8 : 1))

    window.setTimeout(() => {
      finishRef.current({
        score,
        bestValue: difficulty === 'hard' ? moves : score,
        performance: clamp(moveEfficiency * 0.6 + timeScore * 0.4, 0, 1),
        durationMs: duration,
        difficulty,
        detail: [
          { label: 'Hamle', value: String(moves) },
          { label: 'Süre', value: `${(duration / 1000).toFixed(1)}s` },
          { label: 'Hata', value: String(mistakes) },
          { label: 'Zorluk', value: difficulty === 'hard' ? 'Zor' : difficulty === 'easy' ? 'Kolay' : 'Normal' },
        ],
        counters: {
          memPlays: 1,
          memTotalMatches: conf.pairs,
          memHardWins: difficulty === 'hard' ? 1 : 0,
          memPerfectRuns: mistakes === 0 ? 1 : 0,
        },
        minStats: {
          memBestTimeMs: duration,
          ...(difficulty === 'hard' ? { memBestMovesHard: moves } : {}),
        },
      })
    }, 620)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchedCount])

  const flip = (index: number) => {
    if (locked || finishedRef.current) return
    const card = cards[index]
    if (card.flipped || card.matched) return

    audio.play('click')
    const nextCards = cards.map((c, i) => (i === index ? { ...c, flipped: true } : c))
    const nextSelected = [...selected, index]
    setCards(nextCards)
    setSelected(nextSelected)

    if (nextSelected.length < 2) return

    setMoves((m) => m + 1)
    const [a, b] = nextSelected
    if (nextCards[a].symbol === nextCards[b].symbol) {
      audio.play('perfect')
      buzz(10)
      setCards((cs) => cs.map((c, i) => (i === a || i === b ? { ...c, matched: true } : c)))
      setSelected([])
    } else {
      setMistakes((m) => m + 1)
      setLocked(true)
      audio.play('error')
      timeoutRef.current = window.setTimeout(() => {
        setCards((cs) => cs.map((c, i) => (i === a || i === b ? { ...c, flipped: false } : c)))
        setSelected([])
        setLocked(false)
      }, 620)
    }
  }

  const gridStyle = useMemo(
    () => ({ gridTemplateColumns: `repeat(${conf.cols}, minmax(0, 1fr))` }),
    [conf.cols],
  )

  return (
    <GameArea className="flex flex-col">
      <GameHud
        left={<HudStat label="Hamle" value={moves} />}
        center={<HudStat label="Eşleşme" value={`${matchedCount}/${conf.pairs}`} />}
        right={<HudStat label="Süre" value={`${(elapsed / 1000).toFixed(0)}s`} />}
      />

      <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto px-4 pb-6 pt-24">
        <div className="grid w-full max-w-md gap-2.5 sm:gap-3" style={gridStyle}>
          {cards.map((card, i) => {
            const shown = card.flipped || card.matched
            return (
              <button
                key={card.id}
                onClick={() => flip(i)}
                aria-label={shown ? card.symbol : 'Kapalı kart'}
                className="relative aspect-[3/4] min-h-[64px] [perspective:900px]"
              >
                <motion.div
                  className="relative h-full w-full [transform-style:preserve-3d]"
                  animate={{ rotateY: shown ? 180 : 0 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                >
                  <div className="absolute inset-0 grid place-items-center rounded-md border border-line/70 bg-bg-2 text-lg text-ink-mute [backface-visibility:hidden]">
                    <span className="opacity-50">✧</span>
                  </div>
                  <div
                    className={`absolute inset-0 grid place-items-center rounded-md border text-2xl [backface-visibility:hidden] [transform:rotateY(180deg)] ${
                      card.matched
                        ? 'border-accent/60 bg-accent/12 text-accent'
                        : 'border-line bg-bg-3 text-ink'
                    }`}
                  >
                    {card.symbol}
                  </div>
                </motion.div>
              </button>
            )
          })}
        </div>
      </div>

      <p className="pointer-events-none absolute inset-x-0 bottom-3 text-center text-[11px] text-ink-mute">
        Az hamlede bitir · hatasız tur ekstra başarım açıyor
      </p>
    </GameArea>
  )
}

function build(pairs: number): CardState[] {
  const picked = shuffle(SYMBOLS).slice(0, pairs)
  const deck = shuffle([...picked, ...picked])
  return deck.map((symbol, id) => ({ id, symbol, flipped: false, matched: false }))
}
