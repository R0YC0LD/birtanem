/**
 * Kisiye ozel her sey burada.
 * Isim, slogan, mesajlar ve ozel tarihler bu dosyadan degistirilir.
 */

export const siteConfig = {
  personName: 'Buse',
  siteName: 'Buseverse',
  tagline: 'Sadece bir kişi için yapılmış küçük bir evren.',
  /** Profil ekranindaki "birlikte" tarihi — istersen degistir. */
  memberSinceFallback: 'bugün',
  /** Hero'da donen selamlamalar */
  greetings: [
    'Bugün kaç öpücük kazanabileceğine bakalım.',
    'Buranın tek sahibi sensin. İstediğin gibi karıştır.',
    'Yine mi geldin? İyi ki geldin.',
    'Bir şeyler saklandı. Bulman lazım.',
    'Elini çabuk tut, rekorlar kendi kendine kırılmıyor.',
  ],
  /** Gece / sabah selamlari */
  lateNightGreeting: 'Saat geç oldu. Ama uyumayacaksan hiç değilse birkaç level atla.',
  morningGreeting: 'Günaydın. Sabah sabah oynayan tek insan sensin herhalde.',
} as const

/* ------------------------------------------------------------------ */
/* Ozel tarihler — config-driven                                       */
/* ------------------------------------------------------------------ */

export interface SpecialDate {
  id: string
  /** 'MM-DD' formatinda; her yil tekrar eder */
  when: string
  label: string
  message: string
  /** O gun verilen bonus */
  bonusKisses: number
  /** O gun zorla uygulanan tema (opsiyonel) */
  theme?: string
  /** O gune ozel basarim id'si (achievements.ts icinde tanimli olmali) */
  achievement?: string
}

export const specialDates: SpecialDate[] = [
  {
    id: 'new-year',
    when: '01-01',
    label: 'Yeni Yıl',
    message: 'Yeni yılın ilk öpücüğü senden. Kural böyle.',
    bonusKisses: 50,
    theme: 'midnight-rose',
    achievement: 'sd-new-year',
  },
  {
    id: 'valentines',
    when: '02-14',
    label: '14 Şubat',
    message: 'Bugün resmi olarak bahane günü. Ama benim bahaneye ihtiyacım yok.',
    bonusKisses: 143,
    theme: 'golden-hour',
    achievement: 'sd-valentine',
  },
  {
    id: 'spring',
    when: '05-01',
    label: 'Bahar',
    message: 'Hava düzeldi. Dışarı çıkalım mı, yoksa bir tur daha mı?',
    bonusKisses: 40,
    achievement: 'sd-spring',
  },
  {
    id: 'buse-day',
    when: '08-16',
    label: 'Buse Günü',
    message: 'Bugün tamamen senin günün. Buranın kuralı bu.',
    bonusKisses: 100,
    theme: 'ivory-dream',
    achievement: 'sd-buse-day',
  },
]

/** Bugun ozel bir gun mu? */
export function todaysSpecialDate(now = new Date()): SpecialDate | null {
  const key = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  return specialDates.find((d) => d.when === key) ?? null
}
