import { useState, useEffect } from 'react'
import { useRouter } from '@tanstack/react-router'
import { elderApi, Elder, PaginatedResponse } from '../../api/elder'
import dayjs from 'dayjs'

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'active', label: '在院' },
  { value: 'inactive', label: '离院' },
]

const healthStatusOptions = [
  { value: '', label: '全部健康状态' },
  { value: 'healthy', label: '健康' },
  { value: 'sub_healthy', label: '亚健康' },
  { value: 'ill', label: '患病' },
  { value: 'critical', label: '危重' },
]

const careLevelOptions = [
  { value: '', label: '全部护理等级' },
  { value: 'independent', label: '自理' },
  { value: 'semi_care', label: '半护理' },
  { value: 'full_care', label: '全护理' },
  { value: 'special_care', label: '特护' },
]

export default function ElderList() {
  const router = useRouter()
  const [list, setList] = useState<Elder[]>([])
  const [loading, setLoading] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState('')
  const [healthStatus, setHealthStatus] = useState('')
  const [careLevel, setCareLevel] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [total, setTotal] = useState(0)

  const fetchList = async () => {
    try {
      setLoading(true)
      const res = await elderApi.getList({
        page,
        page_size: pageSize,
        keyword: keyword || undefined,
        status: status || undefined,
        health_status: healthStatus || undefined,
        care_level: careLevel || undefined,
      })
      setList(res.data.items)
      setTotal(res.data.total)
    } catch (err) {
      console.error('获取老人列表失败', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchList()
  }, [page, status, healthStatus, careLevel])

  const handleSearch = () => {
    setPage(1)
    fetchList()
  }

  const handleReset = () => {
    setKeyword('')
    setStatus('')
    setHealthStatus('')
    setCareLevel('')
    setPage(1)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除该老人档案吗？')) return
    try {
      await elderApi.remove(id)
      fetchList()
    } catch (err) {
      console.error('删除失败', err)
    }
  }

  const handleStatusChange = async (id: number, newStatus: string) => {
    const remark = prompt('请输入状态变更原因：')
    if (remark === null) return
    try {
      await elderApi.updateStatus(id, newStatus, remark)
      fetchList()
    } catch (err) {
      console.error('状态变更失败', err)
    }
  }

  const calculateAge = (birthDate: string) => {
    return dayjs().diff(dayjs(birthDate), 'year')
  }

  const getStatusBadgeClass = (s: string) => {
    const map: Record<string, string> = {
      active: 'status-badge status-active',
      inactive: 'status-badge status-inactive',
    }
    return map[s] || 'status-badge status-pending'
  }

  const getHealthStatusBadgeClass = (s: string) => {
    const map: Record<string, string> = {
      healthy: 'status-badge status-active',
      sub_healthy: 'status-badge status-pending',
      ill: 'status-badge status-warning',
      critical: 'status-badge status-critical',
    }
    return map[s] || 'status-badge status-pending'
  }

  const getStatusLabel = (s: string) => {
    const map: Record<string, string> = {
      active: '在院',
      inactive: '离院',
    }
    return map[s] || s
  }

  const getHealthStatusLabel = (s: string) => {
    const map: Record<string, string> = {
      healthy: '健康',
      sub_healthy: '亚健康',
      ill: '患病',
      critical: '危重',
    }
    return map[s] || s
  }

  const getCareLevelLabel = (s: string) => {
    const map: Record<string, string> = {
      independent: '自理',
      semi_care: '半护理',
      full_care: '全护理',
      special_care: '特护',
    }
    return map[s] || s
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">老人档案</h1>
        <button
          className="btn btn-primary"
          onClick={() => alert('新增功能待实现')}
        >
          + 新增老人
        </button>
      </div>

      <div className="card">
        <div className="search-bar">
          <input
            type="text"
            className="form-input"
            placeholder="搜索姓名、身份证号..."
            style={{ width: '240px' }}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <select
            className="form-select"
            style={{ width: '140px' }}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            className="form-select"
            style={{ width: '140px' }}
            value={healthStatus}
            onChange={(e) => setHealthStatus(e.target.value)}
          >
            {healthStatusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            className="form-select"
            style={{ width: '140px' }}
            value={careLevel}
            onChange={(e) => setCareLevel(e.target.value)}
          >
            {careLevelOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <button className="btn btn-primary" onClick={handleSearch}>
            搜索
          </button>
          <button className="btn btn-outline" onClick={handleReset}>
            重置
          </button>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>姓名</th>
                <th>性别</th>
                <th>年龄</th>
                <th>房间号</th>
                <th>床号</th>
                <th>健康状态</th>
                <th>护理等级</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                    加载中...
                  </td>
                </tr>
              ) : list.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <div className="empty-state">
                      <div className="empty-state-icon">📋</div>
                      <div>暂无数据</div>
                    </div>
                  </td>
                </tr>
              ) : (
                list.map((elder) => (
                  <tr key={elder.id}>
                    <td>{elder.name}</td>
                    <td>{elder.gender === 'male' ? '男' : elder.gender === 'female' ? '女' : elder.gender}</td>
                    <td>{calculateAge(elder.birth_date)} 岁</td>
                    <td>{elder.room_number || '-'}</td>
                    <td>{elder.bed_number || '-'}</td>
                    <td>
                      <span className={getHealthStatusBadgeClass(elder.health_status)}>
                        {getHealthStatusLabel(elder.health_status)}
                      </span>
                    </td>
                    <td>{getCareLevelLabel(elder.care_level)}</td>
                    <td>
                      <span className={getStatusBadgeClass(elder.status)}>
                        {getStatusLabel(elder.status)}
                      </span>
                    </td>
                    <td>
                      <span
                        className="action-link"
                        onClick={() => router.navigate({ to: '/elders/$id', params: { id: String(elder.id) } })}
                      >
                        详情
                      </span>
                      <span
                        className="action-link"
                        onClick={() => alert('编辑功能待实现')}
                      >
                        编辑
                      </span>
                      <span
                        className="action-link"
                        onClick={() => handleStatusChange(elder.id, elder.status === 'active' ? 'inactive' : 'active')}
                      >
                        {elder.status === 'active' ? '离院' : '在院'}
                      </span>
                      <span
                        className="action-link danger"
                        onClick={() => handleDelete(elder.id)}
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

        {totalPages > 1 && (
          <div className="pagination">
            <button
              className="page-btn"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              上一页
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                className={`page-btn ${page === p ? 'active' : ''}`}
                onClick={() => setPage(p)}
              >
                {p}
              </button>
            ))}
            <button
              className="page-btn"
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              下一页
            </button>
            <span style={{ fontSize: '13px', color: '#6b7280', marginLeft: '8px' }}>
              共 {total} 条
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
