import { AnimatePresence, motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { useEffect, useId, useRef, useState } from 'react'
import { X } from 'lucide-react'
import type { Rarity } from '../types'
import { cx } from '../utils'
import { audio } from '../systems/audio'

/* ------------------------------------------------------------------ */
/* Buton                                                               */
/* ------------------------------------------------------------------ */

type ButtonProps = {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'ghost' | 'outline' | 'danger' | 'quiet'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  className?: string
  type?: 'button' | 'submit'
  ariaLabel?: string
  full?: boolean
}

const VARIANTS: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-accent text-bg-0 font-semibold hover:bg-accent-soft shadow-[0_10px_30px_-12px_rgb(var(--accent)/0.9)]',
  ghost: 'bg-white/[0.06] text-ink hover:bg-white/[0.11] border border-white/10',
  outline: 'border border-line text-ink hover:border-accent/70 hover:text-accent',
  danger: 'bg-rose-900/70 text-rose-50 hover:bg-rose-800/80 border border-rose-500/30',
  quiet: 'text-ink-dim hover:text-ink',
}

const SIZES = {
  sm: 'h-9 px-3.5 text-[13px] rounded-sm',
  md: 'h-11 px-5 text-sm rounded-md min-w-[44px]',
  lg: 'h-13 px-7 text-base rounded-md py-3.5',
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled,
  className,
  type = 'button',
  ariaLabel,
  full,
}: ButtonProps) {
  return (
    <motion.button
      type={type}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => {
        if (disabled) return
        onClick?.()
      }}
      onPointerEnter={() => !disabled && audio.play('hover')}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 600, damping: 30 }}
      className={cx(
        'relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap transition-colors duration-200',
        SIZES[size],
        VARIANTS[variant],
        full && 'w-full',
        disabled && 'pointer-events-none opacity-40',
        className,
      )}
    >
      {children}
    </motion.button>
  )
}

/* ------------------------------------------------------------------ */
/* Kart                                                                */
/* ------------------------------------------------------------------ */

export function Card({
  children,
  className,
  onClick,
  interactive,
  glass,
}: {
  children: ReactNode
  className?: string
  onClick?: () => void
  interactive?: boolean
  glass?: boolean
}) {
  const Comp = onClick ? motion.button : motion.div
  return (
    <Comp
      onClick={onClick}
      onPointerEnter={onClick ? () => audio.play('hover') : undefined}
      whileHover={interactive ? { y: -4 } : undefined}
      whileTap={onClick ? { scale: 0.985 } : undefined}
      transition={{ type: 'spring', stiffness: 420, damping: 30 }}
      className={cx(
        glass ? 'surface-glass' : 'surface',
        'relative text-left',
        onClick && 'w-full cursor-pointer',
        className,
      )}
    >
      {children}
    </Comp>
  )
}

/* ------------------------------------------------------------------ */
/* Progress bar                                                        */
/* ------------------------------------------------------------------ */

