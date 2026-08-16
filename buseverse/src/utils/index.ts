export * from './format'

export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t

export function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function randFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

export function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Deterministik pseudo-random (gunluk gorevler icin tohumlanabilir). */
export function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function hashString(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function uid(prefix = 'id'): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export const cx = (...parts: (string | false | null | undefined)[]) =>
  parts.filter(Boolean).join(' ')

/** requestAnimationFrame tabanli, temizligi garantili dongu. */
export function createLoop(step: (dt: number, now: number) => void) {
  let raf = 0
  let last = 0
  let running = false

  const tick = (now: number) => {
    if (!running) return
    const dt = last ? Math.min(64, now - last) : 16
    last = now
    step(dt, now)
    raf = requestAnimationFrame(tick)
  }

  return {
    start() {
      if (running) return
      running = true
      last = 0
      raf = requestAnimationFrame(tick)
    },
    stop() {
      running = false
      if (raf) cancelAnimationFrame(raf)
      raf = 0
    },
    get running() {
      return running
    },
  }
}
