import { useEffect, useRef } from 'react'
import { Html } from '@react-three/drei'
import { motion, AnimatePresence } from 'framer-motion'

interface EffectPhotoProps {
  before: string
  after: string
  visible: boolean
  onComplete: () => void
}

export function EffectPhoto({ before, after, visible, onComplete }: EffectPhotoProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (visible) {
      timerRef.current = setTimeout(() => {
        onComplete()
      }, 3000)
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [visible, onComplete])

  return (
    <Html center distanceFactor={8} style={{ pointerEvents: 'auto' }}>
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            style={{
              display: 'flex',
              gap: '16px',
              padding: '16px',
              background: 'rgba(62, 39, 35, 0.9)',
              borderRadius: '12px',
              backdropFilter: 'blur(8px)',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <img
                src={before}
                alt="护理前"
                style={{
                  width: '160px',
                  height: '120px',
                  objectFit: 'cover',
                  borderRadius: '8px',
                  border: '2px solid #B76E79',
                }}
              />
              <p style={{ color: '#FFFFF0', fontSize: '14px', marginTop: '8px' }}>护理前</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <img
                src={after}
                alt="护理后"
                style={{
                  width: '160px',
                  height: '120px',
                  objectFit: 'cover',
                  borderRadius: '8px',
                  border: '2px solid #50C878',
                }}
              />
              <p style={{ color: '#FFFFF0', fontSize: '14px', marginTop: '8px' }}>护理后</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Html>
  )
}
