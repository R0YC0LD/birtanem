import type { AchievementCategory, AchievementDef, Rarity, Stats } from '../types'

/**
 * Basarim veritabani.
 *
 * Iki tur basarim var:
 *  - stat tabanli: `stat` + `target` (+ `cmp`) verilir, motor ilerlemeyi otomatik izler.
 *  - flag tabanli: `flag` verilir, ilgili yerde `store.setFlag('...')` cagrilir.
 *
 * `cmp: 'lte'` olan basarimlarda 0 degeri "henuz veri yok" demektir; motor
 * 0 iken kilidi acmaz.
 */

/** Nadirlige gore standart odul tablosu — enflasyonu engeller. */
const REWARD: Record<Rarity, { xp: number; kisses: number }> = {
  common: { xp: 20, kisses: 6 },
  uncommon: { xp: 40, kisses: 13 },
  rare: { xp: 75, kisses: 26 },
  epic: { xp: 135, kisses: 48 },
  legendary: { xp: 280, kisses: 115 },
  secret: { xp: 150, kisses: 55 },
}

type Extra = Partial<
  Pick<AchievementDef, 'stat' | 'target' | 'cmp' | 'flag' | 'hidden' | 'ghost' | 'hint' | 'grantsKey' | 'xp' | 'kisses'>
>

function make(
  id: string,
  title: string,
  description: string,
  category: AchievementCategory,
  rarity: Rarity,
  icon: string,
  extra: Extra = {},
): AchievementDef {
  const base = REWARD[rarity]
  return {
    id,
    title,
    description,
    category,
    rarity,
    icon,
    xp: extra.xp ?? base.xp,
    kisses: extra.kisses ?? base.kisses,
    ...extra,
  }
}

/** stat tabanli kisayol */
const S = (
  id: string,
  title: string,
  description: string,
  category: AchievementCategory,
  rarity: Rarity,
  icon: string,
  stat: keyof Stats,
  target: number,
  cmp: 'gte' | 'lte' = 'gte',
  extra: Extra = {},
) => make(id, title, description, category, rarity, icon, { stat, target, cmp, ...extra })

/** flag tabanli kisayol */
const F = (
  id: string,
  title: string,
  description: string,
  category: AchievementCategory,
  rarity: Rarity,
  icon: string,
  flag: string,
  extra: Extra = {},
) => make(id, title, description, category, rarity, icon, { flag, ...extra })

/* ================================================================== */
/* GENERAL                                                             */
/* ================================================================== */

const general: AchievementDef[] = [
  F('gen-start', 'Ve Böyle Başladı', 'Buseverse’e ilk kez girdin.', 'general', 'common', '❋', 'onboarded'),
  S('gen-first-game', 'İlk Adım', 'İlk mini oyununu tamamla.', 'general', 'common', '➊', 'gamesPlayed', 1),
  S('gen-five', 'Bir Daha!', 'Toplam 5 oyun tamamla.', 'general', 'common', '⁵', 'gamesPlayed', 5),
  S('gen-fifteen', 'Isınma Turu', 'Toplam 15 oyun tamamla.', 'general', 'common', '✧', 'gamesPlayed', 15),
  S('gen-fifty', 'Oyun Delisi', 'Toplam 50 oyun tamamla.', 'general', 'uncommon', '◆', 'gamesPlayed', 50),
  S('gen-hundred', 'Buseverse Veteranı', 'Toplam 100 oyun tamamla.', 'general', 'rare', '✦', 'gamesPlayed', 100),
  S('gen-250', 'Bu Artık Bağımlılık', 'Toplam 250 oyun tamamla.', 'general', 'epic', '❈', 'gamesPlayed', 250),
  S('gen-500', 'Sayacı Bozdun', 'Toplam 500 oyun tamamla.', 'general', 'legendary', '⚜', 'gamesPlayed', 500),
  S('gen-variety-5', 'Hepsinden Biraz', '5 farklı oyun oyna.', 'general', 'uncommon', '⬡', 'distinctGamesPlayed', 5),
  S('gen-variety-all', 'Tam Kadro', 'Bütün oyunları en az bir kez oyna.', 'general', 'rare', '⬢', 'distinctGamesPlayed', 10),
  S('gen-night', 'Gece Kuşu', 'Gece 00:00–05:00 arasında uğra.', 'general', 'common', '☾', 'nightVisits', 1),
  S('gen-morning', 'Erkenci Buse', 'Sabah 05:00–08:00 arasında bir oyun bitir.', 'general', 'uncommon', '☀', 'morningVisits', 1),
  S('gen-sessions-10', 'Müdavim', '10 farklı oturumda gir.', 'general', 'common', '⌂', 'sessions', 10),
  S('gen-sessions-40', 'Buranın Sakini', '40 farklı oturumda gir.', 'general', 'rare', '⌘', 'sessions', 40),
  S('gen-time-30', 'Yarım Saat', 'Toplam 30 dakika oyna.', 'general', 'common', '⧗', 'playtimeMs', 1_800_000),
  S('gen-time-2h', 'İki Saat', 'Toplam 2 saat oyna.', 'general', 'uncommon', '⧖', 'playtimeMs', 7_200_000),
  S('gen-time-6h', 'Altı Saat', 'Toplam 6 saat oyna.', 'general', 'rare', '⌛', 'playtimeMs', 21_600_000),
  S('gen-time-15h', 'Vaktini Bana Verdin', 'Toplam 15 saat oyna.', 'general', 'epic', '⏣', 'playtimeMs', 54_000_000),
  F('gen-quick-fail', 'Oops.', 'Bir oyunu 5 saniyeden kısa sürede kaybet.', 'general', 'uncommon', '✖', 'quick-fail'),
  S('gen-fails-10', 'Pes Etmeyen', '10 oyunu kaybet ve devam et.', 'general', 'common', '↺', 'gamesFailed', 10),
  S('gen-fails-50', 'Israrcı', '50 oyunu kaybet ve hâlâ buradasın.', 'general', 'rare', '↻', 'gamesFailed', 50),
]

