import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { stockAlertApi } from '@/api/stockAlertApi';
import { communicationApi } from '@/api/communicationApi';
import { reviewApi } from '@/api/reviewApi';
import type { StockAlert, CommunicationLog, ReviewOpinion } from '@/types';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import Loading from '@/components/ui/Loading';
import { useAuthStore } from '@/store/authStore';

const StockAlerts: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAcknowledged, setShowAcknowledged] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCommunicationModal, setShowCommunicationModal] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<StockAlert | null>(null);
  const [communicationMessage, setCommunicationMessage] = useState('');
  const [reviewOpinion, setReviewOpinion] = useState('');
  const [isApproved, setIsApproved] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await stockAlertApi.getStockAlerts(showAcknowledged ? undefined : false);
      setAlerts(res.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [showAcknowledged]);

  const handleAcknowledge = async (id: string) => {
    await stockAlertApi.acknowledgeAlert(id);
    fetchAlerts();
  };

  const handleAddCommunication = async () => {
    if (!selectedAlert || !communicationMessage.trim()) return;
    try {
      await communicationApi.createLog({
        stockAlertId: selectedAlert.id,
        message: communicationMessage,
        fromUserId: user?.id,
      });
      setShowCommunicationModal(false);
      setCommunicationMessage('');
      const res = await stockAlertApi.getStockAlertById(selectedAlert.id);
      setAlerts((prev) => prev.map((a) => (a.id === selectedAlert.id ? res.data : a)));
    } catch (err: any) {
      alert(err.response?.data?.message || '保存失败');
    }
  };

  const handleAddReview = async () => {
    if (!selectedAlert || !reviewOpinion.trim()) return;
    try {
      await reviewApi.addReviewOpinion({
        stockAlertId: selectedAlert.id,
        opinion: reviewOpinion,
        isApproved,
        reviewerUserId: user?.id,
      });
      setShowReviewModal(false);
      setReviewOpinion('');
      const res = await stockAlertApi.getStockAlertById(selectedAlert.id);
      setAlerts((prev) => prev.map((a) => (a.id === selectedAlert.id ? res.data : a)));
    } catch (err: any) {
      alert(err.response?.data?.message || '保存失败');
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">库存预警</h2>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={showAcknowledged}
            onChange={(e) => setShowAcknowledged(e.target.checked)}
            className="rounded"
          />
          显示已确认
        </label>
      </div>

      {alerts.length === 0 ? (
        <EmptyState description="暂无库存预警" />
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="bg-white rounded-lg shadow overflow-hidden"
            >
              <div
                className="p-5 cursor-pointer"
                onClick={() => setExpandedId(expandedId === alert.id ? null : alert.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">{alert.partName}</h3>
                      <p className="text-sm text-gray-500 mt-1">配件编号: {alert.partNumber}</p>
                    </div>
                    <StatusBadge status={alert.riskLevel} type="risk" />
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        alert.isAcknowledged
                          ? 'bg-gray-100 text-gray-600'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {alert.isAcknowledged ? '已确认' : '待确认'}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      {dayjs(alert.createdAt).format('YYYY-MM-DD HH:mm')}
                    </p>
                    <svg
                      className={`w-5 h-5 text-gray-400 mt-2 ml-auto transition-transform ${
                        expandedId === alert.id ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                <p className="text-gray-700 mt-3">{alert.alertMessage}</p>
              </div>

              {expandedId === alert.id && (
                <div className="border-t px-5 py-4 bg-gray-50 space-y-4">
                  {!alert.isAcknowledged && (
                    <div className="flex gap-3">
                      <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAcknowledge(alert.id);
                      }}
                      className="px-4 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition-colors"
                    >
                      确认预警
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAlert(alert);
                        setShowReviewModal(true);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
                    >
                      添加审核意见
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAlert(alert);
                        setShowCommunicationModal(true);
                      }}
                      className="px-4 py-2 bg-gray-600 text-white font-medium rounded-md hover:bg-gray-700 transition-colors"
                    >
                      新增沟通
                    </button>
                  </div>
                  )}

                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">沟通过程</h4>
                    {alert.communicationLogs?.length === 0 ? (
                      <p className="text-sm text-gray-500">暂无沟通记录</p>
                    ) : (
                      <div className="relative pl-6">
                        <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gray-200" />
                        {alert.communicationLogs?.map((log: CommunicationLog, idx: number) => (
                          <div key={log.id} className="relative pb-4">
                            <div className="absolute -left-6 top-1.5 w-3 h-3 rounded-full bg-blue-500" />
                            <div className="bg-white p-3 rounded-lg border">
                              <div className="flex justify-between mb-1">
                                <span className="font-medium text-sm">{log.fromUserName}</span>
                                <span className="text-xs text-gray-500">
                                  {dayjs(log.sentAt).format('YYYY-MM-DD HH:mm')}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700">{log.message}</p>
                            </div>
                            {idx < (alert.communicationLogs?.length || 0) - 1 && (
                              <div className="absolute left-2 top-6 bottom-0 w-0.5 bg-gray-200" />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">审核意见</h4>
                    {alert.reviewOpinions?.length === 0 ? (
                      <p className="text-sm text-gray-500">暂无审核意见</p>
                    ) : (
                      <div className="space-y-2">
                        {alert.reviewOpinions?.map((opinion: ReviewOpinion) => (
                        <div key={opinion.id} className="bg-white p-3 rounded-lg border">
                          <div className="flex justify-between mb-1">
                            <span className="font-medium text-sm">{opinion.reviewerUserName}</span>
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-xs px-2 py-0.5 rounded ${
                                  opinion.isApproved ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}
                              >
                                {opinion.isApproved ? '同意' : '不同意'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {dayjs(opinion.reviewedAt).format('YYYY-MM-DD HH:mm')}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-700">{opinion.opinion}</p>
                        </div>
                      ))}
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showCommunicationModal && (
        <Modal
          title="新增沟通记录"
          onClose={() => setShowCommunicationModal(false)}
          footer={
            <>
              <button
                onClick={() => setShowCommunicationModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleAddCommunication}
                className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
              >
                发送
              </button>
            </>
          }
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">沟通内容</label>
            <textarea
              value={communicationMessage}
              onChange={(e) => setCommunicationMessage(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="请输入沟通内容..."
            />
          </div>
        </Modal>
      )}

      {showReviewModal && (
        <Modal
          title="添加审核意见"
          onClose={() => setShowReviewModal(false)}
          footer={
            <>
              <button
                onClick={() => setShowReviewModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleAddReview}
                className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
              >
                提交
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">审核结果</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={isApproved}
                    onChange={() => setIsApproved(true)}
                  />
                  <span className="text-sm">同意</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={!isApproved}
                    onChange={() => setIsApproved(false)}
                  />
                  <span className="text-sm">不同意</span>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">意见内容</label>
              <textarea
                value={reviewOpinion}
                onChange={(e) => setReviewOpinion(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="请输入审核意见..."
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default StockAlerts;
