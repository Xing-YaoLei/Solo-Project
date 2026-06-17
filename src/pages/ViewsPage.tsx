import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookmarkPlus, Calendar, Filter, Save, ArrowRight } from 'lucide-react'
import type { SavedView, ViewFilters } from '@/types'
import { getSavedViews, saveView as apiSaveView } from '@/services/api'
import { useAppStore } from '@/store/useAppStore'
import ViewCard from '@/components/ViewCard'

const DEPARTMENTS = ['神经康复科', '骨科康复科', '心肺康复科']
const THERAPISTS = ['王晓峰', '刘静', '张伟', '陈丽华', '赵明']
const REJECTION_STATUSES = ['pending', 'processing', 'resolved']
const REJECTION_STATUS_LABELS: Record<string, string> = {
  pending: '待处理',
  processing: '处理中',
  resolved: '已解决',
}

export default function ViewsPage() {
  const navigate = useNavigate()
  const { viewFilters, setViewFilters, saveView, loadView, deleteView, morningMeetingMode, toggleMorningMeetingMode, savedViews: storeViews } = useAppStore()
  const [views, setViews] = useState<SavedView[]>([])
  const [activeViewId, setActiveViewId] = useState<string | null>(null)
  const [localFilters, setLocalFilters] = useState<ViewFilters>(viewFilters)
  const [viewName, setViewName] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  useEffect(() => {
    getSavedViews().then((data) => {
      setViews(data)
      data.forEach((v) => saveView(v))
    })
  }, [saveView])

  const handleLoad = (id: string) => {
    setActiveViewId(id)
    const view = views.find((v) => v.id === id)
    if (view) {
      setLocalFilters(view.filters)
      loadView(id)
    }
  }

  const handleDelete = (id: string) => {
    if (confirmDeleteId === id) {
      setViews((prev) => prev.filter((v) => v.id !== id))
      deleteView(id)
      setConfirmDeleteId(null)
      if (activeViewId === id) setActiveViewId(null)
    } else {
      setConfirmDeleteId(id)
      setTimeout(() => setConfirmDeleteId(null), 3000)
    }
  }

  const handleToggleShare = (id: string) => {
    setViews((prev) =>
      prev.map((v) => (v.id === id ? { ...v, isShared: !v.isShared } : v)),
    )
  }

  const handleSaveView = async () => {
    if (!viewName.trim()) return
    const newView: SavedView = {
      id: `SV_${Date.now()}`,
      name: viewName.trim(),
      owner: '当前用户',
      isShared: false,
      filters: localFilters,
      createdAt: new Date().toISOString().slice(0, 10),
    }
    await apiSaveView(newView)
    saveView(newView)
    setViews((prev) => [...prev, newView])
    setViewName('')
  }

  const handleApplyToDashboard = () => {
    setViewFilters(localFilters)
    navigate('/')
  }

  const handleMorningMeetingToggle = (viewId: string) => {
    const view = views.find((v) => v.id === viewId)
    if (view?.isShared) {
      if (!morningMeetingMode) {
        toggleMorningMeetingMode()
      }
      setViewFilters(view.filters)
      loadView(viewId)
      navigate('/')
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-48px)] max-w-7xl gap-0 px-6 py-6">
      {morningMeetingMode && (
        <div className="absolute left-0 right-0 top-0 z-30 flex items-center justify-center bg-amber-500 py-2 text-sm font-medium text-white">
          <Calendar className="mr-2 h-4 w-4" />
          早会模式已开启
          <button
            onClick={toggleMorningMeetingMode}
            className="ml-4 rounded bg-white/20 px-2 py-0.5 text-xs transition-colors hover:bg-white/30"
          >
            关闭
          </button>
        </div>
      )}

      <div className="w-80 shrink-0 overflow-y-auto border-r border-gray-200 pr-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">已保存视图</h2>
          <BookmarkPlus className="h-5 w-5 text-gray-400" />
        </div>
        <div className="space-y-3">
          {views.map((view) => (
            <div key={view.id}>
              <ViewCard
                view={view}
                isActive={activeViewId === view.id}
                onLoad={handleLoad}
                onDelete={handleDelete}
                onToggleShare={handleToggleShare}
              />
              {view.isShared && (
                <button
                  onClick={() => handleMorningMeetingToggle(view.id)}
                  className="mt-1.5 w-full rounded-md border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-100"
                >
                  🌅 早会模式
                </button>
              )}
              {confirmDeleteId === view.id && (
                <div className="mt-1.5 rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-600">
                  确认删除？点击删除按钮确认
                </div>
              )}
            </div>
          ))}
          {views.length === 0 && (
            <p className="py-8 text-center text-sm text-gray-400">暂无保存的视图</p>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pl-6">
        <div className="mb-5 flex items-center gap-3">
          <Filter className="h-5 w-5 text-gray-400" />
          <h2 className="text-base font-semibold text-gray-900">视图编辑器</h2>
        </div>

        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-5">
          <label className="mb-1.5 block text-sm font-medium text-gray-700">视图名称</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={viewName}
              onChange={(e) => setViewName(e.target.value)}
              placeholder="输入新视图名称..."
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-gray-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
            <button
              onClick={handleSaveView}
              disabled={!viewName.trim()}
              className="flex items-center gap-1.5 rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              保存视图
            </button>
          </div>
        </div>

        <div className="space-y-5 rounded-lg border border-gray-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-gray-800">筛选条件</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">开始日期</label>
              <input
                type="date"
                value={localFilters.dateRange[0]}
                onChange={(e) =>
                  setLocalFilters((prev) => ({
                    ...prev,
                    dateRange: [e.target.value, prev.dateRange[1]],
                  }))
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">结束日期</label>
              <input
                type="date"
                value={localFilters.dateRange[1]}
                onChange={(e) =>
                  setLocalFilters((prev) => ({
                    ...prev,
                    dateRange: [prev.dateRange[0], e.target.value],
                  }))
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">科室</label>
              <select
                value={localFilters.department ?? ''}
                onChange={(e) =>
                  setLocalFilters((prev) => ({
                    ...prev,
                    department: e.target.value || undefined,
                  }))
                }
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                <option value="">全部科室</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">治疗师</label>
              <select
                value={localFilters.therapist ?? ''}
                onChange={(e) =>
                  setLocalFilters((prev) => ({
                    ...prev,
                    therapist: e.target.value || undefined,
                  }))
                }
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                <option value="">全部治疗师</option>
                {THERAPISTS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">完成率下限 (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={localFilters.completionRateRange?.[0] ?? 0}
                onChange={(e) =>
                  setLocalFilters((prev) => ({
                    ...prev,
                    completionRateRange: [
                      Number(e.target.value),
                      prev.completionRateRange?.[1] ?? 100,
                    ],
                  }))
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">完成率上限 (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={localFilters.completionRateRange?.[1] ?? 100}
                onChange={(e) =>
                  setLocalFilters((prev) => ({
                    ...prev,
                    completionRateRange: [
                      prev.completionRateRange?.[0] ?? 0,
                      Number(e.target.value),
                    ],
                  }))
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">拒付状态</label>
            <select
              value={localFilters.rejectionStatus ?? ''}
              onChange={(e) =>
                setLocalFilters((prev) => ({
                  ...prev,
                  rejectionStatus: e.target.value || undefined,
                }))
              }
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="">全部状态</option>
              {REJECTION_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {REJECTION_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-2">
            <button
              onClick={handleApplyToDashboard}
              className="flex items-center gap-2 rounded-md bg-teal-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-700"
            >
              <ArrowRight className="h-4 w-4" />
              应用到看板
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
