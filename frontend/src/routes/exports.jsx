import React, { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  Download, FileSpreadsheet, Filter, RefreshCw, Clock,
  CheckCircle2, XCircle, ChevronRight, Info, Sparkles, FileText
} from 'lucide-react'
import { api } from '../lib/api'
import { EXPORT_TYPE } from '../lib/constants'
import { SectionTitle, Modal, EmptyState, Pagination } from '../components/ui'
import toast from 'react-hot-toast'

export const Route = createFileRoute('/exports')({
  component: ExportsPage,
})

function ExportsPage() {
  const [tasks, setTasks] = useState([])
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ export_type: 'orders', requested_by: '', criteria: {} })
  const [preview, setPreview] = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const d = await api.listExportTasks()
      setTasks(d)
    } catch (e) { console.warn(e); setTasks([]) }
  }

  async function doExport() {
    try {
      const criteria = { ...form.criteria }
      if (form.export_type === 'conversion') {
        criteria.period_start = form.criteria.period_start
        criteria.period_end = form.criteria.period_end
      }
      const t = await api.createExport({
        export_type: form.export_type,
        criteria,
        requested_by: form.requested_by || '系统用户',
      })
      toast.success('导出任务已创建')
      setShowCreate(false)
      setTimeout(async () => {
        const updated = await api.getExportTask(t.id)
        if (updated.status === 'completed') {
          toast.success('文件已生成，开始下载')
          window.location.href = updated.file_url
        }
        load()
      }, 1500)
      load()
    } catch (e) { toast.error(e.message) }
  }

  const getCaliber = (type) => {
    const samples = {
      orders: {
        fields: ['订单号', '套餐名称', '民宿名称', '客户姓名', '入住日期', '退房日期', '实收金额', '状态(中文)', '销售渠道', '销售负责人', '创建时间'],
        extra: ['状态映射：待确认/已确认/已入住/已退房/已取消/已退款'],
        formulas: [],
      },
      conversion: {
        fields: ['套餐名称', '统计周期', '下单数', '确认数', '入住数', '取消数', '订单确认率(%)', '确认入住率(%)', '整体转化率(%)', '总营收', '平均客单价'],
        extra: ['状态映射同上'],
        formulas: [
          '订单确认率 = 确认数 / 下单数 × 100%',
          '确认入住率 = 入住数 / 确认数 × 100%',
          '整体转化率 = 入住数 / (下单数 × 3) × 100%（咨询量按下单数×3估算）',
          '总营收 = 实收金额合计（不含已取消/已退款订单）',
        ],
      },
      inventory: {
        fields: ['套餐名称', '日期', '总库存', '已售', '预留', '可售', '可售率(%)', '单价'],
        extra: [],
        formulas: [
          '可售 = 总库存 - 已售 - 预留',
          '可售率 = 可售 / 总库存 × 100%',
        ],
      },
      anomaly: {
        fields: ['异常单号', '关联订单号', '关联套餐', '异常类型(中文)', '异常标题', '异常描述', '影响等级', '处理状态(中文)', '责任归属(中文)', '责任人', '根本原因', '处理结果', '赔付金额(元)', '上报人', '处理人'],
        extra: ['异常类型：套餐超卖/价格异常/库存错误/核销失败/押金问题',
                '责任归属：销售部/运营部/前台/系统/客户',
                '影响等级：低/中/高/严重'],
        formulas: [],
      },
    }
    return samples[type] || samples.orders
  }

  const typeList = [
    { key: 'orders', label: '订单明细', desc: '完整订单列表', icon: FileText, color: 'from-blue-400 to-blue-600' },
    { key: 'conversion', label: '套餐转化率', desc: '转化漏斗与销售表现', icon: Sparkles, color: 'from-amber-400 to-orange-500' },
    { key: 'inventory', label: '库存明细', desc: '每日库存与单价', icon: FileSpreadsheet, color: 'from-emerald-400 to-emerald-600' },
    { key: 'anomaly', label: '异常单', desc: '异常详情与处理结果', icon: Info, color: 'from-red-400 to-red-600' },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Download className="w-5 h-5 text-primary-600" /> 数据导出
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            每一份导出 Excel 包含 3 个 Sheet：<span className="text-gray-700 font-medium">数据明细</span>、
            <span className="text-gray-700 font-medium">数据口径说明</span>、
            <span className="text-gray-700 font-medium">口径补充</span>（含指标公式、状态映射、筛选规则）。
            方便团队围绕套餐转化率解释数据变化。
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary" onClick={load}>
            <RefreshCw className="w-4 h-4" /> 刷新
          </button>
          <button className="btn-primary" onClick={() => {
            setForm({ export_type: 'orders', requested_by: '', criteria: {} })
            setPreview(null)
            setShowCreate(true)
          }}>
            <Download className="w-4 h-4" /> 新建导出
          </button>
        </div>
      </div>

      <SectionTitle title="选择导出类型" desc="点击卡片选择导出类型并查看数据口径说明" />
      <div className="grid grid-cols-4 gap-4">
        {typeList.map(t => {
          const Icon = t.icon
          return (
            <button
              key={t.key}
              onClick={() => {
                setForm({ ...form, export_type: t.key })
                setPreview(t.key)
                setShowCreate(true)
              }}
              className="group card p-5 text-left hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${t.color} text-white flex items-center justify-center mb-3 group-hover:scale-105 transition-transform shadow-md`}>
                <Icon className="w-6 h-6" />
              </div>
              <p className="font-semibold text-gray-900 mb-1">{t.label}</p>
              <p className="text-xs text-gray-500 mb-3">{t.desc}</p>
              <p className="text-xs text-primary-600 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                立即导出 <ChevronRight className="w-3 h-3" />
              </p>
            </button>
          )
        })}
      </div>

      {preview || (
        <div className="card p-5">
          <SectionTitle title="最近导出任务" />
          {tasks.length === 0 ? (
            <EmptyState title="暂无导出任务" desc="点击上方卡片开始导出" icon={FileSpreadsheet} />
          ) : (
            <>
              <div className="table-wrapper">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="th">任务编号</th>
                      <th className="th">导出类型</th>
                      <th className="th">申请人</th>
                      <th className="th">行数</th>
                      <th className="th">文件大小</th>
                      <th className="th">状态</th>
                      <th className="th">创建时间</th>
                      <th className="th">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map(t => (
                      <tr key={t.id}>
                        <td className="td font-mono text-xs text-primary-600">{t.task_no}</td>
                        <td className="td">
                          <span className="tag border-gray-200 bg-gray-50">
                            {EXPORT_TYPE[t.export_type]?.label || t.export_type}
                          </span>
                        </td>
                        <td className="td text-sm">{t.requested_by || '-'}</td>
                        <td className="td text-sm font-medium text-gray-700">{t.total_rows || 0}</td>
                        <td className="td text-sm text-gray-500">
                          {t.file_size ? `${(t.file_size / 1024).toFixed(1)} KB` : '-'}
                        </td>
                        <td className="td">
                          {t.status === 'completed'
                            ? <span className="badge bg-emerald-100 text-emerald-700"><CheckCircle2 className="w-3 h-3 inline mr-1" />已完成</span>
                            : t.status === 'failed'
                              ? <span className="badge bg-red-100 text-red-700"><XCircle className="w-3 h-3 inline mr-1" />失败</span>
                              : <span className="badge bg-amber-100 text-amber-700"><Clock className="w-3 h-3 inline mr-1" />处理中</span>
                          }
                        </td>
                        <td className="td text-xs text-gray-500">
                          {t.created_at?.slice(0, 19).replace('T', ' ')}
                        </td>
                        <td className="td">
                          {t.status === 'completed' && t.file_url && (
                            <a href={t.file_url} className="btn-primary text-xs">
                              <Download className="w-3 h-3" /> 下载
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      <Modal
        open={showCreate}
        title={`导出 - ${EXPORT_TYPE[form.export_type]?.label || ''}`}
        size="lg"
        onClose={() => setShowCreate(false)}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setShowCreate(false)}>取消</button>
            <button className="btn-primary" onClick={doExport}>
              <Download className="w-4 h-4" /> 开始导出
            </button>
          </>
        }
      >
        <div className="space-y-5">
          <div>
            <label className="label">导出类型</label>
            <div className="grid grid-cols-4 gap-2">
              {typeList.map(t => {
                const Icon = t.icon
                const active = form.export_type === t.key
                return (
                  <button
                    key={t.key}
                    onClick={() => { setForm({ ...form, export_type: t.key }); setPreview(t.key) }}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      active ? 'border-primary-500 bg-primary-50' : 'border-gray-100 bg-white hover:border-gray-200'
                    }`}
                  >
                    <Icon className={`w-4 h-4 mb-1 ${active ? 'text-primary-600' : 'text-gray-400'}`} />
                    <p className={`text-sm font-medium ${active ? 'text-primary-700' : 'text-gray-700'}`}>{t.label}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {form.export_type === 'conversion' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">统计开始日期</label>
                <input type="date" className="input"
                  value={form.criteria.period_start || ''}
                  onChange={e => setForm({
                    ...form, criteria: { ...form.criteria, period_start: e.target.value }
                  })} />
              </div>
              <div>
                <label className="label">统计结束日期</label>
                <input type="date" className="input"
                  value={form.criteria.period_end || ''}
                  onChange={e => setForm({
                    ...form, criteria: { ...form.criteria, period_end: e.target.value }
                  })} />
              </div>
            </div>
          )}

          <div>
            <label className="label">申请人</label>
            <input className="input" placeholder="您的姓名"
              value={form.requested_by}
              onChange={e => setForm({ ...form, requested_by: e.target.value })} />
          </div>

          {form.export_type && (() => {
            const c = getCaliber(form.export_type)
            return (
              <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 space-y-3">
                <h4 className="text-sm font-semibold text-amber-800 flex items-center gap-2">
                  <Info className="w-4 h-4" /> 数据口径预览
                </h4>
                <div>
                  <p className="text-xs font-medium text-amber-700 mb-1.5">📋 包含字段 ({c.fields.length})</p>
                  <div className="flex flex-wrap gap-1.5">
                    {c.fields.map(f => (
                      <span key={f} className="px-2 py-0.5 rounded-md bg-white border border-amber-200 text-[11px] text-amber-800">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
                {c.formulas.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-amber-700 mb-1.5">📐 指标公式</p>
                    <ul className="space-y-1">
                      {c.formulas.map((f, i) => (
                        <li key={i} className="text-[11px] text-amber-700 pl-3 relative before:content-['▸'] before:absolute before:left-0 before:text-amber-500">
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {c.extra.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-amber-700 mb-1.5">📌 其他说明</p>
                    <ul className="space-y-1">
                      {c.extra.map((e, i) => (
                        <li key={i} className="text-[11px] text-amber-700 pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-amber-500">
                          {e}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <p className="text-[11px] text-amber-600 pt-2 border-t border-amber-200/50">
                  ℹ️ 以上口径说明将作为 Excel 的独立 Sheet 一并导出，方便向团队解释数据来源与计算逻辑。
                </p>
              </div>
            )
          })()}
        </div>
      </Modal>
    </div>
  )
}