/* ================================================================== */
/* LEVEL                                                               */
/* ================================================================== */

const level: AchievementDef[] = [
  S('lv-2', 'Başlangıç', 'Level 2 ol.', 'level', 'common', '②', 'level', 2),
  S('lv-3', 'Devam', 'Level 3 ol.', 'level', 'common', '③', 'level', 3),
  S('lv-5', 'Isınıyoruz', 'Level 5 ol.', 'level', 'common', '⑤', 'level', 5),
  S('lv-8', 'Kalp Kâşifi', 'Level 8 ol.', 'level', 'uncommon', '⑧', 'level', 8),
  S('lv-10', 'Çift Haneler', 'Level 10 ol.', 'level', 'uncommon', '⑩', 'level', 10),
  S('lv-15', 'On Beş', 'Level 15 ol.', 'level', 'rare', '❖', 'level', 15),
  S('lv-20', 'Öpücük Ustası', 'Level 20 ol.', 'level', 'rare', '❋', 'level', 20),
  S('lv-25', 'Yolun Yarısı', 'Level 25 ol.', 'level', 'epic', '◈', 'level', 25),
  S('lv-30', 'Romantik Efsane', 'Level 30 ol.', 'level', 'epic', '✵', 'level', 30),
  S('lv-35', 'Buseverse Kahramanı', 'Level 35 ol.', 'level', 'epic', '✷', 'level', 35),
  S('lv-40', 'Efsane', 'Level 40 ol.', 'level', 'legendary', '✹', 'level', 40),
  S('lv-45', 'Son Düzlük', 'Level 45 ol.', 'level', 'legendary', '✺', 'level', 45),
  S('lv-50', 'Final Form', 'Level 50 ol.', 'level', 'legendary', '✸', 'level', 50),
]

/* ================================================================== */
/* KISSES / EKONOMI                                                    */
/* ================================================================== */

const kisses: AchievementDef[] = [
  S('ks-1', 'İlk Öpücük', 'İlk öpücüğünü kazan.', 'kisses', 'common', '💋', 'lifetimeKisses', 1),
  S('ks-100', 'Cep Dolu', 'Toplam 100 öpücük kazan.', 'kisses', 'common', '❤', 'lifetimeKisses', 100),
  S('ks-500', 'Öpücük Koleksiyoncusu', 'Toplam 500 öpücük kazan.', 'kisses', 'uncommon', '❥', 'lifetimeKisses', 500),
  S('ks-1500', 'Ciddi Birikim', 'Toplam 1.500 öpücük kazan.', 'kisses', 'rare', '♡', 'lifetimeKisses', 1500),
  S('ks-4000', 'Milyarder Değil Ama Yakın', 'Toplam 4.000 öpücük kazan.', 'kisses', 'epic', '♥', 'lifetimeKisses', 4000),
  S('ks-9000', 'Ekonomiyi Bozdun', 'Toplam 9.000 öpücük kazan.', 'kisses', 'legendary', '⧫', 'lifetimeKisses', 9000),
  S('ks-hoard', 'Biriktirici', 'Aynı anda 1.000 öpücük tut.', 'kisses', 'rare', '⛃', 'kisses', 1000),
  S('ks-hoard-2', 'Hiç Harcamıyorsun', 'Aynı anda 2.500 öpücük tut.', 'kisses', 'epic', '⛁', 'kisses', 2500),
  S('ks-spend-1', 'İlk Alışveriş', 'Dükkândan bir şey satın al.', 'kisses', 'common', '✚', 'shopPurchases', 1),
  S('ks-spend-8', 'Müşteri', 'Dükkândan 8 farklı şey al.', 'kisses', 'uncommon', '✜', 'shopPurchases', 8),
  S('ks-spend-18', 'Rafları Boşalttın', 'Dükkândan 18 farklı şey al.', 'kisses', 'epic', '✛', 'shopPurchases', 18),
  S('ks-spent-1000', 'Cömert', 'Toplam 1.000 öpücük harca.', 'kisses', 'uncommon', '↯', 'kissesSpent', 1000),
  S('ks-spent-3500', 'Har Vurup Harman Savurdun', 'Toplam 3.500 öpücük harca.', 'kisses', 'rare', '⚡', 'kissesSpent', 3500),
]

/* ================================================================== */
/* HEART HUNTER                                                        */
/* ================================================================== */

