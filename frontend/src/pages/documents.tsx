import { useEffect, useState } from 'react';
import api from '../utils/api';
import { formatDateTime } from '../utils/helpers';

interface CheckinDocument {
  id: string;
  documentType: string;
  documentNumber: string;
  guestName: string;
  issueDate?: string;
  expiryDate?: string;
  createdAt: string;
  property?: { id: string; name: string; roomNumber: string };
  booking?: { id: string; guestName: string; checkInDate: string };
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<CheckinDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [docTypeFilter, setDocTypeFilter] = useState('');

  useEffect(() => {
    fetchDocuments();
  }, [docTypeFilter]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const result = await api.get('/checkin-documents', {
        params: { documentType: docTypeFilter || undefined },
      }) as unknown as CheckinDocument[];
      setDocuments(result);
    } catch (error) {
      console.error('获取证件失败:', error);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <select
            value={docTypeFilter}
            onChange={(e) => setDocTypeFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">全部证件类型</option>
            <option value="身份证">身份证</option>
            <option value="护照">护照</option>
            <option value="驾驶证">驾驶证</option>
          </select>
        </div>
        <button className="btn">+ 新增证件</button>
      </div>

      {loading ? (
        <div className="card p-12 text-center text-gray-500">加载中...</div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {documents.map((doc) => (
            <div key={doc.id} className="card p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <span className="inline-block bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded mb-2">
                    {doc.documentType}
                  </span>
                  <h3 className="font-semibold text-gray-900">
                    {doc.guestName}
                  </h3>
                </div>
                <div className="w-10 h-12 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">
                  证件照
                </div>
              </div>
              <div className="mt-4 space-y-2 text-sm text-gray-600">
                <p className="flex justify-between">
                  <span className="text-gray-500">证件号码</span>
                  <span className="font-mono">{doc.documentNumber}</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-gray-500">房源</span>
                  <span>{doc.property?.name}</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-gray-500">房号</span>
                  <span>{doc.property?.roomNumber}</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-gray-500">登记时间</span>
                  <span>{formatDateTime(doc.createdAt)}</span>
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 flex space-x-2">
                <button className="flex-1 text-sm text-primary-600 hover:text-primary-800">
                  查看详情
                </button>
                <button className="flex-1 text-sm text-gray-500 hover:text-gray-700">
                  编辑
                </button>
              </div>
            </div>
          ))}
          {documents.length === 0 && (
            <div className="col-span-3 card p-12 text-center text-gray-400">
              暂无证件记录
            </div>
          )}
        </div>
      )}
    </div>
  );
}
