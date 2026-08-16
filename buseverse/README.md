# Buseverse

> Sadece bir kişi için yapılmış küçük bir evren.

Mini oyunlar, XP, öpücük ekonomisi, 211 başarım, koleksiyon, günlük görevler,
gizli oda ve bir final içeren tek sayfalık romantik oyun platformu.
Backend yok, hesap yok — her şey tarayıcıda `localStorage` üzerinde çalışıyor.

Canlı: **https://r0yc0ld.github.io/birtanem/**

---

## Çalıştırma

```bash
npm install
npm run dev
```

Üretim derlemesi:

```bash
npm run build
```

`npm run build` önce `tsc --noEmit` ile tip kontrolü yapar, sonra `dist/` üretir.
Production `base` yolu `/birtanem/` olarak ayarlıdır (`vite.config.ts`).

---

## Mimari

```
src/
  config/site.ts        kişiye özel her şey: isim, slogan, selamlamalar, özel tarihler
  data/                 veri odaklı tanımlar (kod değil, içerik)
    achievements.ts     211 başarım
    levels.ts           XP eğrisi, ünvanlar, applyXp()
    rewards.ts          level ödülleri (2..50)
    games.ts            mini oyun kataloğu
    shop.ts             dükkân ürünleri
    collectibles.ts     16 koleksiyon parçası
    quests.ts           günlük görev şablonları + seri döngüsü
    messages.ts         Buse'ye özel metinler
    themes.ts           tema / çerçeve / iz tanımları
  systems/
    engine.ts           ilerleme motoru — XP, level, başarım, koleksiyon, final
    save.ts             versiyonlu kayıt, migrasyon, bozuk kayıt kurtarma
    audio.ts            Web Audio ile sentezlenen sesler (asset yok, telif yok)
  store/useGame.ts      tek global store (zustand) — tüm mutasyonlar buradan geçer
  games/                10 mini oyun + ortak yardımcılar
  components/           UI primitifleri, overlay'ler, navigasyon, oyun kabuğu
  pages/                9 ekran
  hooks/useSecrets.ts   easter egg tespiti (klavye + dokunmatik)
```

### Tek yön kuralı

Bütün ödüller `store/useGame.ts` içindeki `commit()` fonksiyonundan geçer:

```
draft(save) → mutasyon → runEngine() → bildirim kuyruğu → persist()
```

`runEngine` zincirleme açılışları (başarım → XP → level → ödül → yeni başarım)
kararlı hale gelene kadar döner. Bileşenlerin içine dağılmış `if` kontrolü yok.

---

## Buse'ye özel metinleri değiştirme

| Ne | Dosya |
|---|---|
| İsim, site adı, slogan, selamlamalar | `src/config/site.ts` |
| Özel tarihler (yılbaşım 14 Şubat, "Buse Günü"...) | `src/config/site.ts` → `specialDates` |
| Level mesajları, mektuplar, gizli mesajlar, final metni | `src/data/messages.ts` |
| Level ünvanları | `src/data/levels.ts` → `titleTiers` |
| Level ödülleri | `src/data/rewards.ts` → `milestones` |
| Koleksiyon parçalarının hikâyeleri | `src/data/collectibles.ts` |
| Dükkân ürün açıklamaları | `src/data/shop.ts` |

`siteConfig.personName` değiştirilirse hero, profil ve "BUSE yaz" sırrı otomatik uyar.
(Sıfırlama onayında yazılacak kelime `Profile.tsx` içinde sabittir, oradan da değiştir.)

---

## Kayıt sistemi

- Anahtar: `buseverse:save`, alan: `saveVersion` (şu an `1`).
- `persist()` 400 ms debounce ile yazar; sekme kapanırken `writeNow()` ile son hâli kaydeder.
- `loadSave()` okuyamazsa bozuk veriyi `buseverse:save:broken:<zaman>` altına kopyalar,
  varsayılan kayıtla devam eder — site asla açılmamazlık etmez.
- `merge()` eksik/yeni alanları varsayılanla tamamlar, yani yeni alan eklemek kırılma yaratmaz.
- Şema değişirse `save.ts` içindeki `migrate()` fonksiyonuna bir adım eklenir:

```ts
if (version < 2) {
  // alanları dönüştür
  data.saveVersion = 2
}
```

**Ödül tekrarı yok:** `unlockAchievement` açık başarımda hemen `false` döner.
Sayfa her yenilendiğinde `runEngine` tekrar koşar ama daha önce açılanlara
ikinci kez XP/öpücük vermez (testlerle doğrulandı).

---

## Başarım ekleme

`src/data/achievements.ts` içine bir satır eklemek yeterli.

**İstatistiğe bağlı (ilerleme çubuğu otomatik gelir):**

```ts
S('hh-5000', 'Kalp Avcısı V', 'Toplam 5.000 kalp yakala.',
  'heart', 'legendary', '♥', 'hhHearts', 5000)
```

"X'in altında" tipi için son parametre `'lte'`:

```ts
S('kr-100', 'Işık', '100 ms altında tepki ver.',
  'reaction', 'legendary', '↯', 'krBestMs', 100, 'lte')
```