const heart: AchievementDef[] = [
  S('hh-play', 'Av Başlasın', 'Kalp Avcısı’nı bir kez oyna.', 'heart', 'common', '♥', 'hhPlays', 1),
  S('hh-25', 'Kalp Avcısı I', 'Toplam 25 kalp yakala.', 'heart', 'common', '♥', 'hhHearts', 25),
  S('hh-150', 'Kalp Avcısı II', 'Toplam 150 kalp yakala.', 'heart', 'uncommon', '♥', 'hhHearts', 150),
  S('hh-600', 'Kalp Avcısı III', 'Toplam 600 kalp yakala.', 'heart', 'rare', '♥', 'hhHearts', 600),
  S('hh-2000', 'Kalp Avcısı IV', 'Toplam 2.000 kalp yakala.', 'heart', 'epic', '♥', 'hhHearts', 2000),
  S('hh-gold-1', 'Altın Kalp', 'İlk altın kalbini yakala.', 'heart', 'common', '✦', 'hhGolden', 1),
  S('hh-gold-60', 'Altın Standart', '60 altın kalp yakala.', 'heart', 'uncommon', '✦', 'hhGolden', 60),
  S('hh-rainbow-1', 'Gökkuşağı', 'İlk gökkuşağı kalbini yakala.', 'heart', 'uncommon', '❈', 'hhRainbow', 1),
  S('hh-rainbow-30', 'Nadir Zevkler', '30 gökkuşağı kalbi yakala.', 'heart', 'rare', '❈', 'hhRainbow', 30),
  S('hh-combo-5', 'Combo Starter', 'x5 combo yap.', 'heart', 'common', '⌁', 'hhCombo', 5),
  S('hh-combo-20', 'Combo Queen', 'x20 combo yap.', 'heart', 'uncommon', '⌁', 'hhCombo', 20),
  S('hh-combo-40', 'Durdurulamaz', 'x40 combo yap.', 'heart', 'rare', '⌁', 'hhCombo', 40),
  S('hh-combo-60', 'Bu Nasıl Oluyor', 'x60 combo yap.', 'heart', 'epic', '⌁', 'hhCombo', 60),
  S('hh-score-900', 'İyi Tur', 'Tek turda 900 skor yap.', 'heart', 'uncommon', '◆', 'hhScore', 900),
  S('hh-score-2000', 'Çok İyi Tur', 'Tek turda 2.000 skor yap.', 'heart', 'rare', '◈', 'hhScore', 2000),
  S('hh-score-3600', 'Efsanevi Tur', 'Tek turda 3.600 skor yap.', 'heart', 'epic', '❖', 'hhScore', 3600),
  S('hh-clean', 'Mükemmel Tur', 'Hiç kırık kalp ya da bomba almadan turu bitir.', 'heart', 'rare', '✧', 'hhCleanRuns', 1),
  S('hh-clean-5', 'Temiz Sicil', '5 kez tertemiz tur çıkar.', 'heart', 'epic', '✧', 'hhCleanRuns', 5),
  S('hh-bombs-25', 'Patlamayı Sevdin', '25 bombaya bas.', 'heart', 'common', '✖', 'hhBombs', 25),
]

/* ================================================================== */
/* MEMORY                                                              */
/* ================================================================== */

const memory: AchievementDef[] = [
  S('mem-play', 'İyi Hafıza', 'Memory of Us’u bir kez bitir.', 'memory', 'common', '◈', 'memPlays', 1),
  S('mem-15', 'Kartlara Alıştın', 'Memory of Us’u 15 kez bitir.', 'memory', 'uncommon', '◈', 'memPlays', 15),
  S('mem-40', 'Deste Senin', 'Memory of Us’u 40 kez bitir.', 'memory', 'rare', '◈', 'memPlays', 40),
  S('mem-hard-1', 'Zoru Sevdin', 'Zor modda bir tur bitir.', 'memory', 'uncommon', '❖', 'memHardWins', 1),
  S('mem-hard-10', 'Zorun Ustası', 'Zor modda 10 tur bitir.', 'memory', 'rare', '❖', 'memHardWins', 10),
  S('mem-moves-26', 'Fotoğrafik Hafıza', 'Zor modu 26 hamlenin altında bitir.', 'memory', 'rare', '⌾', 'memBestMovesHard', 26, 'lte'),
  S('mem-moves-22', 'Bu Kadarı Fazla', 'Zor modu 22 hamlenin altında bitir.', 'memory', 'epic', '⌾', 'memBestMovesHard', 22, 'lte'),
  S('mem-time-30', 'Speed Memory', 'Bir turu 30 saniyenin altında bitir.', 'memory', 'uncommon', '⧗', 'memBestTimeMs', 30_000, 'lte'),
  S('mem-time-18', 'Işık Hızı', 'Bir turu 18 saniyenin altında bitir.', 'memory', 'rare', '⧗', 'memBestTimeMs', 18_000, 'lte'),
  S('mem-perfect', 'Hiç Şaşırmadın', 'Hiç yanlış eşleştirme yapmadan turu bitir.', 'memory', 'epic', '✧', 'memPerfectRuns', 1),
  S('mem-perfect-3', 'Kusursuz Seri', '3 kez hatasız tur çıkar.', 'memory', 'legendary', '✧', 'memPerfectRuns', 3),
  S('mem-match-120', 'Eşleşme Uzmanı', 'Toplam 120 eşleşme yap.', 'memory', 'common', '⧉', 'memTotalMatches', 120),
  S('mem-match-500', 'Kartları Ezberledin', 'Toplam 500 eşleşme yap.', 'memory', 'rare', '⧉', 'memTotalMatches', 500),
]

/* ================================================================== */
/* REACTION — KISS RUSH                                                */
/* ================================================================== */

