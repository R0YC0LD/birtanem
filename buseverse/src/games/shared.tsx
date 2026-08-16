import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { cx } from '../utils'

/* ------------------------------------------------------------------ */
/* Canvas yardimcilari                                                 */
/* ------------------------------------------------------------------ */

export interface CanvasCtx {
  ctx: CanvasRenderingContext2D
  w: number
  h: number
}

/** Canvas'i DPR'a gore olceklendirir; dondurdugu fonksiyon boyutlari yeniler. */
export function fitCanvas(canvas: HTMLCanvasElement): CanvasCtx | null {
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  const rect = canvas.getBoundingClientRect()
  const dpr = Math.min(2, window.devicePixelRatio || 1)
  const w = Math.max(1, Math.floor(rect.width))
  const h = Math.max(1, Math.floor(rect.height))
  canvas.width = Math.floor(w * dpr)
  canvas.height = Math.floor(h * dpr)
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  return { ctx, w, h }
}

/** Canvas uzerindeki pointer konumunu CSS pikseline cevirir. */
export function pointerPos(canvas: HTMLCanvasElement, e: PointerEvent | MouseEvent | Touch) {
  const rect = canvas.getBoundingClientRect()
  return { x: e.clientX - rect.left, y: e.clientY - rect.top }
}

/* ------------------------------------------------------------------ */
/* HUD                                                                 */
/* ------------------------------------------------------------------ */

export function GameHud({
  left,
  center,
  right,
}: {
  left?: ReactNode
  center?: ReactNode
  right?: ReactNode
}) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-3 p-3.5">
      <div className="min-w-0">{left}</div>
      <div className="shrink-0">{center}</div>
      <div className="min-w-0 text-right">{right}</div>
    </div>
  )
}

export function HudStat({ label, value, tone }: { label: string; value: ReactNode; tone?: string }) {
  return (
    <div className="rounded-md border border-line/60 bg-bg-0/70 px-3 py-1.5 backdrop-blur-md">
      <p className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-ink-mute">{label}</p>
      <p className={cx('tabular display text-lg leading-tight', tone)}>{value}</p>
    </div>
  )
}

/** Kalan sureyi gosteren ince cubuk. */
export function TimeBar({ value }: { value: number }) {
  return (
    <div className="absolute inset-x-0 top-0 z-20 h-1 bg-bg-3/60">
      <div
        className="h-full bg-accent transition-[width] duration-200 ease-linear"
        style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Geri sayim                                                          */
/* ------------------------------------------------------------------ */

export function useCountdown(from = 3, onDone?: () => void) {
  const [n, setN] = useState(from)
  const doneRef = useRef(onDone)
  doneRef.current = onDone

  useEffect(() => {
    if (n <= 0) {
      doneRef.current?.()
      return
    }
    const t = window.setTimeout(() => setN((v) => v - 1), 700)
    return () => window.clearTimeout(t)
  }, [n])

  return n
}

export function CountdownOverlay({ n }: { n: number }) {
  if (n <= 0) return null
  return (
    <div className="absolute inset-0 z-30 grid place-items-center bg-bg-0/70 backdrop-blur-sm">
      <motion.span
        key={n}
        initial={{ scale: 1.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.6, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 20 }}
        className="display text-7xl text-accent"
      >
        {n}
      </motion.span>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Combo gostergesi                                                    */
/* ------------------------------------------------------------------ */

export function ComboBadge({ combo, mult }: { combo: number; mult: number }) {
  if (combo < 2) return null
  const intensity = Math.min(1, combo / 30)
  return (
    <motion.div
      key={Math.floor(combo / 5)}
      initial={{ scale: 0.7, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="pointer-events-none absolute left-1/2 top-16 z-10 -translate-x-1/2 text-center"
    >
      <motion.p
        className="display leading-none text-gold"
        animate={{ scale: [1, 1.12, 1] }}
        transition={{ duration: 0.34 }}
        style={{
          fontSize: `${22 + intensity * 26}px`,
          textShadow: `0 0 ${8 + intensity * 26}px rgb(var(--gold) / ${0.35 + intensity * 0.5})`,
        }}
      >
        x{mult}
      </motion.p>
      <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-gold/70">
        {combo} combo
      </p>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/* Yuzen puan yazilari (canvas ustu DOM, sayisi sinirli)               */
/* ------------------------------------------------------------------ */

export interface Pop {
  id: number
  x: number
  y: number
  text: string
  color: string
}

export function PopLayer({ pops }: { pops: Pop[] }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
      {pops.map((p) => (
        <motion.span
          key={p.id}
          initial={{ opacity: 1, y: 0, scale: 0.85 }}
          animate={{ opacity: 0, y: -46, scale: 1.15 }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          className="display absolute text-lg font-semibold"
          style={{ left: p.x, top: p.y, color: p.color, transform: 'translate(-50%,-50%)' }}
        >
          {p.text}
        </motion.span>
      ))}
    </div>
  )
}

/** Sinirli sayida pop tutan kucuk yardimci. */
export function usePops(limit = 12) {
  const [pops, setPops] = useState<Pop[]>([])
  const idRef = useRef(0)
  const timers = useRef<number[]>([])

  useEffect(
    () => () => {
      timers.current.forEach((t) => window.clearTimeout(t))
      timers.current = []
    },
    [],
  )

  const push = (x: number, y: number, text: string, color = 'rgb(var(--ink))') => {
    const id = ++idRef.current
    setPops((prev) => [...prev.slice(-(limit - 1)), { id, x, y, text, color }])
    const t = window.setTimeout(() => setPops((prev) => prev.filter((p) => p.id !== id)), 780)
    timers.current.push(t)
  }

  return { pops, push }
}

/* ------------------------------------------------------------------ */
/* Ortak alan                                                          */
/* ------------------------------------------------------------------ */

export function GameArea({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cx('relative h-full w-full select-none overflow-hidden', className)}>{children}</div>
  )
}

/** Oyun bittiginde kisa bir "bitiyor" ekrani gostermek icin. */
export function FinishFlash({ show }: { show: boolean }) {
  if (!show) return null
  return (
    <motion.div
      className="pointer-events-none absolute inset-0 z-40 bg-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 0.5, 0] }}
      transition={{ duration: 0.45 }}
    />
  )
}
