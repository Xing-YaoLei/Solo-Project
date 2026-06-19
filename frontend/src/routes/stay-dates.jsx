import React, { useEffect, useState, useMemo } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  Calendar, Plus, Search, Lock, Unlock, Settings, AlertCircle
} from 'lucide-react'
import { api } from '../lib/api'
import { SectionTitle, Modal, EmptyState } from '../components/ui'
import toast from 'react-hot-toast'

export const Route = createFileRoute('/stay-dates')({
  component: StayDatesPage,
})

function StayDatesPage() {
  const search = Route.useSearch()
  const [packages, setPackages] = useState([])
  const [pkgId, setPkgId] = useState(search.package_id || null)
  const [dates, setDates] = useState([])
  const [showBulk, setShowBulk] = useState(false)
  const [bulkParams, setBulkParams] = useState({
    start_date: new Date().toISOString().slice(0, 10),
    end_date: new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10),
    check_in_time: '14:00',
    check_out_time: '12:00',
  })
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date(); d.setDate(1); return d
  })

  useEffect(() => {
    (async () => {
      const d = await api.listPackages({ page: 1, page_size: 100 })
      setPackages(d.items)
      if (!pkgId && d.items.length) setPkgId(d.items[0].id)
    })()
  }, [])

  useEffect(() => {
    if (!pkgId) return
    loadDates()
  }, [pkgId, currentMonth])

  async function loadDates() {
    const start = new Date(currentMonth)
    const end = new Date(currentMonth); end.setMonth(end.getMonth() + 2)
    const d = await api.listStayDates({
      package_id: pkgId,
      start_date: start.toISOString().slice(0, 10),
      end_date: end.toISOString().slice(0, 10),
    })
    setDates(d)
  }

  async function doBulkCreate() {
    try {
      await api.bulkCreateStayDates({ package_id: pkgId, ...bulkParams })
      toast.success('批量创建成功')
      setShowBulk(false)
      loadDates()
    } catch (e) { toast.error(e.message) }
  }

  async function toggleBlock(d) {
    try {
      await api.updateStayDate(d.id, {
        is_blocked: !d.is_blocked,
        block_reason: !d.is_blocked ? '手动关闭' : null,
      })
      toast.success(d.is_blocked ? '已开放' : '已关闭')
      loadDates()
    } catch (e) { toast.error(e.message) }
  }

  const calendar = useMemo(() => {
    const months = []
    for (let m = 0; m < 2; m++) {
      const base = new Date(currentMonth); base.setMonth(base.getMonth() + m)
      const y = base.getFullYear(), mo = base.getMonth()
      const firstDay = new Date(y, mo, 1)
      const lastDay = new Date(y, mo + 1, 0)
      const startWeekday = firstDay.getDay()
      const days = []
      for (let i = 0; i < startWeekday; i++) days.push(null)
      for (let i = 1; i <= lastDay.getDate(); i++) {
        const ds = `${y}-${String(mo + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
        const sd = dates.find(d => d.stay_date === ds)
        days.push({ date: ds, day: i, weekday: new Date(y, mo, i).getDay(), sd })
      }
      while (days.length % 7 !== 0) days.push(null)
      months.push({ year: y, month: mo + 1, days })
    }
    return months
  }, [dates, currentMonth])

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">入住日期管理</h1>
          <p className="text-sm text-gray-500 mt-1">
            在日历上直观管理各套餐的可售日期与入住时间，一键关闭异常日期
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary" onClick={() => setShowBulk(true)}>
            <Plus className="w-4 h-4" /> 批量生成
          </button>
        </div>
      </div>

      <div className="card p-4 flex items-center gap-3 flex-wrap">
        <label className="text-sm text-gray-600">选择套餐：</label>
        <select className="input max-w-md" value={pkgId || ''} onChange={e => setPkgId(Number(e.target.value))}>
          <option value="">-- 请选择 --</option>
          {packages.map(p => (
            <option key={p.id} value={p.id}>{p.name} - {p.homestay_name}</option>
          ))}
        </select>
        <div className="ml-auto flex items-center gap-2">
          <button className="btn-ghost text-sm" onClick={() => {
            const d = new Date(currentMonth); d.setMonth(d.getMonth() - 2)
            setCurrentMonth(d)
          }}>← 2月</button>
          <span className="text-sm font-medium px-3 py-1 rounded-lg bg-primary-50 text-primary-600">
            {calendar[0]?.year}.{String(calendar[0]?.month).padStart(2, '0')} - {calendar[1]?.year}.{String(calendar[1]?.month).padStart(2, '0')}
          </span>
          <button className="btn-ghost text-sm" onClick={() => {
            const d = new Date(currentMonth); d.setMonth(d.getMonth() + 2)
            setCurrentMonth(d)
          }}>2月 →</button>
          <button className="btn-ghost text-sm" onClick={() => {
            const d = new Date(); d.setDate(1); setCurrentMonth(d)
          }}>本月</button>
        </div>
      </div>

      <div className="flex items-center gap-5 text-xs text-gray-500 mb-2">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-200" />已开放</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-100 border border-red-200" />已关闭</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-gray-100 border border-gray-200" />未配置</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-100 border border-amber-200" />今日</span>
      </div>

      {!pkgId ? (
        <EmptyState title="请先选择套餐" desc="上方选择需要配置入住日期的套餐" icon={Calendar} />
      ) : (
        <div className="grid grid-cols-2 gap-5">
          {calendar.map((m, mi) => (
            <div key={mi} className="card p-4">
              <h3 className="text-base font-semibold text-gray-800 mb-3 text-center">
                {m.year}年{m.month}月
              </h3>
              <div className="grid grid-cols-7 gap-1">
                {['日', '一', '二', '三', '四', '五', '六'].map(w => (
                  <div key={w} className="text-center text-xs font-medium text-gray-400 py-1.5">{w}</div>
                ))}
                {m.days.map((d, di) => {
                  if (!d) return <div key={di} />
                  const today = new Date().toISOString().slice(0, 10) === d.date
                  let cls = 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                  let txt = 'text-gray-300'
                  if (d.sd) {
                    if (d.sd.is_blocked) {
                      cls = 'border-red-200 bg-red-50 hover:bg-red-100'
                      txt = 'text-red-700'
                    } else {
                      cls = 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100'
                      txt = 'text-emerald-700'
                    }
                  }
                  if (today) {
                    cls = 'border-amber-400 ring-2 ring-amber-100 ' + cls
                  }
                  return (
                    <button
                      key={di}
                      disabled={!d.sd}
                      onClick={() => d.sd && toggleBlock(d.sd)}
                      className={`relative aspect-square flex flex-col items-center justify-center rounded-lg border text-xs transition-all disabled:cursor-default ${cls}`}
                    >
                      <span className={`font-semibold ${d.sd ? txt : 'text-gray-300'}`}>{d.day}</span>
                      {d.sd && (
                        <span className="absolute bottom-1 right-1.5 text-[9px]">
                          {d.sd.is_blocked ? <Lock className="w-2.5 h-2.5 text-red-500" /> : <Unlock className="w-2.5 h-2.5 text-emerald-500" />}
                        </span>
                      )}
                      {d.sd?.block_reason && (
                        <span className="absolute top-1 left-1">
                          <AlertCircle className="w-2.5 h-2.5 text-amber-500" />
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
              <div className="mt-3 text-xs text-gray-400 text-center">
                共 {dates.filter(d => !d.is_blocked).length} 天开放 / {dates.filter(d => d.is_blocked).length} 天关闭
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={showBulk}
        title="批量生成入住日期"
        size="md"
        onClose={() => setShowBulk(false)}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setShowBulk(false)}>取消</button>
            <button className="btn-primary" onClick={doBulkCreate}>生成</button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">开始日期</label>
              <input type="date" className="input" value={bulkParams.start_date}
                onChange={e => setBulkParams({ ...bulkParams, start_date: e.target.value })} />
            </div>
            <div>
              <label className="label">结束日期</label>
              <input type="date" className="input" value={bulkParams.end_date}
                onChange={e => setBulkParams({ ...bulkParams, end_date: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">入住时间</label>
              <input type="time" className="input" value={bulkParams.check_in_time}
                onChange={e => setBulkParams({ ...bulkParams, check_in_time: e.target.value })} />
            </div>
            <div>
              <label className="label">退房时间</label>
              <input type="time" className="input" value={bulkParams.check_out_time}
                onChange={e => setBulkParams({ ...bulkParams, check_out_time: e.target.value })} />
            </div>
          </div>
          <p className="text-xs text-gray-500 p-3 rounded-lg bg-amber-50 text-amber-700">
            ℹ️ 系统会为该日期范围内的每一天自动生成或更新配置，已经存在的不会重复创建。
          </p>
        </div>
      </Modal>
    </div>
  )
}
