import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface AnimatedNumberProps {
  value: number
  className?: string
}

export default function AnimatedNumber({ value, className }: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(value)
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    if (displayValue === value) return
    setAnimating(true)
    const duration = 300
    const startVal = displayValue
    const diff = value - startVal
    const startTime = performance.now()

    const step = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayValue(Math.round(startVal + diff * eased))
      if (progress < 1) {
        requestAnimationFrame(step)
      } else {
        setDisplayValue(value)
        setAnimating(false)
      }
    }

    requestAnimationFrame(step)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return (
    <span
      key={value}
      className={cn(
        'inline-block tabular-nums transition-transform duration-300',
        animating && 'scale-110',
        className
      )}
    >
      {displayValue}
    </span>
  )
}
