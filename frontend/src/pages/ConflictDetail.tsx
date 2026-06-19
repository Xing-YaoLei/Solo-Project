import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from '@tanstack/react-router'
import {
  ArrowLeft,
  AlertTriangle,
  Users,
  User,
  Clock,
  MessageSquare,
  Send,
  CheckCircle,
  UserPlus,
  FileText,
} from 'lucide-react'
import { conflictApi, reservationApi } from '@/services/api'
import type { ConflictRecord, TimelineRecord } from '@/types'
import {
  formatDateTime,
  getConflictStatusLabel,
  getConflictStatusColor,
  getSeverityLabel,
  getSeverityColor,
  getStatusLabel,
  getStatusColor,
  cn,
} from '@/utils'
import Timeline from '@/components/Timeline'

export default function ConflictDetail() {
  const { id } = useParams({ from: '/conflicts/$id' })
  const navigate = useNavigate()
  const [conflict, setConflict] = useState<ConflictRecord | null>(null)
  const [timeline, setTimeline] = useState<TimelineRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [noteText, setNoteText] = useState('')
  const [showAssignDialog, setShowAssignDialog] = useState(false)
  const [showResolveDialog, setShowResolveDialog] = useState(false)
  const [resolution, setResolution] = useState('')
  const [selectedOperator, setSelectedOperator] = useState<number | null>(null)

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    try {
      setLoading(true)
      const data = await conflictApi.getDetail(Number(id))
      setConflict(data)

      const allTimeline: TimelineRecord[] = []
      if (data.affected_objects) {
        for (const obj of data.affected_objects) {
          try {
            const tl = await reservationApi.getTimeline(obj.reservation_id)
            allTimeline.push(...tl)
          } catch (e) {}
        }
      }
      allTimeline.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      setTimeline(allTimeline)
    } catch (error) {
      console.error('加载冲突详情失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddNote = async () => {
    if (!noteText.trim()) return
    try {
      await conflictApi.addNote(Number(id), noteText)
      setNoteText('')
      loadData()
    } catch (error) {
      console.error('添加备注失败:', error)
    }
  }

  const handleAssign = async () => {
    if (!selectedOperator) {
      alert('请选择处理人')
      return
    }
    try {
      await conflictApi.update(Number(id), {
        assigned_to: selectedOperator,
        status: 'assigned',
      })
      setShowAssignDialog(false)
      setSelectedOperator(null)
      loadData()
    } catch (error) {
      console.error('分配处理人失败:', error)
    }
  }

  const handleResolve = async () => {
    if (!resolution.trim()) {
      alert('请填写处理结果')
      return
    }
    try {
      await conflictApi.update(Number(id), {
        status: 'resolved',
        resolution,
      })
      setShowResolveDialog(false)
      setResolution('')
      loadData()
    } catch (error) {
      console.error('解决冲突失败:', error)
    }
  }

  const handleStartProcess = async () => {
    try {
      await conflictApi.update(Number(id), { status: 'in_progress' })
      loadData()
    } catch (error) {
      console.error('开始处理失败:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  if (!conflict) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">冲突记录不存在</p>
        <button
          onClick={() => navigate({ to: '/conflicts' })}
          className="mt-4 text-primary-600 hover:underline"
        >
          返回列表
        </button>
      </div>
    )
  }

  const canAssign = ['detected'].includes(conflict.status)
  const canStart = ['assigned'].includes(conflict.status)
  const canResolve = ['in_progress'].includes(conflict.status)

  return (
    <div className="space-y-4">
      {/* 顶部导航 */}
      <div className="flex items-center">
        <button
          onClick={() => navigate({ to: '/conflicts' })}
          className="p-2 -ml-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="ml-2">
          <h1 className="text-xl font-bold text-gray-900">冲突详情</h1>
          <p className="text-sm text-gray-500">{conflict.conflict_no}</p>
        </div>
      </div>

      {/* 状态和操作 */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="text-red-600" size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'px-2.5 py-1 text-sm font-medium rounded-full',
                    getConflictStatusColor(conflict.status)
                  )}
                >
                  {getConflictStatusLabel(conflict.status)}
                </span>
                <span
                  className={cn(
                    'px-2.5 py-1 text-xs font-medium rounded-full',
                    getSeverityColor(conflict.severity)
                  )}
                >
                  {getSeverityLabel(conflict.severity)}级
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                检测时间：{formatDateTime(conflict.detected_at)}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {canAssign && (
              <button
                onClick={() => setShowAssignDialog(true)}
                className="flex items-center px-3 py-2 bg-primary-100 text-primary-700 rounded-lg text-sm font-medium hover:bg-primary-200"
              >
                <UserPlus size={16} className="mr-1.5" />
                分配处理人
              </button>
            )}
            {canStart && (
              <button
                onClick={handleStartProcess}
                className="flex items-center px-3 py-2 bg-yellow-100 text-yellow-700 rounded-lg text-sm font-medium hover:bg-yellow-200"
              >
                <Send size={16} className="mr-1.5" />
                开始处理
              </button>
            )}
            {canResolve && (
              <button
                onClick={() => setShowResolveDialog(true)}
                className="flex items-center px-3 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600"
              >
                <CheckCircle size={16} className="mr-1.5" />
                解决冲突
              </button>
            )}
          </div>
        </div>

        {conflict.description && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">{conflict.description}</p>
          </div>
        )}

        {conflict.assignee && (
          <div className="mt-3 flex items-center text-sm text-gray-600">
            <User size={14} className="mr-1.5 text-gray-400" />
            处理人：{conflict.assignee.full_name || conflict.assignee.username}
          </div>
        )}

        {conflict.resolution && (
          <div className="mt-3 p-3 bg-green-50 rounded-lg">
            <p className="text-xs text-green-600 font-medium mb-1">处理结果</p>
            <p className="text-sm text-green-700">{conflict.resolution}</p>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* 左侧：受影响对象 */}
        <div className="lg:col-span-2 space-y-4">
          {/* 受影响的预约 */}
          <div className="bg-white rounded-xl shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Users className="mr-2 text-red-500" size={20} />
                受影响的预约
                <span className="ml-2 text-sm font-normal text-gray-500">
                  共 {conflict.affected_objects?.length || 0} 个
                </span>
              </h2>
            </div>
            <div className="divide-y divide-gray-100">
              {conflict.affected_objects?.map((obj) => (
                <Link
                  key={obj.id}
                  to={`/reservations/${obj.reservation_id}`}
                  className="block p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <FileText
                          size={18}
                          className="text-gray-500"
                        />
                      </div>
                      <div className="ml-3">
                        <p className="font-medium text-gray-900">
                          {obj.reservation?.visitor_name || '预约单'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {obj.reservation?.reservation_no || `#${obj.reservation_id}`}
                        </p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        'px-2 py-0.5 text-xs font-medium rounded-full',
                        getStatusColor(obj.reservation?.status || 'pending')
                      )}
                    >
                      {getStatusLabel(obj.reservation?.status || 'pending')}
                    </span>
                  </div>
                  {obj.impact_description && (
                    <p className="mt-2 text-sm text-red-600 bg-red-50 px-3 py-1.5 rounded">
                      {obj.impact_description}
                    </p>
                  )}
                  {obj.reservation && (
                    <div className="mt-2 flex items-center text-xs text-gray-500">
                      <span className="mr-4">
                        {obj.reservation.visitor_count} 人
                      </span>
                      <span>{obj.reservation.visitor_phone}</span>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>

          {/* 添加处理备注 */}
          <div className="bg-white rounded-xl shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <MessageSquare className="mr-2 text-primary-500" size={20} />
                处理说明
              </h2>
            </div>
            <div className="p-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                  <User size={14} className="text-gray-500" />
                </div>
                <div className="flex-1">
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                    placeholder="添加处理说明，将同步到所有受影响预约的时间线..."
                  />
                  <div className="mt-2 flex justify-end">
                    <button
                      onClick={handleAddNote}
                      disabled={!noteText.trim()}
                      className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      发送
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 右侧：时间线 */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm sticky top-4">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Clock className="mr-2 text-primary-500" size={20} />
                处理时间线
              </h2>
            </div>
            <div className="p-4 max-h-96 lg:max-h-[calc(100vh-200px)] overflow-y-auto">
              <Timeline events={timeline} />
            </div>
          </div>
        </div>
      </div>

      {/* 分配处理人弹窗 */}
      {showAssignDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">分配处理人</h3>
            </div>
            <div className="p-5">
              <div className="space-y-2">
                {[
                  { id: 1, name: '张三', role: '运营主管' },
                  { id: 2, name: '李四', role: '票务专员' },
                  { id: 3, name: '王五', role: '现场调度' },
                ].map((user) => (
                  <label
                    key={user.id}
                    className={cn(
                      'flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors',
                      selectedOperator === user.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name="operator"
                        value={user.id}
                        checked={selectedOperator === user.id}
                        onChange={() => setSelectedOperator(user.id)}
                        className="mr-3"
                      />
                      <div>
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.role}</p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-2">
              <button
                onClick={() => setShowAssignDialog(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                取消
              </button>
              <button
                onClick={handleAssign}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600"
              >
                确认分配
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 解决冲突弹窗 */}
      {showResolveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">解决冲突</h3>
            </div>
            <div className="p-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                处理结果说明
              </label>
              <textarea
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="请详细描述冲突的处理方式和结果..."
              />
            </div>
            <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-2">
              <button
                onClick={() => setShowResolveDialog(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                取消
              </button>
              <button
                onClick={handleResolve}
                disabled={!resolution.trim()}
                className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 disabled:opacity-50"
              >
                确认解决
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
