import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import type { MiniGameProps } from '../components/GameShell'
import { CountdownOverlay, GameArea, GameHud, HudStat, useCountdown } from './shared'
import { audio } from '../systems/audio'
import { clamp } from '../utils'
import { useGame } from '../store/useGame'

const ROUNDS = 20

type Judge = 'perfect' | 'great' | 'good' | 'miss'

const JUDGE_STYLE: Record<Judge, { label: string; color: string; points: number }> = {
  perfect: { label: 'PERFECT', color: '#E9C79A', points: 150 },
  great: { label: 'GREAT', color: '#7FB89A', points: 90 },
  good: { label: 'GOOD', color: '#8FA8E0', points: 45 },
  miss: { label: 'MISS', color: '#C46A6A', points: 0 },
}

export function PerfectTiming({ onFinish }: MiniGameProps) {
  const buzz = useGame((s) => s.buzz)
  const [pos, setPos] = useState(0)
  const [round, setRound] = useState(0)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [judge, setJudge] = useState<{ j: Judge; id: number } | null>(null)

  const started = useRef(false)
  const finished = useRef(false)
  const posRef = useRef(0)
  const dirRef = useRef(1)
  const rafRef = useRef(0)
  const stats = useRef({ perfects: 0, greats: 0, goods: 0, misses: 0, bestStreak: 0, startedAt: Date.now() })
  const streakRef = useRef(0)
  const roundRef = useRef(0)
  const judgeId = useRef(0)

  const finishRef = useRef(onFinish)
  finishRef.current = onFinish

  const count = useCountdown(3, () => {
    started.current = true
  })

  // Perfect serisi buyudukce hedef daralir ve ibre hizlanir
  const perfectWidth = () => clamp(0.085 - streakRef.current * 0.0035, 0.028, 0.085)
  const greatWidth = () => perfectWidth() * 2.4
  const goodWidth = () => perfectWidth() * 4.6
  const speed = () => 0.00085 + Math.min(roundRef.current, 18) * 0.000042 + streakRef.current * 0.00003

  useEffect(() => {
    let last = 0
    const step = (now: number) => {
      const dt = last ? Math.min(48, now - last) : 16
      last = now
      if (started.current && !finished.current) {
        posRef.current += dirRef.current * speed() * dt
        if (posRef.current >= 1) {
          posRef.current = 1
          dirRef.current = -1
        } else if (posRef.current <= 0) {
          posRef.current = 0
          dirRef.current = 1
        }
        setPos(posRef.current)
      }
      rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  const finish = () => {
    if (finished.current) return
    finished.current = true
    const s = stats.current
    const duration = Date.now() - s.startedAt
    const accuracy = (s.perfects * 1 + s.greats * 0.6 + s.goods * 0.3) / ROUNDS
    setTimeout(() => {
      finishRef.current({
        score: scoreRef.current,
        bestValue: s.bestStreak,
        performance: clamp(accuracy, 0, 1),
        durationMs: duration,
        detail: [
          { label: 'Perfect', value: String(s.perfects) },
          { label: 'En uzun seri', value: `x${s.bestStreak}` },
          { label: 'Great / Good', value: `${s.greats} / ${s.goods}` },
          { label: 'Isabet', value: `${Math.round(accuracy * 100)}%` },
        ],
        counters: {
          ptPlays: 1,
          ptPerfects: s.perfects,
          ptMisses: s.misses,
        },
        maxStats: { ptScore: scoreRef.current, ptBestStreak: s.bestStreak },
      })
    }, 450)
  }

  const scoreRef = useRef(0)

  const hit = () => {
    if (!started.current || finished.current) return
    const d = Math.abs(posRef.current - 0.5)
    let j: Judge = 'miss'
    if (d <= perfectWidth() / 2) j = 'perfect'
    else if (d <= greatWidth() / 2) j = 'great'
    else if (d <= goodWidth() / 2) j = 'good'

    const s = stats.current
    if (j === 'perfect') {
      s.perfects += 1
      streakRef.current += 1
      s.bestStreak = Math.max(s.bestStreak, streakRef.current)
      audio.play('perfect')
      buzz([8, 22, 8])
    } else if (j === 'great') {
      s.greats += 1
      streakRef.current = 0
      audio.play('pop')
    } else if (j === 'good') {
      s.goods += 1
      streakRef.current = 0
      audio.play('click')
    } else {
      s.misses += 1
      streakRef.current = 0
      audio.play('error')
    }

    const bonus = j === 'perfect' ? streakRef.current * 12 : 0
    scoreRef.current += JUDGE_STYLE[j].points + bonus
    setScore(scoreRef.current)
    setStreak(streakRef.current)
    setJudge({ j, id: ++judgeId.current })

    roundRef.current += 1
    setRound(roundRef.current)
    if (roundRef.current >= ROUNDS) finish()
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === 'Enter') {
        e.preventDefault()
        hit()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const pw = perfectWidth()
  const gw = greatWidth()
  const dw = goodWidth()

  return (
    <GameArea>
      <GameHud
        left={<HudStat label="Skor" value={score} />}
        center={<HudStat label="Tur" value={`${Math.min(round + 1, ROUNDS)}/${ROUNDS}`} />}
        right={<HudStat label="Seri" value={`x${streak}`} tone={streak >= 5 ? 'text-gold' : ''} />}
      />

      <button
        onClick={hit}
        aria-label="Tam ortada bas"
        className="absolute inset-0 flex touch-none-y flex-col items-center justify-center px-6"
      >
        <motion.div
          className="display mb-10 text-6xl text-accent"
          animate={{ scale: streak >= 5 ? [1, 1.1, 1] : 1 }}
          transition={{ duration: 1.2, repeat: streak >= 5 ? Infinity : 0 }}
          aria-hidden
        >
          ♥
        </motion.div>

        <div className="relative h-16 w-full max-w-lg overflow-hidden rounded-md border border-line/70 bg-bg-2/70">
          {/* good */}
          <div
            className="absolute inset-y-0 bg-[#8FA8E0]/12"
            style={{ left: `${(0.5 - dw / 2) * 100}%`, width: `${dw * 100}%` }}
          />
          {/* great */}
          <div
            className="absolute inset-y-0 bg-[#7FB89A]/18"
            style={{ left: `${(0.5 - gw / 2) * 100}%`, width: `${gw * 100}%` }}
          />
          {/* perfect */}
          <div
            className="absolute inset-y-0 bg-gold/30 shadow-[0_0_24px_rgb(var(--gold)/0.5)]"
            style={{ left: `${(0.5 - pw / 2) * 100}%`, width: `${pw * 100}%` }}
          />
          {/* ibre */}
          <div
            className="absolute inset-y-0 w-[3px] bg-accent shadow-glow"
            style={{ left: `calc(${pos * 100}% - 1.5px)` }}
          />
        </div>

        <p className="mt-8 text-[13px] text-ink-mute">
          Ekrana bas · masaüstünde <kbd className="rounded bg-white/10 px-1.5 py-0.5">Space</kbd>
        </p>
      </button>

      <AnimatePresence>
        {judge && (
          <motion.div
            key={judge.id}
            initial={{ opacity: 0, scale: 0.7, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.2 }}
            transition={{ type: 'spring', stiffness: 420, damping: 22 }}
            className="pointer-events-none absolute inset-x-0 top-[30%] text-center"
          >
            <p className="display text-3xl" style={{ color: JUDGE_STYLE[judge.j].color }}>
              {JUDGE_STYLE[judge.j].label}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <CountdownOverlay n={count} />
    </GameArea>
  )
}
