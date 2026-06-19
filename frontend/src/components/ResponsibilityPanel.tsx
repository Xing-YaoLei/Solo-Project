import { useState } from 'react'
import { Plus, AlertCircle, Check } from 'lucide-react'
import { api } from '@/api/client'
import type { Responsibility, ResponsibleType } from '@/types'

const RESPONSIBLE_TYPES: ResponsibleType[] = ['员工', '供应商', '管理', '客人自身']

interface ResponsibilityPanelProps {
  complaintId: string
  responsibilities: Responsibility[]
  onRefresh: () => void
}

export default function ResponsibilityPanel({ complaintId, responsibilities, onRefresh }: ResponsibilityPanelProps) {
  const [showForm, setShowForm] = useState(false)
  const [responsibleType, setResponsibleType] = useState<ResponsibleType>('员工')
  const [responsiblePerson, setResponsiblePerson] = useState('')
  const [judgmentBasis, setJudgmentBasis] = useState('')
  const [determinedBy, setDeterminedBy] = useState('')
  const [determinedAt, setDeterminedAt] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editBasis, setEditBasis] = useState('')
  const [savingBasis, setSavingBasis] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.responsibilities.create({
        complaint_id: complaintId,
        responsible_type: responsibleType,
        responsible_person: responsiblePerson,
        judgment_basis: judgmentBasis || null,
        determined_by: determinedBy,
        determined_at: determinedAt,
      })
      setShowForm(false)
      setResponsiblePerson('')
      setJudgmentBasis('')
      setDeterminedBy('')
      setDeterminedAt('')
      onRefresh()
    } finally {
      setSubmitting(false)
    }
  }

  const handleSaveBasis = async (id: string) => {
    setSavingBasis(true)
    try {
      await api.responsibilities.update(id, { judgment_basis: editBasis })
      setEditingId(null)
      onRefresh()
    } finally {
      setSavingBasis(false)
    }
  }

  const startEditing = (r: Responsibility) => {
    setEditingId(r.id)
    setEditBasis(r.judgment_basis || '')
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-800">责任归属</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-md"
        >
          <Plus className="w-3.5 h-3.5" />
          新增
        </button>
      </div>

      {showForm && (
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">责任类型</label>
                <select
                  value={responsibleType}
                  onChange={e => setResponsibleType(e.target.value as ResponsibleType)}
                  className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {RESPONSIBLE_TYPES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">责任人</label>
                <input
                  type="text"
                  value={responsiblePerson}
                  onChange={e => setResponsiblePerson(e.target.value)}
                  required
                  className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">判定人</label>
                <input
                  type="text"
                  value={determinedBy}
                  onChange={e => setDeterminedBy(e.target.value)}
                  required
                  className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">判定时间</label>
                <input
                  type="date"
                  value={determinedAt}
                  onChange={e => setDeterminedAt(e.target.value)}
                  required
                  className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">判断依据（可后补）</label>
              <textarea
                value={judgmentBasis}
                onChange={e => setJudgmentBasis(e.target.value)}
                rows={2}
                className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? '提交中...' : '提交'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="divide-y divide-slate-100">
        {responsibilities.length === 0 ? (
          <div className="px-4 py-6 text-sm text-slate-400 text-center">暂无责任归属记录</div>
        ) : (
          responsibilities.map(r => (
            <div key={r.id} className="px-4 py-3">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                    {r.responsible_type}
                  </span>
                  <span className="text-sm font-medium text-slate-700">{r.responsible_person}</span>
                </div>
                <span className="text-xs text-slate-400">判定人: {r.determined_by}</span>
              </div>
              {editingId === r.id ? (
                <div className="mt-2 flex items-start gap-2">
                  <textarea
                    value={editBasis}
                    onChange={e => setEditBasis(e.target.value)}
                    rows={2}
                    className="flex-1 border border-blue-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="输入判断依据..."
                  />
                  <button
                    onClick={() => handleSaveBasis(r.id)}
                    disabled={savingBasis}
                    className="mt-1 p-1 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="mt-1" onClick={() => startEditing(r)}>
                  {r.judgment_basis ? (
                    <p className="text-sm text-slate-600 cursor-pointer hover:text-blue-600">{r.judgment_basis}</p>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-orange-500 cursor-pointer hover:text-orange-700">
                      <AlertCircle className="w-3 h-3" />
                      待补充
                    </span>
                  )}
                </div>
              )}
              <p className="text-xs text-slate-400 mt-1">{r.determined_at}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
