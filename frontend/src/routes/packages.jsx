import React, { useEffect, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  Plus, Search, Edit3, Calendar, DollarSign, ChevronRight,
  Filter, TrendingUp, Building2
} from 'lucide-react'
import { api } from '../lib/api'
import { Pagination, Modal, SectionTitle, EmptyState } from '../components/ui'
import { RULE_TYPE, ADJUSTMENT_TYPE } from '../lib/constants'
import toast from 'react-hot-toast'

export const Route = createFileRoute('/packages')({
  component: PackagesPage,
})

function PackagesPage() {
  const nav = useNavigate()
  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [data, setData] = useState({ items: [], total: 0 })
  const [showPkgModal, setShowPkgModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [showRuleModal, setShowRuleModal] = useState(false)
  const [rulesPkg, setRulesPkg] = useState(null)
  const [rules, setRules] = useState([])
  const [editingRule, setEditingRule] = useState(null)
  const [priceCalc, setPriceCalc] = useState(null)
  const [showCalc, setShowCalc] = useState(false)
  const [calcParams, setCalcParams] = useState({ package_id: null, check_in: '', check_out: '' })
  const pageSize = 10

  const [pkgForm, setPkgForm] = useState({
    name: '', description: '', homestay_name: '', room_type: '',
    max_guests: 2, base_price: '', is_active: true
  })
  const [ruleForm, setRuleForm] = useState({
    rule_name: '', rule_type: 'weekday', start_date: '', end_date: '',
    weekdays: [], price_adjustment_type: 'fixed', price_adjustment_value: '',
    min_stay_nights: 1, max_stay_nights: '', is_active: true, priority: 0
  })

  useEffect(() => {
    load()
  }, [page, keyword])

  async function load() {
    const d = await api.listPackages({ page, page_size: pageSize, keyword })
    setData(d)
  }

  async function openRules(pkg) {
    setRulesPkg(pkg)
    const rs = await api.listPriceRules(pkg.id)
    setRules(rs)
    setShowRuleModal(true)
  }

  async function savePkg() {
    try {
      const payload = { ...pkgForm, base_price: Number(pkgForm.base_price) || 0 }
      if (editing) {
        await api.updatePackage(editing.id, payload)
        toast.success('套餐已更新')
      } else {
        await api.createPackage(payload)
        toast.success('套餐已创建')
      }
      setShowPkgModal(false)
      setEditing(null)
      load()
    } catch (e) { toast.error(e.message) }
  }

  async function saveRule() {
    try {
      const payload = {
        ...ruleForm,
        package_id: rulesPkg.id,
        price_adjustment_value: Number(ruleForm.price_adjustment_value) || 0,
        priority: Number(ruleForm.priority) || 0,
        min_stay_nights: Number(ruleForm.min_stay_nights) || 1,
        max_stay_nights: ruleForm.max_stay_nights ? Number(ruleForm.max_stay_nights) : null,
        weekdays: ruleForm.weekdays.length ? ruleForm.weekdays : null,
        start_date: ruleForm.start_date || null,
        end_date: ruleForm.end_date || null,
      }
      if (editingRule) {
        await api.updatePriceRule(editingRule.id, payload)
        toast.success('价格规则已更新')
      } else {
        await api.createPriceRule(payload)
        toast.success('价格规则已创建')
      }
      setEditingRule(null)
      const rs = await api.listPriceRules(rulesPkg.id)
      setRules(rs)
    } catch (e) { toast.error(e.message) }
  }

  async function calcPrice() {
    if (!calcParams.package_id || !calcParams.check_in || !calcParams.check_out) return
    try {
      const r = await api.calculatePrice(calcParams)
      setPriceCalc(r)
      setShowCalc(true)
    } catch (e) { toast.error(e.message) }
  }

  const weekdaysList = [
    { v: 0, l: '一' }, { v: 1, l: '二' }, { v: 2, l: '三' }, { v: 3, l: '四' },
    { v: 4, l: '五' }, { v: 5, l: '六' }, { v: 6, l: '日' },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">套餐与价格</h1>
          <p className="text-sm text-gray-500 mt-1">
            配置民宿套餐、价格规则（平日/周末/节假日加价），并可模拟入住日期快速测算价格
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="btn-secondary"
            onClick={() => {
              setCalcParams({
                package_id: data.items[0]?.id || null,
                check_in: new Date().toISOString().slice(0, 10),
                check_out: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
              })
              setShowCalc(true)
              setPriceCalc(null)
            }}
          >
            <DollarSign className="w-4 h-4" /> 价格测算
          </button>
          <button className="btn-primary" onClick={() => {
            setEditing(null)
            setPkgForm({ name: '', description: '', homestay_name: '', room_type: '', max_guests: 2, base_price: '', is_active: true })
            setShowPkgModal(true)
          }}>
            <Plus className="w-4 h-4" /> 新建套餐
          </button>
        </div>
      </div>

      <div className="card p-4 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-9"
            placeholder="搜索套餐名称/民宿名称..."
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setPage(1) }}
          />
        </div>
        <div className="text-xs text-gray-500 ml-auto">
          共 <span className="font-semibold text-gray-800">{data.total}</span> 个套餐
        </div>
      </div>

      {data.items.length === 0 ? (
        <EmptyState title="暂无套餐" desc="点击右上角新建套餐开始" icon={Building2} />
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {data.items.map((pkg) => (
            <div key={pkg.id} className="card overflow-hidden hover:shadow-md transition-all">
              <div className="h-24 bg-gradient-to-br from-primary-400 via-primary-500 to-primary-600 relative">
                <div className="absolute top-3 right-3">
                  <span className={`badge ${pkg.is_active ? 'bg-white/90 text-emerald-600' : 'bg-white/90 text-gray-500'}`}>
                    {pkg.is_active ? '● 在售' : '○ 下架'}
                  </span>
                </div>
                <div className="absolute bottom-3 left-4 text-white">
                  <p className="text-xs opacity-80">{pkg.homestay_name}</p>
                  <p className="font-bold text-lg line-clamp-1">{pkg.name}</p>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-3 mb-3 text-xs text-gray-500">
                  <span className="tag border-gray-200 bg-gray-50">{pkg.room_type || '标准房型'}</span>
                  <span>限{pkg.max_guests}人</span>
                  <span className="ml-auto text-lg font-bold text-primary-600">
                    ¥{pkg.base_price}<span className="text-xs font-normal text-gray-400">/晚起</span>
                  </span>
                </div>
                {pkg.description && (
                  <p className="text-xs text-gray-500 line-clamp-2 mb-4 min-h-[2rem]">{pkg.description}</p>
                )}
                <div className="flex items-center gap-2">
                  <button
                    className="btn-secondary flex-1"
                    onClick={() => openRules(pkg)}
                  >
                    <DollarSign className="w-4 h-4" /> 价格规则
                    {rulesPkg?.id === pkg.id && rules.length > 0 && (
                      <span className="badge bg-primary-50 text-primary-600 ml-1">
                        {rules.length}
                      </span>
                    )}
                  </button>
                  <button
                    className="btn-ghost"
                    onClick={() => nav({ to: '/stay-dates', search: { package_id: pkg.id } })}
                  >
                    <Calendar className="w-4 h-4" />
                  </button>
                  <button
                    className="btn-ghost"
                    onClick={() => {
                      setEditing(pkg)
                      setPkgForm({ ...pkg, base_price: String(pkg.base_price) })
                      setShowPkgModal(true)
                    }}
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination page={page} pageSize={pageSize} total={data.total} onChange={setPage} />

      <Modal
        open={showPkgModal}
        title={editing ? '编辑套餐' : '新建套餐'}
        size="lg"
        onClose={() => setShowPkgModal(false)}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setShowPkgModal(false)}>取消</button>
            <button className="btn-primary" onClick={savePkg}>保存</button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">套餐名称 *</label>
            <input className="input" value={pkgForm.name}
              onChange={(e) => setPkgForm({ ...pkgForm, name: e.target.value })} />
          </div>
          <div>
            <label className="label">所属民宿 *</label>
            <input className="input" value={pkgForm.homestay_name}
              onChange={(e) => setPkgForm({ ...pkgForm, homestay_name: e.target.value })} />
          </div>
          <div>
            <label className="label">房型</label>
            <input className="input" value={pkgForm.room_type}
              onChange={(e) => setPkgForm({ ...pkgForm, room_type: e.target.value })} />
          </div>
          <div>
            <label className="label">最多入住人数</label>
            <input type="number" className="input" value={pkgForm.max_guests}
              onChange={(e) => setPkgForm({ ...pkgForm, max_guests: Number(e.target.value) })} />
          </div>
          <div>
            <label className="label">基础价格(元/晚) *</label>
            <input type="number" className="input" value={pkgForm.base_price}
              onChange={(e) => setPkgForm({ ...pkgForm, base_price: e.target.value })} />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="w-4 h-4" checked={pkgForm.is_active}
                onChange={(e) => setPkgForm({ ...pkgForm, is_active: e.target.checked })} />
              上架在售
            </label>
          </div>
          <div className="col-span-2">
            <label className="label">套餐描述</label>
            <textarea rows="3" className="input" value={pkgForm.description}
              onChange={(e) => setPkgForm({ ...pkgForm, description: e.target.value })} />
          </div>
        </div>
      </Modal>

      <Modal
        open={showRuleModal}
        title={`价格规则 - ${rulesPkg?.name || ''}`}
        size="xl"
        onClose={() => setShowRuleModal(false)}
      >
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-gray-500">
            基础价 ¥{rulesPkg?.base_price} · 规则按优先级从高到低匹配，数字越大越优先
          </p>
          <button
            className="btn-primary text-sm"
            onClick={() => {
              setEditingRule(null)
              setRuleForm({
                rule_name: '', rule_type: 'weekday', start_date: '', end_date: '',
                weekdays: [], price_adjustment_type: 'fixed', price_adjustment_value: '',
                min_stay_nights: 1, max_stay_nights: '', is_active: true, priority: 0
              })
            }}
          >
            <Plus className="w-3.5 h-3.5" /> 新增规则
          </button>
        </div>

        <div className="mb-6 p-4 rounded-xl border border-gray-100 bg-gray-50/50">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">规则名称</label>
              <input className="input" value={ruleForm.rule_name}
                onChange={(e) => setRuleForm({ ...ruleForm, rule_name: e.target.value })} />
            </div>
            <div>
              <label className="label">规则类型</label>
              <select className="input" value={ruleForm.rule_type}
                onChange={(e) => setRuleForm({ ...ruleForm, rule_type: e.target.value })}>
                {Object.entries(RULE_TYPE).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            {ruleForm.rule_type === 'custom_date' && (
              <>
                <div>
                  <label className="label">开始日期</label>
                  <input type="date" className="input" value={ruleForm.start_date}
                    onChange={(e) => setRuleForm({ ...ruleForm, start_date: e.target.value })} />
                </div>
                <div>
                  <label className="label">结束日期</label>
                  <input type="date" className="input" value={ruleForm.end_date}
                    onChange={(e) => setRuleForm({ ...ruleForm, end_date: e.target.value })} />
                </div>
              </>
            )}
            {ruleForm.rule_type === 'holiday' && (
              <div className="col-span-2">
                <label className="label">适用星期（多选，留空表示每天）</label>
                <div className="flex gap-2 flex-wrap">
                  {weekdaysList.map((w) => (
                    <label key={w.v} className={`px-3 py-1.5 rounded-lg cursor-pointer border text-sm ${
                      ruleForm.weekdays.includes(w.v)
                        ? 'bg-primary-50 border-primary-200 text-primary-700'
                        : 'bg-white border-gray-200'
                    }`}>
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={ruleForm.weekdays.includes(w.v)}
                        onChange={() => {
                          const cur = [...ruleForm.weekdays]
                          const i = cur.indexOf(w.v)
                          if (i >= 0) cur.splice(i, 1)
                          else cur.push(w.v)
                          setRuleForm({ ...ruleForm, weekdays: cur })
                        }}
                      />
                      周{w.l}
                    </label>
                  ))}
                </div>
              </div>
            )}
            <div>
              <label className="label">调整方式</label>
              <select className="input" value={ruleForm.price_adjustment_type}
                onChange={(e) => setRuleForm({ ...ruleForm, price_adjustment_type: e.target.value })}>
                {Object.entries(ADJUSTMENT_TYPE).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">调整值{ruleForm.price_adjustment_type === 'percentage' ? '(%)' : '(元)'}</label>
              <input type="number" className="input" value={ruleForm.price_adjustment_value}
                onChange={(e) => setRuleForm({ ...ruleForm, price_adjustment_value: e.target.value })} />
            </div>
            <div>
              <label className="label">最少入住晚数</label>
              <input type="number" className="input" value={ruleForm.min_stay_nights}
                onChange={(e) => setRuleForm({ ...ruleForm, min_stay_nights: e.target.value })} />
            </div>
            <div>
              <label className="label">最多入住晚数（留空不限制）</label>
              <input type="number" className="input" value={ruleForm.max_stay_nights}
                onChange={(e) => setRuleForm({ ...ruleForm, max_stay_nights: e.target.value })} />
            </div>
            <div>
              <label className="label">优先级（越大越优先）</label>
              <input type="number" className="input" value={ruleForm.priority}
                onChange={(e) => setRuleForm({ ...ruleForm, priority: e.target.value })} />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="w-4 h-4" checked={ruleForm.is_active}
                  onChange={(e) => setRuleForm({ ...ruleForm, is_active: e.target.checked })} />
                启用此规则
              </label>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            {editingRule && (
              <button className="btn-ghost text-xs" onClick={() => {
                setEditingRule(null)
                setRuleForm({
                  rule_name: '', rule_type: 'weekday', start_date: '', end_date: '',
                  weekdays: [], price_adjustment_type: 'fixed', price_adjustment_value: '',
                  min_stay_nights: 1, max_stay_nights: '', is_active: true, priority: 0
                })
              }}>取消编辑</button>
            )}
            <button className="btn-primary text-sm" onClick={saveRule}>
              {editingRule ? '更新规则' : '添加规则'}
            </button>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="w-full">
            <thead>
              <tr>
                <th className="th">优先级</th>
                <th className="th">规则名</th>
                <th className="th">类型</th>
                <th className="th">生效范围</th>
                <th className="th">调整方式</th>
                <th className="th">状态</th>
                <th className="th">操作</th>
              </tr>
            </thead>
            <tbody>
              {rules.length === 0 ? (
                <tr><td colSpan="7" className="td text-center text-gray-400 py-8">暂无规则，使用基础价</td></tr>
              ) : rules.map((r) => (
                <tr key={r.id}>
                  <td className="td"><span className="badge bg-primary-50 text-primary-600">{r.priority}</span></td>
                  <td className="td font-medium">{r.rule_name}</td>
                  <td className="td">{RULE_TYPE[r.rule_type]}</td>
                  <td className="td text-xs text-gray-500">
                    {r.rule_type === 'custom_date'
                      ? `${r.start_date || ''} ~ ${r.end_date || ''}`
                      : r.weekdays?.length
                        ? r.weekdays.map(w => `周${weekdaysList.find(x => x.v === w)?.l}`).join('、')
                        : RULE_TYPE[r.rule_type]}
                  </td>
                  <td className="td">
                    {r.price_adjustment_type === 'fixed' ? `±¥${r.price_adjustment_value}` : `±${r.price_adjustment_value}%`}
                  </td>
                  <td className="td">
                    <span className={`badge ${r.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                      {r.is_active ? '启用' : '停用'}
                    </span>
                  </td>
                  <td className="td">
                    <button
                      className="btn-ghost text-xs"
                      onClick={() => {
                        setEditingRule(r)
                        setRuleForm({
                          ...r,
                          start_date: r.start_date || '',
                          end_date: r.end_date || '',
                          weekdays: r.weekdays || [],
                          max_stay_nights: r.max_stay_nights || '',
                          price_adjustment_value: String(r.price_adjustment_value),
                        })
                      }}
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>

      <Modal
        open={showCalc}
        title="价格测算"
        size="lg"
        onClose={() => setShowCalc(false)}
      >
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div>
            <label className="label">选择套餐</label>
            <select
              className="input"
              value={calcParams.package_id || ''}
              onChange={(e) => setCalcParams({ ...calcParams, package_id: Number(e.target.value) })}
            >
              <option value="">-- 请选择 --</option>
              {data.items.map((p) => (
                <option key={p.id} value={p.id}>{p.name}（¥{p.base_price}/晚）</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">入住日期</label>
            <input type="date" className="input" value={calcParams.check_in}
              onChange={(e) => setCalcParams({ ...calcParams, check_in: e.target.value })} />
          </div>
          <div>
            <label className="label">退房日期</label>
            <input type="date" className="input" value={calcParams.check_out}
              onChange={(e) => setCalcParams({ ...calcParams, check_out: e.target.value })} />
          </div>
        </div>
        <button className="btn-primary w-full mb-4" onClick={calcPrice}>
          <DollarSign className="w-4 h-4" /> 测算价格
        </button>
        {priceCalc && (
          <div className="p-5 rounded-xl bg-gradient-to-br from-primary-50 to-primary-100/50">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-600">总价</p>
              <p className="text-3xl font-bold text-primary-700">¥{priceCalc.total}</p>
            </div>
            <div className="table-wrapper bg-white">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="th">日期</th>
                    <th className="th">星期</th>
                    <th className="th">适用规则</th>
                    <th className="th text-right">单价</th>
                  </tr>
                </thead>
                <tbody>
                  {priceCalc.details.map((d, i) => (
                    <tr key={i}>
                      <td className="td">{d.date}</td>
                      <td className="td">{'日一二三四五六'[d.weekday]}</td>
                      <td className="td text-primary-600">{d.rule_name}</td>
                      <td className="td text-right font-medium">¥{d.unit_price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
