import { useEffect, useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Trophy, Clock, Target, TrendingUp, CheckCircle2, Play, XCircle, Eye, AlertCircle } from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import StatsChart from '@/components/records/StatsChart'
import RecordList from '@/components/records/RecordList'
import { useRecordsStore } from '@/stores/useRecordsStore'
import type { TrainingRecord } from '@/types/training'
import { mockLevels } from '@/utils/mockData'
import { cn } from '@/lib/utils'

export default function RecordsPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const stats = useRecordsStore((s) => s.stats)
  const records = useRecordsStore((s) => s.records)
  const fetchRecords = useRecordsStore((s) => s.fetchRecords)

  const recordId = searchParams.get('recordId')
  const isSuccess = searchParams.get('isSuccess')

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  const currentRecord = useMemo(() => {
    if (!recordId) return null
    return records.find((r) => r.id === recordId)
  }, [records, recordId])

  const handleSelectRecord = (record: TrainingRecord) => {
    if (record.status === 'failed') {
      navigate(`/replay/${record.id}`)
    }
  }

  const completionRate = stats?.totalAttempts > 0
    ? Math.round((stats.completedCount / stats.totalAttempts) * 100)
    : 0

  const getLevelName = (levelId: string) => {
    return mockLevels.find((l) => l.id === levelId)?.name ?? levelId
  }

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
        {currentRecord && (
          <div className={cn(
            'mb-6 rounded-2xl p-6 border animate-scale-in',
            isSuccess === 'true'
              ? 'bg-success/5 border-success/20'
              : 'bg-danger/5 border-danger/20'
          )}>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className={cn(
                  'flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl',
                  isSuccess === 'true' ? 'bg-success/10' : 'bg-danger/10'
                )}>
                  {isSuccess === 'true' ? (
                    <CheckCircle2 className="h-7 w-7 text-success" />
                  ) : (
                    <XCircle className="h-7 w-7 text-danger" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-neutral-800">
                    {isSuccess === 'true' ? '训练通过！' : '训练未通过'}
                  </h3>
                  <p className="text-sm text-neutral-500">
                    关卡：{getLevelName(currentRecord.levelId)} ·{' '}
                    {new Date(currentRecord.endTime).toLocaleString('zh-CN')}
                  </p>
                  <div className="mt-3 flex items-center gap-6">
                    <div>
                      <p className="text-xs text-neutral-500">本次得分</p>
                      <p className="text-2xl font-bold text-primary">{currentRecord.score}</p>
                    </div>
                    <div className="h-10 w-px bg-neutral-200" />
                    <div>
                      <p className="text-xs text-neutral-500">保洁准时率</p>
                      <p className={cn(
                        'text-2xl font-bold',
                        currentRecord.onTimeRate >= 80 ? 'text-success' :
                        currentRecord.onTimeRate >= 60 ? 'text-warning' : 'text-danger'
                      )}>
                        {currentRecord.onTimeRate.toFixed(1)}%
                      </p>
                    </div>
                    <div className="h-10 w-px bg-neutral-200" />
                    <div>
                      <p className="text-xs text-neutral-500">用时</p>
                      <p className="text-2xl font-bold text-neutral-700">
                        {Math.round((new Date(currentRecord.endTime).getTime() - new Date(currentRecord.startTime).getTime()) / 1000)}秒
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              {isSuccess === 'false' && (
                <Button
                  variant="danger"
                  onClick={() => navigate(`/replay/${currentRecord.id}`)}
                >
                  <Eye className="h-4 w-4" />
                  查看回放分析
                </Button>
              )}
            </div>
            {currentRecord.results && currentRecord.results.length > 0 && (
              <div className="mt-4 pt-4 border-t border-neutral-200">
                <p className="mb-2 text-xs font-medium text-neutral-500">答题详情</p>
                <div className="flex flex-wrap gap-2">
                  {currentRecord.results.map((result, idx) => (
                    <div
                      key={result.id}
                      className={cn(
                        'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs',
                        result.isCorrect
                          ? 'bg-success/10 text-success'
                          : 'bg-danger/10 text-danger'
                      )}
                    >
                      {result.isCorrect ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : (
                        <AlertCircle className="h-3.5 w-3.5" />
                      )}
                      <span>第{idx + 1}题</span>
                      <span className="text-neutral-400">·</span>
                      <span>
                        {(result.timeSpent / 1000).toFixed(1)}秒
                        {result.hesitationPoints > 0 && (
                          <span className="ml-1 text-warning">⚠ 犹豫{result.hesitationPoints}次</span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

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
