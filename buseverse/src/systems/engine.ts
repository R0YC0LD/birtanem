import type { LevelUpPayload, SaveData, Stats } from '../types'
import { achievementById, achievements, achievementsByFlag, statAchievements, TOTAL_ACHIEVEMENTS } from '../data/achievements'
import { collectibles, TOTAL_COLLECTIBLES } from '../data/collectibles'
import { MAX_LEVEL, OVERFLOW_XP_PER_KISS, levelRewards, titleForLevel, xpForLevel } from '../data/levels'
import { messageById } from '../data/messages'

/**
 * Merkezi ilerleme motoru.
 *
 * Butun odul akisi buradan gecer. Amac:
 *  - odullerin iki kez verilmemesi,
 *  - zincirleme aciliislarin (basarim -> XP -> level -> odul -> basarim) dogru islemesi,
 *  - UI'nin sadece "ne oldu" listesini alip gostermesi.
 *
 * Fonksiyonlar SaveData "draft"i uzerinde yerinde calisir; store draft'i
 * kopyalayip verir, sonuc olarak yeni state'i set eder.
 */

export interface EngineOutcome {
  unlockedAchievements: string[]
  unlockedCollectibles: string[]
  unlockedMessages: string[]
  levelUp: LevelUpPayload | null
  xpGained: number
  kissesGained: number
  keysGained: number
  secretRoomJustOpened: boolean
}

export function createOutcome(): EngineOutcome {
  return {
    unlockedAchievements: [],
    unlockedCollectibles: [],
    unlockedMessages: [],
    levelUp: null,
    xpGained: 0,
    kissesGained: 0,
    keysGained: 0,
    secretRoomJustOpened: false,
  }
}

export const SECRET_KEYS_REQUIRED = 3

/* ------------------------------------------------------------------ */
/* Turetilmis istatistikler                                            */
/* ------------------------------------------------------------------ */

export function syncDerived(d: SaveData) {
  const s = d.stats
  s.level = d.level
  s.kisses = d.kisses
  s.achievementsUnlocked = Object.keys(d.achievements).length
  s.collectiblesFound = Object.keys(d.collectibles).length
  s.themesOwned = d.ownedThemes.length
  s.titlesOwned = d.ownedTitles.length
  s.messagesUnlocked = d.unlockedMessages.length
  s.distinctGamesPlayed = Object.keys(d.plays).length
  s.currentStreak = d.streak.count
  s.bestStreak = Math.max(s.bestStreak, d.streak.count)
  s.secretsFound = Object.keys(d.flags).filter((f) => f.startsWith('secret-') || f.startsWith('special-')).length
}

/* ------------------------------------------------------------------ */
/* Odul verme                                                          */
/* ------------------------------------------------------------------ */

export function addKisses(d: SaveData, amount: number, out: EngineOutcome) {
  const n = Math.max(0, Math.round(amount))
  if (n === 0) return
  d.kisses += n
  d.stats.lifetimeKisses += n
  out.kissesGained += n
}

export function spendKisses(d: SaveData, amount: number): boolean {
  const n = Math.max(0, Math.round(amount))
  if (d.kisses < n) return false
  d.kisses -= n
  d.stats.kissesSpent += n
  return true
}

