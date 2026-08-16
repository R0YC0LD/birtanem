import type { DailyQuestState, GameId, Stats } from '../types'
import { hashString, mulberry32 } from '../utils'

/**
 * Gunluk gorevler.
 * Gorevler kumulatif sayaclar uzerinden calisir: gorev olusturulurken sayacin
 * o anki degeri `base` olarak saklanir, ilerleme = stat - base.
 * Bu yuzden sadece "artan" sayaclar kullanilabilir (max/min sayaclar degil).
 */

export interface QuestTemplate {
  id: string
  stat: keyof Stats
  target: number
  label: (target: number) => string
  xp: number
  kisses: number
  /** Bu gorev sadece ilgili oyun aciksa verilir */
  requiresGame?: GameId
}

export const DAILY_SET_BONUS = { xp: 110, kisses: 32 }
export const DAILY_QUEST_COUNT = 3

export const questTemplates: QuestTemplate[] = [
  {
    id: 'q-play3',
    stat: 'gamesPlayed',
    target: 3,
    label: (t) => `${t} oyun tamamla`,
    xp: 55,
    kisses: 14,
  },
  {
    id: 'q-play6',
    stat: 'gamesPlayed',
    target: 6,
    label: (t) => `${t} oyun tamamla`,
    xp: 90,
    kisses: 24,
  },
  {
    id: 'q-xp',
    stat: 'totalXpEarned',
    target: 450,
    label: (t) => `Bugün ${t} XP kazan`,
    xp: 70,
    kisses: 18,
  },
  {
    id: 'q-kiss',
    stat: 'lifetimeKisses',
    target: 130,
    label: (t) => `Bugün ${t} öpücük kazan`,
    xp: 65,
    kisses: 20,
  },
  {
    id: 'q-time',
    stat: 'playtimeMs',
    target: 600_000,
    label: () => `10 dakika oyna`,
    xp: 60,
    kisses: 16,
  },
  {
    id: 'q-hearts',
    stat: 'hhHearts',
    target: 130,
    label: (t) => `Kalp Avcısı’nda ${t} kalp topla`,
    xp: 60,
    kisses: 16,
    requiresGame: 'heart-hunter',
  },
  {
    id: 'q-hearts-big',
    stat: 'hhHearts',
    target: 280,
    label: (t) => `Kalp Avcısı’nda ${t} kalp topla`,
    xp: 95,
    kisses: 26,
    requiresGame: 'heart-hunter',
  },
  {
    id: 'q-golden',
    stat: 'hhGolden',
    target: 12,
    label: (t) => `${t} altın kalp yakala`,
    xp: 70,
    kisses: 20,
    requiresGame: 'heart-hunter',
  },
  {
    id: 'q-memory',
    stat: 'memPlays',
    target: 3,
    label: (t) => `Memory of Us’u ${t} kez bitir`,
    xp: 60,
    kisses: 16,
    requiresGame: 'memory',
  },
  {
    id: 'q-matches',
    stat: 'memTotalMatches',
    target: 45,
    label: (t) => `${t} kart eşleştirmesi yap`,
    xp: 65,
    kisses: 18,
    requiresGame: 'memory',
  },
  {
    id: 'q-rush',
    stat: 'krHits',
    target: 70,
    label: (t) => `Öpücük Rush’ta ${t} isabet yap`,
    xp: 60,
    kisses: 16,
    requiresGame: 'kiss-rush',
  },
  {
    id: 'q-rush-plays',
    stat: 'krPlays',
    target: 3,
    label: (t) => `Öpücük Rush’ı ${t} kez oyna`,
    xp: 55,
    kisses: 14,
    requiresGame: 'kiss-rush',
  },
  {
    id: 'q-stars',
    stat: 'scStars',
    target: 160,
    label: (t) => `${t} yıldız topla`,
    xp: 70,
    kisses: 18,
    requiresGame: 'star-catcher',
  },
  {
    id: 'q-stars-gold',
    stat: 'scGolden',
    target: 10,
    label: (t) => `${t} altın yıldız yakala`,
    xp: 75,
    kisses: 20,
    requiresGame: 'star-catcher',
  },
  {
    id: 'q-perfect',
    stat: 'ptPerfects',
    target: 28,
    label: (t) => `${t} perfect yap`,
    xp: 75,
    kisses: 20,
    requiresGame: 'perfect-timing',
  },
  {
    id: 'q-dodge-hearts',
    stat: 'ldHearts',
    target: 70,
    label: (t) => `Love Dodge’da ${t} kalp topla`,
    xp: 70,
    kisses: 18,
    requiresGame: 'love-dodge',
  },
  {
    id: 'q-puzzle',
    stat: 'pzSolved',
    target: 2,
    label: (t) => `${t} bulmaca çöz`,
    xp: 80,
    kisses: 22,
    requiresGame: 'love-puzzle',
  },
  {
    id: 'q-find',
    stat: 'fsObjects',
    target: 24,
    label: (t) => `${t} gizli obje bul`,
    xp: 75,
    kisses: 20,
    requiresGame: 'find-secret',
  },
  {
    id: 'q-snake',
    stat: 'snPlays',
    target: 3,
    label: (t) => `Love Snake’i ${t} kez oyna`,
    xp: 65,
    kisses: 18,
    requiresGame: 'love-snake',
  },
  {
    id: 'q-const',
    stat: 'cnSolved',
    target: 6,
    label: (t) => `Constellation’da ${t} tur bitir`,
    xp: 75,
    kisses: 20,
    requiresGame: 'constellation',
  },
]

