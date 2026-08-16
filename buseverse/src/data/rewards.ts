/**
 * Level odulleri. Her level bir sey verir; kilometre taslari fazlasini verir.
 * NOT: bu dosya levels.ts'i import ETMEZ (dairesel bagimlilik olmasin diye).
 */

import type { GameId } from '../types'

const LEVEL_CAP = 50

export interface LevelReward {
  icon: string
  label: string
  kisses?: number
  message?: string
  theme?: string
  frame?: string
  trail?: string
  collectible?: string
  secretKey?: boolean
  unlocksGame?: GameId
}

/** Kilometre tasi odulleri — taban opucuk odulunun uzerine eklenir. */
const milestones: Record<number, LevelReward[]> = {
  3: [
    { icon: '🌟', label: 'Star Catcher açıldı', unlocksGame: 'star-catcher' },
    { icon: '🖼️', label: 'Yeni profil çerçevesi: İnce Altın', frame: 'thin-gold' },
  ],
  4: [{ icon: '💌', label: 'Yeni mesaj açıldı', message: 'msg-lv4' }],
  5: [
    { icon: '🎯', label: 'Perfect Timing açıldı', unlocksGame: 'perfect-timing' },
    { icon: '💌', label: 'Yeni mesaj açıldı', message: 'msg-lv5' },
  ],
  6: [{ icon: '🌙', label: 'Koleksiyon: Ay', collectible: 'moon' }],
  7: [{ icon: '🏃', label: 'Love Dodge açıldı', unlocksGame: 'love-dodge' }],
  8: [{ icon: '✨', label: 'Efekt: Yıldız İzi', trail: 'stardust' }],
  9: [{ icon: '🧩', label: 'Love Puzzle açıldı', unlocksGame: 'love-puzzle' }],
  10: [
    { icon: '💌', label: 'Yeni mesaj açıldı', message: 'msg-lv10' },
    { icon: '🎨', label: 'Tema: Midnight Rose', theme: 'midnight-rose' },
  ],
  12: [{ icon: '🖼️', label: 'Çerçeve: Gül Halkası', frame: 'rose-ring' }],
  13: [{ icon: '🎞️', label: 'Koleksiyon: Kaset', collectible: 'tape' }],
  15: [
    { icon: '🐍', label: 'Love Snake açıldı', unlocksGame: 'love-snake' },
    { icon: '💌', label: 'Gizli mesaj açıldı', message: 'msg-lv15' },
  ],
  16: [{ icon: '🎨', label: 'Tema: Ivory Dream', theme: 'ivory-dream' }],
  18: [{ icon: '⭐', label: 'Constellation açıldı', unlocksGame: 'constellation' }],
  20: [
    { icon: '💌', label: 'Yeni mesaj açıldı', message: 'msg-lv20' },
    { icon: '🔥', label: 'Zor Mod: bütün oyunlarda Yoğun ayarı', frame: 'ember' },
  ],
  22: [{ icon: '☁️', label: 'Koleksiyon: Bulut', collectible: 'cloud' }],
  25: [
    { icon: '🗝️', label: 'Gizli Oda anahtarı', secretKey: true },
    { icon: '💌', label: 'Yeni mesaj açıldı', message: 'msg-lv25' },
  ],
  27: [{ icon: '🎨', label: 'Tema: Lavender Night', theme: 'lavender-night' }],
  30: [
    { icon: '✨', label: 'Efekt: Gül Yaprağı İzi', trail: 'petals' },
    { icon: '💌', label: 'Yeni mesaj açıldı', message: 'msg-lv30' },
  ],
  33: [{ icon: '📷', label: 'Koleksiyon: Polaroid', collectible: 'polaroid' }],
  35: [{ icon: '🗝️', label: 'Gizli Oda anahtarı', secretKey: true }],
  36: [{ icon: '🎨', label: 'Tema: Golden Hour', theme: 'golden-hour' }],
  38: [{ icon: '🖼️', label: 'Çerçeve: Sonsuzluk', frame: 'infinity' }],
  40: [
    { icon: '💌', label: 'Yeni mesaj açıldı', message: 'msg-lv40' },
    { icon: '💠', label: 'Koleksiyon: Sonsuzluk', collectible: 'infinity' },
  ],
  43: [{ icon: '✨', label: 'Efekt: Altın Kalp İzi', trail: 'gold-heart' }],
  45: [
    { icon: '🗝️', label: 'Son Gizli Oda anahtarı', secretKey: true },
    { icon: '💌', label: 'Yeni mesaj açıldı', message: 'msg-lv45' },
  ],
  48: [{ icon: '🖼️', label: 'Çerçeve: Efsane', frame: 'legend' }],
  50: [
    { icon: '💋', label: 'Final açıldı', message: 'msg-lv50' },
    { icon: '🎨', label: 'Tema: Son Perde', theme: 'finale' },
  ],
}

/** Level -> odul listesi (2..50). Her levelde en az bir opucuk odulu var. */
export const levelRewards: Record<number, LevelReward[]> = (() => {
  const out: Record<number, LevelReward[]> = {}
  for (let lv = 2; lv <= LEVEL_CAP; lv++) {
    const kisses = 8 + lv * 2
    out[lv] = [
      { icon: '💋', label: `+${kisses} öpücük`, kisses },
      ...(milestones[lv] ?? []),
    ]
  }
  return out
})()

/** Bir levelin "one cikan" odulu — kartlarda ozet gostermek icin. */
export function headlineReward(level: number): LevelReward | null {
  const list = levelRewards[level]
  if (!list) return null
  return list.length > 1 ? list[1] : list[0]
}
