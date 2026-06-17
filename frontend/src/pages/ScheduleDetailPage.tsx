import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from '@tanstack/react-router';
import {
  ArrowLeft,
  AlertTriangle,
  MapPin,
  User,
  Calendar,
  Clock,
  FileText,
  MessageSquare,
  CheckSquare,
  History,
  MapPinned,
  Send,
  Edit3,
  RefreshCw,
  Check,
  X,
  Phone,
  Star,
} from 'lucide-react';
import type {
  CleaningSchedule,
  ConflictRecord,
  RescheduleRecord,
  AttendanceRecord,
  CommunicationRecord,
  ReviewOpinion,
  Apartment,
  User,
  TimeSlot,
} from '@/types';
import { schedulesApi, detailsApi } from '@/api';
import { useAuthStore } from '@/store/auth';
import {
  STATUS_COLORS,
  STATUS_LABELS,
  ATTENDANCE_COLORS,
  ATTENDANCE_LABELS,
  RISK_BG_COLORS,
  RISK_COLORS,
  RISK_LABELS,
  RESCHEDULE_REASON_LABELS,
  ROLE_LABELS,
  formatDateTime,
  formatTime,
  formatDate,
  cn,
} from '@/utils/format';
import type {
  CleaningStatus,
  AttendanceStatus,
  RescheduleReason,
  RiskLevel,
} from '@/types';

type TabType = 'overview' | 'reschedules' | 'attendance' | 'communications' | 'reviews';

