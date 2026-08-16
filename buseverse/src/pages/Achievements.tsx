import { motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { Lock } from 'lucide-react'
import type { AchievementCategory, Rarity } from '../types'
import { useGame } from '../store/useGame'
import {
  achievements,
  categoryLabels,
  rarityLabels,
  rarityOrder,
  TOTAL_ACHIEVEMENTS,
} from '../data/achievements'
import { achievementProgress } from '../systems/engine'
import { Card, Chip, EmptyState, ProgressBar, RarityTag, rarityVar, SectionTitle } from '../components/ui'
import { formatDate, formatPercent } from '../utils/format'
import { cx } from '../utils'

type StatusFilter = 'all' | 'unlocked' | 'locked' | 'secret'

const STATUS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'Hepsi' },
  { id: 'unlocked', label: 'Açılan' },
  { id: 'locked', label: 'Kilitli' },
  { id: 'secret', label: 'Gizli' },
]

export function Achievements() {
  const save = useGame((s) => s.save)
  const setFlag = useGame((s) => s.setFlag)

  const [status, setStatus] = useState<StatusFilter>('all')
  const [rarity, setRarity] = useState<Rarity | 'all'>('all')
  const [category, setCategory] = useState<AchievementCategory | 'all'>('all')

  const unlockedCount = Object.keys(save.achievements).length

  const list = useMemo(() => {
    return achievements.filter((a) => {
      const unlocked = !!save.achievements[a.id]
      if (a.ghost && !unlocked) return false
      if (status === 'unlocked' && !unlocked) return false
      if (status === 'locked' && unlocked) return false
      if (status === 'secret' && a.category !== 'secret') return false
      if (rarity !== 'all' && a.rarity !== rarity) return false
      if (category !== 'all' && a.category !== category) return false
      return true
    })
  }, [save.achievements, status, rarity, category])

  const categories = useMemo(() => {
    const set = new Set(achievements.map((a) => a.category))
    return Array.from(set)
  }, [])

  return (
    <div className="mx-auto max-w-6xl px-gutter pb-10 pt-7">
      <SectionTitle>Başarımlar</SectionTitle>

      <Card className="mb-6 p-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="label-xs">Açılan</p>
            <p className="display mt-1 text-3xl">
              {unlockedCount}
              <span className="text-lg text-ink-mute"> / {TOTAL_ACHIEVEMENTS}</span>
              {/* gizli: sayacin yanindaki nokta */}
              <button
                onClick={() => setFlag('secret-achv-hunt')}
                aria-label="."
                className="ml-2 inline-block h-1.5 w-1.5 rounded-full bg-ink-mute/25 align-middle transition-colors hover:bg-accent"
              />
            </p>
          </div>
          <p className="display text-2xl text-accent">
            {formatPercent(unlockedCount / TOTAL_ACHIEVEMENTS, 1)}
          </p>
        </div>
        <ProgressBar className="mt-4" value={unlockedCount / TOTAL_ACHIEVEMENTS} height="h-2" glow />
      </Card>

      <div className="mb-3 flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {STATUS.map((s) => (
          <Chip key={s.id} active={status === s.id} onClick={() => setStatus(s.id)}>
            {s.label}
          </Chip>
        ))}
      </div>

      <div className="mb-3 flex gap-2 overflow-x-auto no-scrollbar pb-1">
        <Chip active={rarity === 'all'} onClick={() => setRarity('all')}>
          Tüm nadirlikler
        </Chip>
        {rarityOrder.map((r) => (
          <Chip key={r} active={rarity === r} onClick={() => setRarity(r)} tone={rarityVar[r]}>
            {rarityLabels[r]}
          </Chip>
        ))}
      </div>

      <div className="mb-6 flex gap-2 overflow-x-auto no-scrollbar pb-1">
        <Chip active={category === 'all'} onClick={() => setCategory('all')}>
          Tüm kategoriler
        </Chip>
        {categories.map((c) => (
          <Chip key={c} active={category === c} onClick={() => setCategory(c)}>
            {categoryLabels[c]}
          </Chip>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState
          glyph="✧"
          title="Burada bir şey yok"
          body="Filtreyi biraz gevşet, ya da git birkaç oyun oyna. İkisi de işe yarar."
        />
      ) : (
        <motion.div
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.018 } } }}
        >
          {list.map((a) => {
            const state = save.achievements[a.id]
            const unlocked = !!state
            const hiddenLocked = a.hidden && !unlocked
            const prog = achievementProgress(save, a.id)
            const showTitle = hiddenLocked ? '???' : a.title
            const showDesc = hiddenLocked ? (a.hint ?? 'Bunu kendin bulacaksın.') : a.description

            return (
              <motion.div key={a.id} variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}>
                <Card
                  className={cx(
                    'h-full p-4 transition-opacity',
                    unlocked ? 'shine' : 'opacity-70',
                  )}
                >
                  {unlocked && (
                    <span
                      className="absolute inset-x-0 top-0 h-[2px] rounded-t-lg"
                      style={{
                        background: `linear-gradient(90deg, transparent, ${rarityVar[a.rarity]}, transparent)`,
                      }}
                    />
                  )}
                  <div className="flex items-start gap-3">
                    <span
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-md text-lg"
                      style={{
                        background: unlocked
                          ? `color-mix(in srgb, ${rarityVar[a.rarity]} 15%, transparent)`
                          : 'rgb(var(--bg-3) / 0.6)',
                        color: unlocked ? rarityVar[a.rarity] : 'rgb(var(--ink-mute))',
                      }}
                      aria-hidden
                    >
                      {hiddenLocked ? <Lock size={16} /> : a.icon}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cx('truncate text-sm font-semibold', !unlocked && 'text-ink-dim')}>
                          {showTitle}
                        </p>
                        <RarityTag rarity={a.rarity} label={rarityLabels[a.rarity]} />
                      </div>
                      <p className="mt-1 line-clamp-2 text-[12px] leading-snug text-ink-mute">{showDesc}</p>

                      {!unlocked && prog && !hiddenLocked && (
                        <div className="mt-2.5 flex items-center gap-2">
                          <ProgressBar value={prog.current / prog.target} height="h-1" tone="mute" />
                          <span className="tabular shrink-0 text-[10px] text-ink-mute">
                            {prog.current}/{prog.target}
                          </span>
                        </div>
                      )}

                      <div className="mt-2.5 flex items-center gap-2.5 text-[11px]">
                        <span className="text-lav">+{a.xp} XP</span>
                        <span className="text-accent">+{a.kisses} 💋</span>
                        {unlocked && (
                          <span className="ml-auto text-ink-mute">{formatDate(state.unlockedAt)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>
      )}
    </div>
  )
}
