'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { followUpApi } from '@/lib/api';
import type { FollowUpTask, ReviewNote } from '@/lib/types';
import { useParams } from 'next/navigation';

const riskBadge: Record<string, string> = {
  HIGH: 'bg-red-500/15 text-red-400 border-red-500/30',
  MEDIUM: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  LOW: 'bg-green-500/15 text-green-400 border-green-500/30',
};

export default function TaskDetailPage() {
  const { id } = useParams();
  const { user, isManager } = useAuth();
  const router = useRouter();
  const [task, setTask] = useState<FollowUpTask | null>(null);
  const [noteContent, setNoteContent] = useState('');
  const [noteType, setNoteType] = useState<'REVIEW' | 'COMMUNICATION'>('COMMUNICATION');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [pharmacistOpinion, setPharmacistOpinion] = useState('');
  const [isApproved, setIsApproved] = useState(true);
  const [submittingOpinion, setSubmittingOpinion] = useState(false);

  const [batchNo, setBatchNo] = useState('');
  const [productionDate, setProductionDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [shelfLife, setShelfLife] = useState('');
  const [submittingBatch, setSubmittingBatch] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await followUpApi.getTaskDetail(id as string);
        setTask(res.data);
        setError(null);
      } catch (err: any) {
        if (err.response?.status === 403) {
          setError('您没有权限查看此任务');
        } else if (err.response?.status === 404) {
          setError('任务不存在');
        } else {
          setError('加载失败');
        }
      }
    };
    load();
  }, [id]);

  const canEditPharmacistOpinion =
    user?.role === 'PHARMACIST' || isManager;
  const canEditBatchExpiry =
    isManager || (user && task?.assigneeId === user.id);

  const handleAddNote = async () => {
    if (!noteContent.trim()) return;
    setSubmitting(true);
    try {
      await followUpApi.addReviewNote(id as string, { type: noteType, content: noteContent });
      const res = await followUpApi.getTaskDetail(id as string);
      setTask(res.data);
      setNoteContent('');
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (status: string) => {
    try {
      await followUpApi.updateTaskStatus(id as string, status);
      const res = await followUpApi.getTaskDetail(id as string);
      setTask(res.data);
    } catch {
    }
  };

  const handleSubmitOpinion = async () => {
    if (!pharmacistOpinion.trim()) return;
    setSubmittingOpinion(true);
    try {
      await followUpApi.submitPharmacistOpinion(id as string, {
        opinion: pharmacistOpinion,
        isApproved,
      });
      const res = await followUpApi.getTaskDetail(id as string);
      setTask(res.data);
      setPharmacistOpinion('');
    } catch {
    } finally {
      setSubmittingOpinion(false);
    }
  };

  const handleSubmitBatch = async () => {
    if (!batchNo.trim() || !productionDate || !expiryDate || !shelfLife.trim()) return;
    setSubmittingBatch(true);
    try {
      await followUpApi.submitBatchExpiry(id as string, {
        batchNo,
        productionDate,
        expiryDate,
        shelfLife,
      });
      const res = await followUpApi.getTaskDetail(id as string);
      setTask(res.data);
      setBatchNo('');
      setProductionDate('');
      setExpiryDate('');
      setShelfLife('');
    } catch {
    } finally {
      setSubmittingBatch(false);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <p className="text-red-400 text-lg">{error}</p>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-surface-800 hover:bg-surface-700 text-surface-50 text-sm rounded-lg border border-surface-700 transition-colors"
        >
          返回
        </button>
      </div>
    );
  }

  if (!task) return <div className="animate-pulse text-surface-200 text-lg p-8">加载中...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-surface-50">{task.taskNo}</h1>
          <span className={`text-xs px-2.5 py-1 rounded-full border ${riskBadge[task.riskLevel]}`}>
            {task.riskLevel === 'HIGH' ? '高风险' : task.riskLevel === 'MEDIUM' ? '中风险' : '低风险'}
          </span>
        </div>
        <div className="flex gap-2">
          {task.status === 'PENDING' && (
            <button onClick={() => handleStatusUpdate('IN_PROGRESS')} className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm rounded-lg transition-colors">开始处理</button>
          )}
          {task.status === 'IN_PROGRESS' && (
            <button onClick={() => handleStatusUpdate('VERIFIED')} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors">核实完成</button>
          )}
          {task.status === 'IN_PROGRESS' && (
            <button onClick={() => handleStatusUpdate('ESCALATED')} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors">升级处理</button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-surface-800 rounded-xl border border-surface-700 p-5">
            <h2 className="text-sm font-semibold text-surface-50 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-500"></span>
              补货单信息
            </h2>
            <div className="grid grid-cols-2 gap-y-2 gap-x-6 text-sm">
              <div><span className="text-surface-200">单号：</span><span className="text-surface-50">{task.orderNo}</span></div>
              <div><span className="text-surface-200">药品：</span><span className="text-surface-50">{task.drugName}</span></div>
              <div><span className="text-surface-200">门店：</span><span className="text-surface-50">{task.storeName}</span></div>
              <div><span className="text-surface-200">处理人：</span><span className="text-surface-50">{task.assigneeName}</span></div>
            </div>
          </section>

          <section className="bg-surface-800 rounded-xl border border-surface-700 p-5">
            <h2 className="text-sm font-semibold text-surface-50 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              医保流水与处方核对
            </h2>
            {task.insuranceRecord ? (
              <div className="grid grid-cols-2 gap-y-2 gap-x-6 text-sm mb-4">
                <div><span className="text-surface-200">交易号：</span><span className="text-surface-50 font-mono">{task.insuranceRecord.transactionNo}</span></div>
                <div><span className="text-surface-200">患者：</span><span className="text-surface-50">{task.insuranceRecord.patientName}</span></div>
                <div><span className="text-surface-200">医保类型：</span><span className="text-surface-50">{task.insuranceRecord.insuranceType}</span></div>
                <div><span className="text-surface-200">金额：</span><span className="text-surface-50">¥{task.insuranceRecord.amount.toFixed(2)}</span></div>
              </div>
            ) : (
              <p className="text-sm text-amber-400 mb-4">暂无医保流水记录</p>
            )}
            {task.prescriptionPhoto ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-surface-200">处方照片：</span>
                  {!task.prescriptionPhoto.isClear && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30">
                      处方不清
                    </span>
                  )}
                </div>
                <div className="w-40 h-28 bg-surface-700 rounded-lg flex items-center justify-center text-surface-200 text-sm">
                  {task.prescriptionPhoto.fileName}
                </div>
                {task.prescriptionPhoto.ocrText && (
                  <div className="text-xs text-surface-200 bg-surface-900 p-3 rounded-lg mt-2">
                    OCR识别：{task.prescriptionPhoto.ocrText}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-amber-400">暂无处方照片</p>
            )}
          </section>

          <section className="bg-surface-800 rounded-xl border border-surface-700 p-5">
            <h2 className="text-sm font-semibold text-surface-50 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
              复核意见与沟通备注
            </h2>
            <div className="space-y-3 mb-4">
              {task.reviewNotes && task.reviewNotes.length > 0 ? (
                task.reviewNotes.map((note: ReviewNote) => (
                  <div
                    key={note.id}
                    className={`p-3 rounded-lg border ${
                      note.type === 'REVIEW'
                        ? 'bg-purple-500/5 border-purple-500/20'
                        : 'bg-blue-500/5 border-blue-500/20'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        note.type === 'REVIEW'
                          ? 'bg-purple-500/15 text-purple-400'
                          : 'bg-blue-500/15 text-blue-400'
                      }`}>
                        {note.type === 'REVIEW' ? '复核意见' : '沟通备注'}
                      </span>
                      <span className="text-xs text-surface-200">{note.authorName}</span>
                      <span className="text-xs text-surface-200">·</span>
                      <span className="text-xs text-surface-200">{note.authorRole}</span>
                      <span className="text-xs text-surface-200 ml-auto">{note.createdAt}</span>
                    </div>
                    <p className="text-sm text-surface-50">{note.content}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-surface-200">暂无记录</p>
              )}
            </div>
            <div className="flex gap-3">
              <select
                value={noteType}
                onChange={(e) => setNoteType(e.target.value as 'REVIEW' | 'COMMUNICATION')}
                className="px-3 py-2 bg-surface-900 border border-surface-700 rounded-lg text-sm text-surface-50 focus:outline-none focus:border-primary-500"
              >
                <option value="COMMUNICATION">沟通备注</option>
                <option value="REVIEW">复核意见</option>
              </select>
              <input
                type="text"
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="输入内容..."
                className="flex-1 px-4 py-2 bg-surface-900 border border-surface-700 rounded-lg text-sm text-surface-50 placeholder-surface-200 focus:outline-none focus:border-primary-500"
              />
              <button
                onClick={handleAddNote}
                disabled={submitting || !noteContent.trim()}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
              >
                提交
              </button>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="bg-surface-800 rounded-xl border border-surface-700 p-5">
            <h2 className="text-sm font-semibold text-surface-50 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
              药师意见
            </h2>
            {task.pharmacistOpinion ? (
              <div className="space-y-2 text-sm">
                <div><span className="text-surface-200">药师：</span><span className="text-surface-50">{task.pharmacistOpinion.pharmacistName}</span></div>
                <div><span className="text-surface-200">意见：</span><span className="text-surface-50">{task.pharmacistOpinion.opinion}</span></div>
                <div><span className="text-surface-200">审核：</span>
                  <span className={task.pharmacistOpinion.isApproved ? 'text-green-400' : 'text-red-400'}>
                    {task.pharmacistOpinion.isApproved ? '通过' : '不通过'}
                  </span>
                </div>
                <div><span className="text-surface-200">时间：</span><span className="text-surface-50">{task.pharmacistOpinion.reviewedAt}</span></div>
              </div>
            ) : (
              <p className="text-sm text-surface-200 mb-3">待药师审核</p>
            )}
            {canEditPharmacistOpinion && (
              <div className="mt-4 pt-4 border-t border-surface-700 space-y-3">
                <p className="text-xs text-surface-200">录入药师意见</p>
                <textarea
                  value={pharmacistOpinion}
                  onChange={(e) => setPharmacistOpinion(e.target.value)}
                  placeholder="请输入药师审核意见..."
                  rows={3}
                  className="w-full px-3 py-2 bg-surface-900 border border-surface-700 rounded-lg text-sm text-surface-50 placeholder-surface-200 focus:outline-none focus:border-primary-500 resize-none"
                />
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-sm text-surface-50">
                    <input
                      type="checkbox"
                      checked={isApproved}
                      onChange={(e) => setIsApproved(e.target.checked)}
                      className="rounded border-surface-700 bg-surface-900 text-primary-600 focus:ring-primary-500"
                    />
                    审核通过
                  </label>
                </div>
                <button
                  onClick={handleSubmitOpinion}
                  disabled={submittingOpinion || !pharmacistOpinion.trim()}
                  className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
                >
                  {submittingOpinion ? '提交中...' : '提交意见'}
                </button>
              </div>
            )}
          </section>

          <section className="bg-surface-800 rounded-xl border border-surface-700 p-5">
            <h2 className="text-sm font-semibold text-surface-50 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
              批号效期
            </h2>
            {task.batchExpiry ? (
              <div className="space-y-2 text-sm">
                <div><span className="text-surface-200">批号：</span><span className="text-surface-50 font-mono">{task.batchExpiry.batchNo}</span></div>
                <div><span className="text-surface-200">生产日期：</span><span className="text-surface-50">{task.batchExpiry.productionDate}</span></div>
                <div><span className="text-surface-200">有效期至：</span><span className="text-surface-50">{task.batchExpiry.expiryDate}</span></div>
                <div><span className="text-surface-200">保质期：</span><span className="text-surface-50">{task.batchExpiry.shelfLife}</span></div>
                <div><span className="text-surface-200">核验人：</span><span className="text-surface-50">{task.batchExpiry.verifiedBy}</span></div>
              </div>
            ) : (
              <p className="text-sm text-surface-200 mb-3">待补录批号效期</p>
            )}
            {canEditBatchExpiry && (
              <div className="mt-4 pt-4 border-t border-surface-700 space-y-2">
                <p className="text-xs text-surface-200">补录批号效期</p>
                <input
                  type="text"
                  value={batchNo}
                  onChange={(e) => setBatchNo(e.target.value)}
                  placeholder="批号"
                  className="w-full px-3 py-2 bg-surface-900 border border-surface-700 rounded-lg text-sm text-surface-50 placeholder-surface-200 focus:outline-none focus:border-primary-500"
                />
                <input
                  type="date"
                  value={productionDate}
                  onChange={(e) => setProductionDate(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-900 border border-surface-700 rounded-lg text-sm text-surface-50 focus:outline-none focus:border-primary-500"
                />
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-900 border border-surface-700 rounded-lg text-sm text-surface-50 focus:outline-none focus:border-primary-500"
                />
                <input
                  type="text"
                  value={shelfLife}
                  onChange={(e) => setShelfLife(e.target.value)}
                  placeholder="保质期（如：24个月）"
                  className="w-full px-3 py-2 bg-surface-900 border border-surface-700 rounded-lg text-sm text-surface-50 placeholder-surface-200 focus:outline-none focus:border-primary-500"
                />
                <button
                  onClick={handleSubmitBatch}
                  disabled={submittingBatch || !batchNo.trim() || !productionDate || !expiryDate || !shelfLife.trim()}
                  className="w-full px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
                >
                  {submittingBatch ? '提交中...' : '提交'}
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
