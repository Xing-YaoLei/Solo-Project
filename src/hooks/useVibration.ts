import { useSettingsStore } from '@/stores/useSettingsStore'

export function useVibration() {
  const vibrationEnabled = useSettingsStore((s) => s.vibrationEnabled)

  const vibrate = (pattern: number | number[]) => {
    if (!vibrationEnabled) return
    try {
      if ('vibrate' in navigator) {
        navigator.vibrate(pattern)
      }
    } catch {
      // silence: vibration not supported
    }
  }

  const correctVibrate = () => vibrate([50])

  const wrongVibrate = () => vibrate([200])

  const tickVibrate = () => vibrate([20])

  return { correctVibrate, wrongVibrate, tickVibrate }
}
