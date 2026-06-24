'use client'

export class SoundEffects {
  private static ctx: AudioContext | null = null

  private static getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (!this.ctx) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
        if (AudioContextClass) {
          this.ctx = new AudioContextClass()
        }
      } catch (err) {
        console.warn('Web Audio API is not supported in this browser.', err)
      }
    }
    return this.ctx
  }

  public static play(type: 'success' | 'failure' | 'achievement') {
    if (typeof window === 'undefined') return

    // Read user preference (default to true)
    const soundEnabled = localStorage.getItem('cognara-sounds') !== 'false'
    if (!soundEnabled) return

    const ctx = this.getContext()
    if (!ctx) return

    try {
      // Resume context if browser suspended it due to user interaction policies
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {})
      }

      const now = ctx.currentTime

      if (type === 'success') {
        // High-quality synthesized positive chime (E5 -> A5)
        const osc1 = ctx.createOscillator()
        const osc2 = ctx.createOscillator()
        const gain = ctx.createGain()

        osc1.type = 'triangle'
        osc2.type = 'sine'

        osc1.frequency.setValueAtTime(659.25, now) // E5
        osc1.frequency.setValueAtTime(880.00, now + 0.08) // A5

        osc2.frequency.setValueAtTime(1109.73, now + 0.16) // C#6

        gain.gain.setValueAtTime(0, now)
        gain.gain.linearRampToValueAtTime(0.12, now + 0.04)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45)

        osc1.connect(gain)
        osc2.connect(gain)
        gain.connect(ctx.destination)

        osc1.start(now)
        osc2.start(now + 0.1)
        osc1.stop(now + 0.45)
        osc2.stop(now + 0.45)
      } else if (type === 'failure') {
        // Low warm warning buzzer
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        const filter = ctx.createBiquadFilter()

        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(160, now)
        osc.frequency.linearRampToValueAtTime(110, now + 0.25)

        filter.type = 'lowpass'
        filter.frequency.setValueAtTime(350, now)

        gain.gain.setValueAtTime(0, now)
        gain.gain.linearRampToValueAtTime(0.07, now + 0.03)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3)

        osc.connect(filter)
        filter.connect(gain)
        gain.connect(ctx.destination)

        osc.start(now)
        osc.stop(now + 0.3)
      } else if (type === 'achievement') {
        // Beautiful arpeggio sweep (C5 -> E5 -> G5 -> C6)
        const notes = [523.25, 659.25, 783.99, 1046.50]
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()

          osc.type = idx % 2 === 0 ? 'sine' : 'triangle'
          osc.frequency.setValueAtTime(freq, now + idx * 0.07)

          gain.gain.setValueAtTime(0, now + idx * 0.07)
          gain.gain.linearRampToValueAtTime(0.08, now + idx * 0.07 + 0.02)
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.45)

          osc.connect(gain)
          gain.connect(ctx.destination)

          osc.start(now + idx * 0.07)
          osc.stop(now + idx * 0.07 + 0.45)
        })
      }
    } catch (playErr) {
      console.warn('Failed to synthesize sound effect:', playErr)
    }
  }
}
