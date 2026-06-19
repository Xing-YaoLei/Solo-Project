import React from 'react'

export function StatusBadge({ status, map }) {
  const cfg = map[status] || { label: status, color: 'bg-gray-100 text-gray-700' }
  return <span className={`badge ${cfg.color}`}>{cfg.label}</span>
}

export function StatCard({ label, value, sub, icon: Icon, trend, color = 'primary' }) {
  const colorMap = {
    primary: 'from-primary-50 to-primary-100 text-primary-600',
    emerald: 'from-emerald-50 to-emerald-100 text-emerald-600',
    amber: 'from-amber-50 to-amber-100 text-amber-600',
    red: 'from-red-50 to-red-100 text-red-600',
    purple: 'from-purple-50 to-purple-100 text-purple-600',
    blue: 'from-blue-50 to-blue-100 text-blue-600',
  }
  return (
    <div className="stat-card flex items-start justify-between">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
        <p className="text-2xl font-bold text-gray-900 leading-tight">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1.5">{sub}</p>}
        {trend && (
          <p className={`text-xs mt-1.5 ${trend.startsWith('+') ? 'text-emerald-600' : 'text-red-500'}`}>
            {trend} 较上期
          </p>
        )}
      </div>
      {Icon && (
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorMap[color]} flex items-center justify-center shrink-0`}>
          <Icon className="w-6 h-6" />
        </div>
      )}
    </div>
  )
}

export function Modal({ open, onClose, title, children, size = 'md', footer }) {
  if (!open) return null
  const sizeMap = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className={`w-full ${sizeMap[size]} bg-white rounded-2xl shadow-2xl max-h-[85vh] flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
            ✕
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">{children}</div>
        {footer && (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl flex items-center justify-end gap-2 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

export function Pagination({ page, pageSize, total, onChange }) {
  const totalPages = Math.ceil(total / pageSize)
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)
  return (
    <div className="flex items-center justify-between mt-4 px-1">
      <p className="text-sm text-gray-500">
        显示 <span className="font-medium text-gray-700">{start}-{end}</span> 条，
        共 <span className="font-medium text-gray-700">{total}</span> 条
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          上一页
        </button>
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let p
          if (totalPages <= 5) p = i + 1
          else if (page <= 3) p = i + 1
          else if (page >= totalPages - 2) p = totalPages - 4 + i
          else p = page - 2 + i
          return (
            <button
              key={p}
              onClick={() => onChange(p)}
              className={`w-8 h-8 rounded-lg text-sm ${
                p === page
                  ? 'bg-primary-600 text-white'
                  : 'border border-gray-200 bg-white hover:bg-gray-50'
              }`}
            >
              {p}
            </button>
          )
        })}
        <button
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          下一页
        </button>
      </div>
    </div>
  )
}

export function EmptyState({ title, desc, icon: Icon }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && <Icon className="w-16 h-16 text-gray-300 mb-3" />}
      <p className="text-base font-medium text-gray-600 mb-1">{title}</p>
      {desc && <p className="text-sm text-gray-400">{desc}</p>}
    </div>
  )
}

export function SectionTitle({ title, desc, action }) {
  return (
    <div className="flex items-end justify-between mb-4">
      <div>
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        {desc && <p className="text-xs text-gray-500 mt-1">{desc}</p>}
      </div>
      {action}
    </div>
  )
}
