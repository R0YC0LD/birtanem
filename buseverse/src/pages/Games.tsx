import { motion } from 'framer-motion'
import { Lock } from 'lucide-react'
import { useGame } from '../store/useGame'
import { formatBestValue, games } from '../data/games'
import { Card, SectionTitle } from '../components/ui'
import { cx } from '../utils'

export function Games() {
  const level = useGame((s) => s.save.level)
  const bests = useGame((s) => s.save.bests)
  const plays = useGame((s) => s.save.plays)
  const openGame = useGame((s) => s.openGame)

  return (
    <div className="mx-auto max-w-6xl px-gutter pb-10 pt-7">
      <SectionTitle>Oyunlar</SectionTitle>
      <p className="-mt-2 mb-6 max-w-md text-sm text-ink-dim">
        Her oyunun kendi rekoru ve kendi başarım zinciri var. Zoru sonra gelir, önce ısınalım.
      </p>

      <motion.div
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.05 } } }}
      >
        {games.map((g) => {
          const unlocked = level >= g.unlockLevel
          return (
            <motion.div
              key={g.id}
              variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
            >
              <Card
                interactive={unlocked}
                onClick={unlocked ? () => openGame(g.id) : undefined}
                className={cx('shine overflow-hidden p-0', !unlocked && 'opacity-60')}
              >
                <div
                  className="relative flex h-28 items-center justify-center text-5xl"
                  style={{
                    background: `linear-gradient(135deg, ${g.hue[0]}30, ${g.hue[1]}70)`,
                    color: unlocked ? g.hue[0] : 'rgb(var(--ink-mute))',
                  }}
                  aria-hidden
                >
                  {unlocked ? g.glyph : <Lock size={26} />}
                  <span className="absolute right-3 top-3 rounded-full bg-black/35 px-2 py-0.5 text-[10px] font-medium text-white/80">
                    {g.skill}
                  </span>
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="display truncate text-lg leading-tight">{g.title}</p>
                      <p className="mt-0.5 truncate text-[12px] text-accent-soft">{g.tagline}</p>
                    </div>
                    {!unlocked && (
                      <span className="shrink-0 rounded-full bg-white/[0.07] px-2 py-1 text-[10px] text-ink-mute">
                        LV {g.unlockLevel}
                      </span>
                    )}
                  </div>

                  <p className="mt-2.5 line-clamp-2 text-[13px] leading-snug text-ink-dim">{g.description}</p>

                  <div className="mt-4 flex items-end justify-between border-t border-line/50 pt-3">
                    <div>
                      <p className="label-xs">{g.bestLabel}</p>
                      <p className="tabular display mt-0.5 text-base">{formatBestValue(g, bests[g.id])}</p>
                    </div>
                    <p className="text-[11px] text-ink-mute">{plays[g.id] ?? 0} kez oynandı</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          )
        })}
      </motion.div>
    </div>
  )
}
