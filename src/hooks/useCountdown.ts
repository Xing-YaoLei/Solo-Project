import { useState, useEffect, useRef, useCallback } from 'react'

interface UseCountdownOptions {
  initialTime: number
  onTick?: (timeRemaining: number) => void
  onComplete?: () => void
  autoStart?: boolean
}

export function useCountdown({
  initialTime,
  onTick,
  onComplete,
  autoStart = false,
}: UseCountdownOptions) {
  const [timeRemaining, setTimeRemaining] = useState(initialTime)
  const [isRunning, setIsRunning] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const onTickRef = useRef(onTick)
  const onCompleteRef = useRef(onComplete)

  onTickRef.current = onTick
  onCompleteRef.current = onComplete

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const start = useCallback(() => {
    clearTimer()
    setIsRunning(true)
    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        const next = prev - 1
        onTickRef.current?.(next)
        if (next <= 0) {
          clearTimer()
          setIsRunning(false)
          onCompleteRef.current?.()
          return 0
        }
        return next
      })
    }, 1000)
  }, [clearTimer])

  const pause = useCallback(() => {
    clearTimer()
    setIsRunning(false)
  }, [clearTimer])

  const resume = useCallback(() => {
    if (timeRemaining <= 0) return
    setIsRunning(true)
    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        const next = prev - 1
        onTickRef.current?.(next)
        if (next <= 0) {
          clearTimer()
          setIsRunning(false)
          onCompleteRef.current?.()
          return 0
        }
        return next
      })
    }, 1000)
  }, [timeRemaining, clearTimer])

  const reset = useCallback((newTime?: number) => {
    clearTimer()
    setTimeRemaining(newTime ?? initialTime)
    setIsRunning(false)
  }, [initialTime, clearTimer])

  useEffect(() => {
    if (autoStart) {
      start()
    }
    return clearTimer
  }, [autoStart, start, clearTimer])

  return {
    timeRemaining,
    isRunning,
    start,
    pause,
    resume,
    reset,
  }
}
