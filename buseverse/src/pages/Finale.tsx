import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { useGame } from '../store/useGame'
import { isFinaleUnlocked } from '../systems/engine'
import { messageById } from '../data/messages'
import { siteConfig } from '../config/site'
import { Button } from '../components/ui'
import { randFloat } from '../utils'

/**
 * Final: sade, karanlik, sessiz.
 * Efekt yigini yok — sadece yildizlar, kisa bir mesaj ve tek bir buyuk 💋.
 */
export function Finale() {
  const save = useGame((s) => s.save)
  const setFlag = useGame((s) => s.setFlag)
  const setView = useGame((s) => s.setView)
  const unlockMessage = useGame((s) => s.unlockMessage)
  const unlocked = isFinaleUnlocked(save)
  const [stage, setStage] = useState(0)

  const stars = useMemo(
    () =>
      Array.from({ length: 90 }, () => ({
        x: randFloat(0, 100),
        y: randFloat(0, 100),
        size: randFloat(1, 3),
        delay: randFloat(0, 5),
      })),
    [],
  )

  useEffect(() => {
    if (!unlocked) return
    const timers = [
      window.setTimeout(() => setStage(1), 1600),
      window.setTimeout(() => setStage(2), 4200),
      window.setTimeout(() => setStage(3), 7000),
      window.setTimeout(() => {
        setStage(4)
        unlockMessage('msg-finale')
        setFlag('finale-seen')
      }, 9200),
    ]
    return () => timers.forEach((t) => window.clearTimeout(t))
  }, [unlocked, setFlag, unlockMessage])

  if (!unlocked) {
    return (
      <div className="mx-auto max-w-md px-gutter py-24 text-center">
        <p className="display text-5xl text-ink-mute/40">✧</p>
        <h1 className="display mt-6 text-2xl">Henüz değil</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-dim">
          Buranın bir sonu var, ama daha gelmedin. Profilinde neyin eksik olduğunu görebilirsin.
        </p>
        <Button variant="outline" className="mt-6" onClick={() => setView('profile')}>
          Koşullara bak
        </Button>
      </div>
    )
  }

  const msg = messageById.get('msg-finale')

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-[#06060A]">
      {stars.map((s, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full bg-white"
          style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.1, 0.7, 0.1] }}
          transition={{ duration: 4, delay: s.delay, repeat: Infinity, ease: 'easeInOut' }}
          aria-hidden
        />
      ))}

      <div className="relative flex h-full flex-col items-center justify-center px-6 text-center">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: stage >= 1 ? 1 : 0 }}
          transition={{ duration: 1.6 }}
          className="display text-2xl text-white/70 sm:text-3xl"
        >
          For {siteConfig.personName}
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: stage >= 2 ? 1 : 0, y: stage >= 2 ? 0 : 12 }}
          transition={{ duration: 1.6 }}
          className="mt-8 max-w-sm text-[15px] leading-relaxed text-white/55"
        >
          {msg?.body ?? 'Bütün oyunların ödülü buydu.'}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.4 }}
          animate={{
            opacity: stage >= 3 ? 1 : 0,
            scale: stage >= 3 ? 1 : 0.4,
          }}
          transition={{ type: 'spring', stiffness: 90, damping: 18 }}
          className="mt-14 text-[110px] leading-none sm:text-[150px]"
          style={{ filter: 'drop-shadow(0 0 60px rgb(236 150 172 / 0.55))' }}
          aria-label="öpücük"
        >
          💋
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: stage >= 4 ? 1 : 0 }}
          transition={{ duration: 1.4 }}
          className="mt-14"
        >
          <p className="text-[11px] uppercase tracking-[0.3em] text-white/30">
            {siteConfig.siteName} · Level {save.level}
          </p>
          <Button variant="outline" size="sm" className="mt-6" onClick={() => setView('home')}>
            Geri dön
          </Button>
        </motion.div>
      </div>
    </div>
  )
}
