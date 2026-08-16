import { motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronRight, Flame, Lock, Trophy } from 'lucide-react'
import { useGame } from '../store/useGame'
import { siteConfig, todaysSpecialDate } from '../config/site'
import { games, formatBestValue } from '../data/games'
import { achievementById } from '../data/achievements'
import { levelProgress, titleForLevel, xpForLevel, MAX_LEVEL } from '../data/levels'
import { completion } from '../systems/engine'
import { isQuestComplete, questProgress, DAILY_SET_BONUS, streakCycle } from '../data/quests'
import { AnimatedNumber, Button, Card, ProgressBar, SectionTitle, StatTile } from '../components/ui'
import { messageById } from '../data/messages'
import { TOTAL_ACHIEVEMENTS } from '../data/achievements'
import { formatPercent } from '../utils/format'
import { cx } from '../utils'

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
}

export function Home() {
  const save = useGame((s) => s.save)
  const setView = useGame((s) => s.setView)
  const openGame = useGame((s) => s.openGame)
  const claimQuest = useGame((s) => s.claimQuest)
  const claimSet = useGame((s) => s.claimDailySet)
  const setFlag = useGame((s) => s.setFlag)

  const comp = useMemo(() => completion(save), [save])
  const special = todaysSpecialDate()

  const greeting = useMemo(() => {
    const h = new Date().getHours()
    if (h >= 0 && h < 5) return siteConfig.lateNightGreeting
    if (h >= 5 && h < 8) return siteConfig.morningGreeting
    return siteConfig.greetings[Math.floor(Math.random() * siteConfig.greetings.length)]
  }, [])

  const unlockedGames = games.filter((g) => save.level >= g.unlockLevel)
  const nextLocked = games.find((g) => save.level < g.unlockLevel)

  const lastAchievementId = useMemo(() => {
    const entries = Object.entries(save.achievements)
    if (!entries.length) return null
    entries.sort((a, b) => b[1].unlockedAt - a[1].unlockedAt)
    return entries[0][0]
  }, [save.achievements])
  const lastAchievement = lastAchievementId ? achievementById.get(lastAchievementId) : null

  const questsDone = save.daily.quests.filter((q) => q.claimed).length
  const allQuestsClaimed = save.daily.quests.length > 0 && questsDone === save.daily.quests.length

  /* Gizli: kalbi 3 saniye basili tut */
  const holdTimer = useRef<number | undefined>(undefined)
  const [holding, setHolding] = useState(false)
  const startHold = () => {
    setHolding(true)
    holdTimer.current = window.setTimeout(() => {
      setFlag('secret-hold')
      setHolding(false)
    }, 3000)
  }
  const endHold = () => {
    setHolding(false)
    if (holdTimer.current) window.clearTimeout(holdTimer.current)
  }
  useEffect(() => () => endHold(), [])

  return (
    <motion.div
      className="mx-auto max-w-6xl px-gutter pb-10 pt-7"
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.06 } } }}
    >
      {/* ---------------- Hero ---------------- */}
      <motion.section variants={fadeUp} className="relative">
        <p className="label-xs">
          {new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        <h1 className="display mt-2 text-4xl leading-[1.05] sm:text-6xl">
          Hoş geldin,
          <br />
          <NameLetters />
          <motion.button
            onPointerDown={startHold}
            onPointerUp={endHold}
            onPointerLeave={endHold}
            className="ml-3 inline-block align-middle text-3xl sm:text-4xl"
            animate={holding ? { scale: [1, 1.3, 1.1] } : { scale: [1, 1.08, 1] }}
            transition={{ duration: holding ? 3 : 2.4, repeat: holding ? 0 : Infinity, ease: 'easeInOut' }}
            aria-label="Kalp"
          >
            ♥
          </motion.button>
        </h1>
        <p className="mt-3 max-w-md text-[15px] leading-relaxed text-ink-dim">{greeting}</p>

        {special && (
          <motion.div
            variants={fadeUp}
            className="surface mt-5 flex items-start gap-3 border-gold/40 bg-gold/[0.07] p-4"
          >
            <span className="text-xl">✧</span>
            <div>
              <p className="text-sm font-semibold text-gold">{special.label}</p>
              <p className="mt-0.5 text-[13px] text-ink-dim">{special.message}</p>
            </div>
          </motion.div>
        )}
      </motion.section>

      {/* ---------------- Dashboard ---------------- */}
      <motion.section variants={fadeUp} className="mt-8">
        <Card className="overflow-hidden p-5 sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="label-xs">Level {save.level}</p>
              <p className="display mt-1 text-2xl sm:text-3xl">
                {save.activeTitle ?? titleForLevel(save.level)}
              </p>
            </div>
            <div className="text-right">
              <p className="label-xs">Tamamlanma</p>
              <p className="display mt-1 text-2xl text-accent">{formatPercent(comp.total, 1)}</p>
            </div>
          </div>

          <div className="mt-5">
            <ProgressBar value={levelProgress(save.level, save.xp)} height="h-2.5" glow label="XP" />
            <div className="mt-2 flex justify-between text-xs text-ink-mute">
              <span className="tabular">
                {save.level >= MAX_LEVEL
                  ? 'Maksimum level — fazla XP öpücüğe dönüşüyor'
                  : `${save.xp.toLocaleString('tr-TR')} / ${xpForLevel(save.level).toLocaleString('tr-TR')} XP`}
              </span>
              {save.level < MAX_LEVEL && <span>Level {save.level + 1}</span>}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile label="Öpücük" value={<AnimatedNumber value={save.kisses} />} sub="💋 harcanabilir" />
            <StatTile
              label="Başarım"
              value={`${Object.keys(save.achievements).length}`}
              sub={`/ ${TOTAL_ACHIEVEMENTS}`}
              icon={<Trophy size={13} />}
            />
            <StatTile
              label="Günlük seri"
              value={save.streak.count}
              sub={`en iyi ${save.stats.bestStreak}`}
              icon={<Flame size={13} />}
            />
            <StatTile label="Koleksiyon" value={Object.keys(save.collectibles).length} sub="/ 16 parça" />
          </div>
        </Card>
      </motion.section>

      {/* ---------------- Gunluk gorevler ---------------- */}
      <motion.section variants={fadeUp} className="mt-9">
        <SectionTitle
          action={
            <span className="text-xs text-ink-mute">
              {questsDone}/{save.daily.quests.length} tamamlandı
            </span>
          }
        >
          Bugünün görevleri
        </SectionTitle>

        <div className="space-y-2.5">
          {save.daily.quests.map((q) => {
            const prog = questProgress(q, save.stats)
            const done = isQuestComplete(q, save.stats)
            const pct = Math.min(1, prog / q.target)
            return (
              <Card key={q.id} className="flex items-center gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <p className={cx('text-sm font-medium', q.claimed && 'text-ink-mute line-through')}>{q.label}</p>
                  <div className="mt-2 flex items-center gap-3">
                    <ProgressBar value={pct} height="h-1.5" tone={done ? 'gold' : 'accent'} />
                    <span className="tabular shrink-0 text-[11px] text-ink-mute">
                      {Math.min(prog, q.target)}/{q.target}
                    </span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[11px] text-lav">+{q.xp} XP</p>
                  <p className="text-[11px] text-accent">+{q.kisses} 💋</p>
                </div>
                {q.claimed ? (
                  <span className="shrink-0 text-sm text-emerald-400">✓</span>
                ) : (
                  <Button size="sm" disabled={!done} onClick={() => claimQuest(q.id)}>
                    Al
                  </Button>
                )}
              </Card>
            )
          })}
        </div>

        {allQuestsClaimed && !save.daily.setClaimed && (
          <Card className="mt-3 flex items-center gap-4 border-gold/40 bg-gold/[0.07] p-4">
            <span className="text-xl">❋</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gold">Günlük tamamlandı</p>
              <p className="text-[12px] text-ink-dim">
                Bonus: +{DAILY_SET_BONUS.xp} XP · +{DAILY_SET_BONUS.kisses} 💋
              </p>
            </div>
            <Button size="sm" onClick={claimSet}>
              Bonusu al
            </Button>
          </Card>
        )}
      </motion.section>

      {/* ---------------- Seri ---------------- */}
      <motion.section variants={fadeUp} className="mt-9">
        <SectionTitle>Giriş serisi</SectionTitle>
        <Card className="p-5">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {streakCycle.map((reward, i) => {
              const active = i === save.streak.cycleIndex
              const passed = i < save.streak.cycleIndex
              return (
                <div
                  key={i}
                  className={cx(
                    'flex min-w-[62px] flex-1 flex-col items-center gap-1.5 rounded-md border px-2 py-3 transition-colors',
                    active
                      ? 'border-accent/70 bg-accent/12'
                      : passed
                        ? 'border-line/50 bg-bg-2/60 opacity-60'
                        : 'border-line/50',
                  )}
                >
                  <span className="text-[10px] uppercase tracking-wider text-ink-mute">{i + 1}. gün</span>
                  <span className={cx('display text-lg', active ? 'text-accent' : 'text-ink-dim')}>{reward}</span>
                  <span className="text-[10px] text-ink-mute">💋</span>
                </div>
              )
            })}
          </div>
          <p className="mt-3 text-[12px] text-ink-mute">
            {save.streak.count > 0
              ? `${save.streak.count} gündür üst üste geliyorsun. Bir gün atlarsan sıfırlanır.`
              : 'Her gün gel, ödül artarak devam etsin.'}
          </p>
        </Card>
      </motion.section>

      {/* ---------------- Oyunlar ---------------- */}
      <motion.section variants={fadeUp} className="mt-9">
        <SectionTitle
          action={
            <button
              onClick={() => setView('games')}
              className="-my-2 flex items-center gap-1 py-2 text-xs text-ink-mute transition-colors hover:text-accent"
            >
              hepsi <ChevronRight size={13} />
            </button>
          }
        >
          Oyunlar
        </SectionTitle>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {unlockedGames.slice(0, 6).map((g) => (
            <Card key={g.id} interactive onClick={() => openGame(g.id)} className="shine overflow-hidden p-0">
              <div
                className="flex h-24 items-center justify-center text-5xl"
                style={{ background: `linear-gradient(135deg, ${g.hue[0]}33, ${g.hue[1]}66)`, color: g.hue[0] }}
                aria-hidden
              >
                {g.glyph}
              </div>
              <div className="p-4">
                <p className="display text-lg leading-tight">{g.title}</p>
                <p className="mt-1 text-[12px] text-ink-mute">{g.tagline}</p>
                <div className="mt-3 flex items-center justify-between text-[11px]">
                  <span className="rounded-full bg-white/[0.07] px-2 py-0.5 text-ink-dim">{g.skill}</span>
                  <span className="tabular text-ink-mute">{formatBestValue(g, save.bests[g.id])}</span>
                </div>
              </div>
            </Card>
          ))}

          {nextLocked && (
            <Card className="flex flex-col items-center justify-center gap-2 border-dashed p-6 text-center">
              <Lock size={18} className="text-ink-mute" />
              <p className="text-sm font-medium">{nextLocked.title}</p>
              <p className="text-[12px] text-ink-mute">Level {nextLocked.unlockLevel}’te açılıyor</p>
            </Card>
          )}
        </div>
      </motion.section>

      {/* ---------------- Son basarim ---------------- */}
      {lastAchievement && (
        <motion.section variants={fadeUp} className="mt-9">
          <SectionTitle
            action={
              <button
                onClick={() => setView('achievements')}
                className="-my-2 flex items-center gap-1 py-2 text-xs text-ink-mute transition-colors hover:text-accent"
              >
                hepsi <ChevronRight size={13} />
              </button>
            }
          >
            Son açılan
          </SectionTitle>
          <Card className="flex items-center gap-4 p-4">
            <span className="grid h-12 w-12 place-items-center rounded-md bg-accent/12 text-xl text-accent">
              {lastAchievement.icon}
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold">{lastAchievement.title}</p>
              <p className="truncate text-[12px] text-ink-mute">{lastAchievement.description}</p>
            </div>
          </Card>
        </motion.section>
      )}

      {/* ---------------- Mesajlar ---------------- */}
      <motion.section variants={fadeUp} className="mt-9">
        <SectionTitle>Sana bıraktıklarım</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2">
          {save.unlockedMessages
            .slice(-2)
            .map((id) => messageById.get(id))
            .filter(Boolean)
            .map((m) => (
              <Card key={m!.id} className="p-5">
                <p className="label-xs">{m!.source}</p>
                <p className="display mt-1.5 text-lg">{m!.title}</p>
                <p className="mt-2 text-[14px] leading-relaxed text-ink-dim">{m!.body}</p>
              </Card>
            ))}
        </div>
        <button
          onClick={() => setView('profile')}
          className="mt-1 py-2 text-xs text-ink-mute transition-colors hover:text-accent"
        >
          bütün mesajlar profilinde →
        </button>
      </motion.section>

      <Footer />
    </motion.div>
  )
}

