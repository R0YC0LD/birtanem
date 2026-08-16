import type { ComponentType } from 'react'
import type { GameId } from '../types'
import type { MiniGameProps } from '../components/GameShell'

import { HeartHunter } from './HeartHunter'
import { MemoryOfUs } from './MemoryOfUs'
import { KissRush } from './KissRush'
import { StarCatcher } from './StarCatcher'
import { PerfectTiming } from './PerfectTiming'
import { LoveDodge } from './LoveDodge'
import { LovePuzzle } from './LovePuzzle'
import { FindTheSecret } from './FindTheSecret'
import { LoveSnake } from './LoveSnake'
import { Constellation } from './Constellation'

/**
 * Yeni mini oyun eklemek icin:
 *  1. src/games/YeniOyun.tsx dosyasini MiniGameProps arayuzuyle olustur.
 *  2. src/data/games.ts icine GameDef ekle (id, unlockLevel, best metrigi...).
 *  3. src/types/index.ts icindeki GameId birlesimine id'yi ekle.
 *  4. Asagidaki haritaya bagla. Basarim/istatistik icin Stats'a alan ekleyip
 *     achievements.ts'te kullan.
 */
export const GAME_COMPONENTS: Record<GameId, ComponentType<MiniGameProps>> = {
  'heart-hunter': HeartHunter,
  memory: MemoryOfUs,
  'kiss-rush': KissRush,
  'star-catcher': StarCatcher,
  'perfect-timing': PerfectTiming,
  'love-dodge': LoveDodge,
  'love-puzzle': LovePuzzle,
  'find-secret': FindTheSecret,
  'love-snake': LoveSnake,
  constellation: Constellation,
}