/**
 * Belirli bir gun icin 3 gorev uretir. Ayni gun icin ayni sonucu verir.
 */
export function generateDailyQuests(
  date: string,
  stats: Stats,
  unlockedGames: GameId[],
): DailyQuestState[] {
  const rng = mulberry32(hashString(date))
  const pool = questTemplates.filter((t) => !t.requiresGame || unlockedGames.includes(t.requiresGame))

  // Ayni stat'i iki kez secmemek icin filtreleyerek ilerle
  const chosen: QuestTemplate[] = []
  const usedStats = new Set<string>()
  const candidates = pool.slice()

  while (chosen.length < DAILY_QUEST_COUNT && candidates.length > 0) {
    const idx = Math.floor(rng() * candidates.length)
    const t = candidates.splice(idx, 1)[0]
    if (usedStats.has(t.stat as string)) continue
    usedStats.add(t.stat as string)
    chosen.push(t)
  }

  // Havuz kucukse (cok az oyun acik) tekrar kullanmaya izin ver
  let guard = 0
  while (chosen.length < DAILY_QUEST_COUNT && guard++ < 20) {
    const t = pool[Math.floor(rng() * pool.length)]
    if (t && !chosen.includes(t)) chosen.push(t)
  }

  return chosen.map((t, i) => ({
    id: `${date}-${t.id}-${i}`,
    templateId: t.id,
    label: t.label(t.target),
    stat: t.stat,
    base: (stats[t.stat] as number) ?? 0,
    target: t.target,
    xp: t.xp,
    kisses: t.kisses,
    claimed: false,
  }))
}

export function questProgress(q: DailyQuestState, stats: Stats): number {
  const cur = (stats[q.stat] as number) ?? 0
  return Math.max(0, cur - q.base)
}

export function isQuestComplete(q: DailyQuestState, stats: Stats): boolean {
  return questProgress(q, stats) >= q.target
}

/* ------------------------------------------------------------------ */
/* Gunluk seri odulleri                                                */
/* ------------------------------------------------------------------ */

/** 7 gunluk dongu; 7. gun sonrasi dongu bastan baslar ama seri sayaci artmaya devam eder. */
export const streakCycle = [5, 8, 11, 14, 18, 24, 35]

export function streakRewardFor(cycleIndex: number): number {
  return streakCycle[Math.min(cycleIndex, streakCycle.length - 1)]
}
