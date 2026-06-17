import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
  ArrowLeft,
  MapPin,
  User,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Send,
  Image as ImageIcon,
  FileText,
  Settings,
  MessageSquare,
  History,
  AlertCircle,
} from 'lucide-react';
import dayjs from 'dayjs';
import { getWorkOrder, startWorkOrder, completeWorkOrder, reviewWorkOrder, addCommunication } from '@/api/workOrders';
import type { WorkOrder } from '@/types';
import { statusLabels, statusColors, priorityLabels, priorityColors, categoryLabels, categoryColors } from '@/utils/constants';
import { useAuthStore, hasPermission } from '@/hooks/useAuthStore';
import AssignModal from '@/components/AssignModal';
import ReviewModal from '@/components/ReviewModal';
import CompleteModal from '@/components/CompleteModal';

interface Props {
  orderId: number;
}

export default function WorkOrderDetail({ orderId }: Props) {
  const [order, setOrder] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [activeTab, setActiveTab] = useState<'photos' | 'rules' | 'review' | 'communication' | 'logs'>('photos');
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const isManager = user ? hasPermission(user.role, 'manager') : false;
  const isAssignedWorker = user && order?.assigned_to === user.id;

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const data = await getWorkOrder(orderId);
      setOrder(data);
    } catch (err) {
      console.error('获取工单详情失败', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    if (!order) return;
    try {
      const updated = await startWorkOrder(order.id);
      setOrder(updated);
    } catch (err: any) {
      alert('操作失败：' + (err.response?.data?.detail || err.message));
    }
  };

  const handleComplete = async (remark: string) => {
    if (!order) return;
    try {
      const updated = await completeWorkOrder(order.id, { remark });
      setOrder(updated);
      setShowCompleteModal(false);
    } catch (err: any) {
      alert('操作失败：' + (err.response?.data?.detail || err.message));
    }
  };

  const refreshDetail = async () => {
    if (!order) return;
    try {
      const fresh = await getWorkOrder(order.id);
      setOrder(fresh);
      setShowCompleteModal(false);
    } catch (err: any) {
      alert('刷新失败：' + (err.response?.data?.detail || err.message));
    }
  };

  const handleReview = async (isPassed: boolean, comment: string) => {
    if (!order) return;
    try {
      const updated = await reviewWorkOrder(order.id, { is_passed: isPassed, comment });
      setOrder(updated);
      setShowReviewModal(false);
    } catch (err: any) {
      alert('操作失败：' + (err.response?.data?.detail || err.message));
    }
  };

  const handleSendMessage = async () => {
    if (!order || !newMessage.trim()) return;
    setSendingMessage(true);
    try {
      await addCommunication(order.id, newMessage.trim());
      setNewMessage('');
      fetchOrder();
    } catch (err: any) {
      alert('发送失败：' + (err.response?.data?.detail || err.message));
    } finally {
      setSendingMessage(false);
    }
  };

  const isOverdue = () => {
    if (!order?.deadline) return false;
    if (['completed', 'closed'].includes(order.status)) return false;
    return dayjs(order.deadline).isBefore(dayjs());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">工单不存在</p>
      </div>
    );
  }

  const isReviewFailed = order.status === 'review_failed';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate({ to: '/work-orders' })}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900">{order.title}</h1>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                isReviewFailed ? 'bg-red-100 text-red-800 border border-red-300' : statusColors[order.status]
              }`}
            >
              {isReviewFailed && <AlertCircle className="w-3 h-3 mr-1" />}
              {isReviewFailed ? '复核不通过' : statusLabels[order.status]}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">工单号：{order.order_no}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className={`bg-white rounded-xl shadow-sm p-6 border-l-4 ${
            isReviewFailed ? 'border-red-500' : isOverdue() ? 'border-orange-500' : 'border-primary-500'
          }`}>
            {isReviewFailed && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">复核不通过</p>
                  <p className="text-sm text-red-600 mt-1">
                    该工单已被退回 {order.review_failed_count} 次，请根据复核意见重新处理。
                  </p>
                </div>
              </div>
            )}

            {isOverdue() && !isReviewFailed && (
              <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-start">
                <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-orange-800">工单已超时</p>
                  <p className="text-sm text-orange-600 mt-1">
                    已超过处理时限，请尽快处理。
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div>
                <p className="text-xs text-gray-500 mb-1">故障类别</p>
                <div className="flex items-center">
                  <span className={`w-2 h-2 rounded-full mr-2 ${categoryColors[order.category]}`} />
                  <span className="text-sm font-medium text-gray-900">
                    {categoryLabels[order.category]}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">优先级</p>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${priorityColors[order.priority]}`}>
                  {priorityLabels[order.priority]}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">故障位置</p>
                <div className="flex items-center text-sm text-gray-900">
                  <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                  {order.location}
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">指派人员</p>
                <div className="flex items-center text-sm text-gray-900">
                  <User className="w-4 h-4 mr-1 text-gray-400" />
                  {order.assigned_worker_name || '暂未指派'}
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-2">问题描述</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{order.description}</p>
            </div>

            {(order.reporter_name || order.reporter_phone) && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-2">报修人信息</p>
                <div className="flex gap-4 text-sm text-gray-700">
                  {order.reporter_name && <span>姓名：{order.reporter_name}</span>}
                  {order.reporter_phone && <span>电话：{order.reporter_phone}</span>}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                {[
                  { id: 'photos', label: '现场照片', icon: ImageIcon },
                  { id: 'rules', label: '派工规则', icon: Settings },
                  { id: 'review', label: '复核记录', icon: CheckCircle },
                  { id: 'communication', label: '沟通记录', icon: MessageSquare },
                  { id: 'logs', label: '状态流转', icon: History },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <tab.icon className="w-4 h-4 mr-2" />
                    {tab.label}
                    {tab.id === 'review' && order.review_records.length > 0 && (
                      <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-gray-100 rounded-full">
                        {order.review_records.length}
                      </span>
                    )}
                    {tab.id === 'communication' && order.communications.length > 0 && (
                      <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-gray-100 rounded-full">
                        {order.communications.length}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 'photos' && (
                <div>
                  {order.photos.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <ImageIcon className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                      <p className="text-sm">暂无照片</p>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {(() => {
                        const scenePhotos = order.photos.filter((p) => p.photo_type === 'scene' || !p.photo_type);
                        const completionPhotos = order.photos.filter((p) => p.photo_type === 'completion');
                        const otherPhotos = order.photos.filter(
                          (p) => p.photo_type && p.photo_type !== 'scene' && p.photo_type !== 'completion'
                        );

                        const photoGroups: { title: string; photos: typeof order.photos; badge?: string; color?: string }[] = [];
                        if (scenePhotos.length > 0) {
                          photoGroups.push({
                            title: '创建现场照',
                            photos: scenePhotos,
                            badge: '报修时上传',
                            color: 'bg-blue-100 text-blue-700',
                          });
                        }
                        if (completionPhotos.length > 0) {
                          photoGroups.push({
                            title: '处理完成照',
                            photos: completionPhotos,
                            badge: '处理完成时上传',
                            color: 'bg-green-100 text-green-700',
                          });
                        }
                        if (otherPhotos.length > 0) {
                          photoGroups.push({
                            title: '其他照片',
                            photos: otherPhotos,
                            color: 'bg-gray-100 text-gray-700',
                          });
                        }

                        return photoGroups.map((group) => (
                          <div key={group.title}>
                            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                              <h3 className="font-semibold text-gray-800">{group.title}</h3>
                              <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                                {group.photos.length} 张
                              </span>
                              {group.badge && (
                                <span
                                  className={`px-2 py-0.5 text-xs rounded-full ${group.color}`}
                                >
                                  {group.badge}
                                </span>
                              )}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                              {group.photos.map((photo) => (
                                <div key={photo.id} className="relative group">
                                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer"
                                    onClick={() => {
                                      const modal = document.createElement('div');
                                      modal.className = 'fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-8';
                                      modal.innerHTML = `<img src="${photo.url}" alt="" class="max-w-full max-h-full rounded-lg object-contain shadow-2xl" />`;
                                      modal.onclick = () => modal.remove();
                                      document.body.appendChild(modal);
                                    }}
                                  >
                                    <img
                                      src={photo.url}
                                      alt={photo.caption || group.title}
                                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src =
                                          'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect fill="%23e5e7eb" width="100" height="100"/%3E%3Ctext fill="%239ca3af" font-size="12" text-anchor="middle" x="50" y="55"%3E加载失败%3C/text%3E%3C/svg%3E';
                                      }}
                                    />
                                  </div>
                                  {photo.caption && (
                                    <p className="mt-1.5 text-xs text-gray-600 line-clamp-2 leading-relaxed">
                                      {photo.caption}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'rules' && (
                <div>
                  {order.dispatch_rules.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Settings className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                      <p className="text-sm">暂无匹配的派工规则</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {order.dispatch_rules.map((rule) => (
                        <div
                          key={rule.id}
                          className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-gray-900">{rule.name}</h4>
                            {rule.is_active ? (
                              <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded">
                                生效中
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                                已停用
                              </span>
                            )}
                          </div>
                          {rule.description && (
                            <p className="mt-2 text-sm text-gray-600">{rule.description}</p>
                          )}
                          <div className="mt-3 flex gap-4 text-xs text-gray-500">
                            <span>处理时限：{rule.processing_hours} 小时</span>
                            {rule.assigned_role && <span>指定角色：{rule.assigned_role}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'review' && (
                <div>
                  {order.review_records.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                      <p className="text-sm">暂无复核记录</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {order.review_records.map((record) => (
                        <div
                          key={record.id}
                          className={`p-4 rounded-lg border ${
                            record.is_passed
                              ? 'bg-green-50 border-green-200'
                              : 'bg-red-50 border-red-200'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center">
                              {record.is_passed ? (
                                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                              ) : (
                                <XCircle className="w-5 h-5 text-red-500 mr-2" />
                              )}
                              <span
                                className={`font-medium ${
                                  record.is_passed ? 'text-green-800' : 'text-red-800'
                                }`}
                              >
                                {record.is_passed ? '复核通过' : '复核不通过'}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500">
                              {dayjs(record.review_time).format('YYYY-MM-DD HH:mm')}
                            </span>
                          </div>
                          {record.comment && (
                            <p className={`mt-2 text-sm ${record.is_passed ? 'text-green-700' : 'text-red-700'}`}>
                              {record.comment}
                            </p>
                          )}
                          <p className="mt-2 text-xs text-gray-500">
                            复核人：{record.reviewer_name || '未知'}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'communication' && (
                <div className="flex flex-col h-96">
                  <div className="flex-1 overflow-y-auto space-y-4 scrollbar-thin">
                    {order.communications.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <MessageSquare className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                        <p className="text-sm">暂无沟通记录</p>
                      </div>
                    ) : (
                      order.communications.map((comm) => (
                        <div key={comm.id} className="flex gap-3">
                          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-primary-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-900">
                                {comm.sender_name || '未知用户'}
                              </span>
                              <span className="text-xs text-gray-400">
                                {dayjs(comm.created_at).format('MM-DD HH:mm')}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-gray-700">{comm.content}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="输入消息..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={sendingMessage || !newMessage.trim()}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'logs' && (
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
                  <div className="space-y-4">
                    {order.status_logs.map((log, index) => (
                      <div key={log.id} className="relative pl-10">
                        <div className={`absolute left-2 w-4 h-4 rounded-full border-2 ${
                          index === 0 ? 'bg-primary-500 border-primary-500' : 'bg-white border-gray-300'
                        }`} />
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {log.from_status && (
                                <>
                                  <span className={`px-2 py-0.5 text-xs rounded ${statusColors[log.from_status]}`}>
                                    {statusLabels[log.from_status]}
                                  </span>
                                  <span className="text-gray-400">→</span>
                                </>
                              )}
                              <span className={`px-2 py-0.5 text-xs rounded ${statusColors[log.to_status]}`}>
                                {statusLabels[log.to_status]}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500">
                              {dayjs(log.created_at).format('MM-DD HH:mm')}
                            </span>
                          </div>
                          {log.remark && (
                            <p className="mt-2 text-sm text-gray-600">{log.remark}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h3 className="font-semibold text-gray-900 mb-4">处理时限</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">创建时间</span>
                <span className="text-gray-900">{dayjs(order.created_at).format('YYYY-MM-DD HH:mm')}</span>
              </div>
              {order.deadline && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">截止时间</span>
                  <span className={isOverdue() ? 'text-red-600 font-medium' : 'text-gray-900'}>
                    {dayjs(order.deadline).format('YYYY-MM-DD HH:mm')}
                  </span>
                </div>
              )}
              {order.completed_at && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">完成时间</span>
                  <span className="text-gray-900">{dayjs(order.completed_at).format('YYYY-MM-DD HH:mm')}</span>
                </div>
              )}
              {order.closed_at && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">结案时间</span>
                  <span className="text-gray-900">{dayjs(order.closed_at).format('YYYY-MM-DD HH:mm')}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">首次解决</span>
                <span className={order.is_first_time_resolved ? 'text-green-600' : 'text-orange-600'}>
                  {order.is_first_time_resolved ? '是' : `否（${order.review_failed_count}次退回）`}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5">
            <h3 className="font-semibold text-gray-900 mb-4">操作</h3>
            <div className="space-y-3">
              {isManager && order.status === 'pending' && (
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="w-full flex items-center justify-center px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <User className="w-4 h-4 mr-2" />
                  指派工单
                </button>
              )}

              {isAssignedWorker && ['assigned', 'review_failed'].includes(order.status) && (
                <button
                  onClick={handleStart}
                  className="w-full flex items-center justify-center px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  开始处理
                </button>
              )}

              {isAssignedWorker && order.status === 'in_progress' && (
                <button
                  onClick={() => setShowCompleteModal(true)}
                  className="w-full flex items-center justify-center px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  处理完成
                </button>
              )}

              {isManager && order.status === 'reviewing' && (
                <button
                  onClick={() => setShowReviewModal(true)}
                  className="w-full flex items-center justify-center px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  进行复核
                </button>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5">
            <h3 className="font-semibold text-gray-900 mb-4">统计信息</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-gray-900">{order.status_logs.length}</p>
                <p className="text-xs text-gray-500 mt-1">状态变更</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-gray-900">{order.review_records.length}</p>
                <p className="text-xs text-gray-500 mt-1">复核次数</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-gray-900">{order.communications.length}</p>
                <p className="text-xs text-gray-500 mt-1">沟通消息</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-gray-900">{order.photos.length}</p>
                <p className="text-xs text-gray-500 mt-1">照片数量</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showAssignModal && (
        <AssignModal
          order={order}
          onClose={() => setShowAssignModal(false)}
          onAssigned={fetchOrder}
        />
      )}

      {showReviewModal && (
        <ReviewModal
          order={order}
          onClose={() => setShowReviewModal(false)}
          onReviewed={fetchOrder}
        />
      )}

      {showCompleteModal && (
        <CompleteModal
          orderId={order!.id}
          onClose={() => setShowCompleteModal(false)}
          onCompleted={refreshDetail}
        />
      )}
    </div>
  );
}
