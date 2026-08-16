import { create } from 'zustand'
import type {
  Difficulty,
  GameId,
  GameResult,
  LevelUpPayload,
  SaveData,
  ShopItem,
  Stats,
  Toast,
  ViewId,
} from '../types'
import { clearSave, createDefaultSave, loadSave, persist, writeNow } from '../systems/save'
import {
  addKisses as engineAddKisses,
  addXp as engineAddXp,
  createOutcome,
  isFinaleUnlocked,
  runEngine,
  setFlag as engineSetFlag,
  spendKisses as engineSpendKisses,
  syncDerived,
  unlockCollectible as engineUnlockCollectible,
  unlockMessage as engineUnlockMessage,
} from '../systems/engine'
import { games } from '../data/games'
import { DAILY_SET_BONUS, generateDailyQuests, isQuestComplete, streakRewardFor } from '../data/quests'
import { shopItemById } from '../data/shop'
import { applyTheme } from '../data/themes'
import { audio, haptic } from '../systems/audio'
import { dayKey, daysBetween } from '../utils/format'
import { uid } from '../utils'
import { todaysSpecialDate } from '../config/site'
import { achievementById } from '../data/achievements'

/* ------------------------------------------------------------------ */
/* Odul dengesi                                                        */
/* ------------------------------------------------------------------ */

/** Ayni oyunu gun icinde tekrar tekrar oynamanin taban odul carpani. */
const DIMINISH = [1, 1, 1, 0.74, 0.74, 0.55, 0.55, 0.42, 0.42, 0.34]

function diminishFactor(playsToday: number): number {
  return DIMINISH[Math.min(Math.max(0, playsToday), DIMINISH.length - 1)]
}

const DIFFICULTY_MULT: Record<Difficulty, number> = { easy: 0.85, normal: 1, hard: 1.22 }

const NEW_BEST_XP = 45
const NEW_BEST_KISSES = 18

export interface GameRewardBreakdown {
  xp: number
  kisses: number
  newBest: boolean
  diminished: boolean
  factor: number
}

/* ------------------------------------------------------------------ */
/* Runtime state                                                       */
/* ------------------------------------------------------------------ */

export interface Floater {
  id: string
  text: string
  tone: 'xp' | 'kiss' | 'plain'
}

interface RuntimeCounters {
  logoTaps: number
  levelTaps: number
  themeSwaps: number
  brokeAttempts: number
  tabReturns: number
  navSequence: ViewId[]
}

export interface GameStore {
  save: SaveData
  hydrated: boolean

  view: ViewId
  activeGame: GameId | null
  lastResult: (GameResult & { reward: GameRewardBreakdown; unlocked: string[] }) | null

  toasts: Toast[]
  floaters: Floater[]
  achievementQueue: string[]
  levelUp: LevelUpPayload | null
  rewardModal: { title: string; body: string; icon: string; kisses?: number; xp?: number } | null

  counters: RuntimeCounters

  /* --- lifecycle --- */
  hydrate: () => void
  registerVisit: () => void
  addPlaytime: (ms: number) => void

  /* --- navigation --- */
  setView: (v: ViewId) => void
  openGame: (id: GameId) => void
  closeGame: () => void
  clearResult: () => void

  /* --- notifications --- */
  toast: (text: string, tone?: Toast['tone'], icon?: string) => void
  dismissToast: (id: string) => void
  popAchievement: () => void
  dismissLevelUp: () => void
  dismissRewardModal: () => void
  pushFloater: (text: string, tone?: Floater['tone']) => void
  clearFloater: (id: string) => void

  /* --- progression --- */
  awardXp: (amount: number, label?: string) => void
  awardKisses: (amount: number, label?: string) => void
  setFlag: (flag: string) => void
  unlockCollectible: (id: string) => void
  unlockMessage: (id: string) => void
  recordGameResult: (result: GameResult) => void

  /* --- economy --- */
  purchase: (itemId: string) => boolean
  equipTheme: (themeId: string) => void
  equipFrame: (frameId: string) => void
  equipTrail: (trailId: string) => void
  equipTitle: (title: string | null) => void

  /* --- daily --- */
  claimQuest: (questId: string) => void
  claimDailySet: () => void

  /* --- settings --- */
  updateSettings: (patch: Partial<SaveData['settings']>) => void
  resetProgress: () => void
  completeOnboarding: () => void

