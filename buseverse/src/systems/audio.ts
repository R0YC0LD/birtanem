/**
 * Hafif ses motoru.
 *
 * Telif sorunu olmamasi ve asset bagimliligi olmamasi icin butun sesler
 * Web Audio API ile sentezleniyor. Dosya yok, indirme yok, 404 yok.
 * AudioContext ilk kullanici etkilesiminden once olusturulmuyor (autoplay kurali).
 */

export type Sfx =
  | 'hover'
  | 'click'
  | 'back'
  | 'pop'
  | 'kiss'
  | 'xp'
  | 'coin'
  | 'perfect'
  | 'combo'
  | 'error'
  | 'achievement'
  | 'levelup'
  | 'secret'
  | 'purchase'
  | 'start'
  | 'lose'

interface Note {
  freq: number
  /** baslangic gecikmesi (sn) */
  at: number
  /** sure (sn) */
  dur: number
  type?: OscillatorType
  gain?: number
  /** frekans kaymasi (bitis frekansi) */
  glide?: number
}

const RECIPES: Record<Sfx, Note[]> = {
  hover: [{ freq: 880, at: 0, dur: 0.05, type: 'sine', gain: 0.045 }],
  click: [{ freq: 520, at: 0, dur: 0.07, type: 'triangle', gain: 0.09, glide: 700 }],
  back: [{ freq: 420, at: 0, dur: 0.09, type: 'triangle', gain: 0.08, glide: 280 }],
  pop: [{ freq: 660, at: 0, dur: 0.06, type: 'sine', gain: 0.1, glide: 990 }],
  kiss: [
    { freq: 740, at: 0, dur: 0.06, type: 'sine', gain: 0.09, glide: 1180 },
    { freq: 1180, at: 0.05, dur: 0.09, type: 'sine', gain: 0.06 },
  ],
  xp: [
    { freq: 587, at: 0, dur: 0.07, type: 'triangle', gain: 0.07 },
    { freq: 880, at: 0.06, dur: 0.09, type: 'triangle', gain: 0.06 },
  ],
  coin: [
    { freq: 988, at: 0, dur: 0.05, type: 'square', gain: 0.05 },
    { freq: 1319, at: 0.05, dur: 0.11, type: 'square', gain: 0.045 },
  ],
  perfect: [
    { freq: 784, at: 0, dur: 0.07, type: 'sine', gain: 0.08 },
    { freq: 1046, at: 0.06, dur: 0.08, type: 'sine', gain: 0.07 },
    { freq: 1568, at: 0.13, dur: 0.13, type: 'sine', gain: 0.055 },
  ],
  combo: [{ freq: 660, at: 0, dur: 0.08, type: 'triangle', gain: 0.07, glide: 1320 }],
  error: [{ freq: 200, at: 0, dur: 0.14, type: 'sawtooth', gain: 0.055, glide: 120 }],
  achievement: [
    { freq: 523, at: 0, dur: 0.12, type: 'sine', gain: 0.075 },
    { freq: 659, at: 0.1, dur: 0.12, type: 'sine', gain: 0.075 },
    { freq: 784, at: 0.2, dur: 0.16, type: 'sine', gain: 0.08 },
    { freq: 1046, at: 0.32, dur: 0.3, type: 'sine', gain: 0.06 },
  ],
  levelup: [
    { freq: 392, at: 0, dur: 0.14, type: 'triangle', gain: 0.08 },
    { freq: 523, at: 0.12, dur: 0.14, type: 'triangle', gain: 0.08 },
    { freq: 659, at: 0.24, dur: 0.14, type: 'triangle', gain: 0.085 },
    { freq: 784, at: 0.36, dur: 0.2, type: 'triangle', gain: 0.09 },
    { freq: 1046, at: 0.54, dur: 0.5, type: 'sine', gain: 0.07 },
  ],
  secret: [
    { freq: 330, at: 0, dur: 0.2, type: 'sine', gain: 0.07, glide: 494 },
    { freq: 494, at: 0.18, dur: 0.34, type: 'sine', gain: 0.06, glide: 740 },
  ],
  purchase: [
    { freq: 660, at: 0, dur: 0.08, type: 'triangle', gain: 0.07 },
    { freq: 990, at: 0.07, dur: 0.14, type: 'triangle', gain: 0.06 },
  ],
  start: [
    { freq: 440, at: 0, dur: 0.1, type: 'sine', gain: 0.07 },
    { freq: 660, at: 0.09, dur: 0.16, type: 'sine', gain: 0.06 },
  ],
  lose: [
    { freq: 392, at: 0, dur: 0.16, type: 'triangle', gain: 0.07 },
    { freq: 294, at: 0.14, dur: 0.24, type: 'triangle', gain: 0.06, glide: 196 },
  ],
}

