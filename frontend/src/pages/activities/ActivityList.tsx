import { useState, useEffect } from 'react'
import { useRouter } from '@tanstack/react-router'
import { activityApi, Activity } from '../../api/activity'
import dayjs from 'dayjs'

const typeOptions = [
  { value: '', label: '全部类型' },
  { value: 'recreation', label: '休闲娱乐' },
  { value: 'exercise', label: '运动健身' },
  { value: 'education', label: '学习教育' },
  { value: 'medical', label: '医疗健康' },
  { value: 'social', label: '社交活动' },
  { value: 'other', label: '其他' },
]

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'planned', label: '计划中' },
  { value: 'ongoing', label: '进行中' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
]

export default function ActivityList() {
  const router = useRouter()
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [activityType, setActivityType] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [total, setTotal] = useState(0)

  const fetchList = async () => {
    try {
      setLoading(true)
      const res = await activityApi.getList({
        page,
        page_size: pageSize,
        keyword: keyword || undefined,
        activity_type: activityType || undefined,
        status: status || undefined,
      })
      setActivities(res.data.items)
      setTotal(res.data.total)
    } catch (err) {
      console.error('获取活动列表失败', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchList()
  }, [page, activityType, status])

  const handleSearch = () => {
    setPage(1)
    fetchList()
  }

  const handleReset = () => {
    setKeyword('')
    setActivityType('')
    setStatus('')
    setPage(1)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除该活动吗？')) return
    try {
      await activityApi.remove(id)
      fetchList()
    } catch (err) {
      console.error('删除失败', err)
    }
  }

  const getTypeLabel = (t: string) => {
    const map: Record<string, string> = {
      recreation: '休闲娱乐',
      exercise: '运动健身',
      education: '学习教育',
      medical: '医疗健康',
      social: '社交活动',
      other: '其他',
    }
    return map[t] || t
  }

  const getStatusBadgeClass = (s: string) => {
    const map: Record<string, string> = {
      planned: 'status-badge status-pending',
      ongoing: 'status-badge status-active',
      completed: 'status-badge status-completed',
      cancelled: 'status-badge status-inactive',
    }
    return map[s] || 'status-badge status-pending'
  }

  const getStatusLabel = (s: string) => {
    const map: Record<string, string> = {
      planned: '计划中',
      ongoing: '进行中',
      completed: '已完成',
      cancelled: '已取消',
    }
    return map[s] || s
  }

  const getRiskLevelBadgeClass = (r: string) => {
    const map: Record<string, string> = {
      low: 'status-badge status-active',
      medium: 'status-badge status-pending',
      high: 'status-badge status-critical',
    }
    return map[r] || 'status-badge status-pending'
  }

  const getRiskLevelLabel = (r: string) => {
    const map: Record<string, string> = {
      low: '低风险',
      medium: '中风险',
      high: '高风险',
    }
    return map[r] || r
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">活动管理</h1>
        <button
          className="btn btn-primary"
          onClick={() => alert('新增功能待实现')}
        >
          + 新增活动
        </button>
      </div>

      <div className="card">
        <div className="search-bar">
          <input
            type="text"
            className="form-input"
            placeholder="搜索活动名称..."
            style={{ width: '240px' }}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <select
            className="form-select"
            style={{ width: '140px' }}
            value={activityType}
            onChange={(e) => setActivityType(e.target.value)}
          >
            {typeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
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
                <th>活动名称</th>
                <th>类型</th>
                <th>日期</th>
                <th>开始时间</th>
                <th>结束时间</th>
                <th>地点</th>
                <th>风险等级</th>
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
              ) : activities.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <div className="empty-state">
                      <div className="empty-state-icon">🎉</div>
                      <div>暂无活动</div>
                    </div>
                  </td>
                </tr>
              ) : (
                activities.map((activity) => (
                  <tr key={activity.id}>
                    <td>{activity.name}</td>
                    <td>{getTypeLabel(activity.activity_type)}</td>
                    <td>{dayjs(activity.activity_date).format('YYYY-MM-DD')}</td>
                    <td>{activity.start_time}</td>
                    <td>{activity.end_time}</td>
                    <td>{activity.location || '-'}</td>
                    <td>
                      <span className={getRiskLevelBadgeClass(activity.risk_level)}>
                        {getRiskLevelLabel(activity.risk_level)}
                      </span>
                    </td>
                    <td>
                      <span className={getStatusBadgeClass(activity.status)}>
                        {getStatusLabel(activity.status)}
                      </span>
                    </td>
                    <td>
                      <span
                        className="action-link"
                        onClick={() => router.navigate({ to: '/activities/$id', params: { id: String(activity.id) } })}
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
                        onClick={() => router.navigate({ to: '/activities/$id', params: { id: String(activity.id) } })}
                      >
                        签到管理
                      </span>
                      <span
                        className="action-link danger"
                        onClick={() => handleDelete(activity.id)}
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