const reaction: AchievementDef[] = [
  S('kr-play', 'Parmaklar Hazır', 'Öpücük Rush’ı bir kez oyna.', 'reaction', 'common', '⚡', 'krPlays', 1),
  S('kr-20', 'Refleks Antrenmanı', 'Öpücük Rush’ı 20 kez oyna.', 'reaction', 'uncommon', '⚡', 'krPlays', 20),
  S('kr-300', 'Hızlı Parmak', '300 ms’nin altında tepki ver.', 'reaction', 'common', '↯', 'krBestMs', 300, 'lte'),
  S('kr-220', 'Excellent', '220 ms’nin altında tepki ver.', 'reaction', 'uncommon', '↯', 'krBestMs', 220, 'lte'),
  S('kr-180', 'Lightning Buse', '180 ms’nin altında tepki ver.', 'reaction', 'rare', '↯', 'krBestMs', 180, 'lte'),
  S('kr-150', 'Impossible?', '150 ms’nin altında tepki ver.', 'reaction', 'epic', '↯', 'krBestMs', 150, 'lte'),
  S('kr-120', 'İnsan Değilsin', '120 ms’nin altında tepki ver.', 'reaction', 'legendary', '↯', 'krBestMs', 120, 'lte'),
  S('kr-hits-150', 'İsabet', 'Toplam 150 hedefe bas.', 'reaction', 'common', '◎', 'krHits', 150),
  S('kr-hits-600', 'Keskin Nişancı', 'Toplam 600 hedefe bas.', 'reaction', 'rare', '◎', 'krHits', 600),
  S('kr-score-1200', 'Rush Ustası', 'Tek turda 1.200 skor yap.', 'reaction', 'uncommon', '◆', 'krScore', 1200),
  S('kr-score-2400', 'Rush Efsanesi', 'Tek turda 2.400 skor yap.', 'reaction', 'rare', '◈', 'krScore', 2400),
  S('kr-flawless', 'Hiç Iskalamadın', 'Bir turu tek bir hatasız tamamla.', 'reaction', 'rare', '✧', 'krFlawless', 1),
  S('kr-miss-40', 'Sabırsız', 'Toplam 40 kez boşa bas.', 'reaction', 'common', '✖', 'krMisses', 40),
]

/* ================================================================== */
/* DODGE                                                               */
/* ================================================================== */

const dodge: AchievementDef[] = [
  S('ld-play', 'Kaçış Başladı', 'Love Dodge’u bir kez oyna.', 'dodge', 'common', '◭', 'ldPlays', 1),
  S('ld-15', 'Kaçmayı Öğrendin', 'Love Dodge’u 15 kez oyna.', 'dodge', 'uncommon', '◭', 'ldPlays', 15),
  S('ld-30s', 'Otuz Saniye', '30 saniye hayatta kal.', 'dodge', 'common', '⧗', 'ldBestTimeMs', 30_000),
  S('ld-60s', 'Bir Dakika', '60 saniye hayatta kal.', 'dodge', 'uncommon', '⧗', 'ldBestTimeMs', 60_000),
  S('ld-100s', 'Yorulmadın mı', '100 saniye hayatta kal.', 'dodge', 'rare', '⧗', 'ldBestTimeMs', 100_000),
  S('ld-150s', 'Dokunulmaz', '150 saniye hayatta kal.', 'dodge', 'epic', '⧗', 'ldBestTimeMs', 150_000),
  S('ld-hearts-120', 'Kaçarken Topladın', 'Love Dodge’da 120 kalp topla.', 'dodge', 'common', '♥', 'ldHearts', 120),
  S('ld-hearts-600', 'Aç Gözlü', 'Love Dodge’da 600 kalp topla.', 'dodge', 'rare', '♥', 'ldHearts', 600),
  S('ld-score-1500', 'İyi Kaçış', 'Tek turda 1.500 skor yap.', 'dodge', 'uncommon', '◆', 'ldScore', 1500),
  S('ld-score-3200', 'Mükemmel Kaçış', 'Tek turda 3.200 skor yap.', 'dodge', 'rare', '◈', 'ldScore', 3200),
  S('ld-near-60', 'Kıl Payı', '60 kez engele değmeden sıyır.', 'dodge', 'rare', '⌁', 'ldNearMisses', 60),
]

/* ================================================================== */
/* STAR CATCHER                                                        */
/* ================================================================== */

const star: AchievementDef[] = [
  S('sc-play', 'Gökyüzüne Baktın', 'Star Catcher’ı bir kez oyna.', 'star', 'common', '✦', 'scPlays', 1),
  S('sc-100', 'Stargazer', 'Toplam 100 yıldız yakala.', 'star', 'common', '✦', 'scStars', 100),
  S('sc-500', 'Yıldız Toplayıcı', 'Toplam 500 yıldız yakala.', 'star', 'uncommon', '✦', 'scStars', 500),
  S('sc-1500', 'Gökyüzü Senin', 'Toplam 1.500 yıldız yakala.', 'star', 'rare', '✦', 'scStars', 1500),
  S('sc-gold-1', 'Golden Sky', 'İlk altın yıldızı yakala.', 'star', 'common', '✧', 'scGolden', 1),
  S('sc-gold-50', 'Altın Yağmuru', '50 altın yıldız yakala.', 'star', 'uncommon', '✧', 'scGolden', 50),
  S('sc-purple-30', 'Mor Nadirlik', '30 mor yıldız yakala.', 'star', 'uncommon', '✵', 'scPurple', 30),
  S('sc-shoot-1', 'Make a Wish', 'Bir kayan yıldız yakala.', 'star', 'rare', '☄', 'scShooting', 1),
  S('sc-shoot-5', 'Dilek Hakkın Doldu', '5 kayan yıldız yakala.', 'star', 'epic', '☄', 'scShooting', 5),
  S('sc-score-900', 'Parlak Gece', 'Tek turda 900 skor yap.', 'star', 'uncommon', '◆', 'scScore', 900),
  S('sc-score-2000', 'Işık Kirliliği', 'Tek turda 2.000 skor yap.', 'star', 'rare', '◈', 'scScore', 2000),
  S('sc-score-3500', 'Galaksi', 'Tek turda 3.500 skor yap.', 'star', 'epic', '❖', 'scScore', 3500),
]