export default function ScheduleDetailPage() {
  const { scheduleId } = useParams({ from: '/schedules/$scheduleId' });
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState<CleaningSchedule | null>(null);
  const [conflicts, setConflicts] = useState<ConflictRecord[]>([]);
  const [reschedules, setReschedules] = useState<RescheduleRecord[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [communications, setCommunications] = useState<CommunicationRecord[]>([]);
  const [reviews, setReviews] = useState<ReviewOpinion[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [newReview, setNewReview] = useState({ review_type: 'conflict_review', opinion: '', decision: '', is_approved: null as boolean | null });
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const hasRole = useAuthStore((s) => s.hasRole);
  const currentUser = useAuthStore((s) => s.currentUser);

  const id = Number(scheduleId);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [s, conf, resch, att, comm, rev] = await Promise.all([
        schedulesApi.get(id),
        detailsApi.getConflicts(id),
        schedulesApi.getReschedules(id),
        schedulesApi.getAttendance(id),
        detailsApi.getCommunications(id),
        detailsApi.getReviews(id),
      ]);
      setSchedule(s.data);
      setConflicts(conf.data);
      setReschedules(resch.data);
      setAttendance(att.data);
      setCommunications(comm.data);
      setReviews(rev.data);
    } catch (err) {
      console.error('加载详情失败', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [id]);

  const handleUpdateStatus = async (status: CleaningStatus) => {
    try {
      await schedulesApi.updateStatus(id, status);
      await loadAll();
    } catch (err) {
      alert('操作失败');
    }
  };

  const handleRecordAttendance = async (status: AttendanceStatus) => {
    try {
      await schedulesApi.recordAttendance(id, {
        cleaning_schedule_id: id,
        status,
        notes: '',
      });
      setShowAttendanceModal(false);
      await loadAll();
    } catch (err) {
      alert('记录失败');
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    try {
      await detailsApi.addCommunication(id, {
        cleaning_schedule_id: id,
        content: newMessage.trim(),
        message_type: 'note',
        is_internal: true,
      });
      setNewMessage('');
      await loadAll();
    } catch (err) {
      alert('发送失败');
    }
  };

  const handleSubmitReview = async () => {
    if (!newReview.opinion.trim()) {
      alert('请输入复核意见');
      return;
    }
    try {
      await detailsApi.addReview(id, {
        cleaning_schedule_id: id,
        ...newReview,
      });
      setNewReview({ review_type: 'conflict_review', opinion: '', decision: '', is_approved: null });
      await loadAll();
    } catch (err) {
      alert('提交失败');
    }
  };

  const handleResolveConflict = async (conflictId: number) => {
    try {
      await detailsApi.resolveConflict(conflictId, {
        is_resolved: true,
        resolution_notes: '已处理冲突，重新分配资源',
      });
      await loadAll();
    } catch (err) {
      alert('处理失败');
    }
  };

  const handleMarkNoShow = async () => {
    if (!confirm('确认标记为未到场？')) return;
    try {
      await schedulesApi.markNoShow(id);
      await loadAll();
    } catch (err) {
      alert('操作失败');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="card p-12 text-center text-gray-500">
        排班记录不存在
        <Link to="/schedules" className="block mt-4 text-primary-600 hover:text-primary-700">
          返回列表
        </Link>
      </div>
    );
  }

  const tabs: { key: TabType; label: string; icon: React.ElementType; badge?: number }[] = [
    { key: 'overview', label: '概览', icon: FileText },
    { key: 'reschedules', label: '改约记录', icon: History, badge: reschedules.length },
    { key: 'attendance', label: '到场追踪', icon: MapPinned, badge: attendance.length },
    { key: 'communications', label: '沟通记录', icon: MessageSquare, badge: communications.length },
    { key: 'reviews', label: '复核意见', icon: CheckSquare, badge: reviews.length },
  ];

  return (
    <div className="space-y-6">
      {/* 顶部导航 */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate({ to: '/schedules' })}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-semibold text-gray-900">
              排班详情 #{schedule.schedule_code}
            </h1>
            <span className={cn('badge', STATUS_COLORS[schedule.status])}>
              {STATUS_LABELS[schedule.status]}
            </span>
            <span className={cn('badge', ATTENDANCE_COLORS[schedule.attendance_status])}>
              {ATTENDANCE_LABELS[schedule.attendance_status]}
            </span>
            {schedule.has_conflict && schedule.risk_level && (
              <span className={cn('badge border', RISK_COLORS[schedule.risk_level as RiskLevel])}>
                <AlertTriangle size={12} className="inline mr-1" />
                {RISK_LABELS[schedule.risk_level as RiskLevel]}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            创建于 {formatDateTime(schedule.created_at)}
          </p>
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center gap-2 flex-wrap">
          {currentUser?.role === 'cleaner' && schedule.cleaner_id === currentUser.id && (
            <>
              {schedule.status === 'confirmed' || schedule.status === 'pending' ? (
                <button
                  onClick={() => handleUpdateStatus('in_progress')}
                  className="btn-primary"
                >
                  <PlayCircle size={16} className="mr-1.5" />
                  开始任务
                </button>
              ) : null}
              {schedule.status === 'in_progress' && (
                <button onClick={() => handleUpdateStatus('completed')} className="btn-primary">
                  <Check size={16} className="mr-1.5" />
                  完成任务
                </button>
              )}
              <button
                onClick={() => setShowAttendanceModal(true)}
                className="btn-outline"
              >
                <MapPinned size={16} className="mr-1.5" />
                签到/签退
              </button>
            </>
          )}
          {hasRole('admin', 'supervisor') && (
            <>
              <button
                onClick={() => setShowRescheduleModal(true)}
                className="btn-outline gap-1.5"
              >
                <RefreshCw size={16} />
                改约
              </button>
              {schedule.status !== 'no_show' &&
                schedule.status !== 'completed' &&
                schedule.status !== 'cancelled' && (
                  <button onClick={handleMarkNoShow} className="btn-danger gap-1.5">
                    <X size={16} />
                    标记未到场
                  </button>
                )}
            </>
          )}
        </div>
      </div>

      {/* 冲突警告 */}
      {schedule.has_conflict && conflicts.length > 0 && (
        <div className={cn('rounded-xl p-4 border', RISK_BG_COLORS[schedule.risk_level || 'high'])}>
          <div className="flex items-start gap-3">
            <AlertTriangle
              size={20}
              className={cn(
                'flex-shrink-0 mt-0.5',
                schedule.risk_level === 'critical' || schedule.risk_level === 'high'
                  ? 'text-red-600'
                  : 'text-yellow-600'
              )}
            />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">检测到时段冲突</h3>
              <div className="mt-3 space-y-2">
                {conflicts.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-start justify-between gap-4 bg-white/60 rounded-lg p-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={cn('badge border text-[10px]', RISK_COLORS[c.risk_level as RiskLevel])}>
                          {RISK_LABELS[c.risk_level as RiskLevel]}
                        </span>
                        <span className="text-xs font-medium text-gray-700">{c.conflict_type}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{c.description}</p>
                    </div>
                    {!c.is_resolved && hasRole('admin', 'supervisor') && (
                      <button
                        onClick={() => handleResolveConflict(c.id)}
                        className="btn-primary text-xs py-1.5 px-3 whitespace-nowrap"
                      >
                        标记已处理
                      </button>
                    )}
                    {c.is_resolved && (
                      <span className="badge bg-green-100 text-green-800 whitespace-nowrap">
                        <Check size={10} className="inline mr-1" />
                        已处理
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 栏 */}
      <div className="card overflow-hidden">
        <div className="border-b border-gray-200 overflow-x-auto">
          <div className="flex min-w-max">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    'flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
                    activeTab === tab.key
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  )}
                >
                  <Icon size={16} />
                  {tab.label}
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-gray-100 text-gray-600">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <OverviewTab schedule={schedule} hasRole={hasRole} />
          )}
          {activeTab === 'reschedules' && (
            <ReschedulesTab reschedules={reschedules} hasRole={hasRole} />
          )}
          {activeTab === 'attendance' && <AttendanceTab attendance={attendance} />}
          {activeTab === 'communications' && (
            <CommunicationsTab
              communications={communications}
              newMessage={newMessage}
              setNewMessage={setNewMessage}
              onSend={handleSendMessage}
            />
          )}
          {activeTab === 'reviews' && (
            <ReviewsTab
              reviews={reviews}
              newReview={newReview}
              setNewReview={setNewReview}
              onSubmit={handleSubmitReview}
              hasRole={hasRole}
            />
          )}
        </div>
      </div>

      {/* 改约弹窗 */}
      {showRescheduleModal && (
        <RescheduleModal
          schedule={schedule}
          onClose={() => setShowRescheduleModal(false)}
          onSuccess={() => {
            setShowRescheduleModal(false);
            loadAll();
          }}
        />
      )}

      {/* 签到弹窗 */}
      {showAttendanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">到场状态更新</h3>
            <div className="space-y-3">
              {(['not_started', 'en_route', 'arrived', 'checked_out'] as AttendanceStatus[]).map(
                (status) => (
                  <button
                    key={status}
                    onClick={() => handleRecordAttendance(status)}
                    className={cn(
                      'w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-colors',
                      schedule.attendance_status === status
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <span className={cn('badge', ATTENDANCE_COLORS[status])}>
                      {ATTENDANCE_LABELS[status]}
                    </span>
                  </button>
                )
              )}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowAttendanceModal(false)} className="btn-secondary">
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function OverviewTab({ schedule }: { schedule: CleaningSchedule; hasRole: any }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="space-y-4 lg:col-span-2">
        {/* 时段信息 */}
        <Section title="时间安排" icon={Calendar}>
          <div className="grid grid-cols-2 gap-4">
            <InfoItem label="排班日期" value={formatDate(schedule.scheduled_date)} />
            <InfoItem
              label="时段"
              value={`${formatTime(schedule.start_time)} - ${formatTime(schedule.end_time)}`}
            />
            <InfoItem label="时长" value={`${schedule.duration_minutes} 分钟`} />
            <InfoItem
              label="清洁类型"
              value={schedule.cleaning_type === 'routine' ? '日常清洁' : schedule.cleaning_type === 'deep' ? '深度清洁' : schedule.cleaning_type === 'checkout' ? '退租清洁' : schedule.cleaning_type}
            />
          </div>
        </Section>

        {/* 公寓信息 */}
        <Section title="公寓信息" icon={MapPin}>
          {schedule.apartment && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <InfoItem label="公寓编号" value={schedule.apartment.apartment_code} />
                <InfoItem
                  label="位置"
                  value={`${schedule.apartment.building} ${schedule.apartment.unit} ${schedule.apartment.room_number || ''}`}
                />
                <InfoItem label="户型" value={schedule.apartment.apartment_type || '-'} />
                <InfoItem label="面积" value={schedule.apartment.area_sqm ? `${schedule.apartment.area_sqm} ㎡` : '-'} />
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
                <InfoItem label="租客姓名" value={schedule.apartment.resident_name || '-'} />
                <InfoItem
                  label="联系电话"
                  value={
                    schedule.apartment.resident_phone ? (
                      <a
                        href={`tel:${schedule.apartment.resident_phone}`}
                        className="text-primary-600 hover:text-primary-700"
                      >
                        <Phone size={12} className="inline mr-1" />
                        {schedule.apartment.resident_phone}
                      </a>
                    ) : (
                      '-'
                    )
                  }
                />
              </div>
              {schedule.apartment.door_lock_info && (
                <div className="mt-4 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                  <div className="text-xs font-medium text-yellow-700 mb-1">门锁信息</div>
                  <div className="text-sm text-yellow-800">{schedule.apartment.door_lock_info}</div>
                </div>
              )}
              {schedule.apartment.special_instructions && (
                <div className="mt-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <div className="text-xs font-medium text-blue-700 mb-1">特别说明</div>
                  <div className="text-sm text-blue-800">{schedule.apartment.special_instructions}</div>
                </div>
              )}
            </>
          )}
        </Section>

        {/* 备注信息 */}
        <Section title="备注说明" icon={FileText}>
          <div className="space-y-4">
            <div>
              <div className="text-xs font-medium text-gray-500 mb-1">客户备注</div>
              <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
                {schedule.customer_notes || '无'}
              </p>
            </div>
            <div>
              <div className="text-xs font-medium text-gray-500 mb-1">内部备注</div>
              <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
                {schedule.internal_notes || '无'}
              </p>
            </div>
          </div>
        </Section>
      </div>

      <div className="space-y-4">
        {/* 人员分配 */}
        <Section title="人员分配" icon={User}>
          <div className="space-y-4">
            <PersonCard
              label="保洁员"
              person={schedule.cleaner}
              placeholder="待分配"
              accent="teal"
            />
            <PersonCard
              label="主管"
              person={schedule.supervisor}
              placeholder="待分配"
              accent="purple"
            />
          </div>
        </Section>

        {/* 完成情况 */}
        {schedule.status === 'completed' && (
          <Section title="完成情况" icon={Check}>
            <div className="space-y-4">
              <InfoItem label="签到时间" value={schedule.check_in_time ? formatDateTime(schedule.check_in_time) : '-'} />
              <InfoItem label="签退时间" value={schedule.check_out_time ? formatDateTime(schedule.check_out_time) : '-'} />
              <InfoItem label="完成时间" value={schedule.completion_time ? formatDateTime(schedule.completion_time) : '-'} />
              {schedule.quality_score !== null && schedule.quality_score !== undefined && (
                <div>
                  <div className="text-xs font-medium text-gray-500 mb-1">质量评分</div>
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={18}
                          className={cn(
                            s <= Math.round((schedule.quality_score || 0) / 20)
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-300'
                          )}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{schedule.quality_score}分</span>
                  </div>
                </div>
              )}
              {schedule.feedback && (
                <div>
                  <div className="text-xs font-medium text-gray-500 mb-1">反馈</div>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
                    {schedule.feedback}
                  </p>
                </div>
              )}
            </div>
          </Section>
        )}

        {/* 费用信息 */}
        <Section title="费用信息" icon={FileText}>
          <div className="space-y-3">
            <InfoItem
              label="预估费用"
              value={schedule.estimated_cost !== null ? `¥ ${schedule.estimated_cost}` : '-'}
            />
            <InfoItem
              label="实际费用"
              value={schedule.actual_cost !== null ? `¥ ${schedule.actual_cost}` : '-'}
            />
          </div>
        </Section>
      </div>
    </div>
  );
}

function ReschedulesTab({ reschedules }: { reschedules: RescheduleRecord[]; hasRole: any }) {
  if (reschedules.length === 0) {
    return <EmptyState message="暂无改约记录" icon={History} />;
  }
  return (
    <div className="space-y-3">
      {reschedules.map((record, idx) => (
        <div key={record.id} className="p-4 rounded-xl border border-gray-200 bg-gray-50/50">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-medium text-sm">
                #{reschedules.length - idx}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="badge bg-indigo-100 text-indigo-800">
                    {RESCHEDULE_REASON_LABELS[record.reason as RescheduleReason]}
                  </span>
                  <span className="text-xs text-gray-500">{formatDateTime(record.created_at)}</span>
                </div>
                {record.reason_detail && (
                  <p className="text-sm text-gray-600 mt-1">{record.reason_detail}</p>
                )}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-red-50 border border-red-100">
              <div className="text-xs text-red-600 font-medium mb-1">原安排</div>
              <div className="text-sm text-gray-900">{formatDateTime(record.old_start_time)}</div>
              <div className="text-xs text-gray-500 mt-0.5">至 {formatTime(record.old_end_time)}</div>
            </div>
            <div className="p-3 rounded-lg bg-green-50 border border-green-100">
              <div className="text-xs text-green-600 font-medium mb-1">新安排</div>
              <div className="text-sm text-gray-900">{formatDateTime(record.new_start_time)}</div>
              <div className="text-xs text-gray-500 mt-0.5">至 {formatTime(record.new_end_time)}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function AttendanceTab({ attendance }: { attendance: AttendanceRecord[] }) {
  if (attendance.length === 0) {
    return <EmptyState message="暂无到场记录" icon={MapPinned} />;
  }
  return (
    <div className="relative pl-6">
      <div className="absolute left-2 top-2 bottom-2 w-px bg-gray-200" />
      {attendance.map((record, idx) => (
        <div key={record.id} className="relative pb-6 last:pb-0">
          <div
            className={cn(
              'absolute -left-4 top-1 w-5 h-5 rounded-full border-4 border-white',
              ATTENDANCE_COLORS[record.status]
            )}
          />
          <div className="card p-4 ml-2">
            <div className="flex items-center justify-between mb-2">
              <span className={cn('badge', ATTENDANCE_COLORS[record.status])}>
                {ATTENDANCE_LABELS[record.status]}
              </span>
              <span className="text-sm text-gray-500">{formatDateTime(record.timestamp)}</span>
            </div>
            {record.notes && (
              <p className="text-sm text-gray-600 mt-2 p-2 rounded bg-gray-50">{record.notes}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function CommunicationsTab({
  communications,
  newMessage,
  setNewMessage,
  onSend,
}: {
  communications: CommunicationRecord[];
  newMessage: string;
  setNewMessage: (v: string) => void;
  onSend: () => void;
}) {
  return (
    <div className="space-y-4">
      {communications.length === 0 ? (
        <EmptyState message="暂无沟通记录" icon={MessageSquare} />
      ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto p-1">
          {communications.map((msg) => (
            <div key={msg.id} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-medium flex-shrink-0">
                {msg.sender?.full_name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-900">
                    {msg.sender?.full_name || '未知用户'}
                  </span>
                  {msg.sender?.role && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                      {ROLE_LABELS[msg.sender.role as any]}
                    </span>
                  )}
                  <span className="text-xs text-gray-400">{formatDateTime(msg.created_at)}</span>
                </div>
                <div className="bg-gray-50 rounded-xl rounded-tl-sm p-3 text-sm text-gray-700">
                  {msg.content}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="pt-4 border-t border-gray-100">
        <div className="flex gap-3">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="添加沟通记录、说明备注..."
            rows={3}
            className="input resize-none flex-1"
          />
          <div className="flex flex-col justify-end">
            <button
              onClick={onSend}
              disabled={!newMessage.trim()}
              className="btn-primary gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={16} />
              发送
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewsTab({
  reviews,
  newReview,
  setNewReview,
  onSubmit,
  hasRole,
}: {
  reviews: ReviewOpinion[];
  newReview: { review_type: string; opinion: string; decision: string; is_approved: boolean | null };
  setNewReview: (v: any) => void;
  onSubmit: () => void;
  hasRole: any;
}) {
  const canReview = hasRole('admin', 'supervisor');
  return (
    <div className="space-y-4">
      {reviews.length === 0 ? (
        <EmptyState message="暂无复核意见" icon={CheckSquare} />
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div key={review.id} className="p-4 rounded-xl border border-gray-200">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-sm font-medium">
                    {review.reviewer?.full_name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {review.reviewer?.full_name || '未知'}
                    </div>
                    <div className="text-xs text-gray-500">{formatDateTime(review.created_at)}</div>
                  </div>
                </div>
                {review.is_approved !== null && (
                  <span
                    className={cn(
                      'badge',
                      review.is_approved
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    )}
                  >
                    {review.is_approved ? <Check size={10} className="inline mr-1" /> : <X size={10} className="inline mr-1" />}
                    {review.decision || (review.is_approved ? '同意' : '驳回')}
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500 mb-1">
                复核类型: {review.review_type === 'conflict_review' ? '冲突复核' : review.review_type === 'reschedule_review' ? '改约复核' : '其他复核'}
              </div>
              <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{review.opinion}</p>
            </div>
          ))}
        </div>
      )}

      {canReview && (
        <div className="pt-4 border-t border-gray-100">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Edit3 size={16} />
            提交复核意见
          </h4>
          <div className="space-y-3">
            <div>
              <label className="label">复核类型</label>
              <select
                value={newReview.review_type}
                onChange={(e) => setNewReview({ ...newReview, review_type: e.target.value })}
                className="input"
              >
                <option value="conflict_review">冲突复核</option>
                <option value="reschedule_review">改约复核</option>
                <option value="quality_review">质量复核</option>
              </select>
            </div>
            <div>
              <label className="label">复核意见</label>
              <textarea
                value={newReview.opinion}
                onChange={(e) => setNewReview({ ...newReview, opinion: e.target.value })}
                placeholder="请输入详细的复核意见..."
                rows={3}
                className="input resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">决定</label>
                <select
                  value={newReview.decision}
                  onChange={(e) => setNewReview({ ...newReview, decision: e.target.value })}
                  className="input"
                >
                  <option value="">请选择</option>
                  <option value="通过">通过</option>
                  <option value="驳回">驳回</option>
                  <option value="待调整">待调整</option>
                </select>
              </div>
              <div>
                <label className="label">是否批准</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setNewReview({ ...newReview, is_approved: true })}
                    className={cn(
                      'flex-1 btn gap-1',
                      newReview.is_approved === true
                        ? 'bg-green-100 text-green-700 border-green-300 border'
                        : 'btn-outline'
                    )}
                  >
                    <Check size={14} />
                    批准
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewReview({ ...newReview, is_approved: false })}
                    className={cn(
                      'flex-1 btn gap-1',
                      newReview.is_approved === false
                        ? 'bg-red-100 text-red-700 border-red-300 border'
                        : 'btn-outline'
                    )}
                  >
                    <X size={14} />
                    驳回
                  </button>
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <button onClick={onSubmit} className="btn-primary">
                提交复核
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  const Icon = icon;
  return (
    <div className="rounded-xl border border-gray-200 p-5">
      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Icon size={18} className="text-gray-500" />
        {title}
      </h3>
      {children}
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-medium text-gray-500 mb-0.5">{label}</div>
      <div className="text-sm text-gray-900">{value}</div>
    </div>
  );
}

function PersonCard({
  label,
  person,
  placeholder,
  accent,
}: {
  label: string;
  person?: User | null;
  placeholder: string;
  accent: string;
}) {
  const accentClasses: Record<string, string> = {
    teal: 'bg-teal-100 text-teal-700',
    purple: 'bg-purple-100 text-purple-700',
  };
  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center font-semibold flex-shrink-0',
          accentClasses[accent]
        )}
      >
        {person ? person.full_name.charAt(0) : '?'}
      </div>
      <div className="min-w-0">
        <div className="text-xs text-gray-500 mb-0.5">{label}</div>
        <div className="text-sm font-medium text-gray-900 truncate">
          {person ? person.full_name : placeholder}
        </div>
        {person?.phone && (
          <div className="text-xs text-gray-500 truncate">{person.phone}</div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ message, icon }: { message: string; icon: React.ElementType }) {
  const Icon = icon;
  return (
    <div className="py-16 text-center">
      <Icon size={40} className="mx-auto text-gray-300 mb-3" />
      <p className="text-gray-400 text-sm">{message}</p>
    </div>
  );
}

function PlayCircle({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <polygon points="10 8 16 12 10 16 10 8" />
    </svg>
  );
}

function RescheduleModal({
  schedule,
  onClose,
  onSuccess,
}: {
  schedule: CleaningSchedule;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    new_start_time: schedule.start_time.slice(0, 16),
    new_end_time: schedule.end_time.slice(0, 16),
    new_cleaner_id: schedule.cleaner_id || undefined,
    reason: 'customer_request' as RescheduleReason,
    reason_detail: '',
  });
  const [cleaners, setCleaners] = useState<User[]>([]);
  const [conflictCheck, setConflictCheck] = useState<any>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await import('@/api').then((m) => m.usersApi.getCleaners());
        setCleaners(res.data);
      } catch {}
    };
    load();
  }, []);

  useEffect(() => {
    const check = async () => {
      if (!form.new_start_time || !form.new_end_time) return;
      setChecking(true);
      try {
        const res = await schedulesApi.checkConflicts({
          apartment_id: schedule.apartment_id,
          cleaner_id: form.new_cleaner_id,
          start_time: new Date(form.new_start_time).toISOString(),
          end_time: new Date(form.new_end_time).toISOString(),
          schedule_id: schedule.id,
        });
        setConflictCheck(res.data);
      } catch {
        setConflictCheck(null);
      } finally {
        setChecking(false);
      }
    };
    check();
  }, [form.new_start_time, form.new_end_time, form.new_cleaner_id]);

  const handleSubmit = async () => {
    try {
      await schedulesApi.reschedule(schedule.id, {
        cleaning_schedule_id: schedule.id,
        old_start_time: schedule.start_time,
        old_end_time: schedule.end_time,
        old_cleaner_id: schedule.cleaner_id,
        new_start_time: new Date(form.new_start_time).toISOString(),
        new_end_time: new Date(form.new_end_time).toISOString(),
        new_cleaner_id: form.new_cleaner_id,
        reason: form.reason,
        reason_detail: form.reason_detail,
      });
      onSuccess();
    } catch (err: any) {
      alert(err?.response?.data?.detail || '改约失败');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 sticky top-0 bg-white">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <RefreshCw size={20} />
            改约申请
          </h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
            <div className="text-xs text-gray-500 mb-1">当前安排</div>
            <div className="text-sm text-gray-900">
              {formatDateTime(schedule.start_time)} - {formatTime(schedule.end_time)}
              {schedule.cleaner && ` · ${schedule.cleaner.full_name}`}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">新开始时间 *</label>
              <input
                type="datetime-local"
                value={form.new_start_time}
                onChange={(e) => setForm({ ...form, new_start_time: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="label">新结束时间 *</label>
              <input
                type="datetime-local"
                value={form.new_end_time}
                onChange={(e) => setForm({ ...form, new_end_time: e.target.value })}
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="label">重新分配保洁员</label>
            <select
              value={form.new_cleaner_id || ''}
              onChange={(e) =>
                setForm({
                  ...form,
                  new_cleaner_id: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              className="input"
            >
              <option value="">（保持不变）</option>
              {cleaners.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name}
                </option>
              ))}
            </select>
          </div>

          {checking ? (
            <div className="p-3 rounded-lg bg-blue-50 text-blue-700 text-sm">
              正在检测冲突...
            </div>
          ) : conflictCheck && (conflictCheck.has_conflict || conflictCheck.capacity_warnings?.length > 0) ? (
            <div className={cn('p-4 rounded-xl border', conflictCheck.has_conflict ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200')}>
              <div className="flex items-start gap-2">
                <AlertTriangle size={18} className={cn('mt-0.5', conflictCheck.has_conflict ? 'text-red-600' : 'text-yellow-600')} />
                <div>
                  <div className="text-sm font-semibold mb-2">
                    {conflictCheck.has_conflict ? '检测到冲突！' : '容量警告'}
                  </div>
                  {conflictCheck.conflicts?.map((c: any, i: number) => (
                    <div key={i} className="text-sm text-red-700 mb-1">
                      • {c.description}
                    </div>
                  ))}
                  {conflictCheck.capacity_warnings?.map((w: string, i: number) => (
                    <div key={i} className="text-sm text-yellow-700 mb-1">
                      ⚠ {w}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-green-50 text-green-700 text-sm flex items-center gap-2">
              <Check size={16} />
              新安排无冲突，容量正常
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">改约原因 *</label>
              <select
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value as RescheduleReason })}
                className="input"
              >
                {Object.entries(RESCHEDULE_REASON_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label">详细说明</label>
            <textarea
              value={form.reason_detail}
              onChange={(e) => setForm({ ...form, reason_detail: e.target.value })}
              placeholder="请说明改约的详细原因..."
              rows={3}
              className="input resize-none"
            />
          </div>
        </div>
        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0 bg-white">
          <button onClick={onClose} className="btn-secondary">
            取消
          </button>
          <button onClick={handleSubmit} className="btn-primary">
            确认改约
          </button>
        </div>
      </div>
    </div>
  );
}
