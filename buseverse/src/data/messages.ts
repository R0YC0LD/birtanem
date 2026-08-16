/**
 * Buse'ye ozel mesajlar.
 * Metinleri degistirmek icin sadece bu dosyayi duzenlemen yeterli.
 */

export interface PersonalMessage {
  id: string
  /** Kilit ekraninda gorunen baslik */
  title: string
  body: string
  /** Nereden acildigi — mesaj kartinda kucuk etiket */
  source: string
  tone: 'sweet' | 'playful' | 'quiet'
}

export const messages: PersonalMessage[] = [
  {
    id: 'msg-intro',
    title: 'Başlangıç',
    source: 'Onboarding',
    tone: 'sweet',
    body: 'Burayı tek bir kişi için yaptım. Şaka değil, gerçekten tek kişi. Hoş geldin.',
  },
  {
    id: 'msg-lv4',
    title: 'Fena kaptırdın',
    source: 'Level 4',
    tone: 'playful',
    body: 'Dört level oldu bile. İtiraf et, biraz eğlenceli değil mi?',
  },
  {
    id: 'msg-lv5',
    title: 'Beşinci',
    source: 'Level 5',
    tone: 'playful',
    body: 'Buraya kadar geldiysen bayağı kaptırmışsın. Bu arada henüz ısınma turundasın. 💋',
  },
  {
    id: 'msg-lv10',
    title: 'Çift haneli',
    source: 'Level 10',
    tone: 'playful',
    body: '10 level olmuş. Sanırım artık profesyonel öpücük avcısı sayılırsın. Sertifikanı sonra veririm.',
  },
  {
    id: 'msg-lv15',
    title: 'Aramızda kalsın',
    source: 'Level 15',
    tone: 'quiet',
    body: 'Bunu yaparken en çok senin ne diyeceğini merak ettim. Şu an gülüyorsan yeterli.',
  },
  {
    id: 'msg-lv20',
    title: 'Hafife almışım',
    source: 'Level 20',
    tone: 'sweet',
    body: 'Bu kadar oynayacağını düşünmemiştim. Ama seni hafife almak benim hatam, biliyorum.',
  },
  {
    id: 'msg-lv25',
    title: 'Yolun yarısı',
    source: 'Level 25',
    tone: 'quiet',
    body: 'Yarıladın. Buradan sonrası biraz daha zor ama sen zaten kolay şeylerden sıkılıyorsun.',
  },
  {
    id: 'msg-lv30',
    title: 'Otuz',
    source: 'Level 30',
    tone: 'sweet',
    body: 'Bir ara dur ve düşün: bunların hepsini sırf merak ettiğin için yaptın. Bu yüzden seviyorum işte.',
  },
  {
    id: 'msg-lv40',
    title: 'Kırk',
    source: 'Level 40',
    tone: 'quiet',
    body: 'Buraya gelen ilk ve tek kişisin. Rakamı büyütmeye de niyetim yok.',
  },
  {
    id: 'msg-lv45',
    title: 'Neredeyse',
    source: 'Level 45',
    tone: 'sweet',
    body: 'Son düzlük. Sonunda bir şey var, söz. Abartılı değil ama gerçek.',
  },
  {
    id: 'msg-lv50',
    title: 'Elli',
    source: 'Level 50',
    tone: 'quiet',
    body: 'Tamamdır. Buradan sonra oynayacak bir şey kalmadı; sadece söylenecek bir şey var.',
  },

  /* Dukkandan alinan mektuplar */
  {
    id: 'msg-letter-1',
    title: 'Mektup I — Sabah',
    source: 'Dükkân',
    tone: 'sweet',
    body: 'Sabahları uyanınca ilk aklıma gelen şey sensin, ama bunu yüzüne söylemek yerine site yapmayı seçtim. Karakter meselesi.',
  },
  {
    id: 'msg-letter-2',
    title: 'Mektup II — Sessizlik',
    source: 'Dükkân',
    tone: 'quiet',
    body: 'Seninle konuşmadığımız anlar bile rahat geçiyor. Bunun ne kadar nadir olduğunu sonradan anladım.',
  },
  {
    id: 'msg-letter-3',
    title: 'Mektup III — Kavga',
    source: 'Dükkân',
    tone: 'quiet',
    body: 'Kızdığın zaman bile haklı olduğun bir nokta oluyor. Bunu kabul etmem biraz sürüyor, biliyorum.',
  },
  {
    id: 'msg-letter-4',
    title: 'Mektup IV — Plan',
    source: 'Dükkân',
    tone: 'sweet',
    body: 'Bir sürü plan yaptık, çoğunu ertelendi. Sorun değil. Erteleyecek birinin olması güzel şey.',
  },
  {
    id: 'msg-letter-5',
    title: 'Mektup V — Küçük şeyler',
    source: 'Dükkân',
    tone: 'playful',
    body: 'Gülerken burnunu çekmen, telefonu ters tutman, "son bir bölüm" deyip üç bölüm izlemen. Liste uzun, yerim dar.',
  },

  /* Gizli / easter egg mesajlari */
  {
    id: 'msg-secret-room',
    title: 'Gizli Oda',
    source: 'Gizli Oda',
    tone: 'quiet',
    body: 'Üç anahtarı da buldun. Bu odayı bulman biraz zamanını aldı ama zaten bütün mesele oydu: biraz daha kalman.',
  },
  {
    id: 'msg-konami',
    title: 'Eski usul',
    source: 'Gizli kod',
    tone: 'playful',
    body: 'Yukarı yukarı aşağı aşağı... Nereden bildin? Neyse, bu bilgi için 30 öpücük hak ettin.',
  },
  {
    id: 'msg-143',
    title: '143',
    source: 'Gizli skor',
    tone: 'sweet',
    body: '1-4-3. Eski mesajlaşma dilinde "seni seviyorum" demek. Tam 143 yaptın, tesadüf diyemem.',
  },
  {
    id: 'msg-midnight',
    title: '00:00',
    source: 'Gece yarısı',
    tone: 'quiet',
    body: 'Gece yarısı buradasın. Ben de bir yerlerde uyanığım muhtemelen. İyi geceler.',
  },
  {
    id: 'msg-name',
    title: 'B-U-S-E',
    source: 'Gizli kelime',
    tone: 'playful',
    body: 'Kendi adını yazdın. Doğru yerdesin, bütün site zaten o beş harften ibaret.',
  },
  {
    id: 'msg-finale',
    title: 'For Buse',
    source: 'Final',
    tone: 'quiet',
    body: 'Bütün oyunların ödülü buydu.',
  },
]

export const messageById = new Map(messages.map((m) => [m.id, m]))

/** Baslangicta acik olan mesajlar. */
export const defaultUnlockedMessages = ['msg-intro']
