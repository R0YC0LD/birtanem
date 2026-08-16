/**
 * Buseverse — merkezi tip tanimlari.
 * Save dosyasinin sekli, achievement modeli ve oyun sonuclari burada tanimlanir.
 */

/* ------------------------------------------------------------------ */
/* Oyunlar                                                             */
/* ------------------------------------------------------------------ */

export type GameId =
  | 'heart-hunter'
  | 'memory'
  | 'kiss-rush'
  | 'star-catcher'
  | 'perfect-timing'
  | 'love-dodge'
  | 'love-puzzle'
  | 'find-secret'
  | 'love-snake'
  | 'constellation'

export type Difficulty = 'easy' | 'normal' | 'hard'

/** Bir oyunun "en iyi" degerini nasil siraladigimiz. */
export type ScoreDirection = 'higher' | 'lower'

export interface GameDef {
  id: GameId
  title: string
  tagline: string
  description: string
  /** Kilit acilan level */
  unlockLevel: number
  /** Kart uzerindeki dekoratif glyph */
  glyph: string
  /** Zorluk etiketi (kart uzerinde gosterilir) */
  skill: 'Refleks' | 'Hafıza' | 'Zamanlama' | 'Mantık' | 'Dikkat' | 'Kontrol'
  /** Bu oyunun "best" metriginin adi ve yonu */
  bestLabel: string
  bestDirection: ScoreDirection
  /** best degeri formatlama */
  formatBest?: (v: number) => string
  /** Kart gradient tokenlari */
  hue: [string, string]
  hasDifficulty?: boolean
}

/** Bir oyun bittiginde motor'a gonderilen standart sonuc. */
export interface GameResult {
  gameId: GameId
  /** Ham skor (oyunun kendi birimi) */
  score: number
  /** best tablosuna yazilacak deger (skor, sure, hamle, ms...) */
  bestValue: number
  /** 0..1 arasi performans; XP/opucuk odulunu olceklemek icin */
  performance: number
  durationMs: number
  difficulty?: Difficulty
  /** Sonuc ekraninda gosterilecek ek satirlar */
  detail?: { label: string; value: string }[]
  /** Bu turda toplanan sayaclar — istatistiklere EKLENIR */
  counters?: Partial<Stats>
  /** Rekor tipi sayaclar — mevcut degerle max alinir */
  maxStats?: Partial<Stats>
  /** "En az/en hizli" tipi sayaclar — min alinir (0 = veri yok) */
  minStats?: Partial<Stats>
  /** Bu turda tetiklenen flagler (gizli basarimlar vb.) */
  flags?: string[]
  /** Basarisiz/erken biten tur mu */
  failed?: boolean
}

/* ------------------------------------------------------------------ */
/* Basarimlar                                                          */
/* ------------------------------------------------------------------ */

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'secret'

export type AchievementCategory =
  | 'general'
  | 'level'
  | 'kisses'
  | 'heart'
  | 'memory'
  | 'reaction'
  | 'dodge'
  | 'star'
  | 'timing'
  | 'puzzle'
  | 'finder'
  | 'snake'
  | 'streak'
  | 'collection'
  | 'secret'

export type Comparator = 'gte' | 'lte'

export interface AchievementDef {
  id: string
  title: string
  /** Kilitliyken gosterilecek aciklama; hidden ise "???" gosterilir. */
  description: string
  category: AchievementCategory
  rarity: Rarity
  xp: number
  kisses: number
  icon: string
  /** Listede kilitliyken basligi/aciklamasi gizlenir */
  hidden?: boolean
  /** Acilana kadar listede hic gorunmez */
  ghost?: boolean
  /** Istatistik anahtarina bagli otomatik ilerleme */
  stat?: keyof Stats
  target?: number
  cmp?: Comparator
  /** Manuel tetiklenen bayrak */
  flag?: string
  /** Ipucu (hidden basarimlarda) */
  hint?: string
  /** Secret Room anahtari verir */
  grantsKey?: boolean
}

export interface AchievementState {
  unlockedAt: number
  /** Kilitlenirken kaydedilen ilerleme (gorsel amacli) */
  progress: number
}

/* ------------------------------------------------------------------ */
/* Istatistikler — achievement motorunun okudugu tek kaynak            */
/* ------------------------------------------------------------------ */

export interface Stats {
  /* genel */
  gamesPlayed: number
  gamesFailed: number
  playtimeMs: number
  sessions: number
  distinctGamesPlayed: number
  totalXpEarned: number
  lifetimeKisses: number
  /** Su anki opucuk bakiyesi (save.kisses ile senkron tutulur) */
  kisses: number
  kissesSpent: number
  achievementsUnlocked: number
  secretsFound: number
  collectiblesFound: number
  shopPurchases: number
  dailyQuestsDone: number
  dailySetsDone: number
  bestStreak: number
  currentStreak: number
  level: number
  themesOwned: number
  titlesOwned: number
  messagesUnlocked: number
  nightVisits: number
  morningVisits: number
  midnightVisits: number

  /* heart hunter */
  hhPlays: number
  hhScore: number
  hhHearts: number
  hhGolden: number
  hhRainbow: number
  hhBombs: number
  hhBroken: number
  hhCombo: number
  hhCleanRuns: number

