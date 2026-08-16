import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { useGame } from '../store/useGame'
import { Button } from './ui'
import { siteConfig } from '../config/site'
import { audio } from '../systems/audio'

const STEPS = [
  {
    glyph: '❋',
    title: `Merhaba ${siteConfig.personName}.`,
    body: 'Burası senin küçük oyun alanın. Başka kimse için yapılmadı, başka kimseye de açılmayacak.',
  },
  {
    glyph: '💋',
    title: 'Oyna, kazan, biriktir.',
    body: 'Mini oyunlar XP ve öpücük veriyor. Level atladıkça yeni oyunlar, temalar ve mesajlar açılıyor.',
  },
  {
    glyph: '⌖',
    title: 'Her şey göründüğü gibi değil.',
    body: 'Bazı yerlerde sırlar sakladım. Tıklanmayacak gibi duran şeylere tıkla, bekle, dene. Bulacaksın.',
  },
]

export function Onboarding() {
  const onboarded = useGame((s) => s.save.onboarded)
  const complete = useGame((s) => s.completeOnboarding)
  const [step, setStep] = useState(0)

  if (onboarded) return null

  const last = step === STEPS.length - 1
  const current = STEPS[step]

  const next = () => {
    audio.unlock()
    audio.play('click')
    if (last) complete()
    else setStep((s) => s + 1)
  }

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-bg-0 p-5">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70rem_50rem_at_50%_-10%,rgb(var(--accent)/0.22),transparent_60%)]" />

      <div className="relative w-full max-w-md">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -18 }}
            transition={{ type: 'spring', stiffness: 280, damping: 28 }}
            className="text-center"
          >
            <motion.div
              className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-accent/12 text-4xl text-accent"
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
            >
              {current.glyph}
            </motion.div>
            <h1 className="display mt-7 text-3xl leading-tight sm:text-4xl">{current.title}</h1>
            <p className="mx-auto mt-4 max-w-sm text-[15px] leading-relaxed text-ink-dim">{current.body}</p>
          </motion.div>
        </AnimatePresence>

        <div className="mt-10 flex items-center justify-center gap-2">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step ? 'w-6 bg-accent' : 'w-1.5 bg-line'
              }`}
            />
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <Button size="lg" onClick={next} className="min-w-[190px]">
            {last ? 'Başla' : 'Devam'}
          </Button>
        </div>

        {!last && (
          <button
            onClick={() => {
              audio.unlock()
              complete()
            }}
            className="mx-auto mt-4 block text-xs text-ink-mute transition-colors hover:text-ink"
          >
            geç
          </button>
        )}
      </div>
    </div>
  )
}
