import { motion } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { MiniGameProps } from '../components/GameShell'
import { GameArea, GameHud, HudStat } from './shared'
import { audio } from '../systems/audio'
import { clamp, randFloat } from '../utils'
import { useGame } from '../store/useGame'

const ROUNDS = 6
const SHOW_MS = 2600

interface Node {
  id: number
  x: number
  y: number
}

type Phase = 'memorize' | 'draw' | 'between'

export function Constellation({ onFinish }: MiniGameProps) {
  const buzz = useGame((s) => s.buzz)
  const [round, setRound] = useState(0)
  const [phase, setPhase] = useState<Phase>('memorize')
  const [nodes, setNodes] = useState<Node[]>(() => makeNodes(4))
  const [progress, setProgress] = useState(0)
  const [score, setScore] = useState(0)
  const [wrongId, setWrongId] = useState<number | null>(null)

  const stats = useRef({ solved: 0, perfect: 0, mistakes: 0, roundMistakes: 0, startedAt: Date.now(), bestRound: 0 })
  const scoreRef = useRef(0)
  const finished = useRef(false)
  const timers = useRef<number[]>([])
  const roundStart = useRef(Date.now())
  const bestRoundTime = useRef(0)

  const finishRef = useRef(onFinish)
  finishRef.current = onFinish

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = []
  }
  useEffect(() => () => clearTimers(), [])

  const startRound = useCallback((r: number) => {
    const nodeCount = Math.min(4 + r, 10)
    setNodes(makeNodes(nodeCount))
    setProgress(0)
    setPhase('memorize')
    stats.current.roundMistakes = 0
    audio.play('start')
    const t = window.setTimeout(() => {
      setPhase('draw')
      roundStart.current = Date.now()
    }, SHOW_MS)
    timers.current.push(t)
  }, [])

  useEffect(() => {
    startRound(0)
  }, [startRound])

  const finish = useCallback(() => {
    if (finished.current) return
    finished.current = true
    clearTimers()
    const s = stats.current
    const duration = Date.now() - s.startedAt
    finishRef.current({
      score: scoreRef.current,
      bestValue: s.solved,
      performance: clamp(s.solved / ROUNDS, 0, 1),
      durationMs: duration,
      detail: [
        { label: 'Tamamlanan', value: `${s.solved}/${ROUNDS}` },
        { label: 'Hatasız', value: String(s.perfect) },
        { label: 'Hata', value: String(s.mistakes) },
        { label: 'En hızlı tur', value: bestRoundTime.current ? `${(bestRoundTime.current / 1000).toFixed(1)}s` : '—' },
      ],
      counters: {
        cnPlays: 1,
        cnSolved: s.solved,
        cnPerfect: s.perfect,
      },
      minStats: bestRoundTime.current ? { cnBestTimeMs: bestRoundTime.current } : undefined,
    })
  }, [])

  const tap = (node: Node) => {
    if (phase !== 'draw' || finished.current) return
    if (node.id === progress) {
      const next = progress + 1
      setProgress(next)
      audio.play('pop')
      if (next === nodes.length) {
        const elapsed = Date.now() - roundStart.current
        bestRoundTime.current = bestRoundTime.current ? Math.min(bestRoundTime.current, elapsed) : elapsed
        const clean = stats.current.roundMistakes === 0
        stats.current.solved += 1
        if (clean) stats.current.perfect += 1
        const gained = Math.round(nodes.length * 30 * (clean ? 1.6 : 1) + Math.max(0, 4000 - elapsed) / 40)
        scoreRef.current += gained
        setScore(scoreRef.current)
        audio.play('perfect')
        buzz([10, 26, 10])
        setPhase('between')

        const nextRound = round + 1
        const t = window.setTimeout(() => {
          if (nextRound >= ROUNDS) finish()
          else {
            setRound(nextRound)
            startRound(nextRound)
          }
        }, 900)
        timers.current.push(t)
      }
    } else {
      stats.current.mistakes += 1
      stats.current.roundMistakes += 1
      scoreRef.current = Math.max(0, scoreRef.current - 30)
      setScore(scoreRef.current)
      setWrongId(node.id)
      audio.play('error')
      const t = window.setTimeout(() => setWrongId(null), 380)
      timers.current.push(t)
    }
  }

  const linePath = nodes
    .slice(0, progress)
    .map((n) => `${n.x},${n.y}`)
    .join(' ')

  return (
    <GameArea>
      <div className="absolute inset-0 bg-[radial-gradient(50rem_40rem_at_50%_40%,rgb(var(--lav)/0.14),transparent_65%)]" />

      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        {progress > 1 && (
          <polyline
            points={linePath}
            fill="none"
            stroke="rgb(var(--accent))"
            strokeWidth="0.4"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            style={{ filter: 'drop-shadow(0 0 6px rgb(var(--accent)))' }}
          />
        )}
      </svg>

      <div className="absolute inset-0">
        {nodes.map((n) => {
          const done = n.id < progress
          const isNext = n.id === progress
          const wrong = wrongId === n.id
          return (
            <button
              key={n.id}
              onClick={() => tap(n)}
              aria-label={`Yıldız ${n.id + 1}`}
              className="absolute grid h-12 w-12 place-items-center"
              style={{ left: `${n.x}%`, top: `${n.y}%`, transform: 'translate(-50%,-50%)' }}
            >
              <motion.span
                animate={{
                  scale: wrong ? [1, 1.4, 1] : done ? 1.1 : isNext && phase === 'draw' ? [1, 1.14, 1] : 1,
                }}
                transition={{ duration: wrong ? 0.35 : 1.6, repeat: isNext && phase === 'draw' && !wrong ? Infinity : 0 }}
                className="text-2xl"
                style={{
                  color: wrong
                    ? '#C46A6A'
                    : done
                      ? 'rgb(var(--accent))'
                      : 'rgb(var(--ink-dim))',
                  textShadow: done ? '0 0 14px rgb(var(--accent)/0.8)' : undefined,
                }}
              >
                ✦
              </motion.span>
              {phase === 'memorize' && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="tabular absolute -bottom-1 text-[11px] font-bold text-gold"
                >
                  {n.id + 1}
                </motion.span>
              )}
            </button>
          )
        })}
      </div>

      <GameHud
        left={<HudStat label="Skor" value={score} />}
        center={<HudStat label="Tur" value={`${Math.min(round + 1, ROUNDS)}/${ROUNDS}`} />}
        right={<HudStat label="Yıldız" value={`${progress}/${nodes.length}`} />}
      />

      <div className="pointer-events-none absolute inset-x-0 bottom-6 text-center">
        <motion.p
          key={phase + round}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="display text-lg"
        >
          {phase === 'memorize' ? 'Sırayı ezberle' : phase === 'draw' ? 'Şimdi çiz' : 'Güzel'}
        </motion.p>
        <p className="mt-1 text-[11px] text-ink-mute">
          {phase === 'memorize' ? 'Numaralar birazdan kaybolacak' : 'Yıldızlara doğru sırayla dokun'}
        </p>
      </div>
    </GameArea>
  )
}

function makeNodes(count: number): Node[] {
  const nodes: Node[] = []
  let guard = 0
  while (nodes.length < count && guard < 500) {
    guard++
    const x = randFloat(12, 88)
    const y = randFloat(18, 74)
    if (nodes.some((n) => Math.hypot(n.x - x, n.y - y) < 15)) continue
    nodes.push({ id: nodes.length, x, y })
  }
  return nodes
}
