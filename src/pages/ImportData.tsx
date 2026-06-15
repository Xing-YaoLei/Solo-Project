import React, { useEffect, useState } from 'react';
import { Upload, RotateCcw, FileText, Clock, CheckCircle, XCircle, AlertCircle, Plus } from 'lucide-react';
import { api } from '@/services/api';
import { cn } from '@/lib/utils';

interface BatchRecord {
  id: string;
  batch_no: string;
  source: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'rollback';
  record_count: number;
  start_time: string;
  end_time: string | null;
  remark: string;
  created_by: string;
}

interface ProgressNote {
  id: string;
  date: string;
  content: string;
  created_by: string;
  created_at: string;
}

const ImportData: React.FC = () => {
  const [batches, setBatches] = useState<BatchRecord[]>([]);
  const [notes, setNotes] = useState<ProgressNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState<string | null>(null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [noteDate, setNoteDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [batchData, noteData] = await Promise.all([
        api.import.getBatches(),
        api.import.getNotes(),
      ]);
      setBatches(Array.isArray(batchData) ? batchData : batchData.data || []);
      setNotes(Array.isArray(noteData) ? noteData : noteData.data || []);
    } catch (error) {
      console.error('Failed to fetch import data:', error);
      const mockBatches: BatchRecord[] = [
        { id: '1', batch_no: 'BATCH-20240115-001', source: 'live_platform', status: 'completed', record_count: 1250, start_time: '2024-01-15 09:00:00', end_time: '2024-01-15 09:15:23', remark: '直播平台数据导入', created_by: 'admin' },
        { id: '2', batch_no: 'BATCH-20240115-002', source: 'employment', status: 'completed', record_count: 856, start_time: '2024-01-15 09:16:00', end_time: '2024-01-15 09:22:45', remark: '就业表数据导入', created_by: 'admin' },
        { id: '3', batch_no: 'BATCH-20240115-003', source: 'lms', status: 'completed', record_count: 3420, start_time: '2024-01-15 09:23:00', end_time: '2024-01-15 09:45:12', remark: 'LMS系统数据导入', created_by: 'admin' },
        { id: '4', batch_no: 'BATCH-20240114-001', source: 'live_platform', status: 'completed', record_count: 1189, start_time: '2024-01-14 09:00:00', end_time: '2024-01-14 09:12:33', remark: '直播平台数据导入', created_by: 'admin' },
        { id: '5', batch_no: 'BATCH-20240114-002', source: 'employment', status: 'failed', record_count: 0, start_time: '2024-01-14 09:13:00', end_time: '2024-01-14 09:13:25', remark: '数据格式错误', created_by: 'admin' },
        { id: '6', batch_no: 'BATCH-20240113-001', source: 'live_platform', status: 'rollback', record_count: 1100, start_time: '2024-01-13 09:00:00', end_time: '2024-01-13 10:30:00', remark: '数据异常已回滚', created_by: 'admin' },
      ];
      const mockNotes: ProgressNote[] = [
        { id: '1', date: '2024-01-15', content: '本周学员参与度下降，主要因期末考试周，预计下周恢复', created_by: '张老师', created_at: '2024-01-15 14:30:00' },
        { id: '2', date: '2024-01-10', content: 'Java课程第三章练习难度较高，已补充辅导视频', created_by: '李老师', created_at: '2024-01-10 16:45:00' },
      ];
      setBatches(mockBatches);
      setNotes(mockNotes);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (source: string) => {
    setImporting(source);
    try {
      await api.import.triggerImport(source);
      await fetchData();
    } catch (error) {
      console.error('Import failed:', error);
    } finally {
      setImporting(null);
    }
  };

  const handleRollback = async (batchId: string) => {
    if (!confirm('确定要回滚此批次吗？此操作不可撤销。')) return;
    try {
      await api.import.rollback(batchId);
      await fetchData();
    } catch (error) {
      console.error('Rollback failed:', error);
    }
  };

  const handleAddNote = async () => {
    if (!noteContent.trim()) return;
    try {
      await api.import.addNote({ date: noteDate, content: noteContent });
      setShowNoteModal(false);
      setNoteContent('');
      await fetchData();
    } catch (error) {
      console.error('Add note failed:', error);
    }
  };

  const getSourceLabel = (source: string) => {
    const labels: Record<string, string> = {
      live_platform: '直播平台',
      employment: '就业表',
      lms: 'LMS系统',
    };
    return labels[source] || source;
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; icon: any; color: string; bg: string }> = {
      pending: { label: '等待中', icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
      processing: { label: '处理中', icon: Upload, color: 'text-blue-400', bg: 'bg-blue-500/10' },
      completed: { label: '已完成', icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10' },
      failed: { label: '失败', icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
      rollback: { label: '已回滚', icon: RotateCcw, color: 'text-orange-400', bg: 'bg-orange-500/10' },
    };
    return configs[status] || configs.pending;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const importSources = [
    { source: 'live_platform', label: '直播平台', description: '导入直播平台学员观看、互动数据', color: 'from-blue-500 to-blue-600' },
    { source: 'employment', label: '就业表', description: '导入学员就业信息和跟踪数据', color: 'from-green-500 to-green-600' },
    { source: 'lms', label: 'LMS系统', description: '导入学习管理系统练习、作业数据', color: 'from-purple-500 to-purple-600' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">数据导入</h1>
          <p className="text-dark-400 text-sm">管理数据源导入、批次记录和进度注释</p>
        </div>
        <button
          onClick={() => setShowNoteModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-all"
        >
          <Plus size={18} />
          <span>添加进度注释</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {importSources.map((item) => {
          const statusConfig = getStatusConfig(batches.find(b => b.source === item.source)?.status || 'pending');
          const lastBatch = batches.find(b => b.source === item.source);
          return (
            <div key={item.source} className="card-gradient p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">{item.label}</h3>
                  <p className="text-sm text-dark-400 mt-1">{item.description}</p>
                </div>
                <div className={`w-12 h-12 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center`}>
                  <Upload size={20} className="text-white" />
                </div>
              </div>
              {lastBatch && (
                <div className="mb-4 p-3 bg-dark-800/40 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-dark-400">最近批次</span>
                    <span className={cn('text-xs px-2 py-0.5 rounded-full', statusConfig.bg, statusConfig.color)}>
                      {statusConfig.label}
                    </span>
                  </div>
                  <p className="text-sm text-white">{lastBatch.batch_no}</p>
                  <p className="text-xs text-dark-400 mt-1">{lastBatch.start_time}</p>
                </div>
              )}
              <button
                onClick={() => handleImport(item.source)}
                disabled={importing !== null}
                className={cn(
                  'w-full py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2',
                  importing === item.source
                    ? 'bg-dark-700 text-dark-300 cursor-not-allowed'
                    : 'bg-primary-600 hover:bg-primary-500 text-white'
                )}
              >
                {importing === item.source ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                    <span>导入中...</span>
                  </>
                ) : (
                  <>
                    <Upload size={18} />
                    <span>开始导入</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      <div className="card-gradient p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <FileText size={20} className="text-primary-400" />
          批次记录
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-700/50">
                <th className="text-left py-3 px-4 text-sm font-medium text-dark-400">批次号</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-dark-400">数据源</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-dark-400">状态</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-dark-400">记录数</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-dark-400">开始时间</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-dark-400">耗时</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-dark-400">备注</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-dark-400">操作</th>
              </tr>
            </thead>
            <tbody>
              {batches.map((batch) => {
                const statusConfig = getStatusConfig(batch.status);
                const StatusIcon = statusConfig.icon;
                const duration = batch.end_time
                  ? Math.round((new Date(batch.end_time).getTime() - new Date(batch.start_time).getTime()) / 1000)
                  : null;
                return (
                  <tr key={batch.id} className="border-b border-dark-800/50 hover:bg-dark-800/30 transition-colors">
                    <td className="py-3 px-4 text-sm text-white font-mono">{batch.batch_no}</td>
                    <td className="py-3 px-4 text-sm text-dark-300">{getSourceLabel(batch.source)}</td>
                    <td className="py-3 px-4">
                      <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', statusConfig.bg, statusConfig.color)}>
                        <StatusIcon size={12} />
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-white">{batch.record_count.toLocaleString()}</td>
                    <td className="py-3 px-4 text-sm text-dark-300">{batch.start_time}</td>
                    <td className="py-3 px-4 text-sm text-dark-300">
                      {duration !== null ? `${duration}s` : '-'}
                    </td>
                    <td className="py-3 px-4 text-sm text-dark-300 max-w-xs truncate">{batch.remark}</td>
                    <td className="py-3 px-4">
                      {batch.status === 'completed' && (
                        <button
                          onClick={() => handleRollback(batch.id)}
                          className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1"
                        >
                          <RotateCcw size={12} />
                          回滚
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card-gradient p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <AlertCircle size={20} className="text-primary-400" />
          进度注释记录
        </h2>
        {notes.length === 0 ? (
          <div className="text-center py-12 text-dark-400">
            <AlertCircle size={48} className="mx-auto mb-3 opacity-50" />
            <p>暂无进度注释记录</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notes.map((note) => (
              <div key={note.id} className="p-4 bg-dark-800/40 rounded-xl border border-dark-700/50">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-primary-500/20 text-primary-400 text-xs font-medium rounded-full">
                      {note.date}
                    </span>
                    <span className="text-xs text-dark-400">by {note.created_by}</span>
                  </div>
                  <span className="text-xs text-dark-500">{note.created_at}</span>
                </div>
                <p className="text-dark-200 text-sm">{note.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {showNoteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="card-gradient p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-semibold text-white mb-4">添加进度注释</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">日期</label>
                <input
                  type="date"
                  value={noteDate}
                  onChange={(e) => setNoteDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-dark-800/60 border border-dark-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">注释内容</label>
                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="请输入进度落后的原因或说明..."
                  rows={4}
                  className="w-full px-4 py-2.5 bg-dark-800/60 border border-dark-700 rounded-lg text-white focus:outline-none focus:border-primary-500 resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowNoteModal(false)}
                  className="flex-1 py-2.5 bg-dark-700 hover:bg-dark-600 text-white rounded-lg transition-all"
                >
                  取消
                </button>
                <button
                  onClick={handleAddNote}
                  className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-all"
                >
                  确认添加
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportData;
