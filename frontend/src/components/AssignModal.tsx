import { useState, useEffect } from 'react';
import { X, User } from 'lucide-react';
import { assignWorkOrder } from '@/api/workOrders';
import { getWorkers } from '@/api/auth';
import type { WorkOrder, User as UserType } from '@/types';

interface Props {
  order: WorkOrder;
  onClose: () => void;
  onAssigned: () => void;
}

export default function AssignModal({ order, onClose, onAssigned }: Props) {
  const [workers, setWorkers] = useState<UserType[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<number | ''>('');
  const [remark, setRemark] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    try {
      const data = await getWorkers();
      setWorkers(data);
    } catch (err) {
      console.error('获取维修人员列表失败', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorker) {
      alert('请选择指派人员');
      return;
    }
    setLoading(true);
    try {
      await assignWorkOrder(order.id, {
        assigned_to: selectedWorker as number,
        remark: remark || undefined,
      });
      onAssigned();
      onClose();
    } catch (err: any) {
      alert('派工失败：' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">指派工单</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-900">{order.title}</p>
            <p className="text-xs text-gray-500 mt-1">工单号：{order.order_no}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              指派人员 <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-thin">
              {workers.map((worker) => (
                <label
                  key={worker.id}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedWorker === worker.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="worker"
                    value={worker.id}
                    checked={selectedWorker === worker.id}
                    onChange={() => setSelectedWorker(worker.id)}
                    className="sr-only"
                  />
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-primary-600" />
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-900">{worker.full_name}</p>
                    <p className="text-xs text-gray-500">{worker.phone || worker.department}</p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedWorker === worker.id
                        ? 'border-primary-500 bg-primary-500'
                        : 'border-gray-300'
                    }`}
                  >
                    {selectedWorker === worker.id && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              备注
            </label>
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none text-sm"
              placeholder="可选：添加派工备注"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading || !selectedWorker}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {loading ? '指派中...' : '确认指派'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
