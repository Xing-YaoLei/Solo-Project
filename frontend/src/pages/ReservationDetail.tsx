import { useEffect, useState } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import {
  ArrowLeft,
  CalendarDays,
  Users,
  Phone,
  Ticket,
  Clock,
  FileText,
  Edit3,
  RefreshCw,
  CheckCircle,
  XCircle,
  Paperclip,
  Plus,
  MessageSquare,
} from 'lucide-react'
import { reservationApi, timeSlotApi, timelineApi } from '@/services/api'
import type {
  Reservation,
  TimelineRecord,
  RescheduleRecord,
  TimeSlot,
} from '@/types'
import {
  formatDateTime,
  getStatusLabel,
  getStatusColor,
  getTimelineEventTypeLabel,
  getTimelineEventTypeColor,
  cn,
} from '@/utils'
import Timeline from '@/components/Timeline'

export default function ReservationDetail() {
  const { id } = useParams({ from: '/reservations/$id' })
  const navigate = useNavigate()
  const [reservation, setReservation] = useState<Reservation | null>(null)
  const [timeline, setTimeline] = useState<TimelineRecord[]>([])
  const [rescheduleHistory, setRescheduleHistory] = useState<RescheduleRecord[]>([])
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [showReschedule, setShowReschedule] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null)
  const [rescheduleReason, setRescheduleReason] = useState('')
  const [showAddNote, setShowAddNote] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [showUpload, setShowUpload] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    try {
      setLoading(true)
      const [res, timelineRes, historyRes, slotsRes] = await Promise.all([
        reservationApi.getDetail(Number(id)),
        reservationApi.getTimeline(Number(id)),
        reservationApi.getRescheduleHistory(Number(id)),
        timeSlotApi.getList({ is_active: true }),
      ])
      setReservation(res)
      setTimeline(timelineRes)
      setRescheduleHistory(historyRes)
      setTimeSlots(slotsRes)
    } catch (error) {
      console.error('加载预约详情失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCheckIn = async () => {
    try {
      await reservationApi.checkIn(Number(id))
      loadData()
    } catch (error) {
      console.error('签到失败:', error)
    }
  }

  const handleReschedule = async () => {
    if (!selectedSlot) {
      alert('请选择新时段')
      return
    }
    try {
      await reservationApi.reschedule(Number(id), {
        new_time_slot_id: selectedSlot,
        reason: rescheduleReason,
      })
      setShowReschedule(false)
      setSelectedSlot(null)
      setRescheduleReason('')
      loadData()
    } catch (error) {
      console.error('改约失败:', error)
    }
  }

  const handleAddNote = async () => {
    if (!noteText.trim()) return
    try {
      await timelineApi.addRecord(Number(id), {
        event_type: 'remark',
        description: noteText,
      })
      setNoteText('')
      setShowAddNote(false)
      loadData()
    } catch (error) {
      console.error('添加备注失败:', error)
      alert('添加备注失败，请重试')
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files))
    }
  }

  const handleUploadAttachments = async () => {
    if (selectedFiles.length === 0) {
      alert('请选择要上传的文件')
      return
    }
    try {
      setUploading(true)
      const timelineRecord = await timelineApi.addRecord(Number(id), {
        event_type: 'attachment_added',
        description: `上传了 ${selectedFiles.length} 个附件`,
      })
      await timelineApi.uploadAttachments(timelineRecord.id, selectedFiles)
      setSelectedFiles([])
      setShowUpload(false)
      loadData()
    } catch (error) {
      console.error('上传附件失败:', error)
      alert('上传附件失败，请重试')
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  if (!reservation) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">预约单不存在</p>
        <button
          onClick={() => navigate({ to: '/reservations' })}
          className="mt-4 text-primary-600 hover:underline"
        >
          返回列表
        </button>
      </div>
    )
  }

  const infoItems = [
    { icon: Ticket, label: '预约单号', value: reservation.reservation_no },
    { icon: Users, label: '游客姓名', value: reservation.visitor_name },
    { icon: Phone, label: '联系电话', value: reservation.visitor_phone },
    { icon: Users, label: '预约人数', value: `${reservation.visitor_count} 人` },
    { icon: Ticket, label: '票种', value: reservation.ticket_type || '-' },
    { icon: CalendarDays, label: '预约来源', value: reservation.source || '-' },
    { icon: Clock, label: '创建时间', value: formatDateTime(reservation.created_at) },
    {
      icon: CheckCircle,
      label: '签到时间',
      value: reservation.check_in_time
        ? formatDateTime(reservation.check_in_time)
        : '-',
    },
  ]

  return (
    <div className="space-y-4">
      {/* 顶部导航 */}
      <div className="flex items-center">
        <button
          onClick={() => navigate({ to: '/reservations' })}
          className="p-2 -ml-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="ml-2">
          <h1 className="text-xl font-bold text-gray-900">
            预约单详情
          </h1>
          <p className="text-sm text-gray-500">{reservation.reservation_no}</p>
        </div>
      </div>

      {/* 状态和操作 */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center">
            <span
              className={cn(
                'px-3 py-1 text-sm font-medium rounded-full',
                getStatusColor(reservation.status)
              )}
            >
              {getStatusLabel(reservation.status)}
            </span>
            {reservation.time_slot && (
              <span className="ml-3 text-sm text-gray-600">
                {reservation.time_slot.date.slice(0, 10)}{' '}
                {reservation.time_slot.start_time}-
                {reservation.time_slot.end_time}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {reservation.status === 'confirmed' && (
              <button
                onClick={handleCheckIn}
                className="flex items-center px-3 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600"
              >
                <CheckCircle size={16} className="mr-1.5" />
                签到
              </button>
            )}
            {['pending', 'confirmed'].includes(reservation.status) && (
              <>
                <button
                  onClick={() => setShowReschedule(true)}
                  className="flex items-center px-3 py-2 bg-primary-100 text-primary-700 rounded-lg text-sm font-medium hover:bg-primary-200"
                >
                  <RefreshCw size={16} className="mr-1.5" />
                  改约
                </button>
                <button
                  onClick={() => {}}
                  className="flex items-center px-3 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200"
                >
                  <XCircle size={16} className="mr-1.5" />
                  取消
                </button>
              </>
            )}
            <button
              onClick={() => setShowAddNote(true)}
              className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
            >
              <MessageSquare size={16} className="mr-1.5" />
              添加备注
            </button>
            <button
              onClick={() => setShowUpload(true)}
              className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
            >
              <Paperclip size={16} className="mr-1.5" />
              上传附件
            </button>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* 左侧：基本信息 */}
        <div className="lg:col-span-2 space-y-4">
          {/* 基本信息 */}
          <div className="bg-white rounded-xl shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <FileText className="mr-2 text-primary-500" size={20} />
                预约信息
              </h2>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 gap-4">
                {infoItems.map((item, index) => {
                  const Icon = item.icon
                  return (
                    <div key={index} className="flex items-start">
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon size={16} className="text-gray-500" />
                      </div>
                      <div className="ml-3 min-w-0">
                        <p className="text-xs text-gray-500">{item.label}</p>
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {item.value}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
              {reservation.remark && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">备注</p>
                  <p className="text-sm text-gray-700">{reservation.remark}</p>
                </div>
              )}
            </div>
          </div>

          {/* 时段和容量信息 */}
          {reservation.time_slot && (
            <div className="bg-white rounded-xl shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <CalendarDays className="mr-2 text-primary-500" size={20} />
                  时段信息
                </h2>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">
                      {reservation.time_slot.start_time} -{' '}
                      {reservation.time_slot.end_time}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {reservation.time_slot.date.slice(0, 10)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary-600">
                      {reservation.time_slot.remaining_capacity}
                      <span className="text-sm font-normal text-gray-500 ml-1">
                        / {reservation.time_slot.capacity}
                      </span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">剩余容量</p>
                  </div>
                </div>
                {reservation.time_slot.description && (
                  <p className="mt-3 text-sm text-gray-600">
                    {reservation.time_slot.description}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* 改约记录 */}
          {rescheduleHistory.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <RefreshCw className="mr-2 text-orange-500" size={20} />
                  改约记录
                </h2>
              </div>
              <div className="p-5 space-y-3">
                {rescheduleHistory.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="text-sm text-gray-900">
                        原时段 → 新时段
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {record.reason || '无改约原因'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        {formatDateTime(record.reschedule_time)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
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

      {/* 改约弹窗 */}
      {showReschedule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">改约</h3>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  选择新时段
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {timeSlots.map((slot) => (
                    <label
                      key={slot.id}
                      className={cn(
                        'flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors',
                        selectedSlot === slot.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <div className="flex items-center">
                        <input
                          type="radio"
                          name="timeSlot"
                          value={slot.id}
                          checked={selectedSlot === slot.id}
                          onChange={() => setSelectedSlot(slot.id)}
                          className="mr-3"
                        />
                        <div>
                          <p className="font-medium text-gray-900">
                            {slot.date.slice(0, 10)} {slot.start_time}-
                            {slot.end_time}
                          </p>
                          <p className="text-xs text-gray-500">
                            容量 {slot.capacity} 人
                          </p>
                        </div>
                      </div>
                      <span
                        className={cn(
                          'text-sm font-medium',
                          slot.remaining_capacity > 0
                            ? 'text-green-600'
                            : 'text-red-600'
                        )}
                      >
                        剩余 {slot.remaining_capacity}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  改约原因
                </label>
                <textarea
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="请输入改约原因"
                />
              </div>
            </div>
            <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-2">
              <button
                onClick={() => setShowReschedule(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                取消
              </button>
              <button
                onClick={handleReschedule}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600"
              >
                确认改约
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 添加备注弹窗 */}
      {showAddNote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">添加处理备注</h3>
            </div>
            <div className="p-5">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="请输入备注内容..."
              />
            </div>
            <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-2">
              <button
                onClick={() => setShowAddNote(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                取消
              </button>
              <button
                onClick={handleAddNote}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {showUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">上传附件</h3>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  选择文件
                </label>
                <input
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              {selectedFiles.length > 0 && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-700">已选择文件：</p>
                  {selectedFiles.map((file, index) => (
                    <p key={index} className="text-xs text-gray-500">
                      {file.name} ({(file.size / 1024).toFixed(1)} KB)
                    </p>
                  ))}
                </div>
              )}
            </div>
            <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowUpload(false)
                  setSelectedFiles([])
                }}
                disabled={uploading}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={handleUploadAttachments}
                disabled={uploading}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 disabled:opacity-50"
              >
                {uploading ? '上传中...' : '上传'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
