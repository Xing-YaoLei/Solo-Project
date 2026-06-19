import { useEffect, useState } from 'react';
import { Search, Plus, Eye, CheckCircle, XCircle } from 'lucide-react';
import api from '@/lib/api';
import { cn, formatDateTime, getStatusText, getStatusClass } from '@/lib/utils';

interface Document {
  id: number;
  documentType: string;
  documentNo: string;
  guestName: string;
  status: string;
  uploadUrl: string | null;
  remarks: string | null;
  verifiedAt: string | null;
  createdAt: string;
  order: {
    orderNo: string;
    property: { name: string };
    room: { roomNumber: string } | null;
  };
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [verifyRemark, setVerifyRemark] = useState('');

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [page, keyword, statusFilter, propertyId]);

  const fetchProperties = async () => {
    try {
      const res = await api.get('/properties?pageSize=100');
      setProperties(res.data.list || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const params: any = { page, pageSize };
      if (keyword) params.keyword = keyword;
      if (statusFilter) params.status = statusFilter;
      if (propertyId) params.propertyId = propertyId;

      const res = await api.get('/documents', { params });
      setDocuments(res.data.list || []);
      setTotal(res.data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const viewDoc = async (doc: Document) => {
    try {
      const res = await api.get(`/documents/${doc.id}`);
      setSelectedDoc(res.data);
      setShowDetail(true);
      setVerifyRemark('');
    } catch (e) {
      console.error(e);
    }
  };

  const verifyDocument = async (status: string) => {
    if (!selectedDoc) return;
    try {
      await api.patch(`/documents/${selectedDoc.id}/verify`, {
        status,
        remarks: verifyRemark,
      });
      fetchDocuments();
      setShowDetail(false);
    } catch (e) {
      alert('操作失败');
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索客人姓名、证件号..."
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
            <option value="PENDING">待审核</option>
            <option value="UPLOADED">已上传</option>
            <option value="VERIFIED">已验证</option>
            <option value="REJECTED">已拒绝</option>
          </select>
        </div>
        <button className="btn btn-primary flex items-center gap-1">
          <Plus className="w-4 h-4" />
          上传证件
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="text-sm text-gray-500">待审核</div>
          <div className="text-2xl font-bold text-yellow-600 mt-1">-</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-gray-500">已验证</div>
          <div className="text-2xl font-bold text-green-600 mt-1">-</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-gray-500">已拒绝</div>
          <div className="text-2xl font-bold text-red-600 mt-1">-</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-gray-500">证件总数</div>
          <div className="text-2xl font-bold text-gray-800 mt-1">{total}</div>
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">加载中...</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">客人姓名</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">证件类型</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">证件号码</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">关联订单</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">上传时间</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">状态</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {documents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    暂无证件记录
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {doc.guestName}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {doc.documentType}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {doc.documentNo}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-800">{doc.order?.orderNo}</div>
                      <div className="text-xs text-gray-500">
                        {doc.order?.property?.name} · {doc.order?.room?.roomNumber}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatDateTime(doc.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('badge', getStatusClass(doc.status, 'document'))}>
                        {getStatusText(doc.status, 'document')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => viewDoc(doc)}
                        className="text-primary-600 hover:text-primary-700 text-sm flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        查看
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

      {showDetail && selectedDoc && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">证件详情</h3>
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
                  <span className="text-gray-500">客人姓名：</span>
                  <span className="text-gray-800">{selectedDoc.guestName}</span>
                </div>
                <div>
                  <span className="text-gray-500">证件类型：</span>
                  <span className="text-gray-800">{selectedDoc.documentType}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500">证件号码：</span>
                  <span className="text-gray-800">{selectedDoc.documentNo}</span>
                </div>
                <div>
                  <span className="text-gray-500">关联订单：</span>
                  <span className="text-gray-800">{selectedDoc.order?.orderNo}</span>
                </div>
                <div>
                  <span className="text-gray-500">状态：</span>
                  <span className={cn('badge', getStatusClass(selectedDoc.status, 'document'))}>
                    {getStatusText(selectedDoc.status, 'document')}
                  </span>
                </div>
              </div>

              {selectedDoc.uploadUrl && (
                <div>
                  <span className="text-gray-500 text-sm">证件照片：</span>
                  <div className="mt-2 bg-gray-100 rounded-lg h-40 flex items-center justify-center text-gray-400">
                    [证件图片预览]
                  </div>
                </div>
              )}

              {selectedDoc.status === 'PENDING' && (
                <div className="space-y-3 pt-4 border-t border-gray-200">
                  <div>
                    <label className="text-sm text-gray-600">审核意见</label>
                    <textarea
                      value={verifyRemark}
                      onChange={(e) => setVerifyRemark(e.target.value)}
                      placeholder="请输入审核意见（可选）"
                      className="input mt-1"
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => verifyDocument('VERIFIED')}
                      className="btn btn-primary flex items-center gap-1 flex-1"
                    >
                      <CheckCircle className="w-4 h-4" />
                      验证通过
                    </button>
                    <button
                      onClick={() => verifyDocument('REJECTED')}
                      className="btn btn-danger flex items-center gap-1 flex-1"
                    >
                      <XCircle className="w-4 h-4" />
                      拒绝
                    </button>
                  </div>
                </div>
              )}

              {selectedDoc.remarks && (
                <div>
                  <span className="text-gray-500 text-sm">备注：</span>
                  <p className="text-sm text-gray-700 mt-1 bg-gray-50 p-3 rounded">
                    {selectedDoc.remarks}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