export function addXp(d: SaveData, amount: number, out: EngineOutcome) {
  const n = Math.max(0, Math.round(amount))
  if (n === 0) return
  d.stats.totalXpEarned += n
  out.xpGained += n

  const startLevel = d.level
  d.xp += n

  const gainedRewards: { icon: string; label: string }[] = []
  let kissesFromLevels = 0

  while (d.level < MAX_LEVEL) {
    const need = xpForLevel(d.level)
    if (d.xp < need) break
    d.xp -= need
    d.level += 1
    // Bu levelin odullerini uygula
    const rewards = levelRewards[d.level] ?? []
    for (const r of rewards) {
      gainedRewards.push({ icon: r.icon, label: r.label })
      if (r.kisses) {
        addKisses(d, r.kisses, out)
        kissesFromLevels += r.kisses
      }
      if (r.message) unlockMessage(d, r.message, out)
      if (r.theme && !d.ownedThemes.includes(r.theme)) d.ownedThemes.push(r.theme)
      if (r.frame && !d.ownedFrames.includes(r.frame)) d.ownedFrames.push(r.frame)
      if (r.trail && !d.ownedTrails.includes(r.trail)) d.ownedTrails.push(r.trail)
      if (r.collectible) unlockCollectible(d, r.collectible, out)
      if (r.secretKey) grantSecretKey(d, out)
    }
  }

  // Max levelde artan XP opucuge donusur — XP bosa gitmez.
  if (d.level >= MAX_LEVEL && d.xp > 0) {
    const converted = Math.floor(d.xp / OVERFLOW_XP_PER_KISS)
    if (converted > 0) {
      d.xp -= converted * OVERFLOW_XP_PER_KISS
      addKisses(d, converted, out)
    }
  }

  if (d.level > startLevel) {
    if (out.levelUp) {
      // Ayni islemde ikinci kez level atlandiysa tek modalde birlestir
      out.levelUp.to = d.level
      out.levelUp.title = titleForLevel(d.level)
      out.levelUp.rewards.push(...gainedRewards)
      out.levelUp.kisses += kissesFromLevels
    } else {
      out.levelUp = {
        from: startLevel,
        to: d.level,
        title: titleForLevel(d.level),
        rewards: gainedRewards,
        kisses: kissesFromLevels,
      }
    }
  }
}

export function unlockMessage(d: SaveData, id: string, out: EngineOutcome) {
  if (!messageById.has(id)) return
  if (d.unlockedMessages.includes(id)) return
  d.unlockedMessages.push(id)
  out.unlockedMessages.push(id)
}

export function unlockCollectible(d: SaveData, id: string, out: EngineOutcome) {
  if (d.collectibles[id]) return
  d.collectibles[id] = Date.now()
  out.unlockedCollectibles.push(id)
}

export function grantSecretKey(d: SaveData, out: EngineOutcome) {
  d.secretKeys += 1
  out.keysGained += 1
  if (!d.secretRoomUnlocked && d.secretKeys >= SECRET_KEYS_REQUIRED) {
    d.secretRoomUnlocked = true
    out.secretRoomJustOpened = true
    setFlag(d, 'secret-room', out)
  }
}

/* ------------------------------------------------------------------ */
/* Bayraklar & basarim acma                                            */
/* ------------------------------------------------------------------ */

export function setFlag(d: SaveData, flag: string, out: EngineOutcome): boolean {
  if (d.flags[flag]) return false
  d.flags[flag] = true
  const list = achievementsByFlag.get(flag)
  if (list) {
    for (const a of list) unlockAchievement(d, a.id, out)
  }
  return true
}

/**
 * Basarimi acar. Zaten aciksa hicbir sey yapmaz — odul asla iki kez verilmez.
 */
export function unlockAchievement(d: SaveData, id: string, out: EngineOutcome): boolean {
  if (d.achievements[id]) return false
  const def = achievementById.get(id)
  if (!def) return false

  d.achievements[id] = { unlockedAt: Date.now(), progress: def.target ?? 1 }
  out.unlockedAchievements.push(id)

  addXp(d, def.xp, out)
  addKisses(d, def.kisses, out)
  if (def.grantsKey) grantSecretKey(d, out)
  return true
}

/* ------------------------------------------------------------------ */
/* Degerlendirme dongusu                                               */
/* ------------------------------------------------------------------ */

function statSatisfied(value: number, target: number, cmp: 'gte' | 'lte'): boolean {
  if (cmp === 'lte') return value > 0 && value <= target
  return value >= target
}

/** stat tabanli basarimlari ve koleksiyon aciliislarini tarar. */
function evaluateOnce(d: SaveData, out: EngineOutcome): boolean {
  let changed = false
  syncDerived(d)

  for (const a of statAchievements) {
    if (d.achievements[a.id]) continue
    const value = (d.stats[a.stat as keyof Stats] as number) ?? 0
    if (statSatisfied(value, a.target!, a.cmp ?? 'gte')) {
      if (unlockAchievement(d, a.id, out)) changed = true
    }
  }

  for (const c of collectibles) {
    if (d.collectibles[c.id]) continue
    let ok = false
    if (c.stat && c.target !== undefined) {
      ok = ((d.stats[c.stat] as number) ?? 0) >= c.target
    }
    if (!ok && c.level !== undefined) ok = d.level >= c.level
    if (!ok && c.flag) ok = !!d.flags[c.flag]
    if (ok) {
      unlockCollectible(d, c.id, out)
      changed = true
    }
  }

  return changed
}

