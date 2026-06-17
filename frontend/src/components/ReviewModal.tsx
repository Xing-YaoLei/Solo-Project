import { useState } from 'react';
import { X, CheckCircle, XCircle } from 'lucide-react';
import { reviewWorkOrder } from '@/api/workOrders';
import type { WorkOrder } from '@/types';

interface Props {
  order: WorkOrder;
  onClose: () => void;
  onReviewed: () => void;
}

export default function ReviewModal({ order, onClose, onReviewed }: Props) {
  const [isPassed, setIsPassed] = useState<boolean | null>(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPassed === null) {
      alert('请选择复核结果');
      return;
    }
    if (!isPassed && !comment.trim()) {
      alert('复核不通过时请填写原因');
      return;
    }
    setLoading(true);
    try {
      await reviewWorkOrder(order.id, {
        is_passed: isPassed,
        comment: comment.trim() || undefined,
      });
      onReviewed();
      onClose();
    } catch (err: any) {
      alert('复核失败：' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">工单复核</h2>
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
            <label className="block text-sm font-medium text-gray-700 mb-3">
              复核结果 <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsPassed(true)}
                className={`p-4 border-2 rounded-lg flex flex-col items-center transition-colors ${
                  isPassed === true
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <CheckCircle className={`w-8 h-8 mb-2 ${isPassed === true ? 'text-green-500' : 'text-gray-400'}`} />
                <span className={`text-sm font-medium ${isPassed === true ? 'text-green-700' : 'text-gray-700'}`}>
                  复核通过
                </span>
              </button>
              <button
                type="button"
                onClick={() => setIsPassed(false)}
                className={`p-4 border-2 rounded-lg flex flex-col items-center transition-colors ${
                  isPassed === false
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <XCircle className={`w-8 h-8 mb-2 ${isPassed === false ? 'text-red-500' : 'text-gray-400'}`} />
                <span className={`text-sm font-medium ${isPassed === false ? 'text-red-700' : 'text-gray-700'}`}>
                  不通过
                </span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              复核意见 {!isPassed && <span className="text-red-500">*</span>}
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none text-sm"
              placeholder={isPassed ? '可选：填写复核意见' : '请填写不通过的原因'}
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
              disabled={loading || isPassed === null}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {loading ? '提交中...' : '确认复核'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
