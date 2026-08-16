import type { GameDef, GameId } from '../types'
import { formatMs } from '../utils/format'

/**
 * Mini oyun katalogu.
 * Ilk uc oyun baslangicta acik; digerleri level ile aciliyor.
 */
export const games: GameDef[] = [
  {
    id: 'heart-hunter',
    title: 'Kalp Avcısı',
    tagline: 'Düşenleri yakala, patlayanlardan kaç.',
    description:
      'Kalpler yukarıdan düşüyor. Altın ve gökkuşağı olanlar daha çok değerli, kırıklar ve bombalar comboyu bozuyor.',
    unlockLevel: 1,
    glyph: '♥',
    skill: 'Refleks',
    bestLabel: 'En yüksek skor',
    bestDirection: 'higher',
    hue: ['#E36A85', '#7A1F3D'],
  },
  {
    id: 'memory',
    title: 'Memory of Us',
    tagline: 'Eşleri bul, hamleni harca.',
    description:
      'Kartları çevir ve eşleştir. Az hamlede bitirmek ekstra XP veriyor; zor modda süre de sayılıyor.',
    unlockLevel: 1,
    glyph: '◈',
    skill: 'Hafıza',
    bestLabel: 'En az hamle (Zor)',
    bestDirection: 'lower',
    hue: ['#B79BE8', '#3B2A5C'],
    hasDifficulty: true,
  },
  {
    id: 'kiss-rush',
    title: 'Öpücük Rush',
    tagline: 'Ne kadar hızlısın, gerçekten?',
    description:
      'Ekranın rastgele bir yerinde beliren öpücüğe olabildiğince hızlı bas. Yanlış tıklama ceza yazıyor.',
    unlockLevel: 1,
    glyph: '⚡',
    skill: 'Refleks',
    bestLabel: 'En hızlı tepki',
    bestDirection: 'lower',
    formatBest: (v) => `${Math.round(v)} ms`,
    hue: ['#E9C79A', '#8A5A22'],
  },
  {
    id: 'star-catcher',
    title: 'Star Catcher',
    tagline: 'Gökyüzü bu gece cömert.',
    description:
      'Sepetini kaydır, düşen yıldızları topla. Mor ve altın yıldızlar nadir; kayan yıldız çok daha nadir.',
    unlockLevel: 3,
    glyph: '✦',
    skill: 'Kontrol',
    bestLabel: 'En yüksek skor',
    bestDirection: 'higher',
    hue: ['#8FA8E0', '#1B2450'],
  },
  {
    id: 'perfect-timing',
    title: 'Perfect Timing',
    tagline: 'Kalp ritmini tuttur.',
    description:
      'İbre bandın üzerinde gidip geliyor. Tam ortada bas. Perfect serisi büyüdükçe alan daralıyor.',
    unlockLevel: 5,
    glyph: '◎',
    skill: 'Zamanlama',
    bestLabel: 'En uzun perfect serisi',
    bestDirection: 'higher',
    hue: ['#7FB89A', '#1E4438'],
  },
  {
    id: 'love-dodge',
    title: 'Love Dodge',
    tagline: 'Kaçarken toplamayı unutma.',
    description:
      'Sağa sola kayarak düşen engellerden kurtul, aradaki kalpleri topla. Hız zamanla artıyor.',
    unlockLevel: 7,
    glyph: '◭',
    skill: 'Refleks',
    bestLabel: 'En uzun hayatta kalma',
    bestDirection: 'higher',
    formatBest: (v) => formatMs(v),
    hue: ['#E0768F', '#4A1030'],
  },
  {
    id: 'love-puzzle',
    title: 'Love Puzzle',
    tagline: 'Karışanı yerine koy.',
    description:
      'Klasik kayan taş bulmacası. 3x3 ısınma, 5x5 gerçek sınav. Süre ve hamle sayılıyor.',
    unlockLevel: 9,
    glyph: '▣',
    skill: 'Mantık',
    bestLabel: 'En az hamle (5x5)',
    bestDirection: 'lower',
    hue: ['#C9A96E', '#4B3410'],
    hasDifficulty: true,
  },
  {
    id: 'find-secret',
    title: 'Find the Secret',
    tagline: 'Sahnede sekiz şey saklı.',
    description:
      'Manzaraya iyi bak. Sekiz obje saklandı, bazıları gerçekten iyi saklandı. Yanlış tıklama süre yakıyor.',
    unlockLevel: 12,
    glyph: '◉',
    skill: 'Dikkat',
    bestLabel: 'En hızlı bitirme',
    bestDirection: 'lower',
    formatBest: (v) => formatMs(v),
    hue: ['#8E7BE0', '#241A45'],
  },
  {
    id: 'love-snake',
    title: 'Love Snake',
    tagline: 'Uzadıkça zorlaşıyor.',
    description:
      'Yılanı yönlendir, kalpleri ye, kendine çarpma. Ara ara çıkan altın kalp beş puan birden veriyor.',
    unlockLevel: 15,
    glyph: '⌁',
    skill: 'Kontrol',
    bestLabel: 'En yüksek skor',
    bestDirection: 'higher',
    hue: ['#7FB89A', '#173A2E'],
  },
  {
    id: 'constellation',
    title: 'Constellation',
    tagline: 'Noktaları doğru sırayla birleştir.',
    description:
      'Yıldızlar bir an için numaralanıyor, sonra numaralar kayboluyor. Sırayı hatırla ve çiz.',
    unlockLevel: 18,
    glyph: '✧',
    skill: 'Hafıza',
    bestLabel: 'En yüksek tur',
    bestDirection: 'higher',
    hue: ['#9BB8E8', '#151C3D'],
  },
]

export const gameById = new Map<GameId, GameDef>(games.map((g) => [g.id, g]))

export function formatBestValue(game: GameDef, value: number | undefined): string {
  if (value === undefined || value === null || !Number.isFinite(value)) return '—'
  return game.formatBest ? game.formatBest(value) : Math.round(value).toLocaleString('tr-TR')
}