/**
 * Zincirleme aciliislar durana kadar degerlendirir.
 * (basarim -> XP -> level -> odul -> yeni basarim ...)
 */
export function runEngine(d: SaveData, out: EngineOutcome) {
  let guard = 0
  while (evaluateOnce(d, out) && guard++ < 12) {
    /* devam */
  }
  syncDerived(d)
}

/* ------------------------------------------------------------------ */
/* Ilerleme hesaplari (UI icin)                                        */
/* ------------------------------------------------------------------ */

export function achievementProgress(d: SaveData, id: string): { current: number; target: number } | null {
  const def = achievementById.get(id)
  if (!def || !def.stat || def.target === undefined) return null
  const value = (d.stats[def.stat] as number) ?? 0
  if (def.cmp === 'lte') {
    // "X'in altinda" tipi: mevcut deger hedefe ne kadar yakin
    if (value <= 0) return { current: 0, target: def.target }
    const ratio = Math.min(1, def.target / value)
    return { current: Math.round(ratio * def.target), target: def.target }
  }
  return { current: Math.min(value, def.target), target: def.target }
}

export interface CompletionBreakdown {
  achievements: number
  collection: number
  secrets: number
  level: number
  total: number
}

const SECRET_ACHIEVEMENT_COUNT = achievements.filter((a) => a.category === 'secret').length

/** Agirlikli tamamlanma: basarim %50, koleksiyon %20, sirlar %15, level %15. */
export function completion(d: SaveData): CompletionBreakdown {
  const ach = Object.keys(d.achievements).length / TOTAL_ACHIEVEMENTS
  const col = Object.keys(d.collectibles).length / TOTAL_COLLECTIBLES
  const secretsUnlocked = Object.keys(d.achievements).filter(
    (id) => achievementById.get(id)?.category === 'secret',
  ).length
  const sec = SECRET_ACHIEVEMENT_COUNT ? secretsUnlocked / SECRET_ACHIEVEMENT_COUNT : 0
  const lvl = (d.level - 1) / (MAX_LEVEL - 1)
  return {
    achievements: ach,
    collection: col,
    secrets: sec,
    level: lvl,
    total: ach * 0.5 + col * 0.2 + sec * 0.15 + lvl * 0.15,
  }
}

/* ------------------------------------------------------------------ */
/* Final                                                               */
/* ------------------------------------------------------------------ */

export interface FinaleRequirement {
  label: string
  done: boolean
  current: number
  target: number
}

/** Final esikleri — tek yerden ayarlanir. */
export const FINALE_LEVEL = 45
export const FINALE_ACHIEVEMENT_RATIO = 0.45

/**
 * Final icin dort kosul. Hepsi UI'da kontrol listesi olarak gosteriliyor,
 * boylece oyuncu neyin eksik oldugunu her zaman biliyor.
 */
export function finaleRequirements(d: SaveData): FinaleRequirement[] {
  const achUnlocked = Object.keys(d.achievements).length
  const achTarget = Math.ceil(TOTAL_ACHIEVEMENTS * FINALE_ACHIEVEMENT_RATIO)
  const colUnlocked = Object.keys(d.collectibles).length
  return [
    { label: `Level ${FINALE_LEVEL}`, done: d.level >= FINALE_LEVEL, current: d.level, target: FINALE_LEVEL },
    { label: 'Gizli Oda açık', done: d.secretRoomUnlocked, current: d.secretKeys, target: SECRET_KEYS_REQUIRED },
    { label: 'Koleksiyon 14/16', done: colUnlocked >= 14, current: colUnlocked, target: 14 },
    {
      label: `Başarımların %${Math.round(FINALE_ACHIEVEMENT_RATIO * 100)}'i`,
      done: achUnlocked >= achTarget,
      current: achUnlocked,
      target: achTarget,
    },
  ]
}

export function isFinaleUnlocked(d: SaveData): boolean {
  return finaleRequirements(d).every((r) => r.done)
}