/* ================================================================== */
/* PERFECT TIMING                                                      */
/* ================================================================== */

const timing: AchievementDef[] = [
  S('pt-play', 'Ritme Girdin', 'Perfect Timing’i bir kez oyna.', 'timing', 'common', '◎', 'ptPlays', 1),
  S('pt-perfect-1', 'Perfect!', 'İlk perfect’ini yap.', 'timing', 'common', '✧', 'ptPerfects', 1),
  S('pt-perfect-60', 'Tutturuyorsun', 'Toplam 60 perfect yap.', 'timing', 'uncommon', '✧', 'ptPerfects', 60),
  S('pt-perfect-300', 'Metronom', 'Toplam 300 perfect yap.', 'timing', 'rare', '✧', 'ptPerfects', 300),
  S('pt-streak-5', 'Perfect x5', 'Üst üste 5 perfect yap.', 'timing', 'uncommon', '⌁', 'ptBestStreak', 5),
  S('pt-streak-10', 'Machine Precision', 'Üst üste 10 perfect yap.', 'timing', 'rare', '⌁', 'ptBestStreak', 10),
  S('pt-streak-15', 'Bu İş Sende', 'Üst üste 15 perfect yap.', 'timing', 'epic', '⌁', 'ptBestStreak', 15),
  S('pt-streak-20', 'İnsanüstü Ritim', 'Üst üste 20 perfect yap.', 'timing', 'legendary', '⌁', 'ptBestStreak', 20),
  S('pt-score-1200', 'Kalp Ritmi', 'Tek turda 1.200 skor yap.', 'timing', 'uncommon', '◆', 'ptScore', 1200),
  S('pt-score-2600', 'Kusursuz Nabız', 'Tek turda 2.600 skor yap.', 'timing', 'rare', '◈', 'ptScore', 2600),
  S('pt-miss-60', 'Ritmi Kaçırdın', 'Toplam 60 kez ıskala.', 'timing', 'common', '✖', 'ptMisses', 60),
]

/* ================================================================== */
/* PUZZLE                                                              */
/* ================================================================== */

const puzzle: AchievementDef[] = [
  S('pz-play', 'Puzzle Beginner', 'Love Puzzle’ı bir kez çöz.', 'puzzle', 'common', '▣', 'pzSolved', 1),
  S('pz-5', 'Taşlar Yerinde', '5 bulmaca çöz.', 'puzzle', 'common', '▣', 'pzSolved', 5),
  S('pz-25', 'Puzzle Master', '25 bulmaca çöz.', 'puzzle', 'uncommon', '▣', 'pzSolved', 25),
  S('pz-60', 'Bu Senin İşin', '60 bulmaca çöz.', 'puzzle', 'rare', '▤', 'pzSolved', 60),
  S('pz-hard-1', 'Beşe Beş', '5x5 bulmacayı çöz.', 'puzzle', 'uncommon', '▦', 'pzHardSolved', 1),
  S('pz-hard-10', 'No Help Needed', '5x5 bulmacayı 10 kez çöz.', 'puzzle', 'rare', '▦', 'pzHardSolved', 10),
  S('pz-moves-200', 'Verimli', '5x5’i 200 hamlenin altında çöz.', 'puzzle', 'rare', '⌾', 'pzBestMoves5', 200, 'lte'),
  S('pz-moves-140', 'Aşırı Verimli', '5x5’i 140 hamlenin altında çöz.', 'puzzle', 'epic', '⌾', 'pzBestMoves5', 140, 'lte'),
  S('pz-time-90', 'Speed Solver', 'Bir bulmacayı 90 saniyenin altında çöz.', 'puzzle', 'uncommon', '⧗', 'pzBestTimeMs', 90_000, 'lte'),
  S('pz-time-45', 'Hızlı Zihin', 'Bir bulmacayı 45 saniyenin altında çöz.', 'puzzle', 'rare', '⧗', 'pzBestTimeMs', 45_000, 'lte'),
  S('pz-time-22', 'Bunu Nasıl Yaptın', 'Bir bulmacayı 22 saniyenin altında çöz.', 'puzzle', 'epic', '⧗', 'pzBestTimeMs', 22_000, 'lte'),
]

/* ================================================================== */
/* FIND THE SECRET                                                     */
/* ================================================================== */

