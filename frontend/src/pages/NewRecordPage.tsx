import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Save, Send, MapPin, Cpu, ClipboardCheck, User } from 'lucide-react'
import { cleaningApi, pointsApi, devicesApi, personsApi } from '@/lib/api'
import { OfflineAlert } from '@/components/OfflineAlert'
import {
  cn,
  DEVICE_STATUS_LABELS,
  DEVICE_STATUS_COLORS,
  SOURCE_CHANNEL_LABELS,
} from '@/lib/utils'
import type { StorePoint, Device, Person, CleaningItem, SourceChannel } from '@/lib/types'

const DEFAULT_CLEANING_ITEMS: CleaningItem[] = [
  { name: '冲煮头清洁', completed: false, remarks: '' },
  { name: '蒸汽棒清洁', completed: false, remarks: '' },
  { name: '滴水盘清洁', completed: false, remarks: '' },
  { name: '豆仓清洁', completed: false, remarks: '' },
  { name: '外壳擦拭', completed: false, remarks: '' },
  { name: '废水桶清理', completed: false, remarks: '' },
]

export default function NewRecordPage() {
  const navigate = useNavigate()
  const [points, setPoints] = useState<StorePoint[]>([])
  const [devices, setDevices] = useState<Device[]>([])
  const [persons, setPersons] = useState<Person[]>([])

  const [selectedPointId, setSelectedPointId] = useState<number | null>(null)
  const [selectedDeviceId, setSelectedDeviceId] = useState<number | null>(null)
  const [sourceChannel, setSourceChannel] = useState<SourceChannel>('routine_inspection')
  const [cleaningPersonId, setCleaningPersonId] = useState<number | null>(null)
  const [cleaningItems, setCleaningItems] = useState<CleaningItem[]>(DEFAULT_CLEANING_ITEMS)
  const [cleaningRemarks, setCleaningRemarks] = useState('')
  const [supplementNotes, setSupplementNotes] = useState('')
  const [reviewResult, setReviewResult] = useState('')
  const [reviewRemarks, setReviewRemarks] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadBaseData()
  }, [])

  useEffect(() => {
    if (selectedPointId) {
      devicesApi.list({ store_point_id: selectedPointId }).then((res) => {
        setDevices(res.data)
      }).catch(() => {
        setDevices(generateMockDevices(selectedPointId))
      })
    } else {
      setDevices([])
    }
    setSelectedDeviceId(null)
  }, [selectedPointId])

  const loadBaseData = async () => {
    try {
      const [pointsRes, personsRes] = await Promise.all([
        pointsApi.list(),
        personsApi.list(),
      ])
      setPoints(pointsRes.data)
      setPersons(personsRes.data)
    } catch {
      setPoints(generateMockPoints())
      setPersons(generateMockPersons())
      setDevices(generateMockDevices(1))
    }
  }

  const selectedPoint = points.find((p) => p.id === selectedPointId)
  const selectedDevice = devices.find((d) => d.id === selectedDeviceId)

  const toggleItem = (idx: number) => {
    setCleaningItems((items) =>
      items.map((item, i) =>
        i === idx ? { ...item, completed: !item.completed } : item
      )
    )
  }

  const updateItemRemark = (idx: number, remarks: string) => {
    setCleaningItems((items) =>
      items.map((item, i) => (i === idx ? { ...item, remarks } : item))
    )
  }

  const completedCount = cleaningItems.filter((i) => i.completed).length
  const completionRate = Math.round((completedCount / cleaningItems.length) * 100)

  const handleSave = async (submitForReview: boolean = false) => {
    if (!selectedPointId || !selectedDeviceId) {
      alert('请选择门店点位和设备')
      return
    }
    setSaving(true)

    const payload = {
      store_point_id: selectedPointId,
      device_id: selectedDeviceId,
      source_channel: sourceChannel,
      cleaning_person_id: cleaningPersonId,
      cleaning_date: new Date().toISOString(),
      cleaning_items: cleaningItems,
      cleaning_remarks: cleaningRemarks,
      supplement_notes: supplementNotes,
      review_result: reviewResult || undefined,
      review_remarks: reviewRemarks || undefined,
      is_device_offline: selectedDevice?.status === 'offline' || false,
    }

    try {
      const res = await cleaningApi.create(payload)
      const recordId = res.data.id
      if (submitForReview) {
        await cleaningApi.submitReview(recordId)
      }
      navigate({ to: '/records/$recordId', params: { recordId: String(recordId) } })
    } catch {
      const mockId = Date.now()
      navigate({ to: '/records/$recordId', params: { recordId: String(mockId) } })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate({ to: '/records' })}
          className="p-2 rounded-md hover:bg-gray-100 text-gray-600"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">新建清洁单据</h1>
          <p className="text-sm text-gray-500 mt-1">同一屏完成点位、设备、清洁项、复查结果录入</p>
        </div>
      </div>

      {selectedDevice?.status === 'offline' && (
        <OfflineAlert
          deviceName={selectedDevice.device_name}
          remarks={selectedDevice.remarks}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="card-header flex items-center gap-2">
              <MapPin className="w-5 h-5 text-coffee-600" />
              <h2 className="font-semibold text-gray-900">点位清单与来源</h2>
            </div>
            <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">门店点位 <span className="text-red-500">*</span></label>
                <select
                  value={selectedPointId || ''}
                  onChange={(e) => setSelectedPointId(Number(e.target.value) || null)}
                  className="input"
                >
                  <option value="">请选择点位</option>
                  {points.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}（{p.store_code}）
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">来源渠道</label>
                <select
                  value={sourceChannel}
                  onChange={(e) => setSourceChannel(e.target.value as SourceChannel)}
                  className="input"
                >
                  {Object.entries(SOURCE_CHANNEL_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>

              {selectedPoint && (
                <div className="md:col-span-2 p-4 bg-gray-50 rounded-lg text-sm">
                  <div className="grid grid-cols-2 gap-3 text-gray-600">
                    <div><span className="text-gray-500">地址：</span>{selectedPoint.address || '-'}</div>
                    <div><span className="text-gray-500">区域：</span>{selectedPoint.region || '-'}</div>
                    <div><span className="text-gray-500">联系人：</span>{selectedPoint.contact_person || '-'}</div>
                    <div><span className="text-gray-500">电话：</span>{selectedPoint.contact_phone || '-'}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header flex items-center gap-2">
              <Cpu className="w-5 h-5 text-coffee-600" />
              <h2 className="font-semibold text-gray-900">设备状态</h2>
            </div>
            <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">设备 <span className="text-red-500">*</span></label>
                <select
                  value={selectedDeviceId || ''}
                  onChange={(e) => setSelectedDeviceId(Number(e.target.value) || null)}
                  className="input"
                  disabled={!selectedPointId}
                >
                  <option value="">{selectedPointId ? '请选择设备' : '请先选择点位'}</option>
                  {devices.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.device_name}（{d.device_code}）
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">清洁人员</label>
                <select
                  value={cleaningPersonId || ''}
                  onChange={(e) => setCleaningPersonId(Number(e.target.value) || null)}
                  className="input"
                >
                  <option value="">请选择人员</option>
                  {persons.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}（{p.department || '-'}）</option>
                  ))}
                </select>
              </div>

              {selectedDevice && (
                <div className="md:col-span-2 p-4 bg-gray-50 rounded-lg text-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">
                      <Cpu className="inline w-4 h-4 mr-1" />
                      {selectedDevice.device_name} - {selectedDevice.device_code}
                    </span>
                    <span className={cn('badge', DEVICE_STATUS_COLORS[selectedDevice.status])}>
                      {DEVICE_STATUS_LABELS[selectedDevice.status]}
                    </span>
                  </div>
                  {selectedDevice.status === 'offline' && (
                    <p className="text-red-600 text-xs">
                      ⚠ 设备已离线，可能影响清洁数据自动采集，请在现场确认后手动记录
                    </p>
                  )}
                  <div className="grid grid-cols-2 gap-3 text-gray-600 pt-2 border-t border-gray-200">
                    <div>类型：{selectedDevice.device_type || '-'}</div>
                    <div>最后心跳：{selectedDevice.last_heartbeat || '-'}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-coffee-600" />
                <h2 className="font-semibold text-gray-900">清洁项目清单</h2>
              </div>
              <div className="text-sm">
                完成度：
                <span className="font-semibold text-coffee-700 ml-1">
                  {completedCount}/{cleaningItems.length} ({completionRate}%)
                </span>
              </div>
            </div>
            <div className="card-body">
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div
                  className="bg-coffee-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
              <div className="space-y-2">
                {cleaningItems.map((item, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      'p-3 rounded-lg border transition-colors',
                      item.completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => toggleItem(idx)}
                        className="w-5 h-5 rounded border-gray-300 text-coffee-600 focus:ring-coffee-500"
                      />
                      <span className={cn(
                        'font-medium flex-1',
                        item.completed ? 'text-green-800 line-through' : 'text-gray-900'
                      )}>
                        {item.name}
                      </span>
                      <input
                        type="text"
                        placeholder="备注（可选）"
                        value={item.remarks || ''}
                        onChange={(e) => updateItemRemark(idx, e.target.value)}
                        className="w-48 px-2 py-1 text-sm border border-gray-300 rounded-md focus:border-coffee-500 focus:ring-coffee-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <label className="label">清洁备注</label>
                <textarea
                  value={cleaningRemarks}
                  onChange={(e) => setCleaningRemarks(e.target.value)}
                  rows={3}
                  className="input"
                  placeholder="清洁过程中的特殊情况说明..."
                />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-blue-600" />
              <h2 className="font-semibold text-gray-900">复查结果</h2>
            </div>
            <div className="card-body space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">巡检结果</label>
                  <select
                    value={reviewResult}
                    onChange={(e) => setReviewResult(e.target.value)}
                    className="input"
                  >
                    <option value="">请选择</option>
                    <option value="qualified">合格</option>
                    <option value="partially_qualified">部分合格</option>
                    <option value="unqualified">不合格</option>
                  </select>
                </div>
                <div>
                  <label className="label">补资料说明</label>
                  <input
                    type="text"
                    value={supplementNotes}
                    onChange={(e) => setSupplementNotes(e.target.value)}
                    className="input"
                    placeholder="如需补资料，在此说明..."
                  />
                </div>
              </div>
              <div>
                <label className="label">复查备注</label>
                <textarea
                  value={reviewRemarks}
                  onChange={(e) => setReviewRemarks(e.target.value)}
                  rows={3}
                  className="input"
                  placeholder="复查发现的问题或说明..."
                />
              </div>
              <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                <User className="inline w-4 h-4 mr-1" />
                提示：保存后可提交复核，复核流程将记录完整的状态变更日志，便于后续查证。
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card sticky top-6">
            <div className="card-header">
              <h2 className="font-semibold text-gray-900">操作</h2>
            </div>
            <div className="card-body space-y-3">
              <button
                onClick={() => handleSave(false)}
                disabled={saving}
                className="btn-secondary w-full gap-2"
              >
                <Save className="w-4 h-4" />
                保存为草稿
              </button>
              <button
                onClick={() => handleSave(true)}
                disabled={saving}
                className="btn-primary w-full gap-2"
              >
                <Send className="w-4 h-4" />
                保存并提交复核
              </button>
              <button
                onClick={() => navigate({ to: '/records' })}
                className="w-full text-sm text-gray-500 hover:text-gray-700 py-2"
              >
                取消并返回列表
              </button>
            </div>

            <div className="border-t border-gray-200 px-6 py-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">点位：</span>
                <span className="font-medium text-gray-900">
                  {selectedPoint?.name || '未选择'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">设备：</span>
                <span className="font-medium text-gray-900">
                  {selectedDevice?.device_name || '未选择'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">完成度：</span>
                <span className="font-medium text-coffee-700">{completionRate}%</span>
              </div>
              {selectedDevice?.status === 'offline' && (
                <div className="pt-2 text-red-600 text-xs">
                  ⚠ 设备离线，请注意现场确认
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function generateMockPoints(): StorePoint[] {
  return [
    { id: 1, name: '南京路旗舰店', store_code: 'ST0001', address: '南京东路100号', region: '黄浦区', status: 'active', contact_person: '张经理', contact_phone: '13800138001' },
    { id: 2, name: '浦东机场店', store_code: 'ST0002', address: '浦东机场T2航站楼', region: '浦东新区', status: 'active', contact_person: '李主管', contact_phone: '13800138002' },
    { id: 3, name: '人民广场店', store_code: 'ST0003', address: '人民大道120号', region: '黄浦区', status: 'active', contact_person: '王店长', contact_phone: '13800138003' },
    { id: 4, name: '徐家汇店', store_code: 'ST0004', address: '虹桥路1号', region: '徐汇区', status: 'active', contact_person: '赵店长', contact_phone: '13800138004' },
  ]
}

function generateMockDevices(pointId: number): Device[] {
  return [
    { id: pointId * 10 + 1, device_code: `DEV${pointId}01`, device_name: '意式咖啡机A1', device_type: 'espresso_machine', store_point_id: pointId, status: 'online', last_heartbeat: new Date().toISOString() },
    { id: pointId * 10 + 2, device_code: `DEV${pointId}02`, device_name: '意式咖啡机B2', device_type: 'espresso_machine', store_point_id: pointId, status: 'online' },
    { id: pointId * 10 + 3, device_code: `DEV${pointId}03`, device_name: '冷萃机C1', device_type: 'cold_brew', store_point_id: pointId, status: 'offline', last_heartbeat: new Date(Date.now() - 3600000 * 2).toISOString(), remarks: '网络故障' },
    { id: pointId * 10 + 4, device_code: `DEV${pointId}04`, device_name: '磨豆机D1', device_type: 'grinder', store_point_id: pointId, status: 'online' },
  ]
}

function generateMockPersons(): Person[] {
  return [
    { id: 1, name: '陈师傅', employee_id: 'E001', role: '清洁工程师', department: '运维部', phone: '13900139001', is_active: true },
    { id: 2, name: '刘师傅', employee_id: 'E002', role: '清洁工程师', department: '运维部', phone: '13900139002', is_active: true },
    { id: 3, name: '周主管', employee_id: 'E003', role: '复核主管', department: '质检部', phone: '13900139003', is_active: true },
  ]
}
