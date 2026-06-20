import { useState } from 'react'
import type {
  VerificationStatus,
  VerificationAction,
  VerificationTransition,
} from '../types'
import { AVAILABLE_TRANSITIONS, STATUS_LABELS, STATUS_LABEL_MAP } from '../types'
import { formatDate, getStatusDotColor } from '../lib/utils'
import StatusBadge from './StatusBadge'

interface StatusFlowProps {
  currentStatus: VerificationStatus
  actions: VerificationAction[]
  onTransition: (transition: VerificationTransition, note: string) => void
  loading?: boolean
}

export default function StatusFlow({
  currentStatus,
  actions,
  onTransition,
  loading,
}: StatusFlowProps) {
  const transitions = AVAILABLE_TRANSITIONS[currentStatus] || []
  const [activeTransition, setActiveTransition] = useState<VerificationTransition | null>(null)
  const [note, setNote] = useState('')

  const handleConfirm = () => {
    if (!activeTransition) return
    onTransition(activeTransition, note)
    setActiveTransition(null)
    setNote('')
  }

  const handleCancel = () => {
    setActiveTransition(null)
    setNote('')
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">状态流转</h3>

      <div className="mb-4 p-3 bg-gray-50 rounded-md border border-gray-100">
        <p className="text-xs text-gray-500 mb-1">当前状态</p>
        <StatusBadge status={currentStatus} />
      </div>

      {actions && actions.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-medium text-gray-500 mb-2">流转历史</h4>
          <div className="space-y-0">
            {actions
              .slice()
              .reverse()
              .map((action, idx) => (
                <div key={action.id} className="relative pl-6 pb-4">
                  {idx < actions.length - 1 && (
                    <div className="absolute left-[7px] top-4 bottom-0 w-px bg-gray-200" />
                  )}
                  <div
                    className={`absolute left-0 top-1 w-4 h-4 rounded-full border-2 border-white ${getStatusDotColor(action.to_status as VerificationStatus)}`}
                  />
                  <div className="ml-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">
                        {STATUS_LABEL_MAP[action.from_status] || action.from_status}
                      </span>
                      <svg className="w-3 h-3 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                      </svg>
                      <span className="text-xs font-medium text-gray-700">
                        {STATUS_LABEL_MAP[action.to_status] || action.to_status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {action.operator} · {formatDate(action.created_at)}
                    </p>
                    {action.note && (
                      <p className="text-xs text-gray-500 mt-0.5">{action.note}</p>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {transitions.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-gray-500 mb-2">可用操作</h4>
          <div className="space-y-2">
            {transitions.map((t) => (
              <button
                key={`${t.from_status}-${t.to_status}`}
                onClick={() => {
                  if (t.requires_note) {
                    setActiveTransition(t)
                  } else {
                    onTransition(t, '')
                  }
                }}
                disabled={loading}
                className="w-full px-3 py-2 text-sm font-medium rounded-md border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {transitions.length === 0 && (
        <p className="text-xs text-gray-400 text-center py-2">当前状态无可用操作</p>
      )}

      {activeTransition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              {activeTransition.label}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              确认将状态从「{STATUS_LABELS[activeTransition.from_status]}」变更为「
              {STATUS_LABELS[activeTransition.to_status]}」
            </p>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="请输入备注说明（必填）"
              rows={3}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleConfirm}
                disabled={activeTransition.requires_note && !note.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
