import { useEffect, useState } from 'react';
import { Search, Plus, Eye, DollarSign, RefundCcw, Minus } from 'lucide-react';
import api from '@/lib/api';
import { cn, formatDate, formatDateTime, getStatusText, getStatusClass } from '@/lib/utils';

interface Deposit {
  id: number;
  amount: number;
  paidAmount: number;
  refundAmount: number;
  status: string;
  paymentMethod: string | null;
  paidAt: string | null;
  refundedAt: string | null;
  deductionReason: string | null;
  remarks: string | null;
  createdAt: string;
  order: {
    orderNo: string;
    guestName: string;
    property: { name: string };
    room: { roomNumber: string } | null;
  };
}

export default function DepositsPage() {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeposit, setSelectedDeposit] = useState<Deposit | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundRemark, setRefundRemark] = useState('');
  const [showDeductModal, setShowDeductModal] = useState(false);
  const [deductAmount, setDeductAmount] = useState('');
  const [deductReason, setDeductReason] = useState('');

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    fetchDeposits();
  }, [page, keyword, statusFilter, propertyId]);

  const fetchProperties = async () => {
    try {
      const res = await api.get('/properties?pageSize=100');
      setProperties(res.data.list || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchDeposits = async () => {
    setLoading(true);
    try {
      const params: any = { page, pageSize };
      if (keyword) params.keyword = keyword;
      if (statusFilter) params.status = statusFilter;
      if (propertyId) params.propertyId = propertyId;

      const res = await api.get('/deposits', { params });
      setDeposits(res.data.list || []);
      setTotal(res.data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const viewDeposit = async (deposit: Deposit) => {
    try {
      const res = await api.get(`/deposits/${deposit.id}`);
      setSelectedDeposit(res.data);
      setShowDetail(true);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRefund = async () => {
    if (!selectedDeposit || !refundAmount) return;
    try {
      await api.patch(`/deposits/${selectedDeposit.id}/refund`, {
        refundAmount: parseFloat(refundAmount),
        remarks: refundRemark,
      });
      fetchDeposits();
      setShowRefundModal(false);
      setShowDetail(false);
    } catch (e) {
      alert('操作失败');
    }
  };

  const handleDeduct = async () => {
    if (!selectedDeposit || !deductReason) return;
    try {
      await api.patch(`/deposits/${selectedDeposit.id}/deduct`, {
        deductionReason: deductReason,
        deductionAmount: deductAmount ? parseFloat(deductAmount) : undefined,
      });
      fetchDeposits();
      setShowDeductModal(false);
      setShowDetail(false);
    } catch (e) {
      alert('操作失败');
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  const totalPaid = deposits.reduce((sum, d) => sum + d.paidAmount, 0);
  const totalRefunded = deposits.reduce((sum, d) => sum + d.refundAmount, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索客人姓名、订单号..."
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
            <option value="PENDING">待支付</option>
            <option value="PAID">已支付</option>
            <option value="REFUNDED">已退还</option>
            <option value="PARTIAL_REFUNDED">部分退还</option>
            <option value="DEDUCTED">已扣除</option>
          </select>
        </div>
        <button className="btn btn-primary flex items-center gap-1">
          <Plus className="w-4 h-4" />
          新增押金
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="text-sm text-gray-500">押金总额</div>
          <div className="text-2xl font-bold text-gray-800 mt-1">¥{totalPaid.toFixed(2)}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-gray-500">已退还</div>
          <div className="text-2xl font-bold text-green-600 mt-1">¥{totalRefunded.toFixed(2)}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-gray-500">已扣除</div>
          <div className="text-2xl font-bold text-red-600 mt-1">¥0.00</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-gray-500">押金记录数</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{total}</div>
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">加载中...</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">订单/客人</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">房源/房间</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">押金金额</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">已付金额</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">已退金额</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">状态</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">创建时间</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {deposits.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                    暂无押金记录
                  </td>
                </tr>
              ) : (
                deposits.map((deposit) => (
                  <tr key={deposit.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800">{deposit.order?.orderNo}</div>
                      <div className="text-xs text-gray-500">{deposit.order?.guestName}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-800">{deposit.order?.property?.name}</div>
                      <div className="text-xs text-gray-500">
                        {deposit.order?.room?.roomNumber || '未分配'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800">
                      ¥{deposit.amount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-green-600 font-medium">
                      ¥{deposit.paidAmount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-orange-600">
                      ¥{deposit.refundAmount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('badge', getStatusClass(deposit.status, 'deposit'))}>
                        {getStatusText(deposit.status, 'deposit')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatDateTime(deposit.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => viewDeposit(deposit)}
                        className="text-primary-600 hover:text-primary-700 text-sm flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        详情
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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

      {showDetail && selectedDeposit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">押金详情</h3>
              <button
                onClick={() => setShowDetail(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">订单号：</span>
                  <span className="text-gray-800">{selectedDeposit.order?.orderNo}</span>
                </div>
                <div>
                  <span className="text-gray-500">客人：</span>
                  <span className="text-gray-800">{selectedDeposit.order?.guestName}</span>
                </div>
                <div>
                  <span className="text-gray-500">房源：</span>
                  <span className="text-gray-800">{selectedDeposit.order?.property?.name}</span>
                </div>
                <div>
                  <span className="text-gray-500">房间：</span>
                  <span className="text-gray-800">
                    {selectedDeposit.order?.room?.roomNumber || '未分配'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">押金金额：</span>
                  <span className="text-gray-800 font-medium">¥{selectedDeposit.amount.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-gray-500">状态：</span>
                  <span className={cn('badge', getStatusClass(selectedDeposit.status, 'deposit'))}>
                    {getStatusText(selectedDeposit.status, 'deposit')}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">已付金额：</span>
                  <span className="text-green-600">¥{selectedDeposit.paidAmount.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-gray-500">已退金额：</span>
                  <span className="text-orange-600">¥{selectedDeposit.refundAmount.toFixed(2)}</span>
                </div>
              </div>

              {selectedDeposit.paymentMethod && (
                <div>
                  <span className="text-gray-500 text-sm">支付方式：</span>
                  <span className="text-sm text-gray-800">{selectedDeposit.paymentMethod}</span>
                </div>
              )}

              {selectedDeposit.remarks && (
                <div>
                  <span className="text-gray-500 text-sm">备注：</span>
                  <p className="text-sm text-gray-700 mt-1 bg-gray-50 p-3 rounded">
                    {selectedDeposit.remarks}
                  </p>
                </div>
              )}

              {selectedDeposit.status === 'PAID' && (
                <div className="flex gap-2 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setRefundAmount(selectedDeposit.paidAmount.toString());
                      setRefundRemark('');
                      setShowRefundModal(true);
                    }}
                    className="btn btn-secondary flex items-center gap-1 flex-1"
                  >
                    <RefundCcw className="w-4 h-4" />
                    退还押金
                  </button>
                  <button
                    onClick={() => {
                      setDeductAmount('');
                      setDeductReason('');
                      setShowDeductModal(true);
                    }}
                    className="btn btn-danger flex items-center gap-1 flex-1"
                  >
                    <Minus className="w-4 h-4" />
                    扣除押金
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showRefundModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">退还押金</h3>
              <button
                onClick={() => setShowRefundModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm text-gray-700">退还金额</label>
                <input
                  type="number"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="input mt-1"
                  placeholder="请输入退还金额"
                />
              </div>
              <div>
                <label className="text-sm text-gray-700">备注</label>
                <textarea
                  value={refundRemark}
                  onChange={(e) => setRefundRemark(e.target.value)}
                  className="input mt-1"
                  placeholder="请输入备注（可选）"
                  rows={3}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowRefundModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  取消
                </button>
                <button
                  onClick={handleRefund}
                  className="btn btn-primary flex-1"
                >
                  确认退还
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeductModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">扣除押金</h3>
              <button
                onClick={() => setShowDeductModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm text-gray-700">扣除金额（留空则全额扣除）</label>
                <input
                  type="number"
                  value={deductAmount}
                  onChange={(e) => setDeductAmount(e.target.value)}
                  className="input mt-1"
                  placeholder="请输入扣除金额"
                />
              </div>
              <div>
                <label className="text-sm text-gray-700">扣除原因 *</label>
                <textarea
                  value={deductReason}
                  onChange={(e) => setDeductReason(e.target.value)}
                  className="input mt-1"
                  placeholder="请输入扣除原因"
                  rows={3}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowDeductModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  取消
                </button>
                <button
                  onClick={handleDeduct}
                  className="btn btn-danger flex-1"
                >
                  确认扣除
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