  /* memory */
  memPlays: number
  memBestMovesHard: number
  memBestTimeMs: number
  memPerfectRuns: number
  memHardWins: number
  memTotalMatches: number

  /* kiss rush */
  krPlays: number
  krScore: number
  krBestMs: number
  krAvgMsSum: number
  krAvgMsCount: number
  krHits: number
  krMisses: number
  krFlawless: number

  /* star catcher */
  scPlays: number
  scScore: number
  scStars: number
  scGolden: number
  scShooting: number
  scPurple: number

  /* perfect timing */
  ptPlays: number
  ptScore: number
  ptPerfects: number
  ptBestStreak: number
  ptMisses: number

  /* love dodge */
  ldPlays: number
  ldScore: number
  ldBestTimeMs: number
  ldHearts: number
  ldNearMisses: number

  /* puzzle */
  pzPlays: number
  pzSolved: number
  pzBestMoves5: number
  pzBestTimeMs: number
  pzHardSolved: number

  /* find the secret */
  fsPlays: number
  fsSolved: number
  fsObjects: number
  fsBestTimeMs: number
  fsPerfectRuns: number

  /* love snake */
  snPlays: number
  snScore: number
  snLength: number
  snSelfHits: number

  /* constellation */
  cnPlays: number
  cnSolved: number
  cnPerfect: number
  cnBestTimeMs: number
}

/* ------------------------------------------------------------------ */
/* Save                                                                */
/* ------------------------------------------------------------------ */

export interface DailyQuestState {
  id: string
  templateId: string
  label: string
  stat: keyof Stats
  /** Gorev basladigindaki taban deger */
  base: number
  target: number
  xp: number
  kisses: number
  claimed: boolean
}

export interface ShopItemState {
  purchasedAt: number
}

export interface SaveData {
  saveVersion: number
  createdAt: number
  lastSeen: number
  /** Onboarding tamamlandi mi */
  onboarded: boolean

  level: number
  xp: number
  kisses: number

  stats: Stats
  achievements: Record<string, AchievementState>
  /** Oyun/easter-egg tarafindan set edilen tek seferlik bayraklar */
  flags: Record<string, true>
  /** Oyun bazli en iyi degerler */
  bests: Partial<Record<GameId, number>>
  /** Oyun bazli oynanma sayisi */
  plays: Partial<Record<GameId, number>>
  /** Bugun oyun basina oynanma (odul azaltmasi icin) */
  todayPlays: Record<string, number>
  todayPlaysDate: string

  collectibles: Record<string, number>
  purchases: Record<string, ShopItemState>
  ownedThemes: string[]
  ownedFrames: string[]
  ownedTrails: string[]
  ownedTitles: string[]
  unlockedMessages: string[]
  secretKeys: number
  secretRoomUnlocked: boolean
  finaleSeen: boolean

  activeTheme: string
  activeTitle: string | null
  activeFrame: string
  activeTrail: string

  daily: {
    date: string
    quests: DailyQuestState[]
    setClaimed: boolean
  }

  streak: {
    count: number
    lastClaim: string | null
    cycleIndex: number
  }

  settings: {
    sfx: boolean
    music: boolean
    volume: number
    reducedMotion: boolean
    haptics: boolean
    customCursor: boolean
    screenShake: boolean
  }
}

/* ------------------------------------------------------------------ */
/* Bildirimler                                                         */
/* ------------------------------------------------------------------ */

export interface AchievementToast {
  kind: 'achievement'
  id: string
  achievementId: string
}

export interface RewardToast {
  kind: 'reward'
  id: string
  title: string
  subtitle?: string
  xp?: number
  kisses?: number
  icon?: string
}

export interface LevelUpPayload {
  from: number
  to: number
  title: string
  rewards: { icon: string; label: string }[]
  kisses: number
}

export type Toast = {
  id: string
  text: string
  tone: 'info' | 'good' | 'warn'
  icon?: string
}

/* ------------------------------------------------------------------ */
/* Diger                                                               */
/* ------------------------------------------------------------------ */

export interface Collectible {
  id: string
  name: string
  glyph: string
  lore: string
  source: string
  /** Otomatik acilis kosulu */
  stat?: keyof Stats
  target?: number
  flag?: string
  level?: number
}

export type ShopCategory = 'themes' | 'effects' | 'messages' | 'titles' | 'mystery' | 'frames'

export interface ShopItem {
  id: string
  name: string
  description: string
  price: number
  category: ShopCategory
  glyph: string
  /** Satin alindiginda uygulanacak etki */
  effect:
    | { type: 'theme'; themeId: string }
    | { type: 'title'; title: string }
    | { type: 'message'; messageId: string }
    | { type: 'frame'; frameId: string }
    | { type: 'trail'; trailId: string }
    | { type: 'mystery'; grants: string }
  requiresLevel?: number
}

export interface ThemeDef {
  id: string
  name: string
  vars: Record<string, string>
  free?: boolean
}

export type ViewId =
  | 'home'
  | 'games'
  | 'achievements'
  | 'collection'
  | 'shop'
  | 'stats'
  | 'profile'
  | 'secret'
  | 'finale'
