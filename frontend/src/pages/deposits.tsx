import { useEffect, useState } from 'react';
import api from '../utils/api';
import { formatDateTime, formatCurrency, depositStatusMap } from '../utils/helpers';

interface Deposit {
  id: string;
  amount: number;
  status: string;
  refundAmount: number;
  deductAmount: number;
  deductReason?: string;
  notes?: string;
  collectedAt: string;
  refundedAt?: string;
  booking?: {
    id: string;
    guestName: string;
    property?: { name: string; roomNumber: string };
  };
  auditLogs?: Array<{
    id: string;
    fieldName: string;
    oldValue: string | null;
    newValue: string | null;
    changeReason?: string;
    createdAt: string;
  }>;
}

export default function DepositsPage() {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeposit, setSelectedDeposit] = useState<Deposit | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({
    status: '',
    refundAmount: 0,
    deductAmount: 0,
    deductReason: '',
    changeReason: '',
  });

  useEffect(() => {
    fetchDeposits();
  }, []);

  const fetchDeposits = async () => {
    setLoading(true);
    try {
      const result = await api.get('/deposits') as unknown as Deposit[];
      setDeposits(result);
    } catch (error) {
      console.error('获取押金失败:', error);
      setDeposits([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (deposit: Deposit) => {
    setSelectedDeposit(deposit);
    setEditData({
      status: deposit.status,
      refundAmount: Number(deposit.refundAmount) || 0,
      deductAmount: Number(deposit.deductAmount) || 0,
      deductReason: deposit.deductReason || '',
      changeReason: '',
    });
    setShowEditModal(true);
  };

  const handleSave = async () => {
    if (!selectedDeposit) return;
    
    try {
      await api.put(`/deposits/${selectedDeposit.id}`, {
        status: editData.status,
        refundAmount: editData.refundAmount,
        deductAmount: editData.deductAmount,
        deductReason: editData.deductReason,
        changeReason: editData.changeReason,
        changedById: 'demo-user-id',
      });
      setShowEditModal(false);
      fetchDeposits();
    } catch (error) {
      console.error('更新押金失败:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-sm text-gray-500">押金总数</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {deposits.length}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">已收取</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">
            {formatCurrency(
              deposits
                .filter((d) => d.status === 'COLLECTED')
                .reduce((sum, d) => sum + Number(d.amount), 0)
            )}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">已退还</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {formatCurrency(
              deposits.reduce(
                (sum, d) => sum + Number(d.refundAmount),
                0
              )
            )}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">已扣款</p>
          <p className="text-2xl font-bold text-red-600 mt-1">
            {formatCurrency(
              deposits.reduce(
                (sum, d) => sum + Number(d.deductAmount),
                0
              )
            )}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="card p-12 text-center text-gray-500">加载中...</div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  房源/房号
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  客人
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  押金金额
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  退还/扣款
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  状态
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {deposits.map((deposit) => (
                <tr key={deposit.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <p className="font-medium text-gray-900">
                      {deposit.booking?.property?.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {deposit.booking?.property?.roomNumber}
                    </p>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">
                    {deposit.booking?.guestName}
                  </td>
                  <td className="px-4 py-4 text-sm font-medium text-gray-900">
                    {formatCurrency(deposit.amount)}
                  </td>
                  <td className="px-4 py-4 text-sm">
                    <span className="text-green-600">
                      退: {formatCurrency(deposit.refundAmount)}
                    </span>
                    <br />
                    <span className="text-red-600">
                      扣: {formatCurrency(deposit.deductAmount)}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`status-badge ${
                        depositStatusMap[deposit.status]?.className ||
                        'status-pending'
                      }`}
                    >
                      {depositStatusMap[deposit.status]?.label ||
                        deposit.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm space-x-2">
                    <button
                      onClick={() => handleEdit(deposit)}
                      className="text-primary-600 hover:text-primary-800"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => setSelectedDeposit(deposit)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      审计
                    </button>
                  </td>
                </tr>
              ))}
              {deposits.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-gray-400"
                  >
                    暂无押金记录
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {selectedDeposit && selectedDeposit.auditLogs && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">
            📋 {selectedDeposit.booking?.guestName} 的押金变更记录
          </h3>
          <div className="space-y-3">
            {selectedDeposit.auditLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">
                      {log.fieldName}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatDateTime(log.createdAt)}
                    </span>
                  </div>
                  <div className="mt-1 text-sm">
                    <span className="text-red-500 line-through">
                      变更前: {log.oldValue || '无'}
                    </span>
                    <span className="mx-2 text-gray-400">→</span>
                    <span className="text-green-600 font-medium">
                      变更后: {log.newValue}
                    </span>
                  </div>
                  {log.changeReason && (
                    <p className="text-xs text-gray-500 mt-1">
                      原因: {log.changeReason}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showEditModal && selectedDeposit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">编辑押金</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  状态
                </label>
                <select
                  value={editData.status}
                  onChange={(e) =>
                    setEditData({ ...editData, status: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="COLLECTED">已收取</option>
                  <option value="PARTIAL_REFUNDED">部分退还</option>
                  <option value="FULLY_REFUNDED">全额退还</option>
                  <option value="DEDUCTED">已扣款</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    退款金额
                  </label>
                  <input
                    type="number"
                    value={editData.refundAmount}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        refundAmount: Number(e.target.value),
                      })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    扣款金额
                  </label>
                  <input
                    type="number"
                    value={editData.deductAmount}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        deductAmount: Number(e.target.value),
                      })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  扣款原因
                </label>
                <input
                  type="text"
                  value={editData.deductReason}
                  onChange={(e) =>
                    setEditData({ ...editData, deductReason: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  placeholder="如有扣款请填写原因"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  变更原因 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editData.changeReason}
                  onChange={(e) =>
                    setEditData({ ...editData, changeReason: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  placeholder="请填写本次变更的原因"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="btn-secondary"
              >
                取消
              </button>
              <button onClick={handleSave} className="btn">
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
