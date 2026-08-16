import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { MiniGameProps } from '../components/GameShell'
import { CountdownOverlay, GameArea, GameHud, HudStat, PopLayer, TimeBar, usePops, useCountdown } from './shared'
import { audio } from '../systems/audio'
import { clamp, randInt } from '../utils'
import { useGame } from '../store/useGame'

const ROUNDS = 16
const MAX_WAIT = 1400

interface Target {
  id: number
  x: number
  y: number
  shownAt: number
  size: number
}

function grade(ms: number): { label: string; color: string; points: number } {
  if (ms < 150) return { label: 'INSANE', color: '#B79BE8', points: 220 }
  if (ms < 220) return { label: 'EXCELLENT', color: '#E9C79A', points: 170 }
  if (ms < 300) return { label: 'GREAT', color: '#7FB89A', points: 120 }
  if (ms < 450) return { label: 'GOOD', color: '#8FA8E0', points: 80 }
  return { label: 'SLOW', color: '#8E7C88', points: 35 }
}

export function KissRush({ onFinish }: MiniGameProps) {
  const areaRef = useRef<HTMLDivElement>(null)
  const { pops, push } = usePops()
  const buzz = useGame((s) => s.buzz)

  const [target, setTarget] = useState<Target | null>(null)
  const [round, setRound] = useState(0)
  const [score, setScore] = useState(0)
  const [lastGrade, setLastGrade] = useState<{ label: string; color: string; ms: number } | null>(null)

  const stats = useRef({ hits: 0, misses: 0, best: 0, sum: 0, count: 0, startedAt: Date.now() })
  const timers = useRef<number[]>([])
  const started = useRef(false)
  const finished = useRef(false)
  const finishRef = useRef(onFinish)
  finishRef.current = onFinish

  const count = useCountdown(3, () => {
    started.current = true
    scheduleNext(0)
  })

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = []
  }

  useEffect(() => () => clearTimers(), [])

  const finish = useCallback(() => {
    if (finished.current) return
    finished.current = true
    clearTimers()
    const s = stats.current
    const duration = Date.now() - s.startedAt
    const avg = s.count ? s.sum / s.count : 0
    const accuracy = ROUNDS ? s.hits / ROUNDS : 0
    // 0 skoru "veri yok" demek oldugu icin en az 1 gonderiyoruz
    const bestMs = s.best > 0 ? s.best : 0

    finishRef.current({
      score,
      bestValue: bestMs,
      performance: clamp((score / 2600) * 0.7 + accuracy * 0.3, 0, 1),
      durationMs: duration,
      detail: [
        { label: 'En hızlı', value: bestMs ? `${Math.round(bestMs)} ms` : '—' },
        { label: 'Ortalama', value: avg ? `${Math.round(avg)} ms` : '—' },
        { label: 'İsabet', value: `${s.hits}/${ROUNDS}` },
        { label: 'Iskalama', value: String(s.misses) },
      ],
      counters: {
        krPlays: 1,
        krHits: s.hits,
        krMisses: s.misses,
        krAvgMsSum: Math.round(s.sum),
        krAvgMsCount: s.count,
        krFlawless: s.misses === 0 && s.hits === ROUNDS ? 1 : 0,
      },
      maxStats: { krScore: score },
      minStats: bestMs ? { krBestMs: Math.round(bestMs) } : undefined,
    })
  }, [score])

  const scheduleNext = useCallback((currentRound: number) => {
    if (currentRound >= ROUNDS) {
      window.setTimeout(() => finish(), 350)
      return
    }
    const delay = randInt(500, 1500)
    const t = window.setTimeout(() => {
      const el = areaRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const size = window.matchMedia('(pointer: coarse)').matches ? 84 : 72
      const pad = 16
      setTarget({
        id: currentRound,
        x: randInt(pad, Math.max(pad + 1, rect.width - size - pad)),
        y: randInt(pad + 70, Math.max(pad + 71, rect.height - size - pad - 40)),
        shownAt: performance.now(),
        size,
      })
      audio.play('hover')

      // Cok gec kalirsa iskalama sayilir
      const miss = window.setTimeout(() => {
        setTarget((cur) => {
          if (!cur || cur.id !== currentRound) return cur
          stats.current.misses += 1
          setLastGrade({ label: 'MISS', color: '#C46A6A', ms: MAX_WAIT })
          audio.play('error')
          setRound(currentRound + 1)
          scheduleNext(currentRound + 1)
          return null
        })
      }, MAX_WAIT)
      timers.current.push(miss)
    }, delay)
    timers.current.push(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finish])

  const hitTarget = (t: Target) => {
    const ms = performance.now() - t.shownAt
    const g = grade(ms)
    const s = stats.current
    s.hits += 1
    s.sum += ms
    s.count += 1
    s.best = s.best === 0 ? ms : Math.min(s.best, ms)
    setScore((v) => v + g.points)
    setLastGrade({ label: g.label, color: g.color, ms })
    push(t.x + t.size / 2, t.y + t.size / 2, `+${g.points}`, g.color)
    audio.play(ms < 220 ? 'perfect' : 'pop')
    buzz(ms < 220 ? [8, 20, 8] : 10)
    setTarget(null)
    setRound(t.id + 1)
    clearTimers()
    scheduleNext(t.id + 1)
  }

  const missClick = () => {
    if (!started.current || finished.current) return
    stats.current.misses += 1
    setScore((v) => Math.max(0, v - 25))
    setLastGrade({ label: 'BOŞA', color: '#C46A6A', ms: 0 })
    audio.play('error')
  }

  return (
    <GameArea>
      <TimeBar value={1 - round / ROUNDS} />
      <div ref={areaRef} onPointerDown={missClick} className="absolute inset-0 touch-none-y">
        <AnimatePresence>
          {target && (
            <motion.button
              key={target.id}
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 520, damping: 22 }}
              onPointerDown={(e) => {
                e.stopPropagation()
                hitTarget(target)
              }}
              aria-label="Hedef"
              className="absolute grid place-items-center rounded-full border-2 border-accent/70 bg-accent/15 text-3xl shadow-glow"
              style={{ left: target.x, top: target.y, width: target.size, height: target.size }}
            >
              💋
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <GameHud
        left={<HudStat label="Skor" value={score} />}
        center={<HudStat label="Tur" value={`${Math.min(round + 1, ROUNDS)}/${ROUNDS}`} />}
        right={<HudStat label="En hızlı" value={stats.current.best ? `${Math.round(stats.current.best)}ms` : '—'} />}
      />

      <AnimatePresence>
        {lastGrade && (
          <motion.div
            key={`${lastGrade.label}-${round}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-x-0 bottom-16 text-center"
          >
            <p className="display text-2xl" style={{ color: lastGrade.color }}>
              {lastGrade.label}
            </p>
            {lastGrade.ms > 0 && lastGrade.label !== 'MISS' && (
              <p className="tabular mt-0.5 text-xs text-ink-mute">{Math.round(lastGrade.ms)} ms</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <PopLayer pops={pops} />
      <CountdownOverlay n={count} />
      <p className="pointer-events-none absolute inset-x-0 bottom-4 text-center text-[11px] text-ink-mute">
        Beliren öpücüğe hemen bas · boşa basmak −25
      </p>
    </GameArea>
  )
}
