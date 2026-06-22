'use client'

import { useState, useCallback } from 'react'
import { Upload, FileSpreadsheet, ShieldCheck, CheckCircle2, XCircle, AlertTriangle, Loader2, FileText } from 'lucide-react'
import Sidebar from '@/components/layout/sidebar'
import Header from '@/components/layout/header'
import { cn } from '@/lib/utils'

type ImportType = 'erp_export' | 'permission_log'
type UploadStatus = 'idle' | 'uploading' | 'success' | 'error'

interface UploadResult {
  fileName: string
  fileUrl: string
  importType: string
  totalRows: number
  successRows: number
  errorRows: number
  errors?: Array<{ row: number; field?: string; ticket_no?: string; message?: string; reason?: string }>
  linkedTickets?: number
}

const importTypeConfig: Record<ImportType, { label: string; description: string; icon: typeof FileSpreadsheet; color: string; requiredColumns: string[] }> = {
  erp_export: {
    label: 'ERP 导出',
    description: '从 ERP 系统导出的审计问题清单（CSV 格式），包含 title、department、description 等字段。每行将创建一条审计工单及对应的整改日志和邮件材料。',
    icon: FileSpreadsheet,
    color: 'amber',
    requiredColumns: ['title', 'department', 'description'],
  },
  permission_log: {
    label: '权限日志',
    description: '系统权限变更或访问日志（CSV 格式），包含 ticket_no、user_email、action 等字段。每条记录将按工单号关联到对应工单的邮件材料追溯中。',
    icon: ShieldCheck,
    color: 'blue',
    requiredColumns: ['ticket_no'],
  },
}

