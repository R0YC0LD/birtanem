/**
 * Level / XP progression.
 *
 * Egri tasarimi:
 *   xpForLevel(n) = 90 + 16n + 0.55n^2
 *
 * Neden lineer degil: ilk levellar tek oyunla geciliyor (L1->2 = 107 XP,
 * ortalama bir oyun ~90-130 XP veriyor), 20'den sonra level basi 600+ XP
 * gerekiyor, 40+ ise achievement ve high-score avciligina bagli hale geliyor.
 * Level 50'ye toplam ~46.000 XP gerekiyor; bu bilincli olarak "aylar suren"
 * degil "hafta(lar) suren" bir endgame.
 */

import type { LevelReward } from './rewards'
import { levelRewards } from './rewards'

export const MAX_LEVEL = 50

/** Belirtilen levelden bir sonrakine gecmek icin gereken XP. */
export function xpForLevel(level: number): number {
  if (level >= MAX_LEVEL) return Infinity
  return Math.round(90 + 16 * level + 0.55 * level * level)
}

/** Level 1'den verilen levele kadar harcanan toplam XP. */
export function cumulativeXp(level: number): number {
  let total = 0
  for (let i = 1; i < level; i++) total += xpForLevel(i)
  return total
}

/** Max levelde biriken fazla XP'nin opucuge donusum orani. */
export const OVERFLOW_XP_PER_KISS = 25

/* ------------------------------------------------------------------ */
/* Unvanlar                                                            */
/* ------------------------------------------------------------------ */

interface TitleTier {
  level: number
  title: string
}

const titleTiers: TitleTier[] = [
  { level: 1, title: 'Yeni Gelen' },
  { level: 2, title: 'Meraklı' },
  { level: 4, title: 'Öpücük Avcısı' },
  { level: 6, title: 'Tatlı Bela' },
  { level: 8, title: 'Kalp Kâşifi' },
  { level: 10, title: 'Buseverse Gezgini' },
  { level: 13, title: 'Gece Yıldızcısı' },
  { level: 16, title: 'Sır Toplayıcı' },
  { level: 20, title: 'Öpücük Ustası' },
  { level: 24, title: 'Kalp Muhafızı' },
  { level: 28, title: 'Refleks Cambazı' },
  { level: 32, title: 'Romantik Efsane' },
  { level: 36, title: 'Buseverse Kahramanı' },
  { level: 40, title: 'Kalplerin Sahibi' },
  { level: 44, title: 'Sonsuzluk Koleksiyoncusu' },
  { level: 47, title: 'Efsanevi Buse' },
  { level: 50, title: 'My Favorite Person' },
]

export function titleForLevel(level: number): string {
  let current = titleTiers[0].title
  for (const tier of titleTiers) {
    if (level >= tier.level) current = tier.title
    else break
  }
  return current
}

/** Bu levelde unvan degisti mi? */
export function isTitleLevel(level: number): boolean {
  return titleTiers.some((t) => t.level === level)
}

export function nextTitleTier(level: number): TitleTier | null {
  return titleTiers.find((t) => t.level > level) ?? null
}

export { levelRewards }
export type { LevelReward }

/* ------------------------------------------------------------------ */
/* XP -> level cozumleyici (overflow guvenli)                          */
/* ------------------------------------------------------------------ */

export interface LevelResolution {
  level: number
  xp: number
  levelsGained: number
  /** Max levelde artan XP'den donusen opucuk */
  overflowKisses: number
}

/**
 * Mevcut level+xp uzerine amount XP ekler, gereken kadar level atlatir.
 * Tek seferde birden fazla level atlanabilir; artan XP bir sonraki levele tasinir.
 */
export function applyXp(level: number, xp: number, amount: number): LevelResolution {
  let lv = level
  let cur = xp + Math.max(0, Math.round(amount))
  let gained = 0
  let overflowKisses = 0

  while (lv < MAX_LEVEL) {
    const need = xpForLevel(lv)
    if (cur < need) break
    cur -= need
    lv += 1
    gained += 1
  }

  if (lv >= MAX_LEVEL) {
    overflowKisses = Math.floor(cur / OVERFLOW_XP_PER_KISS)
    cur = cur - overflowKisses * OVERFLOW_XP_PER_KISS
  }

  return { level: lv, xp: cur, levelsGained: gained, overflowKisses }
}

/** Level ilerleme yuzdesi (0..1). */
export function levelProgress(level: number, xp: number): number {
  if (level >= MAX_LEVEL) return 1
  const need = xpForLevel(level)
  return Math.max(0, Math.min(1, xp / need))
}