  /* --- secrets --- */
  tapLogo: () => void
  tapLevelBadge: () => void
  noteNavigation: (v: ViewId) => void
  noteBrokeAttempt: () => void
  noteTabReturn: () => void

  /* --- helpers --- */
  isGameUnlocked: (id: GameId) => boolean
  unlockedGameIds: () => GameId[]
  sfx: (name: Parameters<typeof audio.play>[0]) => void
  buzz: (pattern: number | number[]) => void
}

/* ------------------------------------------------------------------ */

function draft(s: SaveData): SaveData {
  return {
    ...s,
    stats: { ...s.stats },
    achievements: { ...s.achievements },
    flags: { ...s.flags },
    bests: { ...s.bests },
    plays: { ...s.plays },
    todayPlays: { ...s.todayPlays },
    collectibles: { ...s.collectibles },
    purchases: { ...s.purchases },
    ownedThemes: [...s.ownedThemes],
    ownedFrames: [...s.ownedFrames],
    ownedTrails: [...s.ownedTrails],
    ownedTitles: [...s.ownedTitles],
    unlockedMessages: [...s.unlockedMessages],
    daily: { ...s.daily, quests: s.daily.quests.map((q) => ({ ...q })) },
    streak: { ...s.streak },
    settings: { ...s.settings },
  }
}

