type SfxName = 'cardPlay' | 'draw' | 'invalid' | 'uno' | 'win' | 'turn'

class SfxEngine {
  private context: AudioContext | null = null
  private enabled = true

  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }

  unlock(): void {
    if (!this.enabled) return
    const ctx = this.getContext()
    if (!ctx) return
    if (ctx.state === 'suspended') {
      void ctx.resume()
    }
  }

  play(name: SfxName): void {
    if (!this.enabled) return
    const ctx = this.getContext()
    if (!ctx || ctx.state === 'suspended') return

    switch (name) {
      case 'cardPlay':
        this.cardSlide(0.065, 0.15, 2000, 0)
        this.cardTap(560, 0.025, 0.055, 0.04)
        break
      case 'draw':
        this.cardSlide(0.085, 0.22, 1700, 0)
        this.cardTap(420, 0.03, 0.04, 0.06)
        break
      case 'invalid':
        this.toneGlide(180, 120, 0.14, 'sawtooth', 0.08)
        this.noiseBurst(0.04, 0.025, 1200, 0.02)
        break
      case 'uno':
        this.tone(620, 0.1, 'square', 0.08)
        this.tone(820, 0.12, 'square', 0.07, 0.1)
        this.noiseBurst(0.045, 0.03, 2500, 0.07)
        break
      case 'win':
        this.tone(420, 0.1, 'triangle', 0.08)
        this.tone(560, 0.11, 'triangle', 0.08, 0.11)
        this.tone(760, 0.16, 'triangle', 0.09, 0.23)
        this.noiseBurst(0.16, 0.04, 3000, 0.03)
        break
      case 'turn':
        this.tone(320, 0.045, 'sine', 0.03)
        break
      default:
        break
    }
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (!this.context) {
      const Ctx =
        window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctx) return null
      this.context = new Ctx()
    }
    return this.context
  }

  private tone(
    frequency: number,
    duration: number,
    type: OscillatorType,
    volume: number,
    delay = 0,
  ): void {
    const ctx = this.getContext()
    if (!ctx) return

    const start = ctx.currentTime + delay
    const end = start + duration

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = type
    osc.frequency.setValueAtTime(frequency, start)

    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.linearRampToValueAtTime(volume, start + 0.008)
    gain.gain.exponentialRampToValueAtTime(0.0001, end)

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(start)
    osc.stop(end)
  }

  private toneGlide(
    fromFrequency: number,
    toFrequency: number,
    duration: number,
    type: OscillatorType,
    volume: number,
    delay = 0,
  ): void {
    const ctx = this.getContext()
    if (!ctx) return

    const start = ctx.currentTime + delay
    const end = start + duration

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = type
    osc.frequency.setValueAtTime(fromFrequency, start)
    osc.frequency.exponentialRampToValueAtTime(Math.max(30, toFrequency), end)

    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.linearRampToValueAtTime(volume, start + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, end)

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(start)
    osc.stop(end)
  }

  // Short filtered noise burst used for paper/card friction and impact texture.
  private noiseBurst(duration: number, volume: number, centerHz: number, delay = 0): void {
    const ctx = this.getContext()
    if (!ctx) return

    const start = ctx.currentTime + delay
    const frameCount = Math.max(1, Math.floor(ctx.sampleRate * duration))
    const buffer = ctx.createBuffer(1, frameCount, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < frameCount; i += 1) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / frameCount)
    }

    const src = ctx.createBufferSource()
    src.buffer = buffer

    const band = ctx.createBiquadFilter()
    band.type = 'bandpass'
    band.frequency.setValueAtTime(centerHz, start)
    band.Q.setValueAtTime(0.8, start)

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.linearRampToValueAtTime(volume, start + 0.006)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)

    src.connect(band)
    band.connect(gain)
    gain.connect(ctx.destination)

    src.start(start)
    src.stop(start + duration)
  }

  private cardSlide(duration: number, volume: number, centerHz: number, delay = 0): void {
    this.noiseBurst(duration, volume, centerHz, delay)
    this.noiseBurst(duration * 0.7, volume * 0.55, centerHz * 0.7, delay + duration * 0.14)
  }

  private cardTap(frequency: number, duration: number, volume: number, delay = 0): void {
    this.tone(frequency, duration, 'triangle', volume, delay)
    this.tone(frequency * 1.9, duration * 0.45, 'sine', volume * 0.5, delay + 0.004)
  }
}

export const sfx = new SfxEngine()
