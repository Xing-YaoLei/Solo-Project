import { useEffect, useState } from 'react';
import { Search, Plus, AlertTriangle, MessageSquare, FileCheck, Clock, User, ChevronRight, X } from 'lucide-react';
import api from '@/lib/api';
import { cn, formatDateTime, getStatusText, getStatusClass, getRiskLevelClass, getRiskLevelText } from '@/lib/utils';
import { useAuthStore } from '@/store/auth';

interface Conflict {
  id: number;
  conflictNo: string;
  conflictType: string;
  description: string;
  riskLevel: string;
  status: string;
  resolution: string | null;
  createdAt: string;
  resolvedAt: string | null;
  property: { name: string };
  room: { roomNumber: string; roomType: string } | null;
  order: { orderNo: string; guestName: string } | null;
  createdBy: { id: number; fullName: string } | null;
  handledBy: { id: number; fullName: string } | null;
  _count: { communications: number; reviewRecords: number };
}

interface Communication {
  id: number;
  message: string;
  createdAt: string;
  user: { id: number; fullName: string; role: string; avatarUrl: string | null };
}

interface ReviewRecord {
  id: number;
  reviewType: string;
  opinion: string;
  isApproved: boolean | null;
  createdAt: string;
  user: { id: number; fullName: string; role: string };
}

interface ConflictDetail extends Conflict {
  communications: Communication[];
  reviewRecords: ReviewRecord[];
}

