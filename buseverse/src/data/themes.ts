import type { ThemeDef } from '../types'

const darkRarity = {
  '--r-common': '154 163 174',
  '--r-uncommon': '127 184 154',
  '--r-rare': '126 166 224',
  '--r-epic': '181 138 224',
  '--r-legendary': '224 168 92',
  '--r-secret': '227 106 133',
}

const lightRarity = {
  '--r-common': '108 118 130',
  '--r-uncommon': '52 124 92',
  '--r-rare': '48 100 172',
  '--r-epic': '118 72 172',
  '--r-legendary': '158 108 34',
  '--r-secret': '188 58 94',
}

export const themes: ThemeDef[] = [
  {
    id: 'ember',
    name: 'Ember (varsayılan)',
    free: true,
    vars: {
      '--bg-0': '18 10 24',
      '--bg-1': '28 16 36',
      '--bg-2': '38 22 48',
      '--bg-3': '52 30 62',
      '--line': '66 40 76',
      '--ink': '246 239 233',
      '--ink-dim': '200 182 192',
      '--ink-mute': '142 124 136',
      '--accent': '227 106 133',
      '--accent-soft': '240 168 186',
      '--gold': '233 199 154',
      '--lav': '183 155 232',
      '--wine': '122 31 61',
      '--scheme': 'dark',
      ...darkRarity,
    },
  },
  {
    id: 'midnight-rose',
    name: 'Midnight Rose',
    vars: {
      '--bg-0': '12 10 26',
      '--bg-1': '20 17 40',
      '--bg-2': '30 25 56',
      '--bg-3': '42 34 74',
      '--line': '60 50 96',
      '--ink': '240 238 250',
      '--ink-dim': '190 186 214',
      '--ink-mute': '134 128 162',
      '--accent': '236 122 158',
      '--accent-soft': '246 178 200',
      '--gold': '226 200 170',
      '--lav': '160 148 240',
      '--wine': '96 30 78',
      '--scheme': 'dark',
      ...darkRarity,
    },
  },
  {
    id: 'lavender-night',
    name: 'Lavender Night',
    vars: {
      '--bg-0': '16 12 30',
      '--bg-1': '26 20 46',
      '--bg-2': '36 28 62',
      '--bg-3': '48 38 82',
      '--line': '68 54 108',
      '--ink': '240 236 250',
      '--ink-dim': '196 188 222',
      '--ink-mute': '142 132 174',
      '--accent': '178 150 240',
      '--accent-soft': '206 186 250',
      '--gold': '226 206 166',
      '--lav': '200 178 250',
      '--wine': '76 40 118',
      '--scheme': 'dark',
      ...darkRarity,
    },
  },
  {
    id: 'golden-hour',
    name: 'Golden Hour',
    vars: {
      '--bg-0': '28 16 18',
      '--bg-1': '40 22 24',
      '--bg-2': '54 30 30',
      '--bg-3': '70 40 36',
      '--line': '92 56 46',
      '--ink': '252 240 228',
      '--ink-dim': '214 190 172',
      '--ink-mute': '158 130 112',
      '--accent': '232 150 96',
      '--accent-soft': '244 190 148',
      '--gold': '244 206 140',
      '--lav': '190 148 200',
      '--wine': '128 48 40',
      '--scheme': 'dark',
      ...darkRarity,
    },
  },
  {
    id: 'ivory-dream',
    name: 'Ivory Dream',
    vars: {
      '--bg-0': '250 245 241',
      '--bg-1': '255 251 248',
      '--bg-2': '246 236 234',
      '--bg-3': '236 223 222',
      '--line': '218 200 200',
      '--ink': '44 28 36',
      '--ink-dim': '96 74 86',
      '--ink-mute': '146 122 134',
      '--accent': '196 72 104',
      '--accent-soft': '224 136 162',
      '--gold': '172 128 58',
      '--lav': '128 102 188',
      '--wine': '146 44 76',
      '--scheme': 'light',
      ...lightRarity,
    },
  },
  {
    id: 'finale',
    name: 'Son Perde',
    vars: {
      '--bg-0': '6 6 10',
      '--bg-1': '12 12 18',
      '--bg-2': '18 18 26',
      '--bg-3': '26 26 36',
      '--line': '44 44 58',
      '--ink': '246 244 250',
      '--ink-dim': '190 188 200',
      '--ink-mute': '130 128 142',
      '--accent': '236 150 172',
      '--accent-soft': '246 196 210',
      '--gold': '232 214 176',
      '--lav': '176 168 226',
      '--wine': '90 34 56',
      '--scheme': 'dark',
      ...darkRarity,
    },
  },
]

export const themeById = new Map(themes.map((t) => [t.id, t]))
export const DEFAULT_THEME = 'ember'

export function applyTheme(themeId: string) {
  const theme = themeById.get(themeId) ?? themeById.get(DEFAULT_THEME)!
  const root = document.documentElement
  for (const [k, val] of Object.entries(theme.vars)) {
    if (k === '--scheme') {
      root.dataset.scheme = val
      root.style.colorScheme = val
      continue
    }
    root.style.setProperty(k, val)
  }
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) {
    const bg = theme.vars['--bg-0'].split(' ').map(Number)
    meta.setAttribute('content', `rgb(${bg[0]}, ${bg[1]}, ${bg[2]})`)
  }
}

/* ------------------------------------------------------------------ */
/* Cerceve & particle iz tanimlari                                     */
/* ------------------------------------------------------------------ */

export interface FrameDef {
  id: string
  name: string
  /** avatar cevresine uygulanan sinif */
  ring: string
  free?: boolean
}

export const frames: FrameDef[] = [
  { id: 'plain', name: 'Sade', ring: 'ring-2 ring-line', free: true },
  { id: 'thin-gold', name: 'İnce Altın', ring: 'ring-2 ring-gold/70' },
  { id: 'rose-ring', name: 'Gül Halkası', ring: 'ring-4 ring-accent/60' },
  { id: 'ember', name: 'Kor', ring: 'ring-4 ring-wine shadow-glow' },
  { id: 'lavender', name: 'Lavanta', ring: 'ring-4 ring-lav/70' },
  { id: 'infinity', name: 'Sonsuzluk', ring: 'ring-4 ring-gold shadow-glow' },
  { id: 'legend', name: 'Efsane', ring: 'ring-[6px] ring-rarity-legendary shadow-glow' },
]

export const frameById = new Map(frames.map((f) => [f.id, f]))

export interface TrailDef {
  id: string
  name: string
  glyphs: string[]
  color: string
  free?: boolean
}

export const trails: TrailDef[] = [
  { id: 'none', name: 'Kapalı', glyphs: [], color: '', free: true },
  { id: 'stardust', name: 'Yıldız Tozu', glyphs: ['✦', '✧', '·'], color: 'rgb(var(--lav))' },
  { id: 'petals', name: 'Gül Yaprağı', glyphs: ['✿', '❀', '·'], color: 'rgb(var(--accent))' },
  { id: 'gold-heart', name: 'Altın Kalp', glyphs: ['♥', '♡'], color: 'rgb(var(--gold))' },
  { id: 'sparks', name: 'Kıvılcım', glyphs: ['·', '✳'], color: 'rgb(var(--accent-soft))' },
]

export const trailById = new Map(trails.map((t) => [t.id, t]))
