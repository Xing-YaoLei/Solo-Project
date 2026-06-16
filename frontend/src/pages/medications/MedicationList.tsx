import { useState, useEffect } from 'react'
import { medicationApi, Medication } from '../../api/medication'
import { elderApi, Elder } from '../../api/elder'
import dayjs from 'dayjs'

export default function MedicationList() {
  const [elders, setElders] = useState<Elder[]>([])
  const [selectedElderId, setSelectedElderId] = useState<number | null>(null)
  const [medications, setMedications] = useState<Medication[]>([])
  const [loading, setLoading] = useState(false)
  const [eldersLoading, setEldersLoading] = useState(true)

  const fetchElders = async () => {
    try {
      setEldersLoading(true)
      const res = await elderApi.getList({ page_size: 100, status: 'active' })
      setElders(res.data.items)
      if (res.data.items.length > 0) {
        setSelectedElderId(res.data.items[0].id)
      }
    } catch (err) {
      console.error('获取老人列表失败', err)
    } finally {
      setEldersLoading(false)
    }
  }

  const fetchMedications = async () => {
    if (!selectedElderId) return
    try {
      setLoading(true)
      const res = await medicationApi.getList(selectedElderId)
      setMedications(res.data)
    } catch (err) {
      console.error('获取用药记录失败', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchElders()
  }, [])

  useEffect(() => {
    if (selectedElderId) {
      fetchMedications()
    }
  }, [selectedElderId])

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除该用药记录吗？')) return
    try {
      await medicationApi.remove(id)
      fetchMedications()
    } catch (err) {
      console.error('删除失败', err)
    }
  }

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await medicationApi.updateStatus(id, status)
      fetchMedications()
    } catch (err) {
      console.error('状态变更失败', err)
    }
  }

  const getStatusBadgeClass = (s: string) => {
    const map: Record<string, string> = {
      active: 'status-badge status-active',
      discontinued: 'status-badge status-inactive',
      pending: 'status-badge status-pending',
    }
    return map[s] || 'status-badge status-pending'
  }

  const getStatusLabel = (s: string) => {
    const map: Record<string, string> = {
      active: '服用中',
      discontinued: '已停用',
      pending: '待开始',
    }
    return map[s] || s
  }

  const getSelectedElderName = () => {
    const elder = elders.find((e) => e.id === selectedElderId)
    return elder?.name || ''
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">用药清单</h1>
        <button
          className="btn btn-primary"
          onClick={() => alert('新增功能待实现')}
          disabled={!selectedElderId}
        >
          + 新增用药
        </button>
      </div>

      <div className="card">
        <div className="search-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label className="form-label" style={{ margin: 0, whiteSpace: 'nowrap' }}>
              选择老人：
            </label>
            <select
              className="form-select"
              style={{ width: '200px' }}
              value={selectedElderId || ''}
              onChange={(e) => setSelectedElderId(Number(e.target.value))}
              disabled={eldersLoading}
            >
              {eldersLoading ? (
                <option value="">加载中...</option>
              ) : elders.length === 0 ? (
                <option value="">暂无老人</option>
              ) : (
                elders.map((elder) => (
                  <option key={elder.id} value={elder.id}>
                    {elder.name}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {selectedElderId && getSelectedElderName() && (
          <div style={{ marginBottom: '16px', padding: '12px 16px', background: '#f0f9ff', borderRadius: '6px' }}>
            <span style={{ color: '#1e40af', fontWeight: '500' }}>
              当前查看：{getSelectedElderName()} 的用药清单
            </span>
          </div>
        )}

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>药品名称</th>
                <th>通用名</th>
                <th>剂量</th>
                <th>频次</th>
                <th>给药途径</th>
                <th>开方医生</th>
                <th>开始日期</th>
                <th>结束日期</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                    加载中...
                  </td>
                </tr>
              ) : !selectedElderId ? (
                <tr>
                  <td colSpan={10}>
                    <div className="empty-state">
                      <div className="empty-state-icon">👴</div>
                      <div>请先选择一位老人</div>
                    </div>
                  </td>
                </tr>
              ) : medications.length === 0 ? (
                <tr>
                  <td colSpan={10}>
                    <div className="empty-state">
                      <div className="empty-state-icon">💊</div>
                      <div>暂无用药记录</div>
                    </div>
                  </td>
                </tr>
              ) : (
                medications.map((med) => (
                  <tr key={med.id}>
                    <td>{med.drug_name}</td>
                    <td>{med.generic_name || '-'}</td>
                    <td>{med.dosage}</td>
                    <td>{med.frequency}</td>
                    <td>{med.route}</td>
                    <td>{med.prescribing_doctor || '-'}</td>
                    <td>
                      {med.start_date ? dayjs(med.start_date).format('YYYY-MM-DD') : '-'}
                    </td>
                    <td>
                      {med.end_date ? dayjs(med.end_date).format('YYYY-MM-DD') : '-'}
                    </td>
                    <td>
                      <span className={getStatusBadgeClass(med.status)}>
                        {getStatusLabel(med.status)}
                      </span>
                    </td>
                    <td>
                      <span
                        className="action-link"
                        onClick={() => alert('编辑功能待实现')}
                      >
                        编辑
                      </span>
                      {med.status !== 'active' && (
                        <span
                          className="action-link"
                          onClick={() => handleStatusChange(med.id, 'active')}
                        >
                          启用
                        </span>
                      )}
                      {med.status === 'active' && (
                        <span
                          className="action-link"
                          onClick={() => handleStatusChange(med.id, 'discontinued')}
                        >
                          停用
                        </span>
                      )}
                      <span
                        className="action-link danger"
                        onClick={() => handleDelete(med.id)}
                      >
                        删除
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
