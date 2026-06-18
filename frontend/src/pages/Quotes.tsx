import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { quoteApi } from '@/api/quoteApi';
import { workOrderApi } from '@/api/workOrderApi';
import { reviewApi } from '@/api/reviewApi';
import { communicationApi } from '@/api/communicationApi';
import type { Quote, QuoteItem, QuoteStatus, WorkOrder, ReviewOpinion, CommunicationLog } from '@/types';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import Loading from '@/components/ui/Loading';
import { useAuthStore } from '@/store/authStore';

interface QuoteItemForm {
  id?: string;
  itemName: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  laborCost: number;
  isPart: boolean;
  partId?: string;
}

const emptyQuoteItem: QuoteItemForm = {
  itemName: '',
  description: '',
  quantity: 1,
  unitPrice: 0,
  laborCost: 0,
  isPart: true,
};

const Quotes: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [newQuote, setNewQuote] = useState({
    workOrderId: '',
    customerNotes: '',
    internalNotes: '',
    discount: 0,
    tax: 0,
    items: [{ ...emptyQuoteItem }],
  });
  const [newCommunication, setNewCommunication] = useState('');
  const [newReview, setNewReview] = useState('');
  const [isApproved, setIsApproved] = useState(true);
  const [showCommunicationModal, setShowCommunicationModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  const fetchQuotes = async () => {
    setLoading(true);
    try {
      const [qRes, wRes] = await Promise.all([
        quoteApi.getQuotes(),
        workOrderApi.getWorkOrders(),
      ]);
      setQuotes(qRes.data || []);
      setWorkOrders(wRes.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, []);

  const addQuoteItem = () => {
    setNewQuote({ ...newQuote, items: [...newQuote.items, { ...emptyQuoteItem }] });
  };

  const updateQuoteItem = (index: number, field: keyof QuoteItemForm, value: any) => {
    const items = [...newQuote.items];
    (items[index] as any)[field] = value;
    setNewQuote({ ...newQuote, items });
  };

  const removeQuoteItem = (index: number) => {
    const items = newQuote.items.filter((_, i) => i !== index);
    setNewQuote({ ...newQuote, items: items.length ? items : [{ ...emptyQuoteItem }] });
  };

  const calculateTotals = () => {
    let partsTotal = 0;
    let laborTotal = 0;
    newQuote.items.forEach((item) => {
      if (item.isPart) {
        partsTotal += item.quantity * item.unitPrice;
      }
      laborTotal += item.quantity * item.laborCost;
    });
    const subtotal = partsTotal + laborTotal;
    const discount = newQuote.discount;
    const tax = (subtotal - discount) * (newQuote.tax / 100);
    const grandTotal = subtotal - discount + tax;
    return { partsTotal, laborTotal, subtotal, discount, tax, grandTotal };
  };

  const handleCreateQuote = async () => {
    if (!newQuote.workOrderId || newQuote.items.length === 0) {
      alert('请选择工单并添加报价项目');
      return;
    }
    try {
      const totals = calculateTotals();
      const data = {
        ...newQuote,
        items: newQuote.items.map(({ id, ...rest }) => rest),
        partsTotal: totals.partsTotal,
        laborTotal: totals.laborTotal,
        grandTotal: totals.grandTotal,
      };
      await quoteApi.createQuote(data);
      setShowCreateModal(false);
      setNewQuote({
        workOrderId: '',
        customerNotes: '',
        internalNotes: '',
        discount: 0,
        tax: 0,
        items: [{ ...emptyQuoteItem }],
      });
      fetchQuotes();
    } catch (err: any) {
      alert(err.response?.data?.message || '创建失败');
    }
  };

  const handleViewDetail = async (quoteId: string) => {
    const res = await quoteApi.getQuoteById(quoteId);
    setSelectedQuote(res.data);
    setShowDetailModal(true);
  };

  const handleApprove = async (quoteId: string, approved: boolean) => {
    const status: QuoteStatus = approved ? 'Approved' : 'Rejected';
    await quoteApi.updateQuoteStatus(quoteId, status);
    fetchQuotes();
    if (selectedQuote?.id === quoteId) {
      const res = await quoteApi.getQuoteById(quoteId);
      setSelectedQuote(res.data);
    }
  };

  const handleAddCommunication = async () => {
    if (!selectedQuote || !newCommunication.trim()) return;
    try {
      await communicationApi.createLog({
        quoteId: selectedQuote.id,
        message: newCommunication,
        fromUserId: user?.id,
      });
      setShowCommunicationModal(false);
      setNewCommunication('');
      const res = await quoteApi.getQuoteById(selectedQuote.id);
      setSelectedQuote(res.data);
    } catch (err: any) {
      alert(err.response?.data?.message || '保存失败');
    }
  };

  const handleAddReview = async () => {
    if (!selectedQuote || !newReview.trim()) return;
    try {
      await reviewApi.addReviewOpinion({
        quoteId: selectedQuote.id,
        opinion: newReview,
        isApproved,
        reviewerUserId: user?.id,
      });
      setShowReviewModal(false);
      setNewReview('');
      const res = await quoteApi.getQuoteById(selectedQuote.id);
      setSelectedQuote(res.data);
    } catch (err: any) {
      alert(err.response?.data?.message || '保存失败');
    }
  };

  const totals = calculateTotals();

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">报价单</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          + 新增报价单
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {quotes.length === 0 ? (
          <EmptyState description="暂无报价单" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">报价单号</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">关联工单号</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">创建人</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">配件总额</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">人工总额</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">折扣</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">税费</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">总计</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">创建时间</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {quotes.map((quote) => (
                  <tr key={quote.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{quote.quoteNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{quote.workOrderNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{quote.createdByUserName}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={quote.status} type="quote" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">¥{quote.partsTotal.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">¥{quote.laborTotal.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">-¥{quote.discount.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">¥{quote.tax.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900">¥{quote.grandTotal.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {dayjs(quote.createdAt).format('YYYY-MM-DD HH:mm')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button onClick={() => handleViewDetail(quote.id)} className="text-blue-600 hover:text-blue-800">查看</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreateModal && (
        <Modal
          title="新增报价单"
          onClose={() => setShowCreateModal(false)}
          footer={
            <>
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreateQuote}
                className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
              >
                保存
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">选择工单 *</label>
              <select
                value={newQuote.workOrderId}
                onChange={(e) => setNewQuote({ ...newQuote, workOrderId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="">请选择工单</option>
                {workOrders.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.orderNumber} - {w.vehicleLicensePlate}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">报价项目</label>
                <button
                  onClick={addQuoteItem}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  + 添加项目
                </button>
              </div>
              <div className="space-y-3">
                {newQuote.items.map((item, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={item.isPart}
                          onChange={(e) => updateQuoteItem(index, 'isPart', e.target.checked)}
                          className="rounded"
                        />
                        配件项目
                      </label>
                      {newQuote.items.length > 1 && (
                        <button
                          onClick={() => removeQuoteItem(index)}
                          className="text-sm text-red-600 hover:text-red-800"
                        >
                          删除
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <input
                          type="text"
                          placeholder="项目名称 *"
                          value={item.itemName}
                          onChange={(e) => updateQuoteItem(index, 'itemName', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          placeholder="数量"
                          value={item.quantity}
                          onChange={(e) => updateQuoteItem(index, 'quantity', Number(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          step="0.01"
                          placeholder={item.isPart ? '单价' : '单价(0)'}
                          value={item.unitPrice}
                          onChange={(e) => updateQuoteItem(index, 'unitPrice', Number(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="人工费"
                          value={item.laborCost}
                          onChange={(e) => updateQuoteItem(index, 'laborCost', Number(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="text"
                          placeholder="描述"
                          value={item.description}
                          onChange={(e) => updateQuoteItem(index, 'description', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">折扣金额</label>
                <input
                  type="number"
                  step="0.01"
                  value={newQuote.discount}
                  onChange={(e) => setNewQuote({ ...newQuote, discount: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">税率(%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newQuote.tax}
                  onChange={(e) => setNewQuote({ ...newQuote, tax: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span>配件总额：</span><span>¥{totals.partsTotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>人工总额：</span><span>¥{totals.laborTotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>小计：</span><span>¥{totals.subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>折扣：</span><span>-¥{totals.discount.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>税费：</span><span>¥{totals.tax.toFixed(2)}</span></div>
              <div className="flex justify-between font-semibold text-base border-t pt-2"><span>总计：</span><span>¥{totals.grandTotal.toFixed(2)}</span></div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">客户备注</label>
              <textarea
                value={newQuote.customerNotes}
                onChange={(e) => setNewQuote({ ...newQuote, customerNotes: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">内部备注</label>
              <textarea
                value={newQuote.internalNotes}
                onChange={(e) => setNewQuote({ ...newQuote, internalNotes: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>
        </Modal>
      )}

      {showDetailModal && selectedQuote && (
        <Modal
          title={`报价单详情 - ${selectedQuote.quoteNumber}`}
          onClose={() => setShowDetailModal(false)}
        >
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">报价单号：</span><span className="font-medium">{selectedQuote.quoteNumber}</span></div>
              <div><span className="text-gray-500">状态：</span><StatusBadge status={selectedQuote.status} type="quote" /></div>
              <div><span className="text-gray-500">关联工单：</span><span>{selectedQuote.workOrderNumber}</span></div>
              <div><span className="text-gray-500">创建人：</span><span>{selectedQuote.createdByUserName}</span></div>
            </div>

            {selectedQuote.status === 'PendingApproval' && (
              <div className="flex gap-3">
                <button
                  onClick={() => handleApprove(selectedQuote.id, true)}
                  className="px-4 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition-colors"
                >
                  批准
                </button>
                <button
                  onClick={() => handleApprove(selectedQuote.id, false)}
                  className="px-4 py-2 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 transition-colors"
                >
                  拒绝
                </button>
                <button
                  onClick={() => setShowReviewModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
                >
                  添加审核意见
                </button>
                <button
                  onClick={() => setShowCommunicationModal(true)}
                  className="px-4 py-2 bg-gray-600 text-white font-medium rounded-md hover:bg-gray-700 transition-colors"
                >
                  新增沟通
                </button>
              </div>
            )}

            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span>配件总额：</span><span>¥{selectedQuote.partsTotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>人工总额：</span><span>¥{selectedQuote.laborTotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>折扣：</span><span>-¥{selectedQuote.discount.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>税费：</span><span>¥{selectedQuote.tax.toFixed(2)}</span></div>
              <div className="flex justify-between font-semibold text-base border-t pt-2"><span>总计：</span><span>¥{selectedQuote.grandTotal.toFixed(2)}</span></div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">报价项目</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">类型</th>
                      <th className="px-3 py-2 text-left">名称</th>
                      <th className="px-3 py-2 text-right">数量</th>
                      <th className="px-3 py-2 text-right">单价</th>
                      <th className="px-3 py-2 text-right">人工费</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {selectedQuote.items.map((item: QuoteItem) => (
                      <tr key={item.id}>
                        <td className="px-3 py-2">{item.isPart ? '配件' : '人工'}</td>
                        <td className="px-3 py-2">{item.itemName}</td>
                        <td className="px-3 py-2 text-right">{item.quantity}</td>
                        <td className="px-3 py-2 text-right">¥{item.unitPrice.toFixed(2)}</td>
                        <td className="px-3 py-2 text-right">¥{item.laborCost.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {selectedQuote.customerNotes && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">客户备注</h4>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{selectedQuote.customerNotes}</p>
              </div>
            )}

            <div>
              <h4 className="font-medium text-gray-900 mb-2">审核意见</h4>
              {selectedQuote.reviewOpinions?.length === 0 ? (
                <p className="text-sm text-gray-500">暂无审核意见</p>
              ) : (
                <div className="space-y-2">
                  {selectedQuote.reviewOpinions?.map((opinion: ReviewOpinion) => (
                    <div key={opinion.id} className="bg-gray-50 p-3 rounded border">
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

            <div>
              <h4 className="font-medium text-gray-900 mb-3">沟通记录</h4>
              {selectedQuote.communicationLogs?.length === 0 ? (
                <p className="text-sm text-gray-500">暂无沟通记录</p>
              ) : (
                <div className="relative pl-6">
                  <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gray-200" />
                  {selectedQuote.communicationLogs?.map((log: CommunicationLog) => (
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
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Modal>
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
              value={newCommunication}
              onChange={(e) => setNewCommunication(e.target.value)}
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
                value={newReview}
                onChange={(e) => setNewReview(e.target.value)}
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

export default Quotes;
