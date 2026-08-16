import type { SaveData, Stats } from '../types'
import { dayKey } from '../utils/format'
import { DEFAULT_THEME } from '../data/themes'
import { defaultUnlockedMessages } from '../data/messages'

export const SAVE_VERSION = 1
export const SAVE_KEY = 'buseverse:save'

export function createDefaultStats(): Stats {
  return {
    gamesPlayed: 0,
    gamesFailed: 0,
    playtimeMs: 0,
    sessions: 0,
    distinctGamesPlayed: 0,
    totalXpEarned: 0,
    lifetimeKisses: 0,
    kisses: 0,
    kissesSpent: 0,
    achievementsUnlocked: 0,
    secretsFound: 0,
    collectiblesFound: 0,
    shopPurchases: 0,
    dailyQuestsDone: 0,
    dailySetsDone: 0,
    bestStreak: 0,
    currentStreak: 0,
    level: 1,
    themesOwned: 1,
    titlesOwned: 0,
    messagesUnlocked: defaultUnlockedMessages.length,
    nightVisits: 0,
    morningVisits: 0,
    midnightVisits: 0,

    hhPlays: 0,
    hhScore: 0,
    hhHearts: 0,
    hhGolden: 0,
    hhRainbow: 0,
    hhBombs: 0,
    hhBroken: 0,
    hhCombo: 0,
    hhCleanRuns: 0,

    memPlays: 0,
    memBestMovesHard: 0,
    memBestTimeMs: 0,
    memPerfectRuns: 0,
    memHardWins: 0,
    memTotalMatches: 0,

    krPlays: 0,
    krScore: 0,
    krBestMs: 0,
    krAvgMsSum: 0,
    krAvgMsCount: 0,
    krHits: 0,
    krMisses: 0,
    krFlawless: 0,

    scPlays: 0,
    scScore: 0,
    scStars: 0,
    scGolden: 0,
    scShooting: 0,
    scPurple: 0,

    ptPlays: 0,
    ptScore: 0,
    ptPerfects: 0,
    ptBestStreak: 0,
    ptMisses: 0,

    ldPlays: 0,
    ldScore: 0,
    ldBestTimeMs: 0,
    ldHearts: 0,
    ldNearMisses: 0,

    pzPlays: 0,
    pzSolved: 0,
    pzBestMoves5: 0,
    pzBestTimeMs: 0,
    pzHardSolved: 0,

    fsPlays: 0,
    fsSolved: 0,
    fsObjects: 0,
    fsBestTimeMs: 0,
    fsPerfectRuns: 0,

    snPlays: 0,
    snScore: 0,
    snLength: 0,
    snSelfHits: 0,

    cnPlays: 0,
    cnSolved: 0,
    cnPerfect: 0,
    cnBestTimeMs: 0,
  }
}

/** Sistem tercihini oku (SSR/eski tarayici guvenli). */
function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

export function createDefaultSave(): SaveData {
  const now = Date.now()
  return {
    saveVersion: SAVE_VERSION,
    createdAt: now,
    lastSeen: now,
    onboarded: false,

    level: 1,
    xp: 0,
    kisses: 0,

    stats: createDefaultStats(),
    achievements: {},
    flags: {},
    bests: {},
    plays: {},
    todayPlays: {},
    todayPlaysDate: dayKey(),

    collectibles: {},
    purchases: {},
    ownedThemes: [DEFAULT_THEME],
    ownedFrames: ['plain'],
    ownedTrails: ['none'],
    ownedTitles: [],
    unlockedMessages: [...defaultUnlockedMessages],
    secretKeys: 0,
    secretRoomUnlocked: false,
    finaleSeen: false,

    activeTheme: DEFAULT_THEME,
    activeTitle: null,
    activeFrame: 'plain',
    activeTrail: 'none',

    daily: { date: '', quests: [], setClaimed: false },
    streak: { count: 0, lastClaim: null, cycleIndex: 0 },

    settings: {
      sfx: true,
      music: false,
      volume: 0.6,
      reducedMotion: prefersReducedMotion(),
      haptics: true,
      customCursor: true,
      screenShake: true,
    },
  }
}

/**
 * Kayitli veriyi varsayilanla birlestirir.
 * Eksik/bozuk alanlar sessizce varsayilana doner — site asla acilmamazlik yapmaz.
 */
