import { useEffect } from 'react'
import { useSettingsStore } from '@/stores/useSettingsStore'

export function useTheme() {
  const animationIntensity = useSettingsStore((s) => s.animationIntensity)

  useEffect(() => {
    const root = document.documentElement

    if (animationIntensity === 'low') {
      root.style.setProperty('--anim-speed', '2x')
      root.style.setProperty('--anim-opacity', '0.3')
    } else if (animationIntensity === 'medium') {
      root.style.setProperty('--anim-speed', '1x')
      root.style.setProperty('--anim-opacity', '0.7')
    } else {
      root.style.setProperty('--anim-speed', '0.8x')
      root.style.setProperty('--anim-opacity', '1')
    }
  }, [animationIntensity])

  const particleCount = (base: number) => {
    if (animationIntensity === 'low') return Math.round(base * 0.3)
    if (animationIntensity === 'medium') return Math.round(base * 0.7)
    return base
  }

  const animDuration = (baseMs: number) => {
    if (animationIntensity === 'low') return Math.round(baseMs * 0.3)
    if (animationIntensity === 'medium') return baseMs
    return Math.round(baseMs * 1.3)
  }

  const shouldAnimate = () => animationIntensity !== 'low'

  return {
    animationIntensity,
    particleCount,
    animDuration,
    shouldAnimate,
  }
}
