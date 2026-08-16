import { motion } from 'framer-motion'
import {
  BarChart3,
  Gamepad2,
  Home,
  KeyRound,
  Library,
  ShoppingBag,
  Sparkles,
  Trophy,
  User,
} from 'lucide-react'
import type { ViewId } from '../types'
import { useGame } from '../store/useGame'
import { cx } from '../utils'
import { levelProgress, titleForLevel, xpForLevel, MAX_LEVEL } from '../data/levels'
import { AnimatedNumber, ProgressBar } from './ui'
import { frameById } from '../data/themes'
import { siteConfig } from '../config/site'
import { selectFinaleUnlocked } from '../store/useGame'

interface NavItem {
  id: ViewId
  label: string
  icon: typeof Home
  mobile?: boolean
}

const ITEMS: NavItem[] = [
  { id: 'home', label: 'Ana', icon: Home, mobile: true },
  { id: 'games', label: 'Oyunlar', icon: Gamepad2, mobile: true },
  { id: 'achievements', label: 'Başarımlar', icon: Trophy, mobile: true },
  { id: 'collection', label: 'Koleksiyon', icon: Library, mobile: true },
  { id: 'shop', label: 'Dükkân', icon: ShoppingBag },
  { id: 'stats', label: 'İstatistik', icon: BarChart3 },
  { id: 'profile', label: 'Profil', icon: User, mobile: true },
]

export function SideNav() {
  const view = useGame((s) => s.view)
  const setView = useGame((s) => s.setView)
  const secretUnlocked = useGame((s) => s.save.secretRoomUnlocked)
  const finale = useGame(selectFinaleUnlocked)

  return (
    <nav
      aria-label="Ana menü"
      className="fixed left-0 top-0 z-40 hidden h-full w-[84px] flex-col items-center gap-1 border-r border-line/50 bg-bg-1/60 py-5 backdrop-blur-xl lg:flex"
    >
      <button
        onClick={() => useGame.getState().tapLogo()}
        className="display mb-4 grid h-11 w-11 place-items-center rounded-md bg-accent/12 text-xl text-accent transition-transform hover:scale-105"
        aria-label="Buseverse"
        title="Buseverse"
      >
        B
      </button>

      {ITEMS.map((item) => {
        const Icon = item.icon
        const active = view === item.id
        return (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={cx(
              'group relative flex h-14 w-14 flex-col items-center justify-center gap-1 rounded-md transition-colors',
              active ? 'text-accent' : 'text-ink-mute hover:text-ink',
            )}
            aria-current={active ? 'page' : undefined}
          >
            {active && (
              <motion.span
                layoutId="side-active"
                className="absolute inset-0 rounded-md bg-accent/12"
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              />
            )}
            <Icon size={19} className="relative" />
            <span className="relative text-[9.5px] font-medium tracking-wide">{item.label}</span>
          </button>
        )
      })}

      {secretUnlocked && (
        <button
          onClick={() => setView('secret')}
          className={cx(
            'relative mt-2 flex h-14 w-14 flex-col items-center justify-center gap-1 rounded-md transition-colors',
            view === 'secret' ? 'text-gold' : 'text-ink-mute hover:text-gold',
          )}
        >
          <KeyRound size={19} />
          <span className="text-[9.5px] font-medium">Gizli</span>
        </button>
      )}

      {finale && (
        <button
          onClick={() => setView('finale')}
          className={cx(
            'relative flex h-14 w-14 flex-col items-center justify-center gap-1 rounded-md transition-colors',
            view === 'finale' ? 'text-accent' : 'text-ink-mute hover:text-accent',
          )}
        >
          <Sparkles size={19} />
          <span className="text-[9.5px] font-medium">Final</span>
        </button>
      )}
    </nav>
  )
}

export function BottomNav() {
  const view = useGame((s) => s.view)
  const setView = useGame((s) => s.setView)
  const items = ITEMS.filter((i) => i.mobile)

  return (
    <nav
      aria-label="Ana menü"
      className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line/60 bg-bg-1/90 backdrop-blur-xl lg:hidden"
    >
      <div className="mx-auto flex max-w-lg">
        {items.map((item) => {
          const Icon = item.icon
          const active = view === item.id
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              aria-current={active ? 'page' : undefined}
              className={cx(
                'relative flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 py-2 transition-colors',
                active ? 'text-accent' : 'text-ink-mute',
              )}
            >
              {active && (
                <motion.span
                  layoutId="bottom-active"
                  className="absolute inset-x-3 top-0 h-[2px] rounded-full bg-accent"
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                />
              )}
              <Icon size={20} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

/* ------------------------------------------------------------------ */
/* Ust HUD                                                             */
/* ------------------------------------------------------------------ */

export function TopBar() {
  const save = useGame((s) => s.save)
  const setView = useGame((s) => s.setView)
  const tapLevel = useGame((s) => s.tapLevelBadge)
  const progress = levelProgress(save.level, save.xp)
  const need = xpForLevel(save.level)
  const frame = frameById.get(save.activeFrame) ?? frameById.get('plain')!
  const title = save.activeTitle ?? titleForLevel(save.level)

  return (
    <header className="sticky top-0 z-30 border-b border-line/50 bg-bg-0/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-gutter py-3">
        <button
          onClick={() => setView('profile')}
          className={cx(
            'grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-accent/70 to-wine text-sm font-bold text-bg-0',
            frame.ring,
          )}
          aria-label="Profil"
        >
          {siteConfig.personName.charAt(0)}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="truncate text-sm font-semibold">{siteConfig.personName}</span>
            <button
              onClick={tapLevel}
              className="inline-flex h-8 shrink-0 items-center rounded-full bg-white/[0.07] px-2.5 text-[11px] font-semibold text-accent transition-colors hover:bg-white/[0.14]"
              aria-label={`Level ${save.level}`}
            >
              LV {save.level}
            </button>
            <span className="hidden truncate text-[11px] text-ink-mute sm:block">{title}</span>
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <ProgressBar value={progress} height="h-1.5" glow label="Level ilerlemesi" />
            <span className="tabular shrink-0 text-[10px] text-ink-mute">
              {save.level >= MAX_LEVEL ? 'MAX' : `${save.xp}/${need}`}
            </span>
          </div>
        </div>

        <button
          onClick={() => setView('shop')}
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-line/70 bg-bg-2/60 px-3 py-1.5 text-sm font-semibold transition-colors hover:border-accent/60"
          aria-label="Dükkân"
        >
          <span aria-hidden>💋</span>
          <AnimatedNumber value={save.kisses} />
        </button>

        {save.streak.count > 0 && (
          <div
            className="hidden shrink-0 items-center gap-1.5 rounded-full border border-line/70 bg-bg-2/60 px-3 py-1.5 text-sm font-semibold sm:flex"
            title={`${save.streak.count} günlük seri`}
          >
            <span aria-hidden>🔥</span>
            <span className="tabular">{save.streak.count}</span>
          </div>
        )}
      </div>
    </header>
  )
}
