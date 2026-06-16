import { useState, useEffect } from 'react'
import { warningApi } from '../api'

interface Threshold {
  id: number
  metric_name: string
  metric_code: string
  warning_threshold: number
  critical_threshold: number
  operator: string
  unit: string
  description: string
  category: string
  is_enabled: boolean
  created_by?: string
  updated_by?: string
}

interface Alert {
  metric_code: string
  metric_name: string
  current_value: number
  threshold: number
  level: 'critical' | 'warning'
  message: string
  timestamp: string
}

const CATEGORIES = ['全部', '归档质量', '病历质量', '治疗质量', '预约管理', '数据质量']
const OPERATORS = ['>=', '<=', '>', '<', '==', '!=']

const CATEGORY_MAP: Record<string, string> = {
  '归档质量': 'tag-success',
  '病历质量': 'tag-pending',
  '治疗质量': 'tag-warning',
  '预约管理': 'tag-danger',
  '数据质量': 'tag-warning',
}

const emptyForm = {
  metric_name: '',
  metric_code: '',
  warning_threshold: 0,
  critical_threshold: 0,
  operator: '>=',
  unit: '',
  description: '',
  category: '归档质量',
  is_enabled: true,
}

export default function WarningThreshold() {
  const [thresholds, setThresholds] = useState<Threshold[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [activeCategory, setActiveCategory] = useState('全部')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState({ ...emptyForm })

  const fetchData = () => {
    warningApi.getThresholds().then(res => setThresholds(res.data))
    warningApi.getAlerts().then(res => setAlerts(res.data))
  }

  useEffect(() => { fetchData() }, [])

  const filtered = activeCategory === '全部'
    ? thresholds
    : thresholds.filter(t => t.category === activeCategory)

  const openAdd = () => {
    setEditingId(null)
    setForm({ ...emptyForm })
    setModalOpen(true)
  }

  const openEdit = (t: Threshold) => {
    setEditingId(t.id)
    setForm({
      metric_name: t.metric_name,
      metric_code: t.metric_code,
      warning_threshold: t.warning_threshold,
      critical_threshold: t.critical_threshold,
      operator: t.operator,
      unit: t.unit,
      description: t.description,
      category: t.category,
      is_enabled: t.is_enabled,
    })
    setModalOpen(true)
  }

  const handleSave = () => {
    if (editingId !== null) {
      warningApi.updateThreshold(editingId, {
        warning_threshold: form.warning_threshold,
        critical_threshold: form.critical_threshold,
        operator: form.operator,
        description: form.description,
        category: form.category,
        is_enabled: form.is_enabled,
        updated_by: 'admin',
      }).then(() => {
        setModalOpen(false)
        fetchData()
      })
    } else {
      warningApi.createThreshold({
        ...form,
        created_by: 'admin',
      }).then(() => {
        setModalOpen(false)
        fetchData()
      })
    }
  }

  const handleDelete = (id: number) => {
    if (!window.confirm('确认删除该阈值？')) return
    warningApi.deleteThreshold(id).then(() => fetchData())
  }

  const updateForm = (key: string, value: string | number | boolean) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div>
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="section-title">当前预警</div>
        {alerts.length === 0 ? (
          <div style={{ color: 'var(--text-secondary)', fontSize: 13, padding: '8px 0' }}>当前无预警</div>
        ) : (
          alerts.map(a => (
            <div
              key={a.metric_code}
              className={`alert-banner ${a.level === 'critical' ? 'alert-critical' : 'alert-warning'}`}
            >
              <span>{a.level === 'critical' ? '🔴' : '🟡'}</span>
              <span>
                <strong>{a.metric_name}</strong> — 当前值 {a.current_value}，阈值 {a.threshold}，{a.message}
              </span>
              <span style={{ marginLeft: 'auto', fontSize: 12, opacity: 0.7 }}>{a.timestamp}</span>
            </div>
          ))
        )}
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div className="section-title" style={{ marginBottom: 0 }}>预警阈值管理</div>
          <button className="btn btn-primary" onClick={openAdd}>新增阈值</button>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`btn btn-sm ${activeCategory === cat ? 'btn-primary' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <table>
          <thead>
            <tr>
              <th>指标名称</th>
              <th>指标编码</th>
              <th>预警阈值</th>
              <th>严重阈值</th>
              <th>分类</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(t => (
              <tr key={t.id}>
                <td>{t.metric_name}</td>
                <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{t.metric_code}</td>
                <td>{t.operator} {t.warning_threshold} {t.unit}</td>
                <td>{t.operator} {t.critical_threshold} {t.unit}</td>
                <td><span className={`tag ${CATEGORY_MAP[t.category] || 'tag-pending'}`}>{t.category}</span></td>
                <td>
                  <span className={`tag ${t.is_enabled ? 'tag-success' : 'tag-pending'}`}>
                    {t.is_enabled ? '启用' : '禁用'}
                  </span>
                </td>
                <td>
                  <button className="btn btn-sm" onClick={() => openEdit(t)}>编辑</button>
                  <button className="btn btn-sm btn-danger" style={{ marginLeft: 8 }} onClick={() => handleDelete(t.id)}>删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{editingId !== null ? '编辑阈值' : '新增阈值'}</h3>

            <div className="form-group">
              <label>指标名称</label>
              <input value={form.metric_name} onChange={e => updateForm('metric_name', e.target.value)} />
            </div>

            <div className="form-group">
              <label>指标编码</label>
              <input
                value={form.metric_code}
                onChange={e => updateForm('metric_code', e.target.value)}
                readOnly={editingId !== null}
                style={editingId !== null ? { background: '#f5f5f5', cursor: 'not-allowed' } : undefined}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>预警阈值</label>
                <input type="number" value={form.warning_threshold} onChange={e => updateForm('warning_threshold', Number(e.target.value))} />
              </div>
              <div className="form-group">
                <label>严重阈值</label>
                <input type="number" value={form.critical_threshold} onChange={e => updateForm('critical_threshold', Number(e.target.value))} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>比较运算符</label>
                <select value={form.operator} onChange={e => updateForm('operator', e.target.value)}>
                  {OPERATORS.map(op => <option key={op} value={op}>{op}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>单位</label>
                <input value={form.unit} onChange={e => updateForm('unit', e.target.value)} />
              </div>
            </div>

            <div className="form-group">
              <label>描述</label>
              <input value={form.description} onChange={e => updateForm('description', e.target.value)} />
            </div>

            <div className="form-group">
              <label>分类</label>
              <select value={form.category} onChange={e => updateForm('category', e.target.value)}>
                {CATEGORIES.filter(c => c !== '全部').map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.is_enabled}
                  onChange={e => updateForm('is_enabled', e.target.checked)}
                  style={{ width: 'auto' }}
                />
                启用
              </label>
            </div>

            <div className="modal-actions">
              <button className="btn" onClick={() => setModalOpen(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleSave}>保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