/**
 * Isim harfleri tek tek tiklanabilir.
 * Sirayla B-U-S-E'ye dokunmak klavye gerektirmeyen bir easter egg (mobil karsiligi).
 */
function NameLetters() {
  const setFlag = useGame((s) => s.setFlag)
  const unlockMessage = useGame((s) => s.unlockMessage)
  const [step, setStep] = useState(0)
  const letters = siteConfig.personName.split('')

  const tap = (index: number) => {
    if (index === step) {
      const next = step + 1
      if (next >= letters.length) {
        setFlag('secret-name')
        unlockMessage('msg-name')
        setStep(0)
      } else {
        setStep(next)
      }
    } else {
      setStep(index === 0 ? 1 : 0)
    }
  }

  return (
    <span className="text-accent">
      {letters.map((ch, i) => (
        <button
          key={`${ch}-${i}`}
          onClick={() => tap(i)}
          className="transition-transform duration-150 hover:scale-110"
          aria-label={ch}
        >
          {ch}
        </button>
      ))}
    </span>
  )
}

/** Footer'daki minik nokta bir easter egg. */
function Footer() {
  const setFlag = useGame((s) => s.setFlag)
  return (
    <footer className="mt-16 border-t border-line/40 pt-6 text-center">
      <p className="display text-sm text-ink-mute">{siteConfig.siteName}</p>
      <p className="mt-1 text-[11px] text-ink-mute/70">{siteConfig.tagline}</p>
      <button
        onClick={() => setFlag('secret-footer')}
        aria-label="."
        className="mx-auto mt-6 block h-2 w-2 rounded-full bg-ink-mute/25 transition-colors hover:bg-accent"
      />
    </footer>
  )
}