const finder: AchievementDef[] = [
  S('fs-play', 'Gözler Açık', 'Find the Secret’ı bir kez bitir.', 'finder', 'common', '◉', 'fsSolved', 1),
  S('fs-5', 'Detaycı', '5 sahne tamamla.', 'finder', 'common', '◉', 'fsSolved', 5),
  S('fs-20', 'Hiçbir Şey Kaçmıyor', '20 sahne tamamla.', 'finder', 'uncommon', '◉', 'fsSolved', 20),
  S('fs-50', 'Sahne Senin', '50 sahne tamamla.', 'finder', 'rare', '◎', 'fsSolved', 50),
  S('fs-obj-60', 'Altmış Sır', 'Toplam 60 gizli obje bul.', 'finder', 'common', '⌖', 'fsObjects', 60),
  S('fs-obj-250', 'İki Yüz Elli Sır', 'Toplam 250 gizli obje bul.', 'finder', 'rare', '⌖', 'fsObjects', 250),
  S('fs-time-60', 'Çabuk Göz', 'Bir sahneyi 60 saniyenin altında bitir.', 'finder', 'common', '⧗', 'fsBestTimeMs', 60_000, 'lte'),
  S('fs-time-35', 'Keskin Göz', 'Bir sahneyi 35 saniyenin altında bitir.', 'finder', 'uncommon', '⧗', 'fsBestTimeMs', 35_000, 'lte'),
  S('fs-time-20', 'Röntgen Bakışı', 'Bir sahneyi 20 saniyenin altında bitir.', 'finder', 'rare', '⧗', 'fsBestTimeMs', 20_000, 'lte'),
  S('fs-perfect', 'Tek Yanlış Yok', 'Hiç yanlış tıklamadan bir sahne bitir.', 'finder', 'rare', '✧', 'fsPerfectRuns', 1),
  S('fs-perfect-5', 'Şüphe Yok', '5 kez hatasız sahne bitir.', 'finder', 'epic', '✧', 'fsPerfectRuns', 5),
]

/* ================================================================== */
/* SNAKE                                                               */
/* ================================================================== */

const snake: AchievementDef[] = [
  S('sn-play', 'Kuyruk Sallandı', 'Love Snake’i bir kez oyna.', 'snake', 'common', '⌁', 'snPlays', 1),
  S('sn-15', 'Uzuyor', 'Tek turda 15 skor yap.', 'snake', 'common', '⌁', 'snScore', 15),
  S('sn-40', 'Kıvrılıyor', 'Tek turda 40 skor yap.', 'snake', 'uncommon', '⌁', 'snScore', 40),
  S('sn-80', 'Yer Kalmadı', 'Tek turda 80 skor yap.', 'snake', 'rare', '⌁', 'snScore', 80),
  S('sn-130', 'Ekranı Doldurdun', 'Tek turda 130 skor yap.', 'snake', 'epic', '⌁', 'snScore', 130),
  S('sn-len-35', 'Otuz Beş Halka', 'Yılanı 35 uzunluğa çıkar.', 'snake', 'uncommon', '⌇', 'snLength', 35),
  S('sn-self-20', 'Kendine Zarar', '20 kez kendine çarp.', 'snake', 'common', '✖', 'snSelfHits', 20),
]

/* ================================================================== */
/* CONSTELLATION                                                       */
/* ================================================================== */

const constellation: AchievementDef[] = [
  S('cn-play', 'İlk Takımyıldız', 'Constellation’ı bir kez oyna.', 'general', 'common', '✧', 'cnPlays', 1),
  S('cn-10', 'Yıldızları Bağladın', '10 tur tamamla.', 'general', 'common', '✧', 'cnSolved', 10),
  S('cn-40', 'Gökyüzü Haritacısı', '40 tur tamamla.', 'general', 'rare', '✧', 'cnSolved', 40),
  S('cn-100', 'Astronom', '100 tur tamamla.', 'general', 'epic', '✧', 'cnSolved', 100),
  S('cn-perfect-5', 'Hatasız Çizgi', '5 turu hiç hata yapmadan bitir.', 'general', 'uncommon', '✵', 'cnPerfect', 5),
  S('cn-perfect-25', 'Hafıza Sanatçısı', '25 turu hiç hata yapmadan bitir.', 'general', 'rare', '✵', 'cnPerfect', 25),
  S('cn-time-11', 'Anlık Kavrayış', 'Bir turu 11 saniyenin altında bitir.', 'general', 'rare', '⧗', 'cnBestTimeMs', 11_000, 'lte'),
]

/* ================================================================== */
/* STREAK & GUNLUK                                                     */
/* ================================================================== */

const streak: AchievementDef[] = [
  S('st-2', 'İki Gün Üst Üste', '2 günlük seri yap.', 'streak', 'common', '🔥', 'bestStreak', 2),
  S('st-3', 'Alışkanlık Başlıyor', '3 günlük seri yap.', 'streak', 'common', '🔥', 'bestStreak', 3),
  S('st-5', 'Beş Gün', '5 günlük seri yap.', 'streak', 'uncommon', '🔥', 'bestStreak', 5),
  S('st-7', 'Tam Bir Hafta', '7 günlük seri yap.', 'streak', 'rare', '🔥', 'bestStreak', 7),
  S('st-14', 'İki Hafta', '14 günlük seri yap.', 'streak', 'epic', '🔥', 'bestStreak', 14),
  S('st-30', 'Bir Ay Boyunca', '30 günlük seri yap.', 'streak', 'legendary', '🔥', 'bestStreak', 30),
  S('dq-1', 'Görev Tamam', 'İlk günlük görevini tamamla.', 'streak', 'common', '✓', 'dailyQuestsDone', 1),
  S('dq-25', 'Görev Adamı', '25 günlük görev tamamla.', 'streak', 'uncommon', '✓', 'dailyQuestsDone', 25),
  S('dq-80', 'Görev Bağımlısı', '80 günlük görev tamamla.', 'streak', 'rare', '✓', 'dailyQuestsDone', 80),
  S('ds-1', 'Günü Bitirdin', 'Bir günün üç görevini de tamamla.', 'streak', 'common', '❋', 'dailySetsDone', 1),
  S('ds-10', 'On Tam Gün', '10 günü tamamen bitir.', 'streak', 'uncommon', '❋', 'dailySetsDone', 10),
  S('ds-30', 'Otuz Tam Gün', '30 günü tamamen bitir.', 'streak', 'epic', '❋', 'dailySetsDone', 30),
]

