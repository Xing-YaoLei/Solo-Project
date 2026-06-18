import { Howl } from 'howler'
import { useSettingsStore } from '@/stores/useSettingsStore'

const SAMPLE_RATE = 22050

type WaveType = 'sine' | 'square' | 'sawtooth' | 'triangle'

function generateWaveSample(
  frequency: number,
  duration: number,
  type: WaveType = 'sine',
  volume: number = 0.4,
  attackMs = 8,
  releaseMs = 60
): Float32Array {
  const length = Math.floor(SAMPLE_RATE * duration)
  const buffer = new Float32Array(length)
  const attackSamples = Math.floor((attackMs / 1000) * SAMPLE_RATE)
  const releaseSamples = Math.floor((releaseMs / 1000) * SAMPLE_RATE)

  for (let i = 0; i < length; i++) {
    const t = i / SAMPLE_RATE
    let sample = 0
    const phase = 2 * Math.PI * frequency * t

    switch (type) {
      case 'sine':
        sample = Math.sin(phase)
        break
      case 'square':
        sample = Math.sin(phase) >= 0 ? 1 : -1
        break
      case 'sawtooth':
        sample = 2 * (t * frequency - Math.floor(t * frequency + 0.5))
        break
      case 'triangle':
        sample = 2 * Math.abs(2 * (t * frequency - Math.floor(t * frequency + 0.5))) - 1
        break
    }

    let envelope = 1
    if (i < attackSamples) {
      envelope = i / attackSamples
    } else if (i > length - releaseSamples) {
      envelope = Math.max(0, (length - i) / releaseSamples)
    }

    buffer[i] = Math.max(-1, Math.min(1, sample * volume * envelope))
  }
  return buffer
}

function mixBuffers(buffers: Array<{ buffer: Float32Array; delay: number }>): Float32Array {
  const maxDelay = Math.max(...buffers.map((b) => b.delay))
  const maxLength = Math.max(...buffers.map((b) => Math.floor(b.delay * SAMPLE_RATE) + b.buffer.length))
  const totalLength = Math.floor(maxDelay * SAMPLE_RATE) + maxLength
  const out = new Float32Array(totalLength)
  for (const { buffer, delay } of buffers) {
    const start = Math.floor(delay * SAMPLE_RATE)
    for (let i = 0; i < buffer.length; i++) {
      out[start + i] = (out[start + i] || 0) + buffer[i]
    }
  }
  for (let i = 0; i < out.length; i++) {
    out[i] = Math.max(-1, Math.min(1, out[i]))
  }
  return out
}

function floatTo16BitPCM(input: Float32Array): ArrayBuffer {
  const output = new ArrayBuffer(input.length * 2)
  const view = new DataView(output)
  let offset = 0
  for (let i = 0; i < input.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, input[i]))
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true)
  }
  return output
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i))
  }
}

function encodeWav(samples: Float32Array): string {
  const pcm = floatTo16BitPCM(samples)
  const buffer = new ArrayBuffer(44 + pcm.byteLength)
  const view = new DataView(buffer)
  writeString(view, 0, 'RIFF')
  view.setUint32(4, 36 + pcm.byteLength, true)
  writeString(view, 8, 'WAVE')
  writeString(view, 12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, SAMPLE_RATE, true)
  view.setUint32(28, SAMPLE_RATE * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  writeString(view, 36, 'data')
  view.setUint32(40, pcm.byteLength, true)
  const pcmView = new Uint8Array(pcm)
  for (let i = 0; i < pcmView.length; i++) {
    view.setUint8(44 + i, pcmView[i])
  }

  let binary = ''
  const bytes = new Uint8Array(buffer)
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return 'data:audio/wav;base64,' + btoa(binary)
}

function makeHowlSrc(
  frequency: number,
  duration: number,
  type: WaveType = 'sine',
  volume: number = 0.4
): string {
  const samples = generateWaveSample(frequency, duration, type, volume)
  return encodeWav(samples)
}

function makeChordSrc(notes: Array<{ freq: number; delay: number }>, duration = 0.5): string {
  const buffers = notes.map(({ freq, delay }) => ({
    buffer: generateWaveSample(freq, duration, 'sine', 0.35),
    delay,
  }))
  return encodeWav(mixBuffers(buffers))
}

const sounds: Record<string, Howl> = {
  correct: new Howl({
    src: [
      makeChordSrc(
        [
          { freq: 880, delay: 0 },
          { freq: 1318.51, delay: 0.06 },
          { freq: 1760, delay: 0.12 },
        ],
        0.4
      ),
    ],
    volume: 0.5,
    preload: true,
  }),
  wrong: new Howl({
    src: [
      makeChordSrc(
        [
          { freq: 207.65, delay: 0 },
          { freq: 185, delay: 0.08 },
          { freq: 155.56, delay: 0.16 },
        ],
        0.5
      ),
    ],
    volume: 0.5,
    preload: true,
  }),
  tick: new Howl({
    src: [makeHowlSrc(1000, 0.05, 'square', 0.2)],
    volume: 0.3,
    preload: true,
  }),
  countdown: new Howl({
    src: [makeHowlSrc(440, 0.22, 'sine', 0.4)],
    volume: 0.6,
    preload: true,
  }),
  complete: new Howl({
    src: [
      makeChordSrc(
        [
          { freq: 523.25, delay: 0 },
          { freq: 659.25, delay: 0.15 },
          { freq: 783.99, delay: 0.3 },
          { freq: 1046.5, delay: 0.45 },
        ],
        0.7
      ),
    ],
    volume: 0.7,
    preload: true,
  }),
  click: new Howl({
    src: [makeHowlSrc(1200, 0.04, 'sine', 0.2)],
    volume: 0.4,
    preload: true,
  }),
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
    if (ctx.state === 'suspended') {
      ctx.resume()
    }
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
      sound.rate(1)
      sound.stop()
      sound.play()
    } catch {
      fallback()
    }
  }

  const playCorrect = () =>
    play('correct', () => {
      playTone(880, 0.08, 'sine', 0.3)
      setTimeout(() => playTone(1320, 0.12, 'sine', 0.3), 60)
    })

  const playWrong = () =>
    play('wrong', () => {
      playTone(200, 0.18, 'sawtooth', 0.25)
    })

  const playTick = () =>
    play('tick', () => playTone(1000, 0.04, 'square', 0.15))

  const playCountdown = () =>
    play('countdown', () => playTone(440, 0.2, 'square', 0.3))

  const playComplete = () =>
    play('complete', () => {
      try {
        const ctx = getAudioContext()
        const now = ctx.currentTime
        ;[523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.type = 'sine'
          osc.frequency.setValueAtTime(freq, now + i * 0.15)
          gain.gain.setValueAtTime(0.3, now + i * 0.15)
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.45)
          osc.connect(gain)
          gain.connect(ctx.destination)
          osc.start(now + i * 0.15)
          osc.stop(now + i * 0.15 + 0.45)
        })
      } catch {
        // silence: audio context may fail in restricted environments
      }
    })

  const playClick = () =>
    play('click', () => playTone(1200, 0.03, 'sine', 0.15))

  return { playCorrect, playWrong, playTick, playCountdown, playComplete, playClick }
}
