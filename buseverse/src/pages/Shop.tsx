import { motion } from 'framer-motion'
import { useState } from 'react'
import { Check, Lock } from 'lucide-react'
import type { ShopCategory } from '../types'
import { useGame } from '../store/useGame'
import { shopCategories, shopItems } from '../data/shop'
import { AnimatedNumber, Button, Card, Chip, SectionTitle } from '../components/ui'
import { cx } from '../utils'

export function Shop() {
  const save = useGame((s) => s.save)
  const purchase = useGame((s) => s.purchase)
  const equipTheme = useGame((s) => s.equipTheme)
  const equipFrame = useGame((s) => s.equipFrame)
  const equipTrail = useGame((s) => s.equipTrail)
  const equipTitle = useGame((s) => s.equipTitle)

  const [cat, setCat] = useState<ShopCategory | 'all'>('all')
  const list = shopItems.filter((i) => cat === 'all' || i.category === cat)

  const equipped = (id: string) => {
    const item = shopItems.find((i) => i.id === id)
    if (!item) return false
    switch (item.effect.type) {
      case 'theme':
        return save.activeTheme === item.effect.themeId
      case 'frame':
        return save.activeFrame === item.effect.frameId
      case 'trail':
        return save.activeTrail === item.effect.trailId
      case 'title':
        return save.activeTitle === item.effect.title
      default:
        return false
    }
  }

  const equip = (id: string) => {
    const item = shopItems.find((i) => i.id === id)
    if (!item) return
    switch (item.effect.type) {
      case 'theme':
        equipTheme(item.effect.themeId)
        break
      case 'frame':
        equipFrame(item.effect.frameId)
        break
      case 'trail':
        equipTrail(item.effect.trailId)
        break
      case 'title':
        equipTitle(item.effect.title)
        break
      default:
        break
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-gutter pb-10 pt-7">
      <div className="mb-5 flex items-end justify-between gap-4">
        <SectionTitle>Öpücük Dükkânı</SectionTitle>
        <div className="mb-4 flex items-center gap-2 rounded-full border border-line/70 bg-bg-2/60 px-4 py-2">
          <span aria-hidden>💋</span>
          <AnimatedNumber value={save.kisses} className="font-semibold" />
        </div>
      </div>

      <div className="mb-6 flex gap-2 overflow-x-auto no-scrollbar pb-1">
        <Chip active={cat === 'all'} onClick={() => setCat('all')}>
          Hepsi
        </Chip>
        {shopCategories.map((c) => (
          <Chip key={c.id} active={cat === c.id} onClick={() => setCat(c.id)}>
            {c.label}
          </Chip>
        ))}
      </div>

      <motion.div
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.03 } } }}
      >
        {list.map((item) => {
          const owned = !!save.purchases[item.id]
          const levelLocked = !!item.requiresLevel && save.level < item.requiresLevel
          const affordable = save.kisses >= item.price
          const isEquipped = owned && equipped(item.id)
          const equippable = ['theme', 'frame', 'trail', 'title'].includes(item.effect.type)

          return (
            <motion.div key={item.id} variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}>
              <Card className={cx('flex h-full flex-col p-5', levelLocked && 'opacity-65')}>
                <div className="flex items-start gap-3">
                  <span
                    className={cx(
                      'grid h-11 w-11 shrink-0 place-items-center rounded-md text-xl',
                      owned ? 'bg-accent/12 text-accent' : 'bg-bg-3/60 text-ink-dim',
                    )}
                    aria-hidden
                  >
                    {item.glyph}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold leading-tight">{item.name}</p>
                    <p className="mt-1 text-[12px] leading-snug text-ink-mute">{item.description}</p>
                  </div>
                </div>

                <div className="mt-auto pt-5">
                  {levelLocked ? (
                    <div className="flex items-center justify-center gap-2 rounded-md border border-line/60 py-2.5 text-[12px] text-ink-mute">
                      <Lock size={13} /> Level {item.requiresLevel} gerekiyor
                    </div>
                  ) : owned ? (
                    equippable ? (
                      <Button
                        variant={isEquipped ? 'outline' : 'ghost'}
                        size="sm"
                        full
                        disabled={isEquipped}
                        onClick={() => equip(item.id)}
                      >
                        {isEquipped ? (
                          <>
                            <Check size={14} /> Kullanılıyor
                          </>
                        ) : (
                          'Kullan'
                        )}
                      </Button>
                    ) : (
                      <div className="flex items-center justify-center gap-2 rounded-md border border-emerald-500/25 bg-emerald-500/[0.07] py-2.5 text-[12px] text-emerald-300">
                        <Check size={13} /> Alındı
                      </div>
                    )
                  ) : (
                    <Button
                      size="sm"
                      full
                      variant={affordable ? 'primary' : 'ghost'}
                      onClick={() => purchase(item.id)}
                    >
                      {item.price} 💋
                    </Button>
                  )}
                </div>
              </Card>
            </motion.div>
          )
        })}
      </motion.div>

      <p className="mt-8 text-center text-[12px] text-ink-mute">
        Hiçbir ürün rastgele değil. Ne aldığını her zaman görüyorsun.
      </p>
    </div>
  )
}
