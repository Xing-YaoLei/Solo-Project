import { useEffect, useState } from 'react'
import { Star } from 'lucide-react'

interface StarRatingProps {
  stars: number
  size?: number
}

export default function StarRating({ stars, size = 48 }: StarRatingProps) {
  const [filledCount, setFilledCount] = useState(0)

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    for (let i = 0; i < stars; i++) {
      timers.push(setTimeout(() => setFilledCount(i + 1), (i + 1) * 200))
    }
    return () => timers.forEach(clearTimeout)
  }, [stars])

  return (
    <div className="flex gap-2">
      {[1, 2, 3].map((i) => (
        <Star
          key={i}
          size={size}
          fill={i <= filledCount ? '#ff6b35' : 'none'}
          stroke={i <= filledCount ? '#ff6b35' : '#3a3a5a'}
          className="transition-all duration-300"
          style={{
            transform: i <= filledCount ? 'scale(1.1)' : 'scale(1)',
            filter: i <= filledCount ? 'drop-shadow(0 0 6px rgba(255,107,53,0.5))' : 'none',
          }}
        />
      ))}
    </div>
  )
}