function merge(loaded: unknown): SaveData {
  const base = createDefaultSave()
  if (!loaded || typeof loaded !== 'object') return base
  const raw = loaded as Partial<SaveData>

  const stats = { ...base.stats }
  if (raw.stats && typeof raw.stats === 'object') {
    for (const key of Object.keys(stats) as (keyof Stats)[]) {
      const v = (raw.stats as unknown as Record<string, unknown>)[key as string]
      if (typeof v === 'number' && Number.isFinite(v)) stats[key] = v
    }
  }

  const settings = { ...base.settings }
  if (raw.settings && typeof raw.settings === 'object') {
    const rs = raw.settings as Record<string, unknown>
    for (const key of Object.keys(settings) as (keyof SaveData['settings'])[]) {
      const v = rs[key]
      if (key === 'volume') {
        if (typeof v === 'number' && Number.isFinite(v)) settings.volume = Math.min(1, Math.max(0, v))
      } else if (typeof v === 'boolean') {
        ;(settings as Record<string, boolean | number>)[key] = v
      }
    }
  }

  return {
    ...base,
    ...raw,
    saveVersion: SAVE_VERSION,
    createdAt: typeof raw.createdAt === 'number' ? raw.createdAt : base.createdAt,
    level: clampInt(raw.level, 1, 50, 1),
    xp: Math.max(0, numberOr(raw.xp, 0)),
    kisses: Math.max(0, numberOr(raw.kisses, 0)),
    secretKeys: Math.max(0, numberOr(raw.secretKeys, 0)),
    stats,
    settings,
    achievements: isRecord(raw.achievements) ? (raw.achievements as SaveData['achievements']) : {},
    flags: isRecord(raw.flags) ? (raw.flags as SaveData['flags']) : {},
    bests: isRecord(raw.bests) ? (raw.bests as SaveData['bests']) : {},
    plays: isRecord(raw.plays) ? (raw.plays as SaveData['plays']) : {},
    todayPlays: isRecord(raw.todayPlays) ? (raw.todayPlays as Record<string, number>) : {},
    collectibles: isRecord(raw.collectibles) ? (raw.collectibles as Record<string, number>) : {},
    purchases: isRecord(raw.purchases) ? (raw.purchases as SaveData['purchases']) : {},
    ownedThemes: mergeList(raw.ownedThemes, base.ownedThemes),
    ownedFrames: mergeList(raw.ownedFrames, base.ownedFrames),
    ownedTrails: mergeList(raw.ownedTrails, base.ownedTrails),
    ownedTitles: mergeList(raw.ownedTitles, base.ownedTitles),
    unlockedMessages: Array.isArray(raw.unlockedMessages)
      ? Array.from(new Set([...defaultUnlockedMessages, ...raw.unlockedMessages.filter((m) => typeof m === 'string')]))
      : [...defaultUnlockedMessages],
    daily:
      raw.daily && typeof raw.daily === 'object' && Array.isArray(raw.daily.quests)
        ? { date: String(raw.daily.date ?? ''), quests: raw.daily.quests, setClaimed: !!raw.daily.setClaimed }
        : base.daily,
    streak:
      raw.streak && typeof raw.streak === 'object'
        ? {
            count: Math.max(0, numberOr(raw.streak.count, 0)),
            lastClaim: typeof raw.streak.lastClaim === 'string' ? raw.streak.lastClaim : null,
            cycleIndex: Math.max(0, numberOr(raw.streak.cycleIndex, 0)),
          }
        : base.streak,
  }
}

function mergeList(raw: unknown, base: string[]): string[] {
  if (!Array.isArray(raw)) return [...base]
  const clean = raw.filter((x): x is string => typeof x === 'string')
  return Array.from(new Set([...base, ...clean]))
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v)
}
function numberOr(v: unknown, fallback: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback
}
function clampInt(v: unknown, min: number, max: number, fallback: number): number {
  const n = numberOr(v, fallback)
  return Math.min(max, Math.max(min, Math.round(n)))
}

/* ------------------------------------------------------------------ */
/* Migrasyonlar                                                        */
/* ------------------------------------------------------------------ */

/**
 * Ileride save semasi degistiginde buraya adim eklenir.
 * Ornek: if (data.saveVersion < 2) { ...; data.saveVersion = 2 }
 */
function migrate(data: Record<string, unknown>): Record<string, unknown> {
  const version = typeof data.saveVersion === 'number' ? data.saveVersion : 0
  if (version < 1) {
    data.saveVersion = 1
  }
  return data
}

/* ------------------------------------------------------------------ */
/* IO                                                                  */
/* ------------------------------------------------------------------ */

export function loadSave(): { save: SaveData; recovered: boolean; fresh: boolean } {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return { save: createDefaultSave(), recovered: false, fresh: true }
    const parsed = migrate(JSON.parse(raw) as Record<string, unknown>)
    return { save: merge(parsed), recovered: false, fresh: false }
  } catch (err) {
    console.warn('[buseverse] Kayıt okunamadı, yedeğe düşülüyor.', err)
    try {
      const broken = localStorage.getItem(SAVE_KEY)
      if (broken) localStorage.setItem(`${SAVE_KEY}:broken:${Date.now()}`, broken)
    } catch {
      /* depolama tamamen kapaliysa sessizce devam */
    }
    return { save: createDefaultSave(), recovered: true, fresh: true }
  }
}

let writeTimer: number | undefined

/** Debounce'lu yazma — sik state degisimlerinde localStorage'i bogmaz. */
export function persist(save: SaveData) {
  if (writeTimer) window.clearTimeout(writeTimer)
  writeTimer = window.setTimeout(() => {
    writeNow(save)
  }, 400)
}

export function writeNow(save: SaveData) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save))
  } catch (err) {
    console.warn('[buseverse] Kayıt yazılamadı.', err)
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(SAVE_KEY)
  } catch {
    /* yok say */
  }
}
