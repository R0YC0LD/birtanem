import { motion } from 'framer-motion'
import { useMemo } from 'react'
import { useGame } from '../store/useGame'
import { formatBestValue, gameById, games } from '../data/games'
import { completion } from '../systems/engine'
import { Card, ProgressBar, SectionTitle, StatTile } from '../components/ui'
import { formatNumber, formatPercent, formatPlaytime, formatMs, formatDate } from '../utils/format'
import { TOTAL_ACHIEVEMENTS } from '../data/achievements'
import { TOTAL_COLLECTIBLES } from '../data/collectibles'

export function Stats() {
  const save = useGame((s) => s.save)
  const st = save.stats
  const comp = useMemo(() => completion(save), [save])

  const favorite = useMemo(() => {
    const entries = Object.entries(save.plays) as [keyof typeof save.plays, number][]
    if (!entries.length) return null
    entries.sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
    const def = gameById.get(entries[0][0] as never)
    return def ? { name: def.title, count: entries[0][1] ?? 0 } : null
  }, [save.plays])

  const avgReaction = st.krAvgMsCount > 0 ? st.krAvgMsSum / st.krAvgMsCount : 0

  const rows: { label: string; value: string }[] = [
    { label: 'Toplam oyun', value: formatNumber(st.gamesPlayed) },
    { label: 'Kaybedilen tur', value: formatNumber(st.gamesFailed) },
    { label: 'Toplam süre', value: formatPlaytime(st.playtimeMs) },
    { label: 'Oturum sayısı', value: formatNumber(st.sessions) },
    { label: 'Kazanılan toplam XP', value: formatNumber(st.totalXpEarned) },
    { label: 'Ömür boyu öpücük', value: formatNumber(st.lifetimeKisses) },
    { label: 'Harcanan öpücük', value: formatNumber(st.kissesSpent) },
    { label: 'Dükkândan alınan', value: formatNumber(st.shopPurchases) },
    { label: 'Toplanan kalp', value: formatNumber(st.hhHearts + st.ldHearts) },
    { label: 'Altın kalp', value: formatNumber(st.hhGolden) },
    { label: 'En uzun combo', value: `x${st.hhCombo}` },
    { label: 'Toplanan yıldız', value: formatNumber(st.scStars) },
    { label: 'Kayan yıldız', value: formatNumber(st.scShooting) },
    { label: 'En hızlı tepki', value: st.krBestMs ? `${Math.round(st.krBestMs)} ms` : '—' },
    { label: 'Ortalama tepki', value: avgReaction ? `${Math.round(avgReaction)} ms` : '—' },
    { label: 'Perfect sayısı', value: formatNumber(st.ptPerfects) },
    { label: 'En uzun perfect serisi', value: `x${st.ptBestStreak}` },
    { label: 'Çözülen bulmaca', value: formatNumber(st.pzSolved) },
    { label: 'Bulunan gizli obje', value: formatNumber(st.fsObjects) },
    { label: 'Kart eşleştirme', value: formatNumber(st.memTotalMatches) },
    { label: 'En uzun yılan', value: formatNumber(st.snLength) },
    { label: 'Takımyıldız turu', value: formatNumber(st.cnSolved) },
    { label: 'En uzun giriş serisi', value: `${st.bestStreak} gün` },
    { label: 'Tamamlanan günlük görev', value: formatNumber(st.dailyQuestsDone) },
    { label: 'Keşfedilen sır', value: formatNumber(st.secretsFound) },
    { label: 'Gizli anahtar', value: `${save.secretKeys}/3` },
    { label: 'İlk giriş', value: formatDate(save.createdAt) },
  ]

  return (
    <div className="mx-auto max-w-5xl px-gutter pb-10 pt-7">
      <SectionTitle>İstatistikler</SectionTitle>

      <Card className="mb-6 p-5">
        <p className="label-xs">Buseverse tamamlanma</p>
        <p className="display mt-1 text-4xl text-accent">{formatPercent(comp.total, 1)}</p>
        <div className="mt-5 space-y-3">
          <Breakdown label="Başarımlar" weight="%50" value={comp.achievements} />
          <Breakdown label="Koleksiyon" weight="%20" value={comp.collection} />
          <Breakdown label="Sırlar" weight="%15" value={comp.secrets} />
          <Breakdown label="Level" weight="%15" value={comp.level} />
        </div>
      </Card>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Level" value={save.level} sub={`${formatNumber(st.totalXpEarned)} XP kazanıldı`} />
        <StatTile
          label="Başarım"
          value={`${st.achievementsUnlocked}`}
          sub={`/ ${TOTAL_ACHIEVEMENTS}`}
        />
        <StatTile
          label="Koleksiyon"
          value={`${st.collectiblesFound}`}
          sub={`/ ${TOTAL_COLLECTIBLES}`}
        />
        <StatTile
          label="Favori oyun"
          value={favorite ? favorite.name.split(' ')[0] : '—'}
          sub={favorite ? `${favorite.count} kez` : 'henüz yok'}
        />
      </div>

      <SectionTitle>Rekorlar</SectionTitle>
      <div className="mb-8 grid gap-2.5 sm:grid-cols-2">
        {games.map((g) => (
          <Card key={g.id} className="flex items-center justify-between gap-3 p-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-sm bg-bg-3/60 text-base" aria-hidden>
                {g.glyph}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{g.title}</p>
                <p className="truncate text-[11px] text-ink-mute">{g.bestLabel}</p>
              </div>
            </div>
            <p className="tabular display shrink-0 text-lg">{formatBestValue(g, save.bests[g.id])}</p>
          </Card>
        ))}
      </div>

      <SectionTitle>Her şey</SectionTitle>
      <motion.div
        className="surface divide-y divide-line/40 overflow-hidden"
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.012 } } }}
      >
        {rows.map((r) => (
          <motion.div
            key={r.label}
            variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}
            className="flex items-center justify-between px-4 py-3 text-sm"
          >
            <span className="text-ink-dim">{r.label}</span>
            <span className="tabular font-medium">{r.value}</span>
          </motion.div>
        ))}
      </motion.div>

      <p className="mt-6 text-center text-[11px] text-ink-mute">
        Toplam oynanan süre: {formatMs(st.playtimeMs)} · hepsi gerçek veriden hesaplanıyor.
      </p>
    </div>
  )
}

function Breakdown({ label, weight, value }: { label: string; weight: string; value: number }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-[12px]">
        <span className="text-ink-dim">
          {label} <span className="text-ink-mute/70">{weight}</span>
        </span>
        <span className="tabular text-ink-mute">{formatPercent(value, 0)}</span>
      </div>
      <ProgressBar value={value} height="h-1.5" tone="lav" />
    </div>
  )
}
