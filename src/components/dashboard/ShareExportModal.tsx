'use client'

import { useState, useEffect } from 'react'
import { X, Check, Link2, FileDown, Loader2, Building2, User, GraduationCap } from 'lucide-react'
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

const mockDepartments = [
  { id: 'dept-001', name: '计算机科学与技术学院' },
  { id: 'dept-002', name: '电子信息工程学院' },
  { id: 'dept-003', name: '数学与统计学院' },
  { id: 'dept-004', name: '物理学院' },
]

const mockAdvisors = [
  { id: 'adv-001', name: '张明', departmentId: 'dept-001' },
  { id: 'adv-002', name: '李华', departmentId: 'dept-001' },
  { id: 'adv-003', name: '王强', departmentId: 'dept-002' },
  { id: 'adv-004', name: '刘伟', departmentId: 'dept-003' },
]

const mockStudents = [
  { id: 'stu-001', name: '陈小明', studentNo: '202201001', advisorId: 'adv-001' },
  { id: 'stu-002', name: '赵小红', studentNo: '202201002', advisorId: 'adv-001' },
  { id: 'stu-003', name: '王小刚', studentNo: '202201003', advisorId: 'adv-002' },
  { id: 'stu-004', name: '李小丽', studentNo: '202202001', advisorId: 'adv-003' },
]

interface ScopeOption {
  id: string
  name: string
  studentNo?: string
}

