import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo } from 'react'
import { Trophy } from 'lucide-react'
import { useGame } from '../store/useGame'
import { achievementById, rarityLabels } from '../data/achievements'
import { rarityVar, Button, RarityTag } from './ui'
import { cx } from '../utils'

/* ------------------------------------------------------------------ */
/* Parcacik patlamasi                                                  */
/* ------------------------------------------------------------------ */

export function Burst({ count = 14, color, size = 4 }: { count?: number; color?: string; size?: number }) {
  const reduced = useGame((s) => s.save.settings.reducedMotion)
  const seeds = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        angle: (i / count) * Math.PI * 2 + Math.random() * 0.5,
        dist: 40 + Math.random() * 70,
        delay: Math.random() * 0.1,
        scale: 0.5 + Math.random() * 0.8,
      })),
    [count],
  )
  if (reduced) return null
  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2 h-0 w-0" aria-hidden>
      {seeds.map((s, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full"
          style={{
            width: size,
            height: size,
            background: color ?? 'rgb(var(--accent))',
          }}
          initial={{ x: 0, y: 0, opacity: 1, scale: s.scale }}
          animate={{
            x: Math.cos(s.angle) * s.dist,
            y: Math.sin(s.angle) * s.dist,
            opacity: 0,
            scale: 0,
          }}
          transition={{ duration: 0.9, delay: s.delay, ease: [0.22, 1, 0.36, 1] }}
        />
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Basarim popup — kuyruk sistemi                                      */
/* ------------------------------------------------------------------ */

export function AchievementPopup() {
  const queue = useGame((s) => s.achievementQueue)
  const pop = useGame((s) => s.popAchievement)
  const current = queue[0]

  // Kuyruk uzunsa hizlan: tek basarim 4.6s, yigilma varsa 1.4s'e kadar iner.
  // Boylece bir turda 15 basarim acilinca dakikalarca popup izlenmiyor.
  useEffect(() => {
    if (!current) return
    const remaining = queue.length
    const duration = remaining > 6 ? 1400 : remaining > 3 ? 2200 : remaining > 1 ? 3200 : 4600
    const t = window.setTimeout(pop, duration)
    return () => window.clearTimeout(t)
  }, [current, pop, queue.length])

  const def = current ? achievementById.get(current) : undefined

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[120] flex justify-center px-3 sm:top-5">
      <AnimatePresence mode="wait">
        {def && (
          <motion.div
            key={def.id}
            initial={{ opacity: 0, y: -28, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -18, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 340, damping: 26 }}
            className="pointer-events-auto relative w-full max-w-sm overflow-hidden rounded-lg border bg-bg-1/95 p-4 shadow-lift backdrop-blur-xl"
            style={{ borderColor: `color-mix(in srgb, ${rarityVar[def.rarity]} 55%, transparent)` }}
            onClick={pop}
            role="status"
            aria-live="polite"
          >
            <div
              className="absolute inset-x-0 top-0 h-[2px]"
              style={{ background: `linear-gradient(90deg, transparent, ${rarityVar[def.rarity]}, transparent)` }}
            />
            <div
              className="absolute -left-10 -top-10 h-28 w-28 rounded-full blur-2xl"
              style={{ background: `color-mix(in srgb, ${rarityVar[def.rarity]} 32%, transparent)` }}
            />
            <div className="relative flex items-start gap-3.5">
              <motion.div
                initial={{ scale: 0.4, rotate: -18 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 14, delay: 0.08 }}
                className="relative grid h-12 w-12 shrink-0 place-items-center rounded-md text-xl"
                style={{
                  background: `color-mix(in srgb, ${rarityVar[def.rarity]} 16%, transparent)`,
                  color: rarityVar[def.rarity],
                }}
              >
                {def.icon}
                <Burst count={10} color={rarityVar[def.rarity]} size={3} />
              </motion.div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-mute">
                  <Trophy size={11} />
                  Başarım açıldı
                </div>
                <p className="display mt-1 truncate text-[17px] leading-tight">{def.title}</p>
                <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-ink-dim">{def.description}</p>
                <div className="mt-2.5 flex items-center gap-2.5 text-[12px] font-semibold">
                  <span className="text-lav">+{def.xp} XP</span>
                  <span className="text-accent">+{def.kisses} 💋</span>
                  <span className="ml-auto">
                    <RarityTag rarity={def.rarity} label={rarityLabels[def.rarity]} />
                  </span>
                </div>
              </div>
            </div>
            {queue.length > 1 && (
              <div className="mt-2.5 border-t border-line/50 pt-2 text-[11px] text-ink-mute">
                sırada {queue.length - 1} başarım daha var
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Level up                                                            */
/* ------------------------------------------------------------------ */

export function LevelUpModal() {
  const levelUp = useGame((s) => s.levelUp)
  const dismiss = useGame((s) => s.dismissLevelUp)
  const reduced = useGame((s) => s.save.settings.reducedMotion)

  useEffect(() => {
    if (!levelUp) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') dismiss()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [levelUp, dismiss])

  return (
    <AnimatePresence>
      {levelUp && (
        <motion.div
          className="fixed inset-0 z-[140] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          role="dialog"
          aria-modal="true"
          aria-label="Level atladın"
        >
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={dismiss} />

          {!reduced && (
            <motion.div
              className="pointer-events-none absolute left-1/2 top-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgb(var(--accent)/0.5), transparent 62%)',
              }}
              initial={{ scale: 0.2, opacity: 0 }}
              animate={{ scale: [0.2, 1.25, 1], opacity: [0, 0.95, 0.35] }}
              transition={{ duration: 1.3, times: [0, 0.35, 1], ease: 'easeOut' }}
            />
          )}

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 240, damping: 24, delay: 0.15 }}
            className="surface grain relative z-10 w-full max-w-sm overflow-hidden p-7 text-center"
          >
            <motion.p
              className="label-xs"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Level up
            </motion.p>

            <motion.div
              className="display relative mt-2 text-[68px] leading-none text-accent"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 240, damping: 12, delay: 0.4 }}
            >
              {levelUp.to}
              <Burst count={18} size={5} />
            </motion.div>

            {levelUp.to - levelUp.from > 1 && (
              <p className="mt-1 text-xs text-ink-mute">
                tek seferde {levelUp.to - levelUp.from} level atladın
              </p>
            )}

            <motion.p
              className="display mt-3 text-xl"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.62 }}
            >
              {levelUp.title}
            </motion.p>

            {levelUp.rewards.length > 0 && (
              <motion.div
                className="mt-5 space-y-1.5 text-left"
                initial="hidden"
                animate="show"
                variants={{ show: { transition: { staggerChildren: 0.07, delayChildren: 0.75 } } }}
              >
                {levelUp.rewards.map((r, i) => (
                  <motion.div
                    key={`${r.label}-${i}`}
                    variants={{ hidden: { opacity: 0, x: -12 }, show: { opacity: 1, x: 0 } }}
                    className="flex items-center gap-3 rounded-sm bg-white/[0.05] px-3 py-2.5 text-sm"
                  >
                    <span className="text-base">{r.icon}</span>
                    <span className="text-ink-dim">{r.label}</span>
                  </motion.div>
                ))}
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.95 }}
              className="mt-6"
            >
              <Button onClick={dismiss} full>
                Devam
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ------------------------------------------------------------------ */
/* Genel odul modali (streak, gunluk set, ozel gun)                    */
/* ------------------------------------------------------------------ */

export function RewardModal() {
  const modal = useGame((s) => s.rewardModal)
  const dismiss = useGame((s) => s.dismissRewardModal)

  return (
    <AnimatePresence>
      {modal && (
        <motion.div
          className="fixed inset-0 z-[130] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label={modal.title}
        >
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={dismiss} />
          <motion.div
            initial={{ opacity: 0, y: 26, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ type: 'spring', stiffness: 280, damping: 26 }}
            className="surface grain relative z-10 w-full max-w-sm p-7 text-center"
          >
            <motion.div
              className="relative mx-auto grid h-16 w-16 place-items-center rounded-full bg-accent/12 text-3xl"
              initial={{ scale: 0.5, rotate: -12 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 280, damping: 13, delay: 0.1 }}
            >
              {modal.icon}
              <Burst count={12} />
            </motion.div>
            <h2 className="display mt-4 text-2xl">{modal.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-dim">{modal.body}</p>
            {(modal.kisses || modal.xp) && (
              <div className="mt-5 flex items-center justify-center gap-3 text-sm font-semibold">
                {modal.xp ? <span className="text-lav">+{modal.xp} XP</span> : null}
                {modal.kisses ? <span className="text-accent">+{modal.kisses} 💋</span> : null}
              </div>
            )}
            <Button className="mt-6" onClick={dismiss} full>
              Tamam
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ------------------------------------------------------------------ */
/* Toast                                                               */
/* ------------------------------------------------------------------ */

export function Toasts() {
  const toasts = useGame((s) => s.toasts)
  const dismiss = useGame((s) => s.dismissToast)

  useEffect(() => {
    if (!toasts.length) return
    const timers = toasts.map((t) => window.setTimeout(() => dismiss(t.id), 3200))
    return () => timers.forEach((t) => window.clearTimeout(t))
  }, [toasts, dismiss])

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(theme(spacing.nav)+1rem)] z-[110] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:left-auto sm:right-6 sm:items-end">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            onClick={() => dismiss(t.id)}
            className={cx(
              'pointer-events-auto flex max-w-xs items-center gap-2.5 rounded-md border px-3.5 py-2.5 text-[13px] shadow-lift backdrop-blur-xl',
              t.tone === 'good' && 'border-emerald-400/25 bg-emerald-950/70 text-emerald-100',
              t.tone === 'warn' && 'border-amber-400/25 bg-amber-950/70 text-amber-100',
              t.tone === 'info' && 'border-line bg-bg-1/90 text-ink-dim',
            )}
          >
            {t.icon && <span aria-hidden>{t.icon}</span>}
            <span>{t.text}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Ucusan +XP / +opucuk                                                */
/* ------------------------------------------------------------------ */

export function Floaters() {
  const floaters = useGame((s) => s.floaters)
  const clear = useGame((s) => s.clearFloater)

  useEffect(() => {
    if (!floaters.length) return
    const timers = floaters.map((f) => window.setTimeout(() => clear(f.id), 1200))
    return () => timers.forEach((t) => window.clearTimeout(t))
  }, [floaters, clear])

  return (
    <div className="pointer-events-none fixed inset-x-0 top-20 z-[115] flex flex-col items-center gap-1">
      <AnimatePresence>
        {floaters.map((f) => (
          <motion.span
            key={f.id}
            initial={{ opacity: 0, y: 16, scale: 0.9 }}
            animate={{ opacity: 1, y: -14, scale: 1 }}
            exit={{ opacity: 0, y: -42, scale: 0.95 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className={cx(
              'display text-lg font-semibold drop-shadow-[0_2px_10px_rgb(0_0_0/0.7)]',
              f.tone === 'xp' && 'text-lav',
              f.tone === 'kiss' && 'text-accent',
              f.tone === 'plain' && 'text-ink',
            )}
          >
            {f.text}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  )
}
