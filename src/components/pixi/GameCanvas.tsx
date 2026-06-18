import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react'
import * as PIXI from 'pixi.js'

export interface GameCanvasHandle {
  createParticles: (x: number, y: number, color: string, count?: number) => void
  createScreenParticles: (color: string, count?: number) => void
}

interface ParticleData {
  vx: number
  vy: number
  life: number
  decay: number
}

interface CarData {
  speed: number
}

const GameCanvas = forwardRef<GameCanvasHandle>((_, ref) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<PIXI.Application | null>(null)
  const carDataMap = useRef<Map<PIXI.Graphics, CarData>>(new Map())
  const particleDataMap = useRef<Map<PIXI.Graphics, ParticleData>>(new Map())

  useImperativeHandle(ref, () => ({
    createParticles(x: number, y: number, color: string, count = 20) {
      const app = appRef.current
      if (!app) return
      const parsedColor = PIXI.Color.shared.setValue(color).toNumber()
      for (let i = 0; i < count; i++) {
        const p = new PIXI.Graphics()
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5
        const speed = 1.5 + Math.random() * 3
        particleDataMap.current.set(p, {
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          decay: 0.015 + Math.random() * 0.015,
        })
        p.beginFill(parsedColor)
        p.drawCircle(0, 0, 2 + Math.random() * 3)
        p.endFill()
        p.x = x
        p.y = y
        app.stage.addChild(p)
      }
    },
    createScreenParticles(color: string, count = 30) {
      const app = appRef.current
      if (!app) return
      const parsedColor = PIXI.Color.shared.setValue(color).toNumber()
      const cx = app.screen.width / 2
      const cy = app.screen.height / 2
      for (let i = 0; i < count; i++) {
        const p = new PIXI.Graphics()
        const angle = Math.random() * Math.PI * 2
        const speed = 2 + Math.random() * 5
        particleDataMap.current.set(p, {
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          decay: 0.01 + Math.random() * 0.02,
        })
        p.beginFill(parsedColor)
        p.drawCircle(0, 0, 3 + Math.random() * 4)
        p.endFill()
        p.x = cx
        p.y = cy
        app.stage.addChild(p)
      }
    },
  }))

  useEffect(() => {
    if (!containerRef.current) return

    const app = new PIXI.Application()
    let destroyed = false

    app.init({
      resizeTo: containerRef.current,
      background: '#1a1a2e',
      antialias: true,
    }).then(() => {
      if (destroyed) {
        app.destroy(true)
        return
      }
      if (!containerRef.current) return
      containerRef.current.appendChild(app.canvas)
      appRef.current = app

      const carProfiles = [
        [
          0, 0, 30, 0, 35, -8, 55, -12, 70, -12, 85, -8,
          95, 0, 100, 5, 100, 12, 95, 18, 80, 20, 60, 20,
          40, 20, 15, 18, 0, 12,
        ],
        [
          0, 5, 10, 0, 25, -3, 40, -14, 65, -16, 80, -14,
          90, -5, 100, 5, 105, 15, 100, 22, 85, 24, 60, 24,
          35, 24, 15, 22, 0, 15,
        ],
        [
          0, 8, 8, 0, 20, -2, 30, -10, 55, -10, 75, -8,
          90, -2, 100, 8, 102, 18, 95, 22, 70, 22, 45, 22,
          20, 22, 5, 18,
        ],
      ]

      const createCar = (profile: number[], scale: number, y: number, speed: number, alpha: number) => {
        const g = new PIXI.Graphics()
        g.beginFill(0xff6b35)
        g.drawPolygon(profile)
        g.endFill()
        g.scale.set(scale)
        g.alpha = alpha
        g.y = y
        g.x = Math.random() * (app.screen.width + 200) - 100
        carDataMap.current.set(g, { speed })
        app.stage.addChild(g)
        return g
      }

      const cars: PIXI.Graphics[] = []
      cars.push(createCar(carProfiles[0], 1.2, app.screen.height * 0.3, 0.3, 0.15))
      cars.push(createCar(carProfiles[1], 0.8, app.screen.height * 0.5, 0.6, 0.1))
      cars.push(createCar(carProfiles[2], 1.5, app.screen.height * 0.7, 0.15, 0.2))
      cars.push(createCar(carProfiles[0], 0.6, app.screen.height * 0.85, 0.45, 0.08))
      cars.push(createCar(carProfiles[1], 1.0, app.screen.height * 0.15, 0.5, 0.12))

      app.ticker.add(() => {
        for (const car of cars) {
          const data = carDataMap.current.get(car)
          if (data) car.x += data.speed
          if (car.x > app.screen.width + 150) {
            car.x = -150
          }
        }

        const toRemove: PIXI.Graphics[] = []
        for (const [p, data] of particleDataMap.current) {
          p.x += data.vx
          p.y += data.vy
          data.life -= data.decay
          p.alpha = Math.max(0, data.life)
          p.scale.set(data.life)
          if (data.life <= 0) {
            app.stage.removeChild(p)
            p.destroy()
            toRemove.push(p)
          }
        }
        for (const p of toRemove) {
          particleDataMap.current.delete(p)
        }
      })
    })

    const carData = carDataMap.current
    const particleData = particleDataMap.current

    return () => {
      destroyed = true
      if (appRef.current) {
        appRef.current.destroy(true)
        appRef.current = null
      }
      carData.clear()
      particleData.clear()
    }
  }, [])

  return <div ref={containerRef} className="w-full h-full" />
})

GameCanvas.displayName = 'GameCanvas'

export default GameCanvas