export default function UploadPage() {
  const [importType, setImportType] = useState<ImportType>('erp_export')
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<UploadStatus>('idle')
  const [result, setResult] = useState<UploadResult | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) {
      setFile(selected)
      setStatus('idle')
      setResult(null)
      setErrorMessage('')
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const dropped = e.dataTransfer.files[0]
    if (dropped) {
      setFile(dropped)
      setStatus('idle')
      setResult(null)
      setErrorMessage('')
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const handleUpload = async () => {
    if (!file) return

    setStatus('uploading')
    setResult(null)
    setErrorMessage('')

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('importType', importType)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        setStatus('error')
        setErrorMessage(data.error || '上传失败')
        return
      }

      setStatus('success')
      setResult(data)
    } catch (err) {
      setStatus('error')
      setErrorMessage(err instanceof Error ? err.message : '网络错误')
    }
  }

  const handleReset = () => {
    setFile(null)
    setStatus('idle')
    setResult(null)
    setErrorMessage('')
  }

  const config = importTypeConfig[importType]

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header title="数据导入" />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl p-6">
            <div className="mb-6">
              <h1 className="text-lg font-bold text-navy-900">数据导入</h1>
              <p className="mt-1 text-sm text-slate-500">
                上传 ERP 导出文件或权限日志，系统将自动解析并写入审计工单或关联材料
              </p>
            </div>

            <div className="mb-6 space-y-3">
              <label className="block text-sm font-medium text-navy-900">导入类型</label>
              <div className="grid grid-cols-2 gap-3">
                {(Object.keys(importTypeConfig) as ImportType[]).map((type) => {
                  const cfg = importTypeConfig[type]
                  const Icon = cfg.icon
                  const active = importType === type
                  return (
                    <button
                      key={type}
                      onClick={() => { setImportType(type); handleReset() }}
                      className={cn(
                        'flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-colors',
                        active
                          ? 'border-amber-500 bg-amber-50'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      )}
                    >
                      <div className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                        active ? 'bg-amber-600' : 'bg-slate-100'
                      )}>
                        <Icon className={cn('h-5 w-5', active ? 'text-white' : 'text-slate-400')} />
                      </div>
                      <div>
                        <p className={cn('text-sm font-bold', active ? 'text-amber-900' : 'text-slate-700')}>
                          {cfg.label}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500 leading-relaxed">
                          {cfg.description}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {status !== 'success' && (
              <div className="mb-6">
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  className={cn(
                    'flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors',
                    file ? 'border-amber-400 bg-amber-50' : 'border-slate-300 bg-slate-50 hover:border-amber-400'
                  )}
                >
                  <Upload className={cn('mb-3 h-10 w-10', file ? 'text-amber-600' : 'text-slate-400')} />
                  {file ? (
                    <div className="text-center">
                      <p className="text-sm font-medium text-navy-900">{file.name}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-sm font-medium text-slate-600">拖拽文件到此处或点击选择</p>
                      <p className="mt-1 text-xs text-slate-400">支持 CSV 格式</p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="absolute inset-0 cursor-pointer opacity-0"
                    style={{ position: 'relative', marginTop: '12px' }}
                  />
                </div>

                <div className="mt-3 rounded-lg bg-slate-50 p-3">
                  <p className="text-xs font-medium text-slate-600">必填列：</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {config.requiredColumns.map((col) => (
                      <span
                        key={col}
                        className="inline-flex items-center rounded-full bg-white px-2 py-0.5 text-xs font-medium text-navy-900 shadow-sm"
                      >
                        {col}
                      </span>
                    ))}
                  </div>
                  {importType === 'erp_export' && (
                    <p className="mt-1.5 text-xs text-slate-400">
                      可选列：assignee_email, due_date, evidence_email, attachments
                    </p>
                  )}
                  {importType === 'permission_log' && (
                    <p className="mt-1.5 text-xs text-slate-400">
                      可选列：user_email, action, resource, timestamp, ip_address, status, details
                    </p>
                  )}
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <button
                    onClick={handleUpload}
                    disabled={!file || status === 'uploading'}
                    className={cn(
                      'flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-colors',
                      file && status !== 'uploading'
                        ? 'bg-amber-600 text-white hover:bg-amber-700'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    )}
                  >
                    {status === 'uploading' ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        导入中...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        开始导入
                      </>
                    )}
                  </button>
                  {file && status !== 'uploading' && (
                    <button
                      onClick={handleReset}
                      className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50"
                    >
                      重置
                    </button>
                  )}
                </div>
              </div>
            )}

            {status === 'error' && errorMessage && (
              <div className="mb-6 flex items-start gap-2 rounded-lg bg-rose-50 p-4 text-sm text-rose-700">
                <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-medium">导入失败</p>
                  <p className="mt-1 text-xs">{errorMessage}</p>
                </div>
              </div>
            )}

            {status === 'success' && result && (
              <div className="space-y-4">
                <div className="flex items-start gap-2 rounded-lg bg-emerald-50 p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  <div>
                    <p className="text-sm font-medium text-emerald-900">导入完成</p>
                    <p className="mt-1 text-xs text-emerald-700">
                      {result.importType === 'erp_export'
                        ? `成功创建 ${result.successRows} 条审计工单`
                        : `成功关联 ${result.linkedTickets ?? result.successRows} 条权限日志到对应工单`}
                      {result.errorRows > 0 && `，${result.errorRows} 条处理失败`}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="mb-3 text-sm font-bold text-navy-900">导入结果</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="rounded-lg bg-slate-50 p-3 text-center">
                      <p className="text-2xl font-bold text-navy-900">{result.totalRows}</p>
                      <p className="mt-1 text-xs text-slate-500">总记录数</p>
                    </div>
                    <div className="rounded-lg bg-emerald-50 p-3 text-center">
                      <p className="text-2xl font-bold text-emerald-600">{result.successRows}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {result.importType === 'erp_export' ? '创建工单' : '关联成功'}
                      </p>
                    </div>
                    <div className="rounded-lg bg-rose-50 p-3 text-center">
                      <p className="text-2xl font-bold text-rose-600">{result.errorRows}</p>
                      <p className="mt-1 text-xs text-slate-500">处理失败</p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-lg bg-slate-50 p-3">
                    <p className="text-xs text-slate-600">
                      <span className="font-medium">文件：</span>{result.fileName}
                    </p>
                  </div>
                </div>

                {result.errors && result.errors.length > 0 && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                    <div className="mb-3 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <h3 className="text-sm font-bold text-amber-900">错误明细</h3>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-amber-200 text-left">
                            <th className="pb-2 pr-3 font-medium text-amber-800">行号</th>
                            {result.importType === 'erp_export' ? (
                              <th className="pb-2 pr-3 font-medium text-amber-800">字段</th>
                            ) : (
                              <th className="pb-2 pr-3 font-medium text-amber-800">工单号</th>
                            )}
                            <th className="pb-2 font-medium text-amber-800">原因</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.errors.map((err, idx) => (
                            <tr key={idx} className="border-b border-amber-100 last:border-0">
                              <td className="py-1.5 pr-3 text-amber-900">{err.row}</td>
                              <td className="py-1.5 pr-3 text-amber-700">
                                {err.field || err.ticket_no || '-'}
                              </td>
                              <td className="py-1.5 text-amber-700">
                                {err.message || err.reason || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-700"
                  >
                    继续导入
                  </button>
                  {result.importType === 'erp_export' && (
                    <a
                      href="/board"
                      className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50"
                    >
                      查看看板
                    </a>
                  )}
                </div>

                <div className="rounded-lg bg-blue-50 p-4">
                  <div className="flex items-start gap-2">
                    <FileText className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                    <div className="text-xs text-blue-700">
                      <p className="font-medium">数据追溯说明</p>
                      {result.importType === 'erp_export' ? (
                        <p className="mt-1">
                          新创建的工单可在看板视图中查看。进入工单详情页，在"整改日志"和"邮件材料追溯"中可看到导入时自动生成的记录。
                        </p>
                      ) : (
                        <p className="mt-1">
                          导入的权限日志已按工单号关联到对应工单。进入工单详情页，在"邮件材料追溯"中可看到新增的权限日志记录。
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-sm font-bold text-navy-900">CSV 模板示例</h3>
              {importType === 'erp_export' ? (
                <div className="space-y-2">
                  <pre className="overflow-x-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">
{`title,department,description,assignee_email,due_date,evidence_email
"权限异常访问","信息技术部","发现未授权用户访问敏感数据","biz@company.com",2024-07-15,"审计报告：检测到异常权限分配"`}
                  </pre>
                </div>
              ) : (
                <div className="space-y-2">
                  <pre className="overflow-x-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">
{`ticket_no,user_email,action,resource,timestamp,ip_address,status,details
AUD-2024-0001,user@company.com,LOGIN,ERP_SYSTEM,2024-06-15 09:23:45,192.168.1.1,SUCCESS,正常登录`}
                  </pre>
                  <p className="text-xs text-slate-500">
                    ticket_no 必须对应系统中已存在的工单号，否则该行将作为错误返回。
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
