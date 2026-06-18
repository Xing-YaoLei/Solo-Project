import { useNavigate } from 'react-router-dom'
import { useProgressStore } from '@/stores/useProgressStore'
import { levels } from '@/data/levels'
import ComparisonChart from '@/components/review/ComparisonChart'

export default function ReviewPage() {
  const navigate = useNavigate()
  const allResults = useProgressStore((s) => s.getAllResults)
  const results = allResults()

  const chartData = Object.entries(results).map(([id, r]) => ({
    levelId: Number(id),
    turnoverDays: r.inventoryTurnoverDays,
    score: r.score,
  }))

  if (Object.keys(results).length === 0) {
    return (
      <div className="min-h-screen bg-[#1a1a2e] text-[#f5f0e8] flex flex-col items-center justify-center p-6">
        <p className="text-lg text-[#f5f0e880] mb-6">暂无游戏记录</p>
        <button
          onClick={() => navigate('/')}
          className="py-3 px-8 bg-[#ff6b35] text-white rounded-xl font-bold active:scale-95 transition-transform"
        >
          返回主菜单
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#1a1a2e] text-[#f5f0e8] p-6">
      <h1 className="text-2xl font-bold text-center mb-6">复盘对比</h1>

      <div className="w-full max-w-2xl mx-auto h-[300px] bg-[#2a2a4a] rounded-2xl p-4 mb-6 border border-[#3a3a5a]">
        <ComparisonChart data={chartData} />
      </div>

      <div className="w-full max-w-2xl mx-auto overflow-hidden rounded-2xl border border-[#3a3a5a]">
        <table className="w-full">
          <thead>
            <tr className="bg-[#2a2a4a]">
              <th className="text-left py-3 px-4 text-sm font-bold">关卡</th>
              <th className="text-center py-3 px-4 text-sm font-bold">得分</th>
              <th className="text-center py-3 px-4 text-sm font-bold">星级</th>
              <th className="text-center py-3 px-4 text-sm font-bold">周转天数</th>
              <th className="text-right py-3 px-4 text-sm font-bold">时间</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(results).map(([id, r]) => {
              const level = levels.find((l) => l.id === Number(id))
              return (
                <tr key={id} className="border-t border-[#3a3a5a]">
                  <td className="py-3 px-4 text-sm">{level?.name ?? `关卡${id}`}</td>
                  <td className="py-3 px-4 text-sm text-center text-[#ff6b35]">{r.score}</td>
                  <td className="py-3 px-4 text-sm text-center">{'⭐'.repeat(r.stars)}</td>
                  <td className="py-3 px-4 text-sm text-center">{r.inventoryTurnoverDays}天</td>
                  <td className="py-3 px-4 text-sm text-right text-[#f5f0e880]">
                    {new Date(r.timestamp).toLocaleDateString('zh-CN')}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="text-center mt-6">
        <button
          onClick={() => navigate('/')}
          className="py-3 px-8 bg-[#3a3a5a] text-[#f5f0e8] rounded-xl font-bold active:scale-95 transition-transform"
        >
          返回主菜单
        </button>
      </div>
    </div>
  )
}