/* ================================================================== */
/* KOLEKSIYON                                                          */
/* ================================================================== */

const collection: AchievementDef[] = [
  S('col-1', 'İlk Parça', 'İlk koleksiyon parçanı bul.', 'collection', 'common', '❖', 'collectiblesFound', 1),
  S('col-5', 'Beş Parça', '5 koleksiyon parçası topla.', 'collection', 'uncommon', '❖', 'collectiblesFound', 5),
  S('col-10', 'Yarısı Tamam', '10 koleksiyon parçası topla.', 'collection', 'rare', '❖', 'collectiblesFound', 10),
  S('col-16', 'Küçük Anılar', 'Bütün koleksiyonu tamamla.', 'collection', 'legendary', '❖', 'collectiblesFound', 16),
  S('col-theme-3', 'Dekoratör', '3 temaya sahip ol.', 'collection', 'uncommon', '◐', 'themesOwned', 3),
  S('col-theme-6', 'Renk Cambazı', '6 temaya sahip ol.', 'collection', 'rare', '◑', 'themesOwned', 6),
  S('col-title-3', 'Unvan Sahibi', '3 unvana sahip ol.', 'collection', 'uncommon', '☰', 'titlesOwned', 3),
  S('col-msg-6', 'Mektup Kutusu', '6 özel mesaj aç.', 'collection', 'uncommon', '✉', 'messagesUnlocked', 6),
  S('col-msg-14', 'Hepsini Okudun', '14 özel mesaj aç.', 'collection', 'rare', '✉', 'messagesUnlocked', 14),
  S('col-secrets-8', 'Sır Küpü', '8 sır keşfet.', 'collection', 'rare', '⌘', 'secretsFound', 8),
  S('col-secrets-16', 'Buranın Her Köşesi', '16 sır keşfet.', 'collection', 'epic', '⌘', 'secretsFound', 16),
]

/* ================================================================== */
/* SECRET — easter eggler ve gizli basarimlar                          */
/* ================================================================== */

