'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getVisits, createVisit } from '@/lib/api'
import { Plus, X } from 'lucide-react'
import { formatDateTime } from '@/app/helpers'

export default function VisitsPage() {
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    elderId: '',
    visitorName: '',
    relationship: '',
    visitTime: '',
    duration: '60',
    notes: '',
  })

  const { data: visits = [], isLoading } = useQuery({
    queryKey: ['visits'],
    queryFn: () => getVisits(),
  })

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => createVisit(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits'] })
      setShowModal(false)
      setForm({ elderId: '', visitorName: '', relationship: '', visitTime: '', duration: '60', notes: '' })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate({
      ...form,
      duration: Number(form.duration),
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-slate-800">探访记录</h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-teal-700 text-white text-sm font-medium hover:bg-teal-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          添加探访
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-slate-400">加载中...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left py-3 px-4 text-slate-500 font-medium">探访者</th>
                <th className="text-left py-3 px-4 text-slate-500 font-medium">关系</th>
                <th className="text-left py-3 px-4 text-slate-500 font-medium">老人</th>
                <th className="text-left py-3 px-4 text-slate-500 font-medium">探访时间</th>
                <th className="text-left py-3 px-4 text-slate-500 font-medium">时长(分)</th>
                <th className="text-left py-3 px-4 text-slate-500 font-medium">备注</th>
              </tr>
            </thead>
            <tbody>
              {visits.map((v: any) => (
                <tr key={v.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-medium text-slate-800">{v.visitorName}</td>
                  <td className="py-3 px-4 text-slate-600">{v.relationship}</td>
                  <td className="py-3 px-4 text-slate-600">{v.elder?.name ?? '-'}</td>
                  <td className="py-3 px-4 text-slate-600 font-mono text-xs">{formatDateTime(v.visitTime)}</td>
                  <td className="py-3 px-4 text-slate-600 font-mono">{v.duration}</td>
                  <td className="py-3 px-4 text-slate-500 max-w-[200px] truncate">{v.notes || '-'}</td>
                </tr>
              ))}
              {visits.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">暂无探访记录</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 animate-fade-in-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800">添加探访记录</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormField label="老人ID" value={form.elderId} onChange={(v) => setForm({ ...form, elderId: v })} required />
              <FormField label="探访者姓名" value={form.visitorName} onChange={(v) => setForm({ ...form, visitorName: v })} required />
              <FormField label="与老人关系" value={form.relationship} onChange={(v) => setForm({ ...form, relationship: v })} required />
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">探访时间</label>
                <input
                  type="datetime-local"
                  value={form.visitTime}
                  onChange={(e) => setForm({ ...form, visitTime: e.target.value })}
                  required
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <FormField label="时长(分钟)" value={form.duration} onChange={(v) => setForm({ ...form, duration: v })} type="number" />
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">备注</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="w-full py-2.5 rounded-full bg-teal-700 text-white text-sm font-medium hover:bg-teal-800 transition-colors disabled:opacity-50"
              >
                提交
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function FormField({ label, value, onChange, type = 'text', required }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-600 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
      />
    </div>
  )
}
