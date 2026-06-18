import { Howl } from 'howler'
import { useSettingsStore } from '@/stores/useSettingsStore'

const sounds: Record<string, Howl> = {
  correct: new Howl({ src: ['data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA='], volume: 0.5 }),
  wrong: new Howl({ src: ['data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA='], volume: 0.5 }),
  tick: new Howl({ src: ['data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA='], volume: 0.3 }),
  countdown: new Howl({ src: ['data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA='], volume: 0.6 }),
  complete: new Howl({ src: ['data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA='], volume: 0.7 }),
  click: new Howl({ src: ['data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA='], volume: 0.4 }),
}

let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext()
  }
  return audioCtx
}

function playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume = 0.3) {
  try {
    const ctx = getAudioContext()
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    oscillator.type = type
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime)
    gainNode.gain.setValueAtTime(volume, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)
    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + duration)
  } catch {
    // silence: audio context may fail in restricted environments
  }
}

export function useSound() {
  const soundEnabled = useSettingsStore((s) => s.soundEnabled)

  const play = (name: keyof typeof sounds, fallback: () => void) => {
    if (!soundEnabled) return
    try {
      const sound = sounds[name]
      if (sound.state() === 'loaded') {
        sound.play()
      } else {
        fallback()
      }
    } catch {
      fallback()
    }
  }

  const playCorrect = () =>
    play('correct', () => playTone(880, 0.15, 'sine', 0.3))

  const playWrong = () =>
    play('wrong', () => playTone(220, 0.3, 'sawtooth', 0.2))

  const playTick = () =>
    play('tick', () => playTone(600, 0.05, 'sine', 0.1))

  const playCountdown = () =>
    play('countdown', () => playTone(440, 0.2, 'square', 0.3))

  const playComplete = () => {
    if (!soundEnabled) return
    try {
      const ctx = getAudioContext()
      const now = ctx.currentTime
      ;[523.25, 659.25, 783.99].forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, now + i * 0.15)
        gain.gain.setValueAtTime(0.3, now + i * 0.15)
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.4)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now + i * 0.15)
        osc.stop(now + i * 0.15 + 0.4)
      })
    } catch {
      // silence: audio context may fail in restricted environments
    }
  }

  const playClick = () =>
    play('click', () => playTone(1000, 0.05, 'sine', 0.15))

  return { playCorrect, playWrong, playTick, playCountdown, playComplete, playClick }
}
