import { useEffect, useRef, useState } from 'react'
import { useSettingsStore } from '@/stores/useSettingsStore'

interface ParticleEffectProps {
  trigger: boolean
  x: number
  y: number
  color: string
  onDone?: () => void
}

interface Particle {
  id: number
  angle: number
  distance: number
}

export default function ParticleEffect({ trigger, x, y, color, onDone }: ParticleEffectProps) {
  const animationIntensity = useSettingsStore((s) => s.animationIntensity)
  const [particles, setParticles] = useState<Particle[]>([])
  const timerRef = useRef<ReturnType<typeof setTimeout>>()
  const idRef = useRef(0)

  useEffect(() => {
    if (!trigger) return

    const count = animationIntensity === 'low' ? 0 : animationIntensity === 'medium' ? 6 : 12
    if (count === 0) {
      onDone?.()
      return
    }

    const newParticles: Particle[] = []
    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: idRef.current++,
        angle: (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4,
        distance: 30 + Math.random() * 50,
      })
    }
    setParticles(newParticles)

    timerRef.current = setTimeout(() => {
      setParticles([])
      onDone?.()
    }, 600)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [trigger, animationIntensity, onDone])

  if (particles.length === 0) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-50">
      {particles.map((p) => {
        const tx = Math.cos(p.angle) * p.distance
        const ty = Math.sin(p.angle) * p.distance
        return (
          <div
            key={p.id}
            className="absolute rounded-full"
            style={{
              left: x,
              top: y,
              width: 8,
              height: 8,
              backgroundColor: color,
              animation: 'particle-burst 600ms ease-out forwards',
              '--tx': `${tx}px`,
              '--ty': `${ty}px`,
            } as React.CSSProperties}
          />
        )
      })}
    </div>
  )
}