const secret: AchievementDef[] = [
  F('sec-logo', 'Bunu Kimse Bulamaz Sanmıştım', 'Logoya 10 kez üst üste bastın.', 'secret', 'secret', '❋', 'secret-logo', {
    hidden: true,
    hint: 'Başlıklar bazen dokunmayı sever.',
    grantsKey: true,
  }),
  F('sec-konami', 'Konami?', 'Yukarı yukarı aşağı aşağı sol sağ sol sağ B A.', 'secret', 'secret', '⌘', 'secret-konami', {
    hidden: true,
    hint: 'Eski oyunlarda işe yarayan bir şey.',
    grantsKey: true,
  }),
  F('sec-name', 'B Harfi', 'Klavyeden kendi adını yazdın.', 'secret', 'secret', '✎', 'secret-name', {
    hidden: true,
    hint: 'Beş harf. Zaten biliyorsun.',
    grantsKey: true,
  }),
  F('sec-midnight', 'Gece Yarısı', 'Saat tam 00:00 civarında buradaydın.', 'secret', 'secret', '☾', 'secret-midnight', {
    hidden: true,
    hint: 'Günün ilk dakikası.',
  }),
  F('sec-143', '143', 'Bir oyunda tam 143 skor yaptın.', 'secret', 'secret', '❤', 'secret-143', {
    hidden: true,
    hint: 'Bir sayı, üç kelime.',
  }),
  F('sec-footer', 'Orada Ne Arıyordun?', 'Sayfanın en altındaki minik noktayı buldun.', 'secret', 'secret', '·', 'secret-footer', {
    hidden: true,
    hint: 'Aşağı in. Daha aşağı.',
  }),
  F('sec-avatar', 'Aşırı Meraklı', 'Avatarın üzerinde 5 saniye bekledin.', 'secret', 'secret', '◉', 'secret-avatar', {
    hidden: true,
    hint: 'Bazen hiçbir şey yapmamak da bir şey yapmaktır.',
  }),
  F('sec-level-badge', 'Sayıyla Oynama', 'Level rozetine yedi kez bastın.', 'secret', 'secret', '⑦', 'secret-level-badge', {
    hidden: true,
    hint: 'Rakamlar da tıklanır.',
  }),
  F('sec-settings', "Developer'ın Kabusu", 'Ayarlardaki gizli anahtarı buldun.', 'secret', 'secret', '⚙', 'secret-settings', {
    hidden: true,
    hint: 'Ayarların en altı.',
  }),
  F('sec-hold', 'Bırakmadın', 'Bir kalbi üç saniye basılı tuttun.', 'secret', 'secret', '♡', 'secret-hold', {
    hidden: true,
    hint: 'Bazı şeyler bırakılmaz.',
  }),
  F('sec-achv-hunt', 'Listede Bir Şey Var', 'Başarım ekranındaki gizli işareti buldun.', 'secret', 'secret', '⌖', 'secret-achv-hunt', {
    hidden: true,
    hint: 'Sayaçlara dikkatli bak.',
  }),
  F('sec-broke', 'Cüzdan Boş', 'Paran yetmezken satın almayı denedin. Üç kez.', 'secret', 'secret', '⛃', 'secret-broke', {
    hidden: true,
    hint: 'Israr etmek bazen ödüllendirilir.',
  }),
  F('sec-nav', 'Sıra Meselesi', 'Menüleri doğru sırayla gezdin.', 'secret', 'secret', '⇄', 'secret-nav', {
    hidden: true,
    hint: 'Koleksiyon → Dükkân → Başarımlar → Profil.',
  }),
  F('sec-reset-cancel', 'Neredeyse', 'Sıfırlama ekranına kadar gelip vazgeçtin.', 'secret', 'secret', '↺', 'secret-reset-cancel', {
    hidden: true,
    hint: 'Bazı düğmelere basılmaz.',
  }),
  F('sec-theme-spin', 'Kararsız', 'Altı kez üst üste tema değiştirdin.', 'secret', 'secret', '◐', 'secret-theme-spin', {
    hidden: true,
    hint: 'Bir renge karar veremiyorsun.',
  }),
  F('sec-idle', 'Bekleyen', 'İki dakika hiçbir şey yapmadan bekledin.', 'secret', 'secret', '⧗', 'secret-idle', {
    hidden: true,
    hint: 'Hiçbir şey yapma. Gerçekten hiçbir şey.',
  }),
  F('sec-return', 'Geri Döndün', 'Sekmeyi on kez terk edip geri geldin.', 'secret', 'secret', '⟳', 'secret-return', {
    hidden: true,
    hint: 'Gitsen de dönüyorsun.',
  }),
  F('sec-lucky', 'Şanslı', 'Nadiren beliren küçük sürprizi yakaladın.', 'secret', 'secret', '✧', 'secret-lucky', {
    hidden: true,
    ghost: true,
  }),
  F('sec-room', 'Kapı Açıldı', 'Gizli Oda’yı açtın.', 'secret', 'secret', '🗝', 'secret-room', {
    hidden: true,
    hint: 'Üç anahtar lazım.',
  }),
  F('sec-wish', 'Dilek Tuttun', 'Gizli Oda’daki yıldıza dokundun.', 'secret', 'secret', '☄', 'secret-wish', {
    hidden: true,
    ghost: true,
  }),
  F('sec-room-all', 'Odanın Her Köşesi', 'Gizli Oda’daki her şeyi keşfettin.', 'secret', 'secret', '⌘', 'secret-room-all', {
    hidden: true,
    ghost: true,
  }),
  make('sec-finale', 'Worth Every Level', 'Buseverse’in sonunu gördün.', 'secret', 'legendary', '💋', {
    flag: 'finale-seen',
    hidden: true,
    ghost: true,
    xp: 500,
    kisses: 250,
  }),

  /* Ozel tarihler */
  F('sd-new-year', 'Yılın İlki', 'Yılbaşında Buseverse’e girdin.', 'secret', 'secret', '❄', 'special-new-year', {
    hidden: true,
    ghost: true,
  }),
  F('sd-valentine', '14 Şubat', 'Sevgililer gününde buradaydın.', 'secret', 'secret', '❤', 'special-valentines', {
    hidden: true,
    ghost: true,
  }),
  F('sd-spring', 'Bahar Geldi', '1 Mayıs’ta uğradın.', 'secret', 'secret', '✿', 'special-spring', {
    hidden: true,
    ghost: true,
  }),
  F('sd-buse-day', 'Senin Günün', 'Buse Günü’nde buradaydın.', 'secret', 'secret', '✵', 'special-buse-day', {
    hidden: true,
    ghost: true,
  }),
]

/* ================================================================== */

export const achievements: AchievementDef[] = [
  ...general,
  ...level,
  ...kisses,
  ...heart,
  ...memory,
  ...reaction,
  ...dodge,
  ...star,
  ...timing,
  ...puzzle,
  ...finder,
  ...snake,
  ...constellation,
  ...streak,
  ...collection,
  ...secret,
]

export const achievementById = new Map(achievements.map((a) => [a.id, a]))

export const TOTAL_ACHIEVEMENTS = achievements.length

export const categoryLabels: Record<AchievementCategory, string> = {
  general: 'Genel',
  level: 'Level',
  kisses: 'Öpücük',
  heart: 'Kalp Avcısı',
  memory: 'Memory',
  reaction: 'Refleks',
  dodge: 'Dodge',
  star: 'Star Catcher',
  timing: 'Timing',
  puzzle: 'Puzzle',
  finder: 'Find the Secret',
  snake: 'Snake',
  streak: 'Seri & Görev',
  collection: 'Koleksiyon',
  secret: 'Sırlar',
}

export const rarityLabels: Record<Rarity, string> = {
  common: 'Sıradan',
  uncommon: 'Az Bulunur',
  rare: 'Nadir',
  epic: 'Destansı',
  legendary: 'Efsanevi',
  secret: 'Gizli',
}

export const rarityOrder: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'secret']

/** Flag -> basarim eslesmesi (motor icin hizli erisim). */
export const achievementsByFlag = new Map<string, AchievementDef[]>()
for (const a of achievements) {
  if (!a.flag) continue
  const list = achievementsByFlag.get(a.flag) ?? []
  list.push(a)
  achievementsByFlag.set(a.flag, list)
}

/** Stat tabanli basarimlar — motor her degerlendirmede bunlari tarar. */
export const statAchievements = achievements.filter((a) => a.stat && a.target !== undefined)