**Bayrağa bağlı (gizli / özel durumlar):**

```ts
F('sec-yeni', 'Başlık', 'Açıklama', 'secret', 'secret', '✧', 'secret-yeni',
  { hidden: true, hint: 'İpucu', grantsKey: true })
```

Sonra tetiklenecek yerde `useGame.getState().setFlag('secret-yeni')`.

Ödüller nadirliğe göre otomatik (`REWARD` tablosu); istersen `{ xp, kisses }` ile ez.
Yeni bir istatistik gerekiyorsa `types/index.ts` → `Stats` ve
`systems/save.ts` → `createDefaultStats()` içine alanı ekle.

---

## Yeni mini oyun ekleme

1. `src/types/index.ts` → `GameId` birleşimine id ekle.
2. `src/data/games.ts` → `GameDef` ekle (kilit level'ı, rekor metriği, renkler).
3. `src/games/YeniOyun.tsx` → `MiniGameProps` arayüzünü uygulayan bileşen yaz:

```tsx
export function YeniOyun({ difficulty, reduced, onFinish }: MiniGameProps) {
  // bittiğinde:
  onFinish({
    score, bestValue, performance: 0..1, durationMs,
    detail: [{ label: 'Combo', value: 'x12' }],
    counters: { ynPlays: 1 },      // toplanır
    maxStats: { ynScore: score },  // maksimumu alınır
    minStats: { ynBestMs: ms },    // minimumu alınır (0 = veri yok)
    flags: ['secret-bir-sey'],
  })
}
```

4. `src/games/index.ts` → `GAME_COMPONENTS` haritasına bağla.

Ödül hesabı, rekor kaydı, günlük azalan getiri, başarım kontrolü ve sonuç
ekranı `GameShell` + store tarafından otomatik hallediliyor.
`src/games/shared.tsx` içinde HUD, geri sayım, combo rozeti, puan balonları
ve canvas yardımcıları hazır.

---

## Denge notları

- **XP eğrisi:** `xpForLevel(n) = 90 + 16n + 0.55n²`. Level 50'ye toplam ≈ 46.000 XP.
  Level 1→2 tek oyunla geçilir, 20 sonrası level başı 600+ XP, 40+ başarım avcılığı ister.
- **Level 50 kapağı:** fazla XP `25 XP = 1 öpücük` oranıyla dönüşür, boşa gitmez.
- **Azalan getiri:** aynı oyunu gün içinde 3'ten fazla oynarsan taban ödül kademeli düşer
  (1.0 → 0.74 → 0.55 → 0.42 → 0.34). Rekor bonusu her zaman tam verilir.
- **Final koşulları** (`systems/engine.ts`): Level 45 + Gizli Oda + 14/16 koleksiyon +
  başarımların %45'i. Eşikler `FINALE_LEVEL` ve `FINALE_ACHIEVEMENT_RATIO` ile ayarlanır.
- **Tamamlanma:** başarım %50, koleksiyon %20, sırlar %15, level %15.

---

## Sırlar

15'ten fazla easter egg var; klavye gerektirenlerin dokunmatik karşılığı da var:

| Sır | Nasıl |
|---|---|
| Logo | Kenar/üst logoya 10 kez bas |
| Konami | Klavyede ↑↑↓↓←→←→BA — mobilde aynı sırayla kaydırma |
| İsim | Klavyede `buse` yaz — mobilde hero'daki harflere sırayla dokun |
| Gece yarısı | 00:00–00:20 arası gir |
| 143 | Bir oyunda tam 143 skor yap |
| Footer noktası | Sayfanın en altındaki minik nokta |
| Avatar | Profilde avatarın üzerinde 5 saniye bekle |
| Level rozeti | Üstteki `LV` rozetine 7 kez bas |
| Ayarlar | Ayarların en altındaki nokta |
| Kalbi tut | Ana sayfadaki kalbi 3 saniye basılı tut |
| Başarım listesi | Sayaç yanındaki nokta |
| Cüzdan | Paran yetmezken 3 kez satın almayı dene |
| Menü sırası | Koleksiyon → Dükkân → Başarımlar → Profil |
| Sıfırlama | Sıfırlama ekranına gel, vazgeç |
| Tema | 6 kez üst üste tema değiştir |
| Bekleme | 2 dakika hiçbir şey yapma |
| Sekme | Sekmeyi 10 kez terk edip dön |

Üç **Gizli Oda anahtarı** logo, Konami ve isim sırlarından gelir; alternatif olarak
level 25/35/45 ödülleri ve dükkândaki "Paslı Anahtar" da anahtar verir.

---

## Erişilebilirlik

- `prefers-reduced-motion` otomatik algılanır, ayarlardan da açılır/kapanır:
  parçacık sayısı düşer, parallax ve büyük geçişler sadeleşir.
- Modallarda focus trap + Escape, tüm interaktif öğelerde `aria-label`/`aria-current`.
- Alt navigasyon dokunma hedefleri 56 px; klavye ile tüm ekranlar gezilebilir.
- Ses yalnızca ilk kullanıcı etkileşiminden sonra başlar (autoplay kuralı).
