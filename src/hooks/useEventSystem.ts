import { useState, useEffect, useRef, useCallback } from 'react'
import type { EventConfig } from '@/types'

interface UseEventSystemReturn {
  activeEvent: EventConfig | null
  isEventActive: boolean
  dismissEvent: () => void
}

export function useEventSystem(
  events: EventConfig[],
  onEventTriggered: (event: EventConfig) => void
): UseEventSystemReturn {
  const [activeEvent, setActiveEvent] = useState<EventConfig | null>(null)
  const onEventTriggeredRef = useRef(onEventTriggered)
  onEventTriggeredRef.current = onEventTriggered

  const dismissEvent = useCallback(() => {
    setActiveEvent(null)
  }, [])

  useEffect(() => {
    if (events.length === 0) return

    const intervalId = setInterval(() => {
      if (activeEvent !== null) return

      const roll = Math.random()
      let cumulative = 0

      for (const event of events) {
        cumulative += event.triggerProbability
        if (roll < cumulative) {
          setActiveEvent(event)
          onEventTriggeredRef.current(event)
          break
        }
      }
    }, 5000)

    return () => {
      clearInterval(intervalId)
    }
  }, [events, activeEvent])

  return {
    activeEvent,
    isEventActive: activeEvent !== null,
    dismissEvent,
  }
}
