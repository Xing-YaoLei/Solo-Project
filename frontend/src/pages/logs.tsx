import { useEffect, useState } from 'react';
import api from '../utils/api';
import { formatDateTime } from '../utils/helpers';
import { useCurrentUser } from '../utils/useCurrentUser';

interface SystemLog {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  reason?: string;
  details?: string;
  closedAt?: string;
  closedById?: string;
  closeReason?: string;
  createdAt: string;
  createdBy?: { id: string; name: string; role: string };
}

interface LogListResponse {
  data: SystemLog[];
  total: number;
  page: number;
  pageSize: number;
}

const actionMap: Record<string, string> = {
  CREATE: '创建',
  UPDATE: '更新',
  DELETE: '删除',
  COMPLETE: '完成',
  CANCEL: '取消',
  ASSIGN: '分派',
  NOTIFY: '通知',
};

export default function LogsPage() {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [entityType, setEntityType] = useState('');
  const [action, setAction] = useState('');
  const [selectedLog, setSelectedLog] = useState<SystemLog | null>(null);
  const [closeReason, setCloseReason] = useState('');
  const currentUser = useCurrentUser();

  useEffect(() => {
    fetchLogs();
  }, [page, entityType, action]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const result = await api.get('/system-logs', {
        params: {
          entityType: entityType || undefined,
          action: action || undefined,
          page,
          pageSize: 20,
        },
      }) as unknown as LogListResponse;
      setLogs(result.data);
      setTotal(result.total);
    } catch (error) {
      console.error('获取日志失败:', error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = async () => {
    if (!selectedLog || !closeReason) return;
    
    try {
      await api.put(`/system-logs/${selectedLog.id}/close`, {
        closeReason,
        closedById: currentUser?.id,
      });
      setSelectedLog(null);
      setCloseReason('');
      fetchLogs();
    } catch (error) {
      console.error('关闭日志失败:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <select
          value={entityType}
          onChange={(e) => {
            setEntityType(e.target.value);
            setPage(1);
          }}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm"
        >
          <option value="">全部实体类型</option>
          <option value="CleaningTask">保洁任务</option>
          <option value="Deposit">押金</option>
          <option value="CheckinDocument">入住证件</option>
          <option value="Property">房源</option>
        </select>
        <select
          value={action}
          onChange={(e) => {
            setAction(e.target.value);
            setPage(1);
          }}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm"
        >
          <option value="">全部动作</option>
          {Object.entries(actionMap).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <span className="text-sm text-gray-500">共 {total} 条记录</span>
      </div>

      {loading ? (
        <div className="card p-12 text-center text-gray-500">加载中...</div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                时间
              </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                类型
              </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                动作
              </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                原因
              </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                操作者
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
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 text-sm text-gray-600">
                    {formatDateTime(log.createdAt)}
                  </td>
                  <td className="px-4 py-4">
                    <span className="inline-block bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">
                      {log.entityType}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm font-medium text-gray-900">
                    {actionMap[log.action] || log.action}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600 max-w-xs truncate">
                    {log.reason || '-'}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">
                    {log.createdBy?.name || '系统'}
                  </td>
                  <td className="px-4 py-4">
                    {log.closedAt ? (
                      <span className="status-badge status-completed">
                      已关闭
                    </span>
                    ) : (
                      <span className="status-badge status-pending">
                      处理中
                    </span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-sm space-x-2">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="text-primary-600 hover:text-primary-800"
                    >
                      详情
                    </button>
                    {!log.closedAt && (
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        关闭
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-gray-400"
                  >
                    暂无日志记录
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          
          {total > 20 && (
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
              <span className="text-sm text-gray-500">
                第 {page} 页 / 共 {Math.ceil(total / 20)} 页
              </span>
              <div className="space-x-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn-secondary text-sm px-3 py-1"
                >
                  上一页
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page * 20 >= total}
                  className="btn-secondary text-sm px-3 py-1"
                >
                  下一页
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold mb-4">日志详情</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">实体类型</span>
                <span className="font-medium">{selectedLog.entityType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">动作</span>
                <span className="font-medium">
                  {actionMap[selectedLog.action] || selectedLog.action}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">原因</span>
                <span className="font-medium">{selectedLog.reason || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">操作者</span>
                <span className="font-medium">
                  {selectedLog.createdBy?.name || '系统'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">创建时间</span>
                <span className="font-medium">
                  {formatDateTime(selectedLog.createdAt)}
                </span>
              </div>
              {selectedLog.closedAt && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-500">关闭时间</span>
                    <span className="font-medium text-green-600">
                      {formatDateTime(selectedLog.closedAt)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">关闭原因</span>
                    <span className="font-medium">
                      {selectedLog.closeReason || '-'}
                    </span>
                  </div>
                </>
              )}
              {selectedLog.details && (
                <div>
                  <span className="text-gray-500 block mb-1">详细信息</span>
                  <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto">
                    {selectedLog.details}
                  </pre>
                </div>
              )}
            </div>

            {!selectedLog.closedAt && (
              <div className="mt-4 pt-4 border-t border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                关闭原因
              </label>
              <textarea
                value={closeReason}
                onChange={(e) => setCloseReason(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                rows={3}
                placeholder="请输入关闭原因"
              />
            </div>
            )}

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setSelectedLog(null);
                  setCloseReason('');
                }}
                className="btn-secondary"
              >
                关闭
              </button>
              {!selectedLog.closedAt && (
                <button
                  onClick={handleClose}
                  disabled={!closeReason}
                  className="btn"
                >
                  确认关闭
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
