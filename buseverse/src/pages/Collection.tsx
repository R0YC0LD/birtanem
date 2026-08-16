import { motion } from 'framer-motion'
import { useGame } from '../store/useGame'
import { collectibles, TOTAL_COLLECTIBLES } from '../data/collectibles'
import { Card, ProgressBar, SectionTitle } from '../components/ui'
import { formatDate, formatPercent } from '../utils/format'
import { cx } from '../utils'

export function Collection() {
  const save = useGame((s) => s.save)
  const owned = Object.keys(save.collectibles).length

  return (
    <div className="mx-auto max-w-4xl px-gutter pb-10 pt-7">
      <SectionTitle>Küçük Anılar</SectionTitle>
      <p className="-mt-2 mb-6 max-w-md text-sm text-ink-dim">
        On altı parça. Bazıları level ile, bazıları oyunla, bazıları da hiç beklemediğin bir yerde açılıyor.
      </p>

      <Card className="mb-6 p-5">
        <div className="flex items-end justify-between">
          <div>
            <p className="label-xs">Toplanan</p>
            <p className="display mt-1 text-3xl">
              {owned}
              <span className="text-lg text-ink-mute"> / {TOTAL_COLLECTIBLES}</span>
            </p>
          </div>
          <p className="display text-2xl text-accent">{formatPercent(owned / TOTAL_COLLECTIBLES, 0)}</p>
        </div>
        <ProgressBar className="mt-4" value={owned / TOTAL_COLLECTIBLES} height="h-2" tone="gold" glow />
      </Card>

      <motion.div
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.04 } } }}
      >
        {collectibles.map((c) => {
          const found = save.collectibles[c.id]
          return (
            <motion.div key={c.id} variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}>
              <Card className={cx('h-full overflow-hidden p-4 text-center', !found && 'opacity-75')}>
                <div
                  className={cx(
                    'mx-auto grid h-16 w-16 place-items-center rounded-full text-3xl transition-all',
                    found ? 'bg-accent/12 text-accent shadow-glow' : 'bg-bg-3/60 text-ink-mute/35',
                  )}
                  style={found ? undefined : { filter: 'blur(1.5px)' }}
                  aria-hidden
                >
                  {c.glyph}
                </div>
                <p className={cx('display mt-3 text-base', !found && 'text-ink-mute')}>
                  {found ? c.name : '???'}
                </p>
                <p className="mt-1.5 text-[12px] leading-snug text-ink-mute">
                  {found ? c.lore : c.source}
                </p>
                {found && (
                  <p className="mt-2 text-[10px] uppercase tracking-wider text-ink-mute/60">
                    {formatDate(found)}
                  </p>
                )}
              </Card>
            </motion.div>
          )
        })}
      </motion.div>
    </div>
  )
}
