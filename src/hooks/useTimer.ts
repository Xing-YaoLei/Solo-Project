import { useState, useRef, useCallback, useEffect } from 'react'

interface UseTimerReturn {
  timeRemaining: number
  isRunning: boolean
  isUrgent: boolean
  progress: number
  start: () => void
  pause: () => void
  resume: () => void
  reset: () => void
}

export function useTimer(timeLimit: number, onTimeout: () => void): UseTimerReturn {
  const [timeRemaining, setTimeRemaining] = useState(timeLimit)
  const [isRunning, setIsRunning] = useState(false)
  const rafRef = useRef<number>(0)
  const lastTickRef = useRef<number>(0)
  const onTimeoutRef = useRef(onTimeout)
  const hasTimedOutRef = useRef(false)

  onTimeoutRef.current = onTimeout

  const tick = useCallback((now: number) => {
    if (lastTickRef.current === 0) {
      lastTickRef.current = now
    }
    const delta = (now - lastTickRef.current) / 1000
    lastTickRef.current = now

    setTimeRemaining(prev => {
      const next = prev - delta
      if (next <= 0) {
        if (!hasTimedOutRef.current) {
          hasTimedOutRef.current = true
          onTimeoutRef.current()
        }
        return 0
      }
      return next
    })

    rafRef.current = requestAnimationFrame(tick)
  }, [])

  const start = useCallback(() => {
    hasTimedOutRef.current = false
    lastTickRef.current = 0
    setTimeRemaining(timeLimit)
    setIsRunning(true)
    rafRef.current = requestAnimationFrame(tick)
  }, [timeLimit, tick])

  const pause = useCallback(() => {
    setIsRunning(false)
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const resume = useCallback(() => {
    setIsRunning(true)
    lastTickRef.current = 0
    rafRef.current = requestAnimationFrame(tick)
  }, [tick])

  const reset = useCallback(() => {
    setIsRunning(false)
    hasTimedOutRef.current = false
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
    }
    setTimeRemaining(timeLimit)
    lastTickRef.current = 0
  }, [timeLimit])

  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [])

  return {
    timeRemaining,
    isRunning,
    isUrgent: timeRemaining <= 10 && isRunning,
    progress: timeRemaining / timeLimit,
    start,
    pause,
    resume,
    reset,
  }
}