export default function ShareExportModal() {
  const shareModalOpen = useStore((s) => s.shareModalOpen)
  const toggleShareModal = useStore((s) => s.toggleShareModal)
  const currentRole = useStore((s) => s.currentRole)
  const currentDepartment = useStore((s) => s.currentDepartment)
  const currentAdvisor = useStore((s) => s.currentAdvisor)

  const [activeTab, setActiveTab] = useState<'share' | 'export'>('share')
  const [shareRole, setShareRole] = useState<Role>(currentRole)
  const [expiry, setExpiry] = useState(60)
  const [generatedLink, setGeneratedLink] = useState('')
  const [copied, setCopied] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exportFormat, setExportFormat] = useState<'pdf' | 'xlsx'>('pdf')
  const [includeNote, setIncludeNote] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  const [scopeType, setScopeType] = useState<'all' | 'department' | 'advisor' | 'student'>('all')
  const [selectedDepartment, setSelectedDepartment] = useState('')
  const [selectedAdvisor, setSelectedAdvisor] = useState('')
  const [selectedStudent, setSelectedStudent] = useState('')

  const [departmentOptions, setDepartmentOptions] = useState<ScopeOption[]>([])
  const [advisorOptions, setAdvisorOptions] = useState<ScopeOption[]>([])
  const [studentOptions, setStudentOptions] = useState<ScopeOption[]>([])

  useEffect(() => {
    if (!shareModalOpen) return
    setError(null)
    setExportError(null)
    setShareRole(currentRole)
    setGeneratedLink('')
    setCopied(false)
    setScopeType('all')
    setSelectedDepartment(currentDepartment || '')
    setSelectedAdvisor(currentAdvisor || '')
    setSelectedStudent('')

    setDepartmentOptions(mockDepartments.map((d) => ({ id: d.id, name: d.name })))

    let filteredAdvisors = mockAdvisors
    if (currentRole === 'dean' && currentDepartment) {
      filteredAdvisors = mockAdvisors.filter((a) => a.departmentId === currentDepartment)
    }
    setAdvisorOptions(filteredAdvisors.map((a) => ({ id: a.id, name: a.name })))

    let filteredStudents = mockStudents
    if (currentRole === 'advisor' && currentAdvisor) {
      filteredStudents = mockStudents.filter((s) => s.advisorId === currentAdvisor)
    } else if (currentRole === 'dean' && currentDepartment) {
      const deptAdvisors = mockAdvisors.filter((a) => a.departmentId === currentDepartment).map((a) => a.id)
      filteredStudents = mockStudents.filter((s) => deptAdvisors.includes(s.advisorId))
    }
    setStudentOptions(filteredStudents.map((s) => ({ id: s.id, name: s.name, studentNo: s.studentNo })))
  }, [shareModalOpen, currentRole, currentDepartment, currentAdvisor])

  if (!shareModalOpen) return null

  const handleGenerate = async () => {
    setGenerating(true)
    setError(null)
    setGeneratedLink('')
    try {
      const body: Record<string, unknown> = {
        role: shareRole,
        expiryMinutes: expiry,
      }
      if (scopeType === 'department' && selectedDepartment) {
        body.departmentId = selectedDepartment
      } else if (scopeType === 'advisor' && selectedAdvisor) {
        body.advisorId = selectedAdvisor
      } else if (scopeType === 'student' && selectedStudent) {
        body.studentId = selectedStudent
      }

      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || '生成分享链接失败')
      }

      const data = await res.json()
      const baseUrl = window.location.origin
      setGeneratedLink(`${baseUrl}/share/${data.token}`)
      setCopied(false)
    } catch (err) {
      console.error('Generate share link error:', err)
      setError(err instanceof Error ? err.message : '生成分享链接失败，请检查数据库连接')
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
    setExportError(null)
    try {
      const body: Record<string, unknown> = {
        format: exportFormat,
        role: currentRole,
        includeCaliberNote: includeNote,
      }
      if (currentDepartment) body.department = currentDepartment
      if (currentAdvisor) body.advisorId = currentAdvisor

      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.error || '导出失败')
      }

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
    } catch (err) {
      console.error('Export failed:', err)
      setExportError(err instanceof Error ? err.message : '导出失败，请稍后重试')
    } finally {
      setExporting(false)
    }
  }

  const showDepartment = shareRole === 'admin' || shareRole === 'dean'
  const showAdvisor = shareRole === 'admin' || shareRole === 'dean' || shareRole === 'advisor'
  const showStudent = shareRole === 'admin' || shareRole === 'dean' || shareRole === 'advisor' || shareRole === 'student'

  const filteredAdvisors = selectedDepartment
    ? advisorOptions.filter((a) => {
        const advisor = mockAdvisors.find((ad) => ad.id === a.id)
        return advisor?.departmentId === selectedDepartment
      })
    : advisorOptions

  const filteredStudents = selectedAdvisor
    ? studentOptions.filter((s) => {
        const student = mockStudents.find((st) => st.id === s.id)
        return student?.advisorId === selectedAdvisor
      })
    : selectedDepartment
    ? studentOptions.filter((s) => {
        const student = mockStudents.find((st) => st.id === s.id)
        const advisor = mockAdvisors.find((a) => a.id === student?.advisorId)
        return advisor?.departmentId === selectedDepartment
      })
    : studentOptions

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

        <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">
          {activeTab === 'share' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#64748B' }}>
                  分享角色
                </label>
                <select
                  value={shareRole}
                  onChange={(e) => {
                    setShareRole(e.target.value as Role)
                    setScopeType('all')
                    setSelectedDepartment('')
                    setSelectedAdvisor('')
                    setSelectedStudent('')
                  }}
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
                  数据范围
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setScopeType('all')}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
                    style={{
                      backgroundColor: scopeType === 'all' ? '#1B2A4A' : '#F8FAFC',
                      color: scopeType === 'all' ? '#FFFFFF' : '#64748B',
                    }}
                  >
                    全部
                  </button>
                  {showDepartment && (
                    <button
                      onClick={() => {
                        setScopeType('department')
                        setSelectedAdvisor('')
                        setSelectedStudent('')
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
                      style={{
                        backgroundColor: scopeType === 'department' ? '#1B2A4A' : '#F8FAFC',
                        color: scopeType === 'department' ? '#FFFFFF' : '#64748B',
                      }}
                    >
                      <Building2 size={12} />
                      院系
                    </button>
                  )}
                  {showAdvisor && (
                    <button
                      onClick={() => {
                        setScopeType('advisor')
                        setSelectedDepartment('')
                        setSelectedStudent('')
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
                      style={{
                        backgroundColor: scopeType === 'advisor' ? '#1B2A4A' : '#F8FAFC',
                        color: scopeType === 'advisor' ? '#FFFFFF' : '#64748B',
                      }}
                    >
                      <User size={12} />
                      导师
                    </button>
                  )}
                  {showStudent && (
                    <button
                      onClick={() => {
                        setScopeType('student')
                        setSelectedDepartment('')
                        setSelectedAdvisor('')
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
                      style={{
                        backgroundColor: scopeType === 'student' ? '#1B2A4A' : '#F8FAFC',
                        color: scopeType === 'student' ? '#FFFFFF' : '#64748B',
                      }}
                    >
                      <GraduationCap size={12} />
                      学生
                    </button>
                  )}
                </div>
              </div>

              {scopeType === 'department' && (
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: '#64748B' }}>
                    选择院系
                  </label>
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm border outline-none transition-colors"
                    style={{ borderColor: '#E2E8F0', color: '#1E293B' }}
                  >
                    <option value="">请选择院系</option>
                    {departmentOptions.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {scopeType === 'advisor' && (
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: '#64748B' }}>
                    选择导师
                  </label>
                  <select
                    value={selectedAdvisor}
                    onChange={(e) => setSelectedAdvisor(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm border outline-none transition-colors"
                    style={{ borderColor: '#E2E8F0', color: '#1E293B' }}
                  >
                    <option value="">请选择导师</option>
                    {filteredAdvisors.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {scopeType === 'student' && (
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: '#64748B' }}>
                    选择学生
                  </label>
                  <select
                    value={selectedStudent}
                    onChange={(e) => setSelectedStudent(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm border outline-none transition-colors"
                    style={{ borderColor: '#E2E8F0', color: '#1E293B' }}
                  >
                    <option value="">请选择学生</option>
                    {filteredStudents.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}（{s.studentNo}）
                      </option>
                    ))}
                  </select>
                </div>
              )}

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

              {error && (
                <div
                  className="p-3 rounded-lg text-xs"
                  style={{ backgroundColor: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}
                >
                  {error}
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={
                  generating ||
                  (scopeType === 'department' && !selectedDepartment) ||
                  (scopeType === 'advisor' && !selectedAdvisor) ||
                  (scopeType === 'student' && !selectedStudent)
                }
                className="w-full py-2.5 rounded-lg text-sm font-medium text-white transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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

              {exportError && (
                <div
                  className="p-3 rounded-lg text-xs"
                  style={{ backgroundColor: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}
                >
                  {exportError}
                </div>
              )}

              <button
                onClick={handleExport}
                disabled={exporting}
                className="w-full py-2.5 rounded-lg text-sm font-medium text-white transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
