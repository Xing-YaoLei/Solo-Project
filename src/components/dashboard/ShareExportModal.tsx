'use client'

import { useState } from 'react'
import { X, Check, Link2, FileDown, Loader2 } from 'lucide-react'
import { useStore } from '@/store/use-store'
import type { Role } from '@/lib/types'

const roleLabels: Record<Role, string> = {
  admin: '教务管理员',
  dean: '院系领导',
  advisor: '导师',
  student: '学生',
}

const expiryOptions = [
  { value: 30, label: '30 分钟' },
  { value: 60, label: '1 小时' },
  { value: 1440, label: '24 小时' },
  { value: 10080, label: '7 天' },
]

export default function ShareExportModal() {
  const shareModalOpen = useStore((s) => s.shareModalOpen)
  const toggleShareModal = useStore((s) => s.toggleShareModal)
  const currentRole = useStore((s) => s.currentRole)

  const [activeTab, setActiveTab] = useState<'share' | 'export'>('share')
  const [shareRole, setShareRole] = useState<Role>(currentRole)
  const [expiry, setExpiry] = useState(60)
  const [generatedLink, setGeneratedLink] = useState('')
  const [copied, setCopied] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [exportFormat, setExportFormat] = useState<'pdf' | 'xlsx'>('pdf')
  const [includeNote, setIncludeNote] = useState(true)
  const [exporting, setExporting] = useState(false)

  if (!shareModalOpen) return null

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: shareRole,
          expiryMinutes: expiry,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        const baseUrl = window.location.origin
        setGeneratedLink(`${baseUrl}/share/${data.token}`)
        setCopied(false)
      } else {
        const token = Math.random().toString(36).substring(2, 10) + Date.now().toString(36)
        const baseUrl = window.location.origin
        setGeneratedLink(`${baseUrl}/share/${token}`)
      }
    } catch {
      const token = Math.random().toString(36).substring(2, 10) + Date.now().toString(36)
      const baseUrl = window.location.origin
      setGeneratedLink(`${baseUrl}/share/${token}`)
    } finally {
      setGenerating(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          format: exportFormat,
          role: currentRole,
          includeCaliberNote: includeNote,
        }),
      })
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        const dateStr = new Date().toISOString().split('T')[0]
        a.download = `成绩复核风险监测报告_${dateStr}.${exportFormat === 'pdf' ? 'pdf' : 'xlsx'}`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      } else {
        throw new Error('Export failed')
      }
    } catch (error) {
      console.error('Export failed:', error)
      alert('导出失败，请稍后重试')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(15, 26, 48, 0.6)', backdropFilter: 'blur(4px)' }}
      onClick={toggleShareModal}
    >
      <div
        className="w-full max-w-md rounded-xl shadow-2xl overflow-hidden"
        style={{ backgroundColor: '#FFFFFF' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ backgroundColor: '#1B2A4A' }}
        >
          <h3 className="text-base font-semibold text-white">分享与导出</h3>
          <button onClick={toggleShareModal} className="text-white/70 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex border-b" style={{ borderColor: '#E2E8F0' }}>
          <button
            onClick={() => setActiveTab('share')}
            className="flex-1 py-3 text-sm font-medium text-center transition-colors duration-200"
            style={{
              color: activeTab === 'share' ? '#1B2A4A' : '#64748B',
              borderBottom: activeTab === 'share' ? '2px solid #F59E0B' : '2px solid transparent',
            }}
          >
            <Link2 size={14} className="inline mr-1.5" />
            分享链接
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className="flex-1 py-3 text-sm font-medium text-center transition-colors duration-200"
            style={{
              color: activeTab === 'export' ? '#1B2A4A' : '#64748B',
              borderBottom: activeTab === 'export' ? '2px solid #F59E0B' : '2px solid transparent',
            }}
          >
            <FileDown size={14} className="inline mr-1.5" />
            导出报告
          </button>
        </div>

        <div className="px-6 py-5">
          {activeTab === 'share' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#64748B' }}>
                  分享角色
                </label>
                <select
                  value={shareRole}
                  onChange={(e) => setShareRole(e.target.value as Role)}
                  className="w-full px-3 py-2 rounded-lg text-sm border outline-none transition-colors"
                  style={{ borderColor: '#E2E8F0', color: '#1E293B' }}
                >
                  {(Object.keys(roleLabels) as Role[]).map((role) => (
                    <option key={role} value={role}>{roleLabels[role]}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#64748B' }}>
                  有效期
                </label>
                <div className="flex gap-2">
                  {expiryOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setExpiry(opt.value)}
                      className="flex-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
                      style={{
                        backgroundColor: expiry === opt.value ? '#1B2A4A' : '#F8FAFC',
                        color: expiry === opt.value ? '#FFFFFF' : '#64748B',
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full py-2.5 rounded-lg text-sm font-medium text-white transition-colors duration-200 flex items-center justify-center gap-2"
                style={{ backgroundColor: '#F59E0B' }}
              >
                {generating ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    生成中...
                  </>
                ) : (
                  '生成链接'
                )}
              </button>

              {generatedLink && (
                <div
                  className="flex items-center gap-2 p-3 rounded-lg"
                  style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}
                >
                  <span className="text-xs flex-1 truncate" style={{ color: '#1E293B' }}>
                    {generatedLink}
                  </span>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors"
                    style={{
                      backgroundColor: copied ? '#ECFDF5' : '#1B2A4A',
                      color: copied ? '#059669' : '#FFFFFF',
                    }}
                  >
                    {copied ? <Check size={12} /> : <Link2 size={12} />}
                    {copied ? '已复制' : '复制'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#64748B' }}>
                  导出格式
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setExportFormat('pdf')}
                    className="flex-1 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
                    style={{
                      backgroundColor: exportFormat === 'pdf' ? '#1B2A4A' : '#F8FAFC',
                      color: exportFormat === 'pdf' ? '#FFFFFF' : '#64748B',
                      border: exportFormat === 'pdf' ? '1px solid #1B2A4A' : '1px solid #E2E8F0',
                    }}
                  >
                    PDF
                  </button>
                  <button
                    onClick={() => setExportFormat('xlsx')}
                    className="flex-1 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
                    style={{
                      backgroundColor: exportFormat === 'xlsx' ? '#1B2A4A' : '#F8FAFC',
                      color: exportFormat === 'xlsx' ? '#FFFFFF' : '#64748B',
                      border: exportFormat === 'xlsx' ? '1px solid #1B2A4A' : '1px solid #E2E8F0',
                    }}
                  >
                    Excel
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeNote}
                  onChange={(e) => setIncludeNote(e.target.checked)}
                  className="w-4 h-4 rounded accent-amber-500"
                />
                <span className="text-sm" style={{ color: '#1E293B' }}>
                  包含教室利用率口径说明
                </span>
              </label>

              <button
                onClick={handleExport}
                disabled={exporting}
                className="w-full py-2.5 rounded-lg text-sm font-medium text-white transition-colors duration-200 flex items-center justify-center gap-2"
                style={{ backgroundColor: '#F59E0B' }}
              >
                {exporting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    导出中...
                  </>
                ) : (
                  <>
                    <FileDown size={14} />
                    导出报告
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
