import { useEffect, useRef } from 'react'
import { levels } from '@/data/levels'

interface ComparisonChartProps {
  data: Array<{ levelId: number; turnoverDays: number; score: number }>
}

export default function ComparisonChart({ data }: ComparisonChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const draw = () => {
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const dpr = window.devicePixelRatio || 1
      const rect = container.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
      ctx.scale(dpr, dpr)

      const w = rect.width
      const h = rect.height

      ctx.clearRect(0, 0, w, h)

      const padding = { top: 30, right: 60, bottom: 50, left: 60 }
      const chartW = w - padding.left - padding.right
      const chartH = h - padding.top - padding.bottom

      if (data.length === 0) return

      const maxDays = Math.max(...data.map((d) => d.turnoverDays), 10)
      const barWidth = Math.min(40, (chartW / data.length) * 0.5)
      const gap = chartW / data.length

      ctx.fillStyle = '#f5f0e880'
      ctx.font = '12px "Noto Sans SC", sans-serif'

      ctx.textAlign = 'right'
      ctx.fillStyle = '#ff6b35'
      for (let i = 0; i <= 4; i++) {
        const y = padding.top + chartH - (i / 4) * chartH
        const val = Math.round((maxDays * i) / 4)
        ctx.fillText(String(val), padding.left - 10, y + 4)
        ctx.beginPath()
        ctx.strokeStyle = '#3a3a5a'
        ctx.lineWidth = 0.5
        ctx.moveTo(padding.left, y)
        ctx.lineTo(w - padding.right, y)
        ctx.stroke()
      }

      ctx.textAlign = 'left'
      ctx.fillStyle = '#22c55e'
      for (let i = 0; i <= 4; i++) {
        const y = padding.top + chartH - (i / 4) * chartH
        const val = Math.round((100 * i) / 4)
        ctx.fillText(String(val), w - padding.right + 10, y + 4)
      }

      data.forEach((d, i) => {
        const x = padding.left + gap * i + gap / 2
        const barH = (d.turnoverDays / maxDays) * chartH

        ctx.fillStyle = '#ff6b35'
        ctx.fillRect(x - barWidth / 2, padding.top + chartH - barH, barWidth, barH)

        const level = levels.find((l) => l.id === d.levelId)
        ctx.fillStyle = '#f5f0e880'
        ctx.textAlign = 'center'
        ctx.font = '12px "Noto Sans SC", sans-serif'
        ctx.fillText(level?.name ?? `关卡${d.levelId}`, x, h - padding.bottom + 20)

        const shortName = level?.name.slice(0, 2) ?? `${d.levelId}`
        ctx.fillText(shortName, x, h - padding.bottom + 36)
      })

      if (data.length > 1) {
        ctx.beginPath()
        ctx.strokeStyle = '#22c55e'
        ctx.lineWidth = 2
        data.forEach((d, i) => {
          const x = padding.left + gap * i + gap / 2
          const y = padding.top + chartH - (d.score / 100) * chartH
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        })
        ctx.stroke()

        data.forEach((d, i) => {
          const x = padding.left + gap * i + gap / 2
          const y = padding.top + chartH - (d.score / 100) * chartH
          ctx.beginPath()
          ctx.arc(x, y, 4, 0, Math.PI * 2)
          ctx.fillStyle = '#22c55e'
          ctx.fill()
        })
      } else if (data.length === 1) {
        const x = padding.left + gap / 2
        const y = padding.top + chartH - (data[0].score / 100) * chartH
        ctx.beginPath()
        ctx.arc(x, y, 5, 0, Math.PI * 2)
        ctx.fillStyle = '#22c55e'
        ctx.fill()
      }

      ctx.fillStyle = '#ff6b35'
      ctx.fillRect(padding.left, h - 16, 12, 12)
      ctx.fillStyle = '#f5f0e880'
      ctx.textAlign = 'left'
      ctx.font = '11px "Noto Sans SC", sans-serif'
      ctx.fillText('周转天数', padding.left + 16, h - 6)

      ctx.fillStyle = '#22c55e'
      ctx.fillRect(padding.left + 90, h - 16, 12, 12)
      ctx.fillStyle = '#f5f0e880'
      ctx.fillText('得分', padding.left + 106, h - 6)
    }

    draw()

    const observer = new ResizeObserver(() => draw())
    observer.observe(container)

    return () => observer.disconnect()
  }, [data])

  return (
    <div ref={containerRef} className="w-full h-full min-h-[300px]">
      <canvas ref={canvasRef} />
    </div>
  )
}
