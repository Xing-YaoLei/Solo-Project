import { useEffect } from "react"
import { Clock, Target, TrendingUp } from "lucide-react"
import { useStatsStore } from "@/store/statsStore"
import { useGameStore } from "@/store/gameStore"
import { levels } from "@/data/levels"

export default function Stats() {
  const loadProgress = useGameStore((s) => s.loadProgress)
  const results = useStatsStore((s) => s.results)
  const loadResults = useStatsStore((s) => s.loadResults)
  const getAverageScore = useStatsStore((s) => s.getAverageScore)
  const getAverageTime = useStatsStore((s) => s.getAverageTime)
  const getClueConversionRate = useStatsStore((s) => s.getClueConversionRate)
  const getLevelResult = useStatsStore((s) => s.getLevelResult)
  const getConversionTrend = useStatsStore((s) => s.getConversionTrend)

  useEffect(() => {
    loadProgress()
    loadResults()
  }, [loadProgress, loadResults])

  const avgScore = getAverageScore()
  const avgTime = getAverageTime()
  const conversionRate = getClueConversionRate()
  const conversionTrend = getConversionTrend()

  const avgMinutes = Math.floor(avgTime / 60)
  const avgSeconds = avgTime % 60

  const completedLevels = levels.filter((l) =>
    results.some((r) => r.levelId === l.id)
  )

  const chartWidth = 500
  const chartHeight = 200
  const chartPadding = 40
  const maxRate = 100

  const chartPoints = conversionTrend.length > 0
    ? conversionTrend.map((entry, i) => {
        const x = chartPadding + (i / Math.max(conversionTrend.length - 1, 1)) * (chartWidth - chartPadding * 2)
        const y = chartHeight - chartPadding - (entry.rate / maxRate) * (chartHeight - chartPadding * 2)
        return { x, y, rate: entry.rate, levelId: entry.levelId }
      })
    : []

  if (results.length === 0) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="font-serif text-3xl text-amber glow-text mb-8">训练统计</h1>
        <div className="card-dark text-center py-16">
          <p className="text-gray-400 text-lg">暂无训练数据</p>
          <p className="text-gray-500 text-sm mt-2">完成关卡后将在此展示统计信息</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="font-serif text-3xl text-amber glow-text mb-8">训练统计</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <div className="card-dark">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-amber/15 flex items-center justify-center">
              <Clock size={20} className="text-amber" />
            </div>
            <span className="text-sm text-gray-400">平均用时</span>
          </div>
          <p className="text-3xl font-bold text-amber">
            {avgMinutes}<span className="text-lg ml-1">分</span>
            {avgSeconds}<span className="text-lg ml-1">秒</span>
          </p>
        </div>

        <div className="card-dark">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-amber/15 flex items-center justify-center">
              <Target size={20} className="text-amber" />
            </div>
            <span className="text-sm text-gray-400">平均得分</span>
          </div>
          <p className="text-3xl font-bold text-amber">
            {avgScore}<span className="text-lg ml-1">分</span>
          </p>
        </div>

        <div className="card-dark">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-jade/15 flex items-center justify-center">
              <TrendingUp size={20} className="text-jade" />
            </div>
            <span className="text-sm text-gray-400">线索转化率</span>
          </div>
          <p className="text-3xl font-bold text-jade">
            {conversionRate}<span className="text-lg ml-1">%</span>
          </p>
        </div>
      </div>

      <div className="card-dark mb-8">
        <h2 className="font-serif text-lg text-amber mb-4">关卡对比</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 text-gray-400 font-normal">关卡名称</th>
                <th className="text-right py-3 text-gray-400 font-normal">得分</th>
                <th className="text-right py-3 text-gray-400 font-normal">用时</th>
                <th className="text-right py-3 text-gray-400 font-normal">转化率</th>
              </tr>
            </thead>
            <tbody>
              {completedLevels.map((level) => {
                const best = getLevelResult(level.id)
                if (!best) return null
                const mins = Math.floor(best.timeUsed / 60)
                const secs = best.timeUsed % 60
                const viewed = best.clueConversions.filter((c) => c.wasViewed)
                const rate = viewed.length > 0
                  ? Math.round((viewed.filter((c) => c.ledToCorrectDecision).length / viewed.length) * 100)
                  : 0
                return (
                  <tr key={level.id} className="border-b border-gray-800">
                    <td className="py-3 text-gray-200">{level.name}</td>
                    <td className="py-3 text-right text-amber font-medium">{best.score}</td>
                    <td className="py-3 text-right text-amber">
                      {mins}:{secs.toString().padStart(2, "0")}
                    </td>
                    <td className="py-3 text-right text-jade">{rate}%</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {chartPoints.length > 1 && (
        <div className="card-dark">
          <h2 className="font-serif text-lg text-amber mb-4">线索转化趋势</h2>
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-auto"
          >
            <line
              x1={chartPadding} y1={chartHeight - chartPadding}
              x2={chartWidth - chartPadding} y2={chartHeight - chartPadding}
              stroke="rgba(212,165,116,0.2)"
              strokeWidth="1"
            />
            <line
              x1={chartPadding} y1={chartPadding}
              x2={chartPadding} y2={chartHeight - chartPadding}
              stroke="rgba(212,165,116,0.2)"
              strokeWidth="1"
            />
            {[0, 25, 50, 75, 100].map((val) => {
              const y = chartHeight - chartPadding - (val / maxRate) * (chartHeight - chartPadding * 2)
              return (
                <text
                  key={val}
                  x={chartPadding - 8}
                  y={y + 4}
                  textAnchor="end"
                  fill="rgba(212,165,116,0.4)"
                  fontSize="10"
                >
                  {val}%
                </text>
              )
            })}
            <polyline
              fill="none"
              stroke="#2EC4B6"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={chartPoints.map((p) => `${p.x},${p.y}`).join(" ")}
            />
            {chartPoints.map((point, i) => {
              const levelObj = levels.find((l) => l.id === point.levelId)
              return (
                <g key={i}>
                  <circle cx={point.x} cy={point.y} r="5" fill="#2EC4B6" />
                  <circle cx={point.x} cy={point.y} r="3" fill="#1A1A2E" />
                  <text
                    x={point.x}
                    y={chartHeight - chartPadding + 16}
                    textAnchor="middle"
                    fill="rgba(212,165,116,0.6)"
                    fontSize="9"
                  >
                    {levelObj ? levelObj.name.slice(0, 4) : ""}
                  </text>
                  <text
                    x={point.x}
                    y={point.y - 10}
                    textAnchor="middle"
                    fill="#2EC4B6"
                    fontSize="10"
                  >
                    {point.rate}%
                  </text>
                </g>
              )
            })}
          </svg>
        </div>
      )}
    </div>
  )
}