export const useGame = create<GameStore>()((set, get) => {
  /**
   * Butun state degisiklikleri buradan gecer:
   * draft olustur -> mutasyon -> motoru calistir -> bildirimleri kuyruga al -> kaydet.
   */
  const commit = (fn: (d: SaveData, out: ReturnType<typeof createOutcome>) => void, opts?: { silent?: boolean }) => {
    const state = get()
    const d = draft(state.save)
    const out = createOutcome()
    fn(d, out)
    runEngine(d, out)

    const patch: Partial<GameStore> = { save: d }

    if (!opts?.silent) {
      if (out.unlockedAchievements.length) {
        patch.achievementQueue = [...state.achievementQueue, ...out.unlockedAchievements]
      }
      if (out.levelUp) patch.levelUp = out.levelUp

      const extraToasts: Toast[] = []
      for (const id of out.unlockedCollectibles) {
        extraToasts.push({ id: uid('t'), text: 'Koleksiyona yeni parça eklendi', tone: 'good', icon: '❖' })
        void id
      }
      for (const id of out.unlockedMessages) {
        extraToasts.push({ id: uid('t'), text: 'Yeni bir mesaj açıldı', tone: 'good', icon: '✉' })
        void id
      }
      if (out.secretRoomJustOpened) {
        extraToasts.push({ id: uid('t'), text: 'Gizli Oda açıldı', tone: 'good', icon: '🗝' })
      } else if (out.keysGained > 0) {
        extraToasts.push({
          id: uid('t'),
          text: `Gizli anahtar bulundu (${d.secretKeys}/3)`,
          tone: 'good',
          icon: '🗝',
        })
      }
      if (extraToasts.length) patch.toasts = [...state.toasts, ...extraToasts].slice(-4)
    }

    set(patch as GameStore)
    persist(d)

    if (!opts?.silent) {
      if (out.levelUp) {
        audio.play('levelup')
        haptic([12, 40, 18], d.settings.haptics)
      } else if (out.unlockedAchievements.length) {
        audio.play('achievement')
        haptic(18, d.settings.haptics)
      }
    }
    return out
  }

  return {
    save: createDefaultSave(),
    hydrated: false,
    view: 'home',
    activeGame: null,
    lastResult: null,
    toasts: [],
    floaters: [],
    achievementQueue: [],
    levelUp: null,
    rewardModal: null,
    counters: { logoTaps: 0, levelTaps: 0, themeSwaps: 0, brokeAttempts: 0, tabReturns: 0, navSequence: [] },

    /* ---------------- lifecycle ---------------- */

    hydrate: () => {
      const { save, recovered } = loadSave()
      syncDerived(save)
      applyTheme(save.activeTheme)
      audio.setEnabled(save.settings.sfx)
      audio.setVolume(save.settings.volume)
      audio.musicEnabled = save.settings.music
      set({ save, hydrated: true })
      if (recovered) {
        set((s) => ({
          toasts: [
            ...s.toasts,
            { id: uid('t'), text: 'Kayıt bozulmuştu, sıfırdan başlatıldı.', tone: 'warn', icon: '⚠' },
          ],
        }))
      }
    },

    registerVisit: () => {
      commit((d, out) => {
        const today = dayKey()
        const now = new Date()
        const hour = now.getHours()

        d.stats.sessions += 1
        d.lastSeen = Date.now()

        if (hour >= 0 && hour < 5) d.stats.nightVisits += 1
        if (hour >= 5 && hour < 8) d.stats.morningVisits += 1
        if (hour === 0 && now.getMinutes() <= 20) {
          d.stats.midnightVisits += 1
          if (engineSetFlag(d, 'secret-midnight', out)) {
            engineUnlockMessage(d, 'msg-midnight', out)
          }
        }

        // Gunluk sayaclar
        if (d.todayPlaysDate !== today) {
          d.todayPlaysDate = today
          d.todayPlays = {}
        }

        // Gunluk gorevler
        if (d.daily.date !== today) {
          const unlocked = games.filter((g) => d.level >= g.unlockLevel).map((g) => g.id)
          d.daily = { date: today, quests: generateDailyQuests(today, d.stats, unlocked), setClaimed: false }
        }

        // Gunluk seri
        if (d.streak.lastClaim !== today) {
          const diff = d.streak.lastClaim ? daysBetween(d.streak.lastClaim, today) : 999
          if (diff === 1) {
            d.streak.count += 1
            d.streak.cycleIndex = (d.streak.cycleIndex + 1) % 7
          } else {
            d.streak.count = 1
            d.streak.cycleIndex = 0
          }
          d.streak.lastClaim = today
          const reward = streakRewardFor(d.streak.cycleIndex)
          engineAddKisses(d, reward, out)
          d.stats.bestStreak = Math.max(d.stats.bestStreak, d.streak.count)
          set({
            rewardModal: {
              title: `${d.streak.count}. gün`,
              body:
                d.streak.count === 1
                  ? 'Seri başladı. Yarın da gel, artarak devam ediyor.'
                  : 'Seriyi bozmadın. Bu ödül bunun için.',
              icon: '🔥',
              kisses: reward,
            },
          })
        }

        // Ozel gunler
        const special = todaysSpecialDate(now)
        if (special) {
          const flag = `special-${special.id}`
          if (engineSetFlag(d, flag, out)) {
            engineAddKisses(d, special.bonusKisses, out)
            set({
              rewardModal: {
                title: special.label,
                body: special.message,
                icon: '✧',
                kisses: special.bonusKisses,
              },
            })
            if (special.theme && !d.ownedThemes.includes(special.theme)) d.ownedThemes.push(special.theme)
          }
        }
      })
    },

    addPlaytime: (ms) => {
      if (ms <= 0) return
      commit((d) => {
        d.stats.playtimeMs += ms
      }, { silent: false })
    },

    /* ---------------- navigation ---------------- */

    setView: (v) => {
      const cur = get().view
      if (cur === v) return
      set({ view: v })
      get().noteNavigation(v)
      audio.play('click')
      if (typeof window !== 'undefined') {
        try {
          window.history.replaceState(null, '', `#${v}`)
        } catch {
          /* yok say */
        }
      }
    },

    openGame: (id) => {
      set({ activeGame: id, lastResult: null })
      audio.play('start')
    },

    closeGame: () => {
      set({ activeGame: null, lastResult: null })
      audio.play('back')
    },

    clearResult: () => set({ lastResult: null }),

    /* ---------------- notifications ---------------- */

    toast: (text, tone = 'info', icon) =>
      set((s) => ({ toasts: [...s.toasts, { id: uid('t'), text, tone, icon }].slice(-4) })),

    dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

    popAchievement: () => set((s) => ({ achievementQueue: s.achievementQueue.slice(1) })),

    dismissLevelUp: () => set({ levelUp: null }),

    dismissRewardModal: () => set({ rewardModal: null }),

    pushFloater: (text, tone = 'plain') =>
      set((s) => ({ floaters: [...s.floaters, { id: uid('f'), text, tone }].slice(-6) })),

    clearFloater: (id) => set((s) => ({ floaters: s.floaters.filter((f) => f.id !== id) })),

    /* ---------------- progression ---------------- */

    awardXp: (amount, label) => {
      if (amount <= 0) return
      commit((d, out) => engineAddXp(d, amount, out))
      get().pushFloater(label ?? `+${Math.round(amount)} XP`, 'xp')
      audio.play('xp')
    },

    awardKisses: (amount, label) => {
      if (amount <= 0) return
      commit((d, out) => engineAddKisses(d, amount, out))
      get().pushFloater(label ?? `+${Math.round(amount)} 💋`, 'kiss')
      audio.play('kiss')
    },

    setFlag: (flag) => {
      if (get().save.flags[flag]) return
      commit((d, o) => engineSetFlag(d, flag, o))
      if (flag.startsWith('secret-') || flag.startsWith('special-')) audio.play('secret')
    },

    unlockCollectible: (id) => commit((d, out) => engineUnlockCollectible(d, id, out)),
    unlockMessage: (id) => commit((d, out) => engineUnlockMessage(d, id, out)),

    recordGameResult: (result) => {
      const gameDef = games.find((g) => g.id === result.gameId)
      if (!gameDef) return

      let reward: GameRewardBreakdown = { xp: 0, kisses: 0, newBest: false, diminished: false, factor: 1 }
      let unlockedThisRun: string[] = []

      const out = commit((d, o) => {
        /* --- sayaclar --- */
        d.stats.gamesPlayed += 1
        d.stats.playtimeMs += Math.max(0, result.durationMs)
        if (result.failed) d.stats.gamesFailed += 1

        if (result.counters) {
          for (const [k, v] of Object.entries(result.counters)) {
            if (typeof v !== 'number') continue
            const key = k as keyof Stats
            d.stats[key] = ((d.stats[key] as number) ?? 0) + v
          }
        }
        if (result.maxStats) {
          for (const [k, v] of Object.entries(result.maxStats)) {
            if (typeof v !== 'number') continue
            const key = k as keyof Stats
            d.stats[key] = Math.max((d.stats[key] as number) ?? 0, v)
          }
        }
        if (result.minStats) {
          for (const [k, v] of Object.entries(result.minStats)) {
            if (typeof v !== 'number' || v <= 0) continue
            const key = k as keyof Stats
            const cur = (d.stats[key] as number) ?? 0
            d.stats[key] = cur > 0 ? Math.min(cur, v) : v
          }
        }

        /* --- oynanma sayaclari --- */
        d.plays[result.gameId] = (d.plays[result.gameId] ?? 0) + 1
        const today = dayKey()
        if (d.todayPlaysDate !== today) {
          d.todayPlaysDate = today
          d.todayPlays = {}
        }
        const playsToday = d.todayPlays[result.gameId] ?? 0
        d.todayPlays[result.gameId] = playsToday + 1

        /* --- rekor --- */
        const prevBest = d.bests[result.gameId]
        const better =
          prevBest === undefined
            ? true
            : gameDef.bestDirection === 'higher'
              ? result.bestValue > prevBest
              : result.bestValue < prevBest
        const newBest = Number.isFinite(result.bestValue) && result.bestValue > 0 && better
        if (newBest) d.bests[result.gameId] = result.bestValue

        /* --- odul --- */
        const perf = Math.max(0, Math.min(1, result.performance))
        const factor = diminishFactor(playsToday)
        const diffMult = result.difficulty ? DIFFICULTY_MULT[result.difficulty] : 1
        let xp = Math.round((38 + perf * 95) * diffMult * factor)
        let kisses = Math.round((7 + perf * 25) * diffMult * factor)
        if (newBest) {
          xp += NEW_BEST_XP
          kisses += NEW_BEST_KISSES
        }
        reward = { xp, kisses, newBest, diminished: factor < 1, factor }

        engineAddKisses(d, kisses, o)
        engineAddXp(d, xp, o)

        /* --- bayraklar --- */
        for (const f of result.flags ?? []) engineSetFlag(d, f, o)
        if (result.score === 143) engineSetFlag(d, 'secret-143', o)
        if (result.failed && result.durationMs < 5000) engineSetFlag(d, 'quick-fail', o)
        if (new Date().getHours() >= 5 && new Date().getHours() < 8) d.stats.morningVisits += 1
      })

      unlockedThisRun = out.unlockedAchievements
      set({
        lastResult: { ...result, reward, unlocked: unlockedThisRun },
      })
    },

    /* ---------------- economy ---------------- */

    purchase: (itemId) => {
      const state = get()
      const item: ShopItem | undefined = shopItemById.get(itemId)
      if (!item) return false
      if (state.save.purchases[itemId]) return false
      if (item.requiresLevel && state.save.level < item.requiresLevel) {
        state.toast(`Level ${item.requiresLevel} gerekiyor.`, 'warn', '🔒')
        audio.play('error')
        return false
      }
      if (state.save.kisses < item.price) {
        state.noteBrokeAttempt()
        state.toast('Öpücüğün yetmiyor.', 'warn', '💋')
        audio.play('error')
        return false
      }

      commit((d, out) => {
        if (!engineSpendKisses(d, item.price)) return
        d.purchases[itemId] = { purchasedAt: Date.now() }
        d.stats.shopPurchases += 1

        switch (item.effect.type) {
          case 'theme':
            if (!d.ownedThemes.includes(item.effect.themeId)) d.ownedThemes.push(item.effect.themeId)
            break
          case 'frame':
            if (!d.ownedFrames.includes(item.effect.frameId)) d.ownedFrames.push(item.effect.frameId)
            break
          case 'trail':
            if (!d.ownedTrails.includes(item.effect.trailId)) d.ownedTrails.push(item.effect.trailId)
            break
          case 'title':
            if (!d.ownedTitles.includes(item.effect.title)) d.ownedTitles.push(item.effect.title)
            break
          case 'message':
            engineUnlockMessage(d, item.effect.messageId, out)
            break
          case 'mystery': {
            if (item.effect.grants === 'key') {
              // Gizli oda anahtari
              d.secretKeys += 1
              if (!d.secretRoomUnlocked && d.secretKeys >= 3) {
                d.secretRoomUnlocked = true
                engineSetFlag(d, 'secret-room', out)
              }
            } else if (item.effect.grants === 'note') {
              engineUnlockMessage(d, 'msg-letter-2', out)
              engineAddKisses(d, 60, out)
            } else if (item.effect.grants === 'clue') {
              engineAddKisses(d, 25, out)
            }
            break
          }
        }
      })

      audio.play('purchase')
      haptic(14, get().save.settings.haptics)
      get().toast(`${item.name} alındı`, 'good', '✓')
      return true
    },

    equipTheme: (themeId) => {
      const s = get()
      if (!s.save.ownedThemes.includes(themeId)) return
      applyTheme(themeId)
      commit((d) => {
        d.activeTheme = themeId
      })
      const swaps = s.counters.themeSwaps + 1
      set({ counters: { ...s.counters, themeSwaps: swaps } })
      if (swaps >= 6) get().setFlag('secret-theme-spin')
      audio.play('pop')
    },

    equipFrame: (frameId) => {
      if (!get().save.ownedFrames.includes(frameId)) return
      commit((d) => {
        d.activeFrame = frameId
      })
      audio.play('pop')
    },

    equipTrail: (trailId) => {
      if (!get().save.ownedTrails.includes(trailId)) return
      commit((d) => {
        d.activeTrail = trailId
      })
      audio.play('pop')
    },

    equipTitle: (title) => {
      if (title !== null && !get().save.ownedTitles.includes(title)) return
      commit((d) => {
        d.activeTitle = title
      })
      audio.play('pop')
    },

    /* ---------------- daily ---------------- */

    claimQuest: (questId) => {
      const s = get()
      const quest = s.save.daily.quests.find((q) => q.id === questId)
      if (!quest || quest.claimed) return
      if (!isQuestComplete(quest, s.save.stats)) return

      commit((d, out) => {
        const q = d.daily.quests.find((x) => x.id === questId)
        if (!q || q.claimed) return
        q.claimed = true
        d.stats.dailyQuestsDone += 1
        engineAddXp(d, q.xp, out)
        engineAddKisses(d, q.kisses, out)
      })
      s.pushFloater(`+${quest.xp} XP`, 'xp')
      s.pushFloater(`+${quest.kisses} 💋`, 'kiss')
      audio.play('coin')
    },

    claimDailySet: () => {
      const s = get()
      const d0 = s.save.daily
      if (d0.setClaimed) return
      if (!d0.quests.length || !d0.quests.every((q) => q.claimed)) return

      commit((d, out) => {
        if (d.daily.setClaimed) return
        d.daily.setClaimed = true
        d.stats.dailySetsDone += 1
        engineAddXp(d, DAILY_SET_BONUS.xp, out)
        engineAddKisses(d, DAILY_SET_BONUS.kisses, out)
      })
      set({
        rewardModal: {
          title: 'Günlük tamamlandı',
          body: 'Üç görevi de bitirdin. Bugünlük görevin bu kadardı.',
          icon: '❋',
          xp: DAILY_SET_BONUS.xp,
          kisses: DAILY_SET_BONUS.kisses,
        },
      })
      audio.play('achievement')
    },

    /* ---------------- settings ---------------- */

    updateSettings: (patch) => {
      commit((d) => {
        d.settings = { ...d.settings, ...patch }
      })
      const s = get().save.settings
      audio.setEnabled(s.sfx)
      audio.setVolume(s.volume)
      audio.setMusic(s.music)
      document.documentElement.dataset.reducedMotion = s.reducedMotion ? 'true' : 'false'
    },

    resetProgress: () => {
      clearSave()
      const fresh = createDefaultSave()
      writeNow(fresh)
      applyTheme(fresh.activeTheme)
      set({
        save: fresh,
        view: 'home',
        activeGame: null,
        lastResult: null,
        achievementQueue: [],
        levelUp: null,
        rewardModal: null,
        toasts: [{ id: uid('t'), text: 'Her şey sıfırlandı. Baştan başlıyoruz.', tone: 'info', icon: '↺' }],
        counters: { logoTaps: 0, levelTaps: 0, themeSwaps: 0, brokeAttempts: 0, tabReturns: 0, navSequence: [] },
      })
    },

    completeOnboarding: () => {
      commit((d, out) => {
        d.onboarded = true
        engineSetFlag(d, 'onboarded', out)
      })
    },

    /* ---------------- secrets ---------------- */

    tapLogo: () => {
      const s = get()
      const n = s.counters.logoTaps + 1
      set({ counters: { ...s.counters, logoTaps: n } })
      audio.play('hover')
      if (n === 10) get().setFlag('secret-logo')
    },

    tapLevelBadge: () => {
      const s = get()
      const n = s.counters.levelTaps + 1
      set({ counters: { ...s.counters, levelTaps: n } })
      audio.play('hover')
      if (n === 7) get().setFlag('secret-level-badge')
    },

    noteNavigation: (v) => {
      const s = get()
      const seq = [...s.counters.navSequence, v].slice(-4)
      set({ counters: { ...s.counters, navSequence: seq } })
      const target: ViewId[] = ['collection', 'shop', 'achievements', 'profile']
      if (seq.length === 4 && seq.every((x, i) => x === target[i])) {
        get().setFlag('secret-nav')
      }
    },

    noteBrokeAttempt: () => {
      const s = get()
      const n = s.counters.brokeAttempts + 1
      set({ counters: { ...s.counters, brokeAttempts: n } })
      if (n >= 3) get().setFlag('secret-broke')
    },

    noteTabReturn: () => {
      const s = get()
      const n = s.counters.tabReturns + 1
      set({ counters: { ...s.counters, tabReturns: n } })
      if (n >= 10) get().setFlag('secret-return')
    },

    /* ---------------- helpers ---------------- */

    isGameUnlocked: (id) => {
      const g = games.find((x) => x.id === id)
      if (!g) return false
      return get().save.level >= g.unlockLevel
    },

    unlockedGameIds: () => {
      const lvl = get().save.level
      return games.filter((g) => lvl >= g.unlockLevel).map((g) => g.id)
    },

    sfx: (name) => audio.play(name),
    buzz: (pattern) => haptic(pattern, get().save.settings.haptics),
  }
})

/* ------------------------------------------------------------------ */
/* Turetilmis selector yardimcilari                                    */
/* ------------------------------------------------------------------ */

export const selectFinaleUnlocked = (s: GameStore) => isFinaleUnlocked(s.save)

export const selectAchievementUnlocked = (id: string) => (s: GameStore) => !!s.save.achievements[id]

export function achievementTitle(id: string): string {
  return achievementById.get(id)?.title ?? id
}