export default function ConflictsPage() {
  const { user } = useAuthStore();
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [total, setTotal] = useState(0);
  const [highRiskCount, setHighRiskCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConflict, setSelectedConflict] = useState<ConflictDetail | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewType, setReviewType] = useState('');
  const [reviewOpinion, setReviewOpinion] = useState('');
  const [reviewApproved, setReviewApproved] = useState<boolean | null>(null);

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    fetchConflicts();
  }, [page, keyword, statusFilter, riskFilter, propertyId]);

  const fetchProperties = async () => {
    try {
      const res = await api.get('/properties?pageSize=100');
      setProperties(res.data.list || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchConflicts = async () => {
    setLoading(true);
    try {
      const params: any = { page, pageSize };
      if (keyword) params.keyword = keyword;
      if (statusFilter) params.status = statusFilter;
      if (riskFilter) params.riskLevel = riskFilter;
      if (propertyId) params.propertyId = propertyId;

      const res = await api.get('/conflicts', { params });
      setConflicts(res.data.list || []);
      setTotal(res.data.total || 0);
      setHighRiskCount(res.data.highRiskCount || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const viewConflict = async (conflict: Conflict) => {
    try {
      const res = await api.get(`/conflicts/${conflict.id}`);
      setSelectedConflict(res.data);
      setShowDetail(true);
    } catch (e) {
      console.error(e);
    }
  };

  const sendMessage = async () => {
    if (!selectedConflict || !newMessage.trim()) return;
    try {
      const res = await api.post(`/conflicts/${selectedConflict.id}/communications`, {
        message: newMessage,
      });
      setSelectedConflict({
        ...selectedConflict,
        communications: [res.data, ...selectedConflict.communications],
      });
      setNewMessage('');
    } catch (e) {
      alert('发送失败');
    }
  };

  const submitReview = async () => {
    if (!selectedConflict || !reviewType || !reviewOpinion) return;
    try {
      const res = await api.post(`/conflicts/${selectedConflict.id}/reviews`, {
        reviewType,
        opinion: reviewOpinion,
        isApproved: reviewApproved,
      });
      setSelectedConflict({
        ...selectedConflict,
        reviewRecords: [res.data, ...selectedConflict.reviewRecords],
      });
      setShowReviewModal(false);
      setReviewType('');
      setReviewOpinion('');
      setReviewApproved(null);
    } catch (e) {
      alert('提交失败');
    }
  };

  const updateStatus = async (status: string) => {
    if (!selectedConflict) return;
    try {
      await api.patch(`/conflicts/${selectedConflict.id}/status`, {
        status,
        resolution: selectedConflict.resolution,
      });
      fetchConflicts();
      viewConflict(selectedConflict as any);
    } catch (e) {
      alert('操作失败');
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  const isManager = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索冲突编号、描述..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="input pl-10 w-72"
            />
          </div>
          <select
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
            className="input w-40"
          >
            <option value="">全部房源</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input w-36"
          >
            <option value="">全部状态</option>
            <option value="OPEN">待处理</option>
            <option value="IN_PROGRESS">处理中</option>
            <option value="RESOLVED">已解决</option>
            <option value="CLOSED">已关闭</option>
          </select>
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="input w-36"
          >
            <option value="">全部风险</option>
            <option value="CRITICAL">紧急</option>
            <option value="HIGH">高风险</option>
            <option value="MEDIUM">中风险</option>
            <option value="LOW">低风险</option>
          </select>
        </div>
        <button className="btn btn-primary flex items-center gap-1">
          <Plus className="w-4 h-4" />
          新建冲突
        </button>
      </div>

      <div className="grid grid-cols-5 gap-4">
        <div className="card p-4">
          <div className="text-sm text-gray-500">待处理</div>
          <div className="text-2xl font-bold text-yellow-600 mt-1">-</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-gray-500">处理中</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">-</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-gray-500">已解决</div>
          <div className="text-2xl font-bold text-green-600 mt-1">-</div>
        </div>
        <div className="card p-4 border-l-4 border-l-red-500">
          <div className="text-sm text-gray-500">高风险冲突</div>
          <div className="text-2xl font-bold text-red-600 mt-1 flex items-center gap-2">
            {highRiskCount}
            {highRiskCount > 0 && (
              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full animate-pulse">
                紧急
              </span>
            )}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-gray-500">冲突总数</div>
          <div className="text-2xl font-bold text-gray-800 mt-1">{total}</div>
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">加载中...</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {conflicts.length === 0 ? (
              <div className="px-4 py-12 text-center text-gray-400">
                暂无冲突记录
              </div>
            ) : (
              conflicts.map((conflict) => (
                <div
                  key={conflict.id}
                  onClick={() => viewConflict(conflict)}
                  className={cn(
                    'p-4 cursor-pointer transition-colors hover:bg-gray-50',
                    getRiskLevelClass(conflict.riskLevel)
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className={cn(
                          'w-5 h-5 flex-shrink-0',
                          conflict.riskLevel === 'CRITICAL' || conflict.riskLevel === 'HIGH'
                            ? 'text-red-500'
                            : 'text-yellow-500'
                        )} />
                        <span className="font-medium text-gray-800">
                          {conflict.conflictType}
                        </span>
                        <span className={cn('badge', getRiskLevelClass(conflict.riskLevel).includes('critical') ? 'bg-red-200 text-red-800' : '')}>
                          {getRiskLevelText(conflict.riskLevel)}
                        </span>
                        <span className={cn('badge', getStatusClass(conflict.status, 'conflict'))}>
                          {getStatusText(conflict.status, 'conflict')}
                        </span>
                        <span className="text-sm text-gray-500">
                          {conflict.conflictNo}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2 ml-8">
                        {conflict.description}
                      </p>
                      <div className="flex items-center gap-6 mt-3 ml-8 text-xs text-gray-500">
                        <span>
                          房源：{conflict.property?.name}
                          {conflict.room && ` · ${conflict.room.roomNumber}`}
                        </span>
                        {conflict.order && (
                          <span>订单：{conflict.order.orderNo}</span>
                        )}
                        <span>
                          创建：{conflict.createdBy?.fullName || '系统'}
                        </span>
                        <span>{formatDateTime(conflict.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-4 mt-2 ml-8 text-xs">
                        <span className="flex items-center gap-1 text-gray-500">
                          <MessageSquare className="w-3.5 h-3.5" />
                          {conflict._count?.communications || 0} 条沟通
                        </span>
                        <span className="flex items-center gap-1 text-gray-500">
                          <FileCheck className="w-3.5 h-3.5" />
                          {conflict._count?.reviewRecords || 0} 条复核
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              共 {total} 条，第 {page}/{totalPages} 页
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
              >
                上一页
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>

      {showDetail && selectedConflict && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <AlertTriangle className={cn(
                  'w-6 h-6',
                  selectedConflict.riskLevel === 'CRITICAL' || selectedConflict.riskLevel === 'HIGH'
                    ? 'text-red-500'
                    : 'text-yellow-500'
                )} />
                <h3 className="text-lg font-semibold text-gray-800">
                  {selectedConflict.conflictType}
                </h3>
                <span className={cn('badge',
                  selectedConflict.riskLevel === 'CRITICAL' ? 'bg-red-200 text-red-800 animate-pulse' :
                  selectedConflict.riskLevel === 'HIGH' ? 'bg-red-100 text-red-700' :
                  selectedConflict.riskLevel === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                )}>
                  {getRiskLevelText(selectedConflict.riskLevel)}
                </span>
                <span className={cn('badge', getStatusClass(selectedConflict.status, 'conflict'))}>
                  {getStatusText(selectedConflict.status, 'conflict')}
                </span>
              </div>
              <button
                onClick={() => setShowDetail(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div className="card p-4">
                    <h4 className="font-medium text-gray-800 mb-3">基本信息</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">冲突编号</span>
                        <span className="text-gray-800">{selectedConflict.conflictNo}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">房源</span>
                        <span className="text-gray-800">{selectedConflict.property?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">房间</span>
                        <span className="text-gray-800">
                          {selectedConflict.room?.roomNumber || '未指定'}
                        </span>
                      </div>
                      {selectedConflict.order && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">关联订单</span>
                          <span className="text-gray-800">
                            {selectedConflict.order.orderNo}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-500">创建人</span>
                        <span className="text-gray-800">
                          {selectedConflict.createdBy?.fullName || '系统'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">创建时间</span>
                        <span className="text-gray-800">
                          {formatDateTime(selectedConflict.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="card p-4">
                    <h4 className="font-medium text-gray-800 mb-2">问题描述</h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                      {selectedConflict.description}
                    </p>
                  </div>

                  {selectedConflict.resolution && (
                    <div className="card p-4 border-l-4 border-l-green-500">
                      <h4 className="font-medium text-gray-800 mb-2">解决方案</h4>
                      <p className="text-sm text-gray-600">{selectedConflict.resolution}</p>
                    </div>
                  )}

                  {isManager && selectedConflict.status !== 'RESOLVED' && selectedConflict.status !== 'CLOSED' && (
                    <div className="flex gap-2">
                      {selectedConflict.status === 'OPEN' && (
                        <button
                          onClick={() => updateStatus('IN_PROGRESS')}
                          className="btn btn-primary flex-1"
                        >
                          开始处理
                        </button>
                      )}
                      {selectedConflict.status === 'IN_PROGRESS' && (
                        <button
                          onClick={() => {
                            const resolution = prompt('请输入解决方案');
                            if (resolution) {
                              selectedConflict.resolution = resolution;
                              updateStatus('RESOLVED');
                            }
                          }}
                          className="btn btn-success flex-1"
                          style={{ backgroundColor: '#22c55e', color: 'white' }}
                        >
                          标记解决
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <div className="card flex flex-col h-96">
                    <div className="flex items-center justify-between p-4 border-b border-gray-200">
                      <h4 className="font-medium text-gray-800 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        沟通过程
                      </h4>
                      <span className="text-xs text-gray-500">
                        {selectedConflict.communications.length} 条记录
                      </span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {selectedConflict.communications.length === 0 ? (
                        <div className="text-center text-gray-400 py-8">
                          暂无沟通记录
                        </div>
                      ) : (
                        selectedConflict.communications.map((msg) => (
                          <div key={msg.id} className="flex gap-3">
                            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <User className="w-4 h-4 text-primary-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-800">
                                  {msg.user.fullName}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {msg.user.role === 'ADMIN' ? '管理员' :
                                   msg.user.role === 'MANAGER' ? '经理' : '一线人员'}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {formatDateTime(msg.createdAt)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mt-1 bg-gray-50 p-2 rounded">
                                {msg.message}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="p-3 border-t border-gray-200">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                          placeholder="输入沟通内容..."
                          className="input flex-1 text-sm"
                        />
                        <button
                          onClick={sendMessage}
                          className="btn btn-primary text-sm"
                        >
                          发送
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="card">
                    <div className="flex items-center justify-between p-4 border-b border-gray-200">
                      <h4 className="font-medium text-gray-800 flex items-center gap-2">
                        <FileCheck className="w-4 h-4" />
                        复核意见
                      </h4>
                      {isManager && (
                        <button
                          onClick={() => setShowReviewModal(true)}
                          className="text-sm text-primary-600 hover:text-primary-700"
                        >
                          + 添加复核
                        </button>
                      )}
                    </div>
                    <div className="p-4 max-h-48 overflow-y-auto space-y-3">
                      {selectedConflict.reviewRecords.length === 0 ? (
                        <div className="text-center text-gray-400 py-4 text-sm">
                          暂无复核意见
                        </div>
                      ) : (
                        selectedConflict.reviewRecords.map((review) => (
                          <div key={review.id} className="bg-gray-50 p-3 rounded">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-gray-800">
                                {review.reviewType}
                              </span>
                              <span className={cn(
                                'text-xs px-2 py-0.5 rounded-full',
                                review.isApproved === true ? 'bg-green-100 text-green-700' :
                                review.isApproved === false ? 'bg-red-100 text-red-700' :
                                'bg-gray-100 text-gray-700'
                              )}>
                                {review.isApproved === true ? '同意' :
                                 review.isApproved === false ? '不同意' : '备注'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">{review.opinion}</p>
                            <div className="text-xs text-gray-400 mt-2">
                              {review.user.fullName} · {formatDateTime(review.createdAt)}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showReviewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">添加复核意见</h3>
              <button
                onClick={() => setShowReviewModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm text-gray-700">复核类型</label>
                <select
                  value={reviewType}
                  onChange={(e) => setReviewType(e.target.value)}
                  className="input mt-1"
                >
                  <option value="">请选择</option>
                  <option value="房态复核">房态复核</option>
                  <option value="价格复核">价格复核</option>
                  <option value="订单复核">订单复核</option>
                  <option value="其他">其他</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-700">复核意见</label>
                <textarea
                  value={reviewOpinion}
                  onChange={(e) => setReviewOpinion(e.target.value)}
                  className="input mt-1"
                  rows={4}
                  placeholder="请输入复核意见"
                />
              </div>
              <div>
                <label className="text-sm text-gray-700">复核结论</label>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => setReviewApproved(true)}
                    className={cn(
                      'flex-1 py-2 rounded-md border text-sm',
                      reviewApproved === true
                        ? 'bg-green-50 border-green-500 text-green-700'
                        : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                    )}
                  >
                    同意
                  </button>
                  <button
                    onClick={() => setReviewApproved(false)}
                    className={cn(
                      'flex-1 py-2 rounded-md border text-sm',
                      reviewApproved === false
                        ? 'bg-red-50 border-red-500 text-red-700'
                        : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                    )}
                  >
                    不同意
                  </button>
                  <button
                    onClick={() => setReviewApproved(null)}
                    className={cn(
                      'flex-1 py-2 rounded-md border text-sm',
                      reviewApproved === null
                        ? 'bg-gray-100 border-gray-500 text-gray-700'
                        : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                    )}
                  >
                    仅备注
                  </button>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  取消
                </button>
                <button
                  onClick={submitReview}
                  disabled={!reviewType || !reviewOpinion}
                  className="btn btn-primary flex-1 disabled:opacity-50"
                >
                  提交
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
