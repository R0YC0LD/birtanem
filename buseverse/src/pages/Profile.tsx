import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { KeyRound, Sparkles } from 'lucide-react'
import { useGame } from '../store/useGame'
import { siteConfig } from '../config/site'
import { frames, themes, trails } from '../data/themes'
import { messageById } from '../data/messages'
import { titleForLevel, MAX_LEVEL, xpForLevel } from '../data/levels'
import { Button, Card, Modal, ProgressBar, SectionTitle } from '../components/ui'
import { formatDate, formatPlaytime } from '../utils/format'
import { cx } from '../utils'
import { finaleRequirements, isFinaleUnlocked } from '../systems/engine'

export function Profile() {
  const save = useGame((s) => s.save)
  const setView = useGame((s) => s.setView)
  const setFlag = useGame((s) => s.setFlag)
  const equipTheme = useGame((s) => s.equipTheme)
  const equipFrame = useGame((s) => s.equipFrame)
  const equipTrail = useGame((s) => s.equipTrail)
  const equipTitle = useGame((s) => s.equipTitle)
  const updateSettings = useGame((s) => s.updateSettings)
  const resetProgress = useGame((s) => s.resetProgress)

  const [resetStep, setResetStep] = useState<0 | 1 | 2>(0)
  const [confirmText, setConfirmText] = useState('')

  /* Gizli: avatarin uzerinde 5 saniye bekle */
  const hoverTimer = useRef<number | undefined>(undefined)
  const startHover = () => {
    hoverTimer.current = window.setTimeout(() => setFlag('secret-avatar'), 5000)
  }
  const endHover = () => {
    if (hoverTimer.current) window.clearTimeout(hoverTimer.current)
  }
  useEffect(() => () => endHover(), [])

  const frameDef = frames.find((f) => f.id === save.activeFrame) ?? frames[0]
  const finaleReady = isFinaleUnlocked(save)
  const reqs = finaleRequirements(save)

  const closeReset = () => {
    if (resetStep === 2) setFlag('secret-reset-cancel')
    setResetStep(0)
    setConfirmText('')
  }

  return (
    <div className="mx-auto max-w-3xl px-gutter pb-10 pt-7">
      {/* ---------------- Profil karti ---------------- */}
      <Card className="grain overflow-hidden p-6">
        <div className="flex items-center gap-5">
          <motion.div
            onPointerEnter={startHover}
            onPointerLeave={endHover}
            onPointerDown={startHover}
            onPointerUp={endHover}
            whileHover={{ scale: 1.04 }}
            className={cx(
              'grid h-20 w-20 shrink-0 place-items-center rounded-full bg-gradient-to-br from-accent to-wine text-3xl font-bold text-bg-0',
              frameDef.ring,
            )}
          >
            {siteConfig.personName.charAt(0)}
          </motion.div>
          <div className="min-w-0">
            <h1 className="display text-3xl leading-tight">{siteConfig.personName}</h1>
            <p className="mt-0.5 text-sm text-accent">{save.activeTitle ?? titleForLevel(save.level)}</p>
            <p className="mt-1.5 text-[12px] text-ink-mute">
              Level {save.level} · {formatPlaytime(save.stats.playtimeMs)} oynadın
            </p>
          </div>
        </div>

        <div className="mt-6">
          <ProgressBar value={save.level >= MAX_LEVEL ? 1 : save.xp / xpForLevel(save.level)} height="h-2" glow />
          <div className="mt-2 flex justify-between text-[11px] text-ink-mute">
            <span>{save.level >= MAX_LEVEL ? 'Maksimum level' : `${save.xp} / ${xpForLevel(save.level)} XP`}</span>
            <span>Buradasın: {formatDate(save.createdAt)}’dan beri</span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3 text-center">
          <div className="surface-flat p-3">
            <p className="display text-xl">{save.kisses}</p>
            <p className="label-xs mt-1">Öpücük</p>
          </div>
          <div className="surface-flat p-3">
            <p className="display text-xl">{Object.keys(save.achievements).length}</p>
            <p className="label-xs mt-1">Başarım</p>
          </div>
          <div className="surface-flat p-3">
            <p className="display text-xl">{save.stats.gamesPlayed}</p>
            <p className="label-xs mt-1">Oyun</p>
          </div>
        </div>
      </Card>

      {/* ---------------- Gizli oda / final ---------------- */}
      <section className="mt-8">
        <SectionTitle>Uzun yol</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2">
          <Card className="p-5">
            <div className="flex items-center gap-2.5">
              <KeyRound size={16} className="text-gold" />
              <p className="font-semibold">Gizli Oda</p>
            </div>
            <p className="mt-2 text-[13px] text-ink-dim">
              {save.secretRoomUnlocked
                ? 'Açık. İçeride ne olduğunu biliyorsun.'
                : `Üç anahtar gerekiyor. Şu an ${save.secretKeys} tane var.`}
            </p>
            <ProgressBar className="mt-3" value={save.secretKeys / 3} height="h-1.5" tone="gold" />
            {save.secretRoomUnlocked && (
              <Button size="sm" className="mt-4" variant="outline" full onClick={() => setView('secret')}>
                Odaya git
              </Button>
            )}
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2.5">
              <Sparkles size={16} className="text-accent" />
              <p className="font-semibold">Final</p>
            </div>
            <ul className="mt-2.5 space-y-1.5">
              {reqs.map((r) => (
                <li key={r.label} className="flex items-center justify-between text-[12px]">
                  <span className={r.done ? 'text-emerald-400' : 'text-ink-mute'}>
                    {r.done ? '✓' : '○'} {r.label}
                  </span>
                  <span className="tabular text-ink-mute">
                    {r.current}/{r.target}
                  </span>
                </li>
              ))}
            </ul>
            {finaleReady && (
              <Button size="sm" className="mt-4" full onClick={() => setView('finale')}>
                Finali aç
              </Button>
            )}
          </Card>
        </div>
      </section>

      {/* ---------------- Mesajlar ---------------- */}
      <section className="mt-8">
        <SectionTitle
          action={<span className="text-xs text-ink-mute">{save.unlockedMessages.length} mesaj</span>}
        >
          Mesajlar
        </SectionTitle>
        <div className="space-y-3">
          {save.unlockedMessages
            .map((id) => messageById.get(id))
            .filter(Boolean)
            .map((m) => (
              <Card key={m!.id} className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="display text-lg">{m!.title}</p>
                  <span className="shrink-0 rounded-full bg-white/[0.07] px-2 py-0.5 text-[10px] text-ink-mute">
                    {m!.source}
                  </span>
                </div>
                <p className="mt-2 text-[14px] leading-relaxed text-ink-dim">{m!.body}</p>
              </Card>
            ))}
        </div>
      </section>

      {/* ---------------- Gorunum ---------------- */}
      <section className="mt-8">
        <SectionTitle>Görünüm</SectionTitle>

        <Card className="p-5">
          <p className="label-xs">Tema</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {themes.map((t) => {
              const owned = save.ownedThemes.includes(t.id)
              const active = save.activeTheme === t.id
              return (
                <button
                  key={t.id}
                  disabled={!owned}
                  onClick={() => equipTheme(t.id)}
                  className={cx(
                    'flex items-center gap-2 rounded-full border px-3 py-2 text-[12px] transition-all',
                    active ? 'border-accent bg-accent/12 text-accent' : 'border-line/70 text-ink-dim',
                    !owned && 'opacity-40',
                  )}
                >
                  <span
                    className="h-3.5 w-3.5 rounded-full border border-white/20"
                    style={{ background: `rgb(${t.vars['--accent']})` }}
                  />
                  {t.name}
                </button>
              )
            })}
          </div>

          <p className="label-xs mt-6">Çerçeve</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {frames.map((f) => {
              const owned = save.ownedFrames.includes(f.id)
              return (
                <button
                  key={f.id}
                  disabled={!owned}
                  onClick={() => equipFrame(f.id)}
                  className={cx(
                    'rounded-full border px-3 py-2 text-[12px] transition-all',
                    save.activeFrame === f.id
                      ? 'border-accent bg-accent/12 text-accent'
                      : 'border-line/70 text-ink-dim',
                    !owned && 'opacity-40',
                  )}
                >
                  {f.name}
                </button>
              )
            })}
          </div>

          <p className="label-xs mt-6">İmleç izi</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {trails.map((t) => {
              const owned = save.ownedTrails.includes(t.id)
              return (
                <button
                  key={t.id}
                  disabled={!owned}
                  onClick={() => equipTrail(t.id)}
                  className={cx(
                    'rounded-full border px-3 py-2 text-[12px] transition-all',
                    save.activeTrail === t.id
                      ? 'border-accent bg-accent/12 text-accent'
                      : 'border-line/70 text-ink-dim',
                    !owned && 'opacity-40',
                  )}
                >
                  {t.name}
                </button>
              )
            })}
          </div>

          <p className="label-xs mt-6">Unvan</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => equipTitle(null)}
              className={cx(
                'rounded-full border px-3 py-2 text-[12px] transition-all',
                save.activeTitle === null ? 'border-accent bg-accent/12 text-accent' : 'border-line/70 text-ink-dim',
              )}
            >
              Level unvanı ({titleForLevel(save.level)})
            </button>
            {save.ownedTitles.map((t) => (
              <button
                key={t}
                onClick={() => equipTitle(t)}
                className={cx(
                  'rounded-full border px-3 py-2 text-[12px] transition-all',
                  save.activeTitle === t ? 'border-accent bg-accent/12 text-accent' : 'border-line/70 text-ink-dim',
                )}
              >
                {t}
              </button>
            ))}
            {save.ownedTitles.length === 0 && (
              <span className="self-center text-[12px] text-ink-mute">
                Dükkândan unvan alabilirsin.
              </span>
            )}
          </div>
        </Card>
      </section>

      {/* ---------------- Ayarlar ---------------- */}
      <section className="mt-8">
        <SectionTitle>Ayarlar</SectionTitle>
        <Card className="divide-y divide-line/40">
          <Toggle
            label="Ses efektleri"
            value={save.settings.sfx}
            onChange={(v) => updateSettings({ sfx: v })}
          />
          <Toggle
            label="Ortam müziği"
            hint="Hafif bir arka plan sesi. İstersen kapalı kalsın."
            value={save.settings.music}
            onChange={(v) => updateSettings({ music: v })}
          />
          <div className="flex items-center justify-between gap-4 px-5 py-4">
            <div>
              <p className="text-sm">Ses seviyesi</p>
              <p className="text-[11px] text-ink-mute">%{Math.round(save.settings.volume * 100)}</p>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={save.settings.volume}
              onChange={(e) => updateSettings({ volume: Number(e.target.value) })}
              className="w-36"
              aria-label="Ses seviyesi"
            />
          </div>
          <Toggle
            label="Hareketi azalt"
            hint="Animasyonlar ve parçacıklar sadeleşir."
            value={save.settings.reducedMotion}
            onChange={(v) => updateSettings({ reducedMotion: v })}
          />
          <Toggle
            label="Titreşim"
            hint="Sadece destekleyen telefonlarda."
            value={save.settings.haptics}
            onChange={(v) => updateSettings({ haptics: v })}
          />
          <Toggle
            label="Özel imleç"
            hint="Masaüstünde geçerli."
            value={save.settings.customCursor}
            onChange={(v) => updateSettings({ customCursor: v })}
          />

          <div className="flex items-center justify-between px-5 py-4">
            <p className="text-sm text-ink-mute">Sürüm 1.0 · save v{save.saveVersion}</p>
            {/* Gizli anahtar: ayarlarin en altindaki nokta */}
            <button
              onClick={() => setFlag('secret-settings')}
              aria-label="."
              className="h-2 w-2 rounded-full bg-ink-mute/20 transition-colors hover:bg-accent"
            />
          </div>
        </Card>

        <Button variant="danger" className="mt-4" full onClick={() => setResetStep(1)}>
          İlerlemeyi sıfırla
        </Button>
      </section>

      {/* ---------------- Sifirlama ---------------- */}
      <Modal open={resetStep > 0} onClose={closeReset} title="Emin misin?">
        {resetStep === 1 ? (
          <>
            <p className="text-sm leading-relaxed text-ink-dim">
              Bütün leveller, başarımlar, öpücükler, koleksiyon ve rekorlar silinecek. Geri dönüşü yok.
            </p>
            <div className="mt-6 flex gap-3">
              <Button variant="ghost" full onClick={closeReset}>
                Vazgeç
              </Button>
              <Button variant="danger" full onClick={() => setResetStep(2)}>
                Devam et
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm leading-relaxed text-ink-dim">
              Son adım. Onaylamak için aşağıya <span className="font-mono font-semibold text-accent">BUSE</span> yaz.
            </p>
            <input
              autoFocus
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="BUSE"
              aria-label="Onay metni"
              className="mt-4 h-12 w-full rounded-md border border-line bg-bg-2 px-4 font-mono tracking-[0.3em] outline-none focus:border-accent"
            />
            <div className="mt-6 flex gap-3">
              <Button variant="ghost" full onClick={closeReset}>
                Vazgeç
              </Button>
              <Button
                variant="danger"
                full
                disabled={confirmText.trim().toUpperCase() !== 'BUSE'}
                onClick={() => {
                  resetProgress()
                  setResetStep(0)
                  setConfirmText('')
                }}
              >
                Sıfırla
              </Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}

function Toggle({
  label,
  hint,
  value,
  onChange,
}: {
  label: string
  hint?: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4">
      <div className="min-w-0">
        <p className="text-sm">{label}</p>
        {hint && <p className="mt-0.5 text-[11px] leading-snug text-ink-mute">{hint}</p>}
      </div>
      <button
        role="switch"
        aria-checked={value}
        aria-label={label}
        onClick={() => onChange(!value)}
        className={cx(
          'relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200',
          value ? 'bg-accent' : 'bg-bg-3',
        )}
      >
        <motion.span
          layout
          transition={{ type: 'spring', stiffness: 520, damping: 34 }}
          className={cx(
            'absolute top-1 h-5 w-5 rounded-full bg-white shadow',
            value ? 'right-1' : 'left-1',
          )}
        />
      </button>
    </div>
  )
}
