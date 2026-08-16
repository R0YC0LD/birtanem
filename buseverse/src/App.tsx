import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef } from 'react'
import type { ViewId } from './types'
import { useGame } from './store/useGame'
import { useRandomDelight, useSecrets } from './hooks/useSecrets'
import { Atmosphere, CursorLayer } from './components/Atmosphere'
import { AchievementPopup, Floaters, LevelUpModal, RewardModal, Toasts } from './components/Overlays'
import { BottomNav, SideNav, TopBar } from './components/Nav'
import { GameShell } from './components/GameShell'
import { Onboarding } from './components/Onboarding'
import { Home } from './pages/Home'
import { Games } from './pages/Games'
import { Achievements } from './pages/Achievements'
import { Collection } from './pages/Collection'
import { Shop } from './pages/Shop'
import { Stats } from './pages/Stats'
import { Profile } from './pages/Profile'
import { SecretRoom } from './pages/SecretRoom'
import { Finale } from './pages/Finale'
import { ErrorBoundary } from './components/ErrorBoundary'
import { writeNow } from './systems/save'

const VALID_VIEWS: ViewId[] = [
  'home',
  'games',
  'achievements',
  'collection',
  'shop',
  'stats',
  'profile',
  'secret',
  'finale',
]

function CurrentView({ view }: { view: ViewId }) {
  switch (view) {
    case 'games':
      return <Games />
    case 'achievements':
      return <Achievements />
    case 'collection':
      return <Collection />
    case 'shop':
      return <Shop />
    case 'stats':
      return <Stats />
    case 'profile':
      return <Profile />
    case 'secret':
      return <SecretRoom />
    case 'finale':
      return <Finale />
    case 'home':
    default:
      return <Home />
  }
}

export default function App() {
  const hydrated = useGame((s) => s.hydrated)
  const hydrate = useGame((s) => s.hydrate)
  const registerVisit = useGame((s) => s.registerVisit)
  const onboarded = useGame((s) => s.save.onboarded)
  const view = useGame((s) => s.view)
  const setView = useGame((s) => s.setView)
  const activeGame = useGame((s) => s.activeGame)
  const reducedMotion = useGame((s) => s.save.settings.reducedMotion)

  useSecrets()
  useRandomDelight()

  /* Ilk yukleme */
  useEffect(() => {
    hydrate()
  }, [hydrate])

  /*
   * Onboarding bitince ziyaret kaydi (streak / gunluk gorev / ozel gun).
   * Ref korumasi StrictMode'un cift effect cagrisinda oturum sayacinin
   * iki kez artmasini engelliyor.
   */
  const visitedRef = useRef(false)
  useEffect(() => {
    if (!hydrated || !onboarded || visitedRef.current) return
    visitedRef.current = true
    registerVisit()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, onboarded])

  /* Hareket azaltma bayragini koke yaz */
  useEffect(() => {
    document.documentElement.dataset.reducedMotion = reducedMotion ? 'true' : 'false'
  }, [reducedMotion])

  /* Hash ile derin baglanti (GitHub Pages uyumlu) */
  useEffect(() => {
    if (!hydrated) return
    const fromHash = window.location.hash.replace('#', '') as ViewId
    if (VALID_VIEWS.includes(fromHash) && fromHash !== 'home') setView(fromHash)
    const onHash = () => {
      const v = window.location.hash.replace('#', '') as ViewId
      if (VALID_VIEWS.includes(v)) setView(v)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated])

  /* Sayfadan cikarken son kaydi yaz */
  useEffect(() => {
    const onLeave = () => writeNow(useGame.getState().save)
    window.addEventListener('pagehide', onLeave)
    return () => window.removeEventListener('pagehide', onLeave)
  }, [])

  if (!hydrated) {
    return (
      <div className="grid min-h-screen place-items-center bg-bg-0">
        <motion.div
          className="text-4xl text-accent"
          animate={{ scale: [1, 1.18, 1] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          aria-label="Yükleniyor"
        >
          ♥
        </motion.div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <Atmosphere />
      <CursorLayer />

      {!onboarded && <Onboarding />}

      {onboarded && (
        <>
          <SideNav />
          <div className="relative z-10 min-h-screen lg:pl-[84px]">
            {view !== 'finale' && <TopBar />}
            <main className="pb-[calc(theme(spacing.nav)+1rem)] lg:pb-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={view}
                  initial={{ opacity: 0, y: 12, scale: 0.995 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.997 }}
                  transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                >
                  <CurrentView view={view} />
                </motion.div>
              </AnimatePresence>
            </main>
          </div>
          {view !== 'finale' && <BottomNav />}
        </>
      )}

      <AnimatePresence>{activeGame && <GameShell key="game-shell" />}</AnimatePresence>

      <AchievementPopup />
      <LevelUpModal />
      <RewardModal />
      <Toasts />
      <Floaters />
    </ErrorBoundary>
  )
}
