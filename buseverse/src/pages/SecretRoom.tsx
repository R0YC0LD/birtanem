import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { useGame } from '../store/useGame'
import { Card, SectionTitle } from '../components/ui'
import { messageById } from '../data/messages'
import { randFloat } from '../utils'
import { Burst } from '../components/Overlays'

interface Star {
  x: number
  y: number
  size: number
  delay: number
}

export function SecretRoom() {
  const unlocked = useGame((s) => s.save.secretRoomUnlocked)
  const flags = useGame((s) => s.save.flags)
  const setFlag = useGame((s) => s.setFlag)
  const unlockMessage = useGame((s) => s.unlockMessage)
  const setView = useGame((s) => s.setView)

  const [wishMade, setWishMade] = useState(!!flags['secret-wish'])

  const stars = useMemo<Star[]>(
    () =>
      Array.from({ length: 60 }, () => ({
        x: randFloat(2, 98),
        y: randFloat(4, 92),
        size: randFloat(1.5, 4),
        delay: randFloat(0, 4),
      })),
    [],
  )

  useEffect(() => {
    if (unlocked) unlockMessage('msg-secret-room')
  }, [unlocked, unlockMessage])

  useEffect(() => {
    if (flags['secret-wish'] && flags['secret-room'] && flags['secret-footer']) {
      setFlag('secret-room-all')
    }
  }, [flags, setFlag])

  if (!unlocked) {
    return (
      <div className="mx-auto max-w-md px-gutter py-24 text-center">
        <p className="display text-5xl text-ink-mute/40">🗝</p>
        <h1 className="display mt-6 text-2xl">Kapı kilitli</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-dim">
          Üç anahtar bulman gerekiyor. Biri başarımlarda, biri bir sırda, biri de beklemediğin bir yerde saklı.
        </p>
        <button
          onClick={() => setView('achievements')}
          className="mt-6 text-xs text-accent transition-opacity hover:opacity-70"
        >
          başarımlara bak →
        </button>
      </div>
    )
  }

  const msg = messageById.get('msg-secret-room')

  return (
    <div className="relative min-h-full overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(60rem_50rem_at_50%_20%,rgb(var(--lav)/0.18),transparent_65%)]" />

      {stars.map((s, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full bg-white"
          style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size }}
          animate={{ opacity: [0.15, 0.85, 0.15] }}
          transition={{ duration: 3.2, delay: s.delay, repeat: Infinity, ease: 'easeInOut' }}
          aria-hidden
        />
      ))}

      <div className="relative mx-auto max-w-2xl px-gutter pb-16 pt-10">
        <SectionTitle>Gizli Oda</SectionTitle>
        <p className="-mt-2 text-sm text-ink-dim">
          Burayı bulman biraz zamanını aldı. Zaten bütün mesele oydu.
        </p>

        {msg && (
          <Card className="mt-6 border-lav/30 bg-lav/[0.05] p-6">
            <p className="label-xs">{msg.source}</p>
            <p className="display mt-2 text-xl">{msg.title}</p>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-dim">{msg.body}</p>
          </Card>
        )}

        {/* Dilek yildizi */}
        <div className="mt-10 flex flex-col items-center">
          <motion.button
            onClick={() => {
              if (wishMade) return
              setWishMade(true)
              setFlag('secret-wish')
            }}
            whileTap={{ scale: 0.9 }}
            animate={wishMade ? { scale: 1.1 } : { y: [0, -10, 0] }}
            transition={wishMade ? { duration: 0.4 } : { duration: 4.4, repeat: Infinity, ease: 'easeInOut' }}
            className="relative text-6xl"
            style={{
              color: wishMade ? 'rgb(var(--gold))' : 'rgb(var(--ink-dim))',
              textShadow: wishMade ? '0 0 40px rgb(var(--gold)/0.8)' : '0 0 20px rgb(255 255 255 / 0.2)',
            }}
            aria-label="Dilek yıldızı"
          >
            {wishMade ? '☄' : '✦'}
            {wishMade && <Burst count={20} color="rgb(var(--gold))" size={4} />}
          </motion.button>
          <p className="mt-4 text-center text-[13px] text-ink-mute">
            {wishMade ? 'Dileğini tuttun. Ne dilediğini sormayacağım.' : 'Yıldıza dokun.'}
          </p>
        </div>

        <div className="mt-12 grid gap-3 sm:grid-cols-3">
          <Card className="p-4 text-center">
            <p className="display text-2xl">🗝</p>
            <p className="label-xs mt-2">Anahtar</p>
            <p className="mt-1 text-[12px] text-ink-mute">Üçü de bulundu</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="display text-2xl">{wishMade ? '☄' : '✦'}</p>
            <p className="label-xs mt-2">Dilek</p>
            <p className="mt-1 text-[12px] text-ink-mute">{wishMade ? 'Tutuldu' : 'Bekliyor'}</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="display text-2xl">∞</p>
            <p className="label-xs mt-2">Devamı</p>
            <p className="mt-1 text-[12px] text-ink-mute">Final level 45’te</p>
          </Card>
        </div>
      </div>
    </div>
  )
}