class AudioEngine {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private musicGain: GainNode | null = null
  private musicTimer: number | null = null
  private musicNodes: OscillatorNode[] = []

  enabled = true
  musicEnabled = false
  volume = 0.6
  private unlocked = false

  /** Ilk kullanici etkilesiminde cagrilir. */
  unlock() {
    if (this.unlocked) return
    try {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctor) return
      this.ctx = new Ctor()
      this.master = this.ctx.createGain()
      this.master.gain.value = this.volume
      this.master.connect(this.ctx.destination)
      this.musicGain = this.ctx.createGain()
      this.musicGain.gain.value = 0
      this.musicGain.connect(this.master)
      this.unlocked = true
      if (this.musicEnabled) this.startMusic()
    } catch {
      this.ctx = null
    }
  }

  setVolume(v: number) {
    this.volume = Math.min(1, Math.max(0, v))
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05)
    }
  }

  setEnabled(on: boolean) {
    this.enabled = on
  }

  play(sfx: Sfx) {
    if (!this.enabled || !this.ctx || !this.master) return
    const ctx = this.ctx
    if (ctx.state === 'suspended') void ctx.resume()
    const now = ctx.currentTime
    for (const note of RECIPES[sfx]) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = note.type ?? 'sine'
      osc.frequency.setValueAtTime(note.freq, now + note.at)
      if (note.glide) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, note.glide), now + note.at + note.dur)
      }
      const peak = note.gain ?? 0.06
      gain.gain.setValueAtTime(0.0001, now + note.at)
      gain.gain.exponentialRampToValueAtTime(peak, now + note.at + 0.012)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + note.at + note.dur)
      osc.connect(gain)
      gain.connect(this.master)
      osc.start(now + note.at)
      osc.stop(now + note.at + note.dur + 0.05)
      osc.onended = () => {
        osc.disconnect()
        gain.disconnect()
      }
    }
  }

  /* ---------------- Ambient muzik ---------------- */

  setMusic(on: boolean) {
    this.musicEnabled = on
    if (!this.ctx) return
    if (on) this.startMusic()
    else this.stopMusic()
  }

  private startMusic() {
    if (!this.ctx || !this.musicGain || this.musicNodes.length) return
    const ctx = this.ctx
    // Iki hafif detuned pad + cok yavas filtre hareketi
    const chord = [146.83, 220, 293.66] // D3 / A3 / D4
    for (const f of chord) {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = f
      const g = ctx.createGain()
      g.gain.value = 0.11
      const lfo = ctx.createOscillator()
      lfo.frequency.value = 0.05 + Math.random() * 0.06
      const lfoGain = ctx.createGain()
      lfoGain.gain.value = 0.9
      lfo.connect(lfoGain)
      lfoGain.connect(osc.detune)
      osc.connect(g)
      g.connect(this.musicGain)
      osc.start()
      lfo.start()
      this.musicNodes.push(osc, lfo)
    }
    this.musicGain.gain.setTargetAtTime(0.16, ctx.currentTime, 2.4)

    // Ara ara tek nota — cok seyrek, rahatsiz etmesin
    const notes = [587.33, 659.25, 783.99, 880]
    this.musicTimer = window.setInterval(() => {
      if (!this.ctx || !this.musicGain || !this.musicEnabled) return
      const c = this.ctx
      const osc = c.createOscillator()
      const g = c.createGain()
      osc.type = 'sine'
      osc.frequency.value = notes[Math.floor(Math.random() * notes.length)]
      g.gain.setValueAtTime(0.0001, c.currentTime)
      g.gain.exponentialRampToValueAtTime(0.05, c.currentTime + 0.6)
      g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 3.4)
      osc.connect(g)
      g.connect(this.musicGain)
      osc.start()
      osc.stop(c.currentTime + 3.6)
      osc.onended = () => {
        osc.disconnect()
        g.disconnect()
      }
    }, 9000)
  }

  private stopMusic() {
    if (this.musicTimer) {
      window.clearInterval(this.musicTimer)
      this.musicTimer = null
    }
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.6)
    }
    const nodes = this.musicNodes
    this.musicNodes = []
    window.setTimeout(() => {
      for (const n of nodes) {
        try {
          n.stop()
          n.disconnect()
        } catch {
          /* zaten durmus */
        }
      }
    }, 1400)
  }

  dispose() {
    this.stopMusic()
    try {
      void this.ctx?.close()
    } catch {
      /* yok say */
    }
    this.ctx = null
  }
}

export const audio = new AudioEngine()

/** Titresim — destekleniyorsa ve ayar aciksa. */
export function haptic(pattern: number | number[], enabled: boolean) {
  if (!enabled) return
  try {
    if ('vibrate' in navigator) navigator.vibrate(pattern)
  } catch {
    /* desteklenmiyor */
  }
}
