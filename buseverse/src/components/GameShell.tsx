import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowLeft, RotateCcw, Trophy } from 'lucide-react'
import type { Difficulty, GameResult } from '../types'
import { useGame } from '../store/useGame'
import { formatBestValue, gameById } from '../data/games'
import { Button, Card } from './ui'
import { Burst } from './Overlays'
import { achievementById } from '../data/achievements'
import { GAME_COMPONENTS } from '../games'
import { cx } from '../utils'

export interface MiniGameProps {
  difficulty: Difficulty
  reduced: boolean
  onFinish: (result: Omit<GameResult, 'gameId'>) => void
  onQuit: () => void
}

type Phase = 'intro' | 'playing' | 'result'

const DIFFICULTIES: { id: Difficulty; label: string }[] = [
  { id: 'easy', label: 'Kolay' },
  { id: 'normal', label: 'Normal' },
  { id: 'hard', label: 'Zor' },
]

export function GameShell() {
  const activeGame = useGame((s) => s.activeGame)
  const closeGame = useGame((s) => s.closeGame)
  const record = useGame((s) => s.recordGameResult)
  const lastResult = useGame((s) => s.lastResult)
  const clearResult = useGame((s) => s.clearResult)
  const bests = useGame((s) => s.save.bests)
  const reduced = useGame((s) => s.save.settings.reducedMotion)

  const [phase, setPhase] = useState<Phase>('intro')
  const [difficulty, setDifficulty] = useState<Difficulty>('normal')
  const [runKey, setRunKey] = useState(0)

  const def = activeGame ? gameById.get(activeGame) : undefined

  useEffect(() => {
    setPhase('intro')
    setRunKey((k) => k + 1)
  }, [activeGame])

  const handleFinish = useCallback(
    (partial: Omit<GameResult, 'gameId'>) => {
      if (!activeGame) return
      record({ ...partial, gameId: activeGame })
      setPhase('result')
    },
    [activeGame, record],
  )

  const restart = useCallback(() => {
    clearResult()
    setRunKey((k) => k + 1)
    setPhase('playing')
  }, [clearResult])

  const exit = useCallback(() => {
    clearResult()
    closeGame()
  }, [clearResult, closeGame])

  const Component = activeGame ? GAME_COMPONENTS[activeGame] : undefined

  if (!activeGame || !def || !Component) return null

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-bg-0" data-phase={phase}>
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          background: `radial-gradient(80rem 50rem at 50% -20%, ${def.hue[0]}33, transparent 60%), radial-gradient(60rem 40rem at 20% 120%, ${def.hue[1]}44, transparent 60%)`,
        }}
        aria-hidden
      />

      <header className="relative z-10 flex items-center gap-3 border-b border-line/50 px-4 py-3">
        <button
          onClick={exit}
          className="grid h-10 w-10 place-items-center rounded-md text-ink-dim transition-colors hover:bg-white/10 hover:text-ink"
          aria-label="Oyundan çık"
        >
          <ArrowLeft size={19} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="display truncate text-base leading-tight">{def.title}</p>
          <p className="truncate text-[11px] text-ink-mute">
            {def.bestLabel}: {formatBestValue(def, bests[def.id])}
          </p>
        </div>
        {phase === 'playing' && (
          <button
            onClick={restart}
            className="grid h-10 w-10 place-items-center rounded-md text-ink-dim transition-colors hover:bg-white/10 hover:text-ink"
            aria-label="Yeniden başlat"
          >
            <RotateCcw size={17} />
          </button>
        )}
      </header>

      <div className="relative z-10 min-h-0 flex-1 overflow-hidden">
        {/*
          AnimatePresence mode="wait" tek bir child bekler.
          Bu yuzden fazlar && zinciriyle degil, tek bir ucluk ifadeyle veriliyor.
        */}
        <AnimatePresence mode="wait">
          {phase === 'intro' ? (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="flex h-full items-center justify-center overflow-y-auto p-5"
            >
              <div className="w-full max-w-md py-6">
                <div className="display text-5xl text-accent" aria-hidden>
                  {def.glyph}
                </div>
                <h1 className="display mt-4 text-3xl">{def.title}</h1>
                <p className="mt-1 text-sm text-accent-soft">{def.tagline}</p>
                <p className="mt-4 text-[15px] leading-relaxed text-ink-dim">{def.description}</p>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="surface-flat p-3.5">
                    <p className="label-xs">Yetenek</p>
                    <p className="mt-1 text-sm font-semibold">{def.skill}</p>
                  </div>
                  <div className="surface-flat p-3.5">
                    <p className="label-xs">{def.bestLabel}</p>
                    <p className="mt-1 text-sm font-semibold">{formatBestValue(def, bests[def.id])}</p>
                  </div>
                </div>

                {def.hasDifficulty && (
                  <div className="mt-5">
                    <p className="label-xs mb-2">Zorluk</p>
                    <div className="flex gap-2">
                      {DIFFICULTIES.map((d) => (
                        <button
                          key={d.id}
                          onClick={() => setDifficulty(d.id)}
                          className={cx(
                            'h-11 flex-1 rounded-md border text-sm font-medium transition-all',
                            difficulty === d.id
                              ? 'border-accent/70 bg-accent/12 text-accent'
                              : 'border-line/70 text-ink-dim hover:text-ink',
                          )}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <Button size="lg" full className="mt-7" onClick={() => setPhase('playing')}>
                  Başla
                </Button>
              </div>
            </motion.div>
          ) : phase === 'playing' ? (
            <motion.div
              key={`play-${runKey}`}
              initial={{ opacity: 0, scale: 0.985 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.24 }}
              className="h-full"
            >
              <Component difficulty={difficulty} reduced={reduced} onFinish={handleFinish} onQuit={exit} />
            </motion.div>
          ) : lastResult ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 28 }}
              className="h-full overflow-y-auto p-5"
            >
              <ResultScreen onRestart={restart} onExit={exit} />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Sonuc ekrani                                                        */
/* ------------------------------------------------------------------ */

function headline(perf: number, failed?: boolean): string {
  if (failed && perf < 0.15) return 'Olur böyle şeyler.'
  if (perf > 0.88) return 'Bu ne böyle!'
  if (perf > 0.7) return 'Harikaydın.'
  if (perf > 0.5) return 'İyi iş.'
  if (perf > 0.3) return 'Fena değil.'
  return 'Bir tur daha?'
}

function ResultScreen({ onRestart, onExit }: { onRestart: () => void; onExit: () => void }) {
  const result = useGame((s) => s.lastResult)
  const def = result ? gameById.get(result.gameId) : undefined
  const unlockedDefs = useMemo(
    () => (result?.unlocked ?? []).map((id) => achievementById.get(id)).filter(Boolean),
    [result],
  )

  if (!result || !def) return null

  return (
    <div className="mx-auto w-full max-w-md pb-8">
      <motion.p
        className="display text-center text-3xl"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
      >
        {headline(result.performance, result.failed)}
      </motion.p>

      <motion.div
        className="relative mt-7 text-center"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.16 }}
      >
        <p className="label-xs">Skor</p>
        <p className="display text-[56px] leading-none">{result.score.toLocaleString('tr-TR')}</p>
        {result.reward.newBest && (
          <motion.div
            className="relative mt-2 inline-flex items-center gap-1.5 rounded-full bg-gold/15 px-3 py-1 text-[12px] font-semibold text-gold"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 340, damping: 14, delay: 0.42 }}
          >
            <Trophy size={12} />
            Yeni rekor!
            <Burst count={12} color="rgb(var(--gold))" size={3} />
          </motion.div>
        )}
      </motion.div>

      <motion.div
        className="mt-7 grid grid-cols-2 gap-3"
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.06, delayChildren: 0.3 } } }}
      >
        <motion.div variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }} className="surface-flat p-4">
          <p className="label-xs">Kazanılan XP</p>
          <p className="display mt-1 text-2xl text-lav">+{result.reward.xp}</p>
        </motion.div>
        <motion.div variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }} className="surface-flat p-4">
          <p className="label-xs">Öpücük</p>
          <p className="display mt-1 text-2xl text-accent">+{result.reward.kisses} 💋</p>
        </motion.div>
        {(result.detail ?? []).map((d) => (
          <motion.div
            key={d.label}
            variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
            className="surface-flat p-4"
          >
            <p className="label-xs">{d.label}</p>
            <p className="display mt-1 text-xl">{d.value}</p>
          </motion.div>
        ))}
      </motion.div>

      {result.reward.diminished && (
        <p className="mt-3 text-center text-[11px] leading-relaxed text-ink-mute">
          Bugün bu oyunu çok oynadın, taban ödül biraz azaldı. Rekor bonusu tam veriliyor.
        </p>
      )}

      {unlockedDefs.length > 0 && (
        <motion.div
          className="mt-6"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
        >
          <p className="label-xs mb-2">Açılan başarımlar</p>
          <div className="space-y-2">
            {unlockedDefs.map((a) => (
              <Card key={a!.id} className="flex items-center gap-3 p-3">
                <span className="grid h-9 w-9 place-items-center rounded-sm bg-accent/12 text-accent">{a!.icon}</span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{a!.title}</p>
                  <p className="truncate text-[11px] text-ink-mute">{a!.description}</p>
                </div>
              </Card>
            ))}
          </div>
        </motion.div>
      )}

      <motion.div
        className="mt-8 flex gap-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.65 }}
      >
        <Button full onClick={onRestart}>
          Tekrar oyna
        </Button>
        <Button full variant="ghost" onClick={onExit}>
          Menü
        </Button>
      </motion.div>
    </div>
  )
}
