import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Trophy, Clock, Target, TrendingUp, CheckCircle2, Play } from 'lucide-react'
import Card from '@/components/ui/Card'
import StatsChart from '@/components/records/StatsChart'
import RecordList from '@/components/records/RecordList'
import { useRecordsStore } from '@/stores/useRecordsStore'
import type { TrainingRecord } from '@/types/training'

export default function RecordsPage() {
  const navigate = useNavigate()
  const stats = useRecordsStore((s) => s.stats)
  const fetchRecords = useRecordsStore((s) => s.fetchRecords)

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  const handleSelectRecord = (record: TrainingRecord) => {
    if (record.status === 'failed') {
      navigate(`/replay/${record.id}`)
    }
  }

  const completionRate = stats?.totalAttempts > 0
    ? Math.round((stats.completedCount / stats.totalAttempts) * 100)
    : 0

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-neutral-600 transition hover:bg-neutral-100"
            >
              <ArrowLeft className="h-4 w-4" />
              返回首页
            </button>
            <div className="h-6 w-px bg-neutral-200" />
            <div>
              <h1 className="text-lg font-bold text-neutral-800">训练记录</h1>
              <p className="text-xs text-neutral-500">查看历史训练成绩与数据分析</p>
            </div>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white shadow-button transition hover:bg-primary-light"
          >
            <Play className="h-4 w-4" />
            开始新训练
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6">
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card className="flex items-center gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Trophy className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-xs text-neutral-500">总分</p>
              <p className="text-2xl font-bold text-neutral-800">{Math.round(stats?.averageScore ?? 0) * (stats?.totalAttempts ?? 0)}</p>
            </div>
          </Card>

          <Card className="flex items-center gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-success/10">
              <TrendingUp className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-xs text-neutral-500">平均准时率</p>
              <p className="text-2xl font-bold text-neutral-800">{stats?.averageOnTimeRate?.toFixed(1) ?? 0}%</p>
            </div>
          </Card>

          <Card className="flex items-center gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-accent/10">
              <Target className="h-6 w-6 text-accent-dark" />
            </div>
            <div>
              <p className="text-xs text-neutral-500">训练次数</p>
              <p className="text-2xl font-bold text-neutral-800">{stats?.totalAttempts ?? 0}</p>
            </div>
          </Card>

          <Card className="flex items-center gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-info/10">
              <CheckCircle2 className="h-6 w-6 text-info" />
            </div>
            <div>
              <p className="text-xs text-neutral-500">完成率</p>
              <p className="text-2xl font-bold text-neutral-800">{completionRate}%</p>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <StatsChart />
          </div>
          <div className="lg:col-span-2">
            <Card title="训练历史" subtitle="点击失败记录可查看回放分析" className="p-0">
              <RecordList onSelectRecord={handleSelectRecord} />
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
