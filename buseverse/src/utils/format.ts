export function formatNumber(n: number): string {
  return Math.round(n).toLocaleString('tr-TR')
}

export function formatMs(ms: number): string {
  if (!Number.isFinite(ms)) return '—'
  const total = Math.max(0, Math.round(ms / 100) / 10)
  if (total < 60) return `${total.toFixed(1)}s`
  const m = Math.floor(total / 60)
  const s = Math.round(total % 60)
  return `${m}dk ${String(s).padStart(2, '0')}s`
}

export function formatPlaytime(ms: number): string {
  const totalMin = Math.floor(ms / 60000)
  if (totalMin < 1) return `${Math.max(0, Math.floor(ms / 1000))} sn`
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (h === 0) return `${m} dk`
  return `${h} sa ${m} dk`
}

export function formatPercent(v: number, digits = 0): string {
  return `${(v * 100).toFixed(digits)}%`
}

/** YYYY-MM-DD (yerel saat) */
export function dayKey(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function daysBetween(a: string, b: string): number {
  const da = new Date(`${a}T00:00:00`)
  const db = new Date(`${b}T00:00:00`)
  return Math.round((db.getTime() - da.getTime()) / 86400000)
}

export function formatDate(ts: number): string {
  if (!ts) return '—'
  return new Date(ts).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
}
