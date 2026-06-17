'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getActivities, checkIn, bulkCheckIn } from '@/lib/api'
import { CheckCircle2, Square, CheckSquare, Plus, X } from 'lucide-react'
import { formatDate } from '@/app/helpers'

export default function ActivitiesPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['activities'],
    queryFn: () => getActivities(),
  })

  const checkInMutation = useMutation({
    mutationFn: (id: string) => checkIn(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['activities'] }),
  })

  const bulkMutation = useMutation({
    mutationFn: () => bulkCheckIn({ ids: Array.from(selectedIds) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] })
      setSelectedIds(new Set())
    },
  })

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  const pendingItems = activities.filter((a: any) => !a.checkedIn)

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="text-lg font-semibold text-slate-800">活动签到</h2>
        <div className="flex gap-2">
          {selectedIds.size > 0 && (
            <button
              onClick={() => bulkMutation.mutate()}
              disabled={bulkMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-teal-700 text-white text-sm font-medium hover:bg-teal-800 transition-colors disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              批量签到 ({selectedIds.size})
            </button>
          )}
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            <Plus className="w-4 h-4" />
            添加活动
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl p-5 shadow-sm mb-6 animate-fade-in-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-slate-800">新建活动</h3>
            <button onClick={() => setShowForm(false)} className="p-1 hover:bg-slate-100 rounded-lg">
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              setShowForm(false)
            }}
            className="grid grid-cols-3 gap-4"
          >
            <input placeholder="活动名称" className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            <input placeholder="老人ID" className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            <input type="date" className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            <button type="submit" className="col-span-3 py-2 rounded-full bg-teal-700 text-white text-sm font-medium hover:bg-teal-800 transition-colors">
              提交
            </button>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-20 text-slate-400">加载中...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="w-10 py-3 px-4" />
                <th className="text-left py-3 px-4 text-slate-500 font-medium">活动名称</th>
                <th className="text-left py-3 px-4 text-slate-500 font-medium">日期</th>
                <th className="text-left py-3 px-4 text-slate-500 font-medium">老人</th>
                <th className="text-left py-3 px-4 text-slate-500 font-medium">签到状态</th>
                <th className="text-left py-3 px-4 text-slate-500 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {activities.map((a: any) => (
                <tr key={a.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4">
                    {!a.checkedIn && (
                      <button onClick={() => toggleSelect(a.id)} className="p-1">
                        {selectedIds.has(a.id) ? (
                          <CheckSquare className="w-4 h-4 text-teal-600" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300" />
                        )}
                      </button>
                    )}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-800">{a.activityName}</td>
                  <td className="py-3 px-4 text-slate-600 font-mono text-xs">{formatDate(a.activityDate)}</td>
                  <td className="py-3 px-4 text-slate-600">{a.elder?.name ?? '-'}</td>
                  <td className="py-3 px-4">
                    {a.checkedIn ? (
                      <span className="inline-flex items-center gap-1 text-green-600 text-xs font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" /> 已签到
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">未签到</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {!a.checkedIn && (
                      <button
                        onClick={() => checkInMutation.mutate(a.id)}
                        className="px-3 py-1 rounded-full bg-teal-700 text-white text-xs font-medium hover:bg-teal-800 transition-colors"
                      >
                        签到
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {activities.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">暂无活动记录</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