export function ProgressBar({
  value,
  className,
  tone = 'accent',
  height = 'h-2',
  glow,
  label,
}: {
  value: number
  className?: string
  tone?: 'accent' | 'gold' | 'lav' | 'mute'
  height?: string
  glow?: boolean
  label?: string
}) {
  const pct = Math.max(0, Math.min(1, value)) * 100
  const bg =
    tone === 'gold' ? 'bg-gold' : tone === 'lav' ? 'bg-lav' : tone === 'mute' ? 'bg-ink-mute' : 'bg-accent'
  return (
    <div
      className={cx('relative w-full overflow-hidden rounded-full bg-bg-3/70', height, className)}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <motion.div
        className={cx('h-full rounded-full', bg, glow && 'shadow-glow')}
        initial={false}
        animate={{ width: `${pct}%` }}
        transition={{ type: 'spring', stiffness: 140, damping: 24 }}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Sayi sayaci                                                         */
/* ------------------------------------------------------------------ */

export function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const [display, setDisplay] = useState(value)
  const raf = useRef(0)
  const from = useRef(value)
  const start = useRef(0)

  useEffect(() => {
    if (value === display) return
    from.current = display
    start.current = 0
    const dur = 620
    const step = (t: number) => {
      if (!start.current) start.current = t
      const p = Math.min(1, (t - start.current) / dur)
      const eased = 1 - Math.pow(1 - p, 3)
      setDisplay(Math.round(from.current + (value - from.current) * eased))
      if (p < 1) raf.current = requestAnimationFrame(step)
    }
    raf.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return <span className={cx('tabular', className)}>{display.toLocaleString('tr-TR')}</span>
}

/* ------------------------------------------------------------------ */
/* Modal                                                               */
/* ------------------------------------------------------------------ */

export function Modal({
  open,
  onClose,
  children,
  title,
  wide,
  hideClose,
}: {
  open: boolean
  onClose: () => void
  children: ReactNode
  title?: string
  wide?: boolean
  hideClose?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const titleId = useId()

  useEffect(() => {
    if (!open) return
    const prev = document.activeElement as HTMLElement | null
    const el = ref.current
    const focusables = () =>
      Array.from(
        el?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((n) => n.offsetParent !== null)

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key !== 'Tab') return
      const list = focusables()
      if (!list.length) return
      const first = list[0]
      const last = list[list.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKey)
    const t = window.setTimeout(() => focusables()[0]?.focus(), 60)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKey)
      window.clearTimeout(t)
      document.body.style.overflow = overflow
      prev?.focus?.()
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} aria-hidden />
          <motion.div
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            initial={{ opacity: 0, y: 22, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className={cx(
              'surface grain relative z-10 max-h-[86vh] w-full overflow-y-auto p-6 sm:p-7',
              wide ? 'max-w-2xl' : 'max-w-md',
            )}
          >
            {title && (
              <h2 id={titleId} className="display mb-4 pr-8 text-2xl">
                {title}
              </h2>
            )}
            {!hideClose && (
              <button
                onClick={onClose}
                aria-label="Kapat"
                className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full text-ink-mute transition-colors hover:bg-white/10 hover:text-ink"
              >
                <X size={18} />
              </button>
            )}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ------------------------------------------------------------------ */
/* Kucuk parcalar                                                      */
/* ------------------------------------------------------------------ */

export function Chip({
  children,
  active,
  onClick,
  tone,
}: {
  children: ReactNode
  active?: boolean
  onClick?: () => void
  tone?: string
}) {
  return (
    <button
      onClick={onClick}
      onPointerEnter={() => audio.play('hover')}
      className={cx(
        'h-9 shrink-0 rounded-full border px-3.5 text-[13px] font-medium transition-all duration-200',
        active
          ? 'border-accent/60 bg-accent/15 text-accent'
          : 'border-line/70 bg-bg-2/40 text-ink-dim hover:border-line hover:text-ink',
      )}
      style={active && tone ? { borderColor: tone, color: tone, background: `${tone}22` } : undefined}
    >
      {children}
    </button>
  )
}

export const rarityVar: Record<Rarity, string> = {
  common: 'rgb(var(--r-common))',
  uncommon: 'rgb(var(--r-uncommon))',
  rare: 'rgb(var(--r-rare))',
  epic: 'rgb(var(--r-epic))',
  legendary: 'rgb(var(--r-legendary))',
  secret: 'rgb(var(--r-secret))',
}

export function RarityTag({ rarity, label }: { rarity: Rarity; label: string }) {
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]"
      style={{ color: rarityVar[rarity], background: `color-mix(in srgb, ${rarityVar[rarity]} 14%, transparent)` }}
    >
      {label}
    </span>
  )
}

export function StatTile({
  label,
  value,
  sub,
  icon,
}: {
  label: string
  value: ReactNode
  sub?: string
  icon?: ReactNode
}) {
  return (
    <div className="surface-flat p-4">
      <div className="flex items-center gap-2">
        {icon && <span className="text-ink-mute">{icon}</span>}
        <span className="label-xs">{label}</span>
      </div>
      <div className="display mt-2 text-2xl leading-none">{value}</div>
      {sub && <div className="mt-1.5 text-xs text-ink-mute">{sub}</div>}
    </div>
  )
}

export function EmptyState({ glyph, title, body }: { glyph: string; title: string; body: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-line/70 px-6 py-14 text-center">
      <div className="mb-4 text-4xl text-ink-mute/50" aria-hidden>
        {glyph}
      </div>
      <p className="display text-lg">{title}</p>
      <p className="mt-1.5 max-w-xs text-sm text-ink-mute">{body}</p>
    </div>
  )
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <h2 className="display text-xl sm:text-2xl">{children}</h2>
      {action}
    </div>
  )
}
