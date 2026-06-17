'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { followUpApi } from '@/lib/api';
import type { FollowUpTask, PharmacistOpinion, BatchExpiryRecord } from '@/lib/types';
import Link from 'next/link';
import clsx from 'clsx';

export default function TrackingPage() {
  const { user, isManager, isPharmacist } = useAuth();
  const [tasks, setTasks] = useState<FollowUpTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [opinionText, setOpinionText] = useState('');
  const [isApproved, setIsApproved] = useState(true);
  const [batchNo, setBatchNo] = useState('');
  const [productionDate, setProductionDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [shelfLife, setShelfLife] = useState('');

  const loadTasks = async () => {
    setLoading(true);
    try {
      const res = isManager
        ? await followUpApi.getAllTasks({ status: 'IN_PROGRESS' })
        : await followUpApi.getMyTasks({ status: 'IN_PROGRESS' });
      const sorted = res.data.sort((a: FollowUpTask, b: FollowUpTask) => {
        const order: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };
        return order[a.riskLevel] - order[b.riskLevel];
      });
      setTasks(sorted);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [isManager, user?.id]);

  const expandTask = (taskId: string) => {
    if (expandedId === taskId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(taskId);
    setOpinionText('');
    setIsApproved(true);
    setBatchNo('');
    setProductionDate('');
    setExpiryDate('');
    setShelfLife('');
  };

  const handleSubmitOpinion = async (taskId: string) => {
    if (!opinionText.trim()) return;
    setSubmitting(`opinion-${taskId}`);
    try {
      await followUpApi.submitPharmacistOpinion(taskId, {
        opinion: opinionText,
        isApproved,
      });
      const res = await followUpApi.getTaskDetail(taskId);
      const updated = res.data;
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, hasPharmacistOpinion: true, pharmacistOpinion: updated.pharmacistOpinion as PharmacistOpinion }
            : t
        )
      );
      setOpinionText('');
      setIsApproved(true);
    } catch {
    } finally {
      setSubmitting(null);
    }
  };

  const handleSubmitBatch = async (taskId: string) => {
    if (!batchNo.trim() || !productionDate || !expiryDate || !shelfLife.trim()) return;
    setSubmitting(`batch-${taskId}`);
    try {
      await followUpApi.submitBatchExpiry(taskId, {
        batchNo,
        productionDate,
        expiryDate,
        shelfLife,
      });
      const res = await followUpApi.getTaskDetail(taskId);
      const updated = res.data;
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, hasBatchExpiry: true, batchExpiry: updated.batchExpiry as BatchExpiryRecord }
            : t
        )
      );
      setBatchNo('');
      setProductionDate('');
      setExpiryDate('');
      setShelfLife('');
    } catch {
    } finally {
      setSubmitting(null);
    }
  };

  if (loading) return <div className="animate-pulse text-surface-200 text-lg p-8">加载中...</div>;

  const riskLabel: Record<string, { text: string; cls: string }> = {
    HIGH: { text: '高风险', cls: 'bg-red-500/15 text-red-400 border-red-500/30' },
    MEDIUM: { text: '中风险', cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
    LOW: { text: '低风险', cls: 'bg-green-500/15 text-green-400 border-green-500/30' },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-50">回访追踪</h1>
          <p className="text-surface-200 mt-1">
            {isManager ? '追踪全部进行中的回访' : '追踪我的回访任务'}，补充药师意见与批号效期
          </p>
        </div>
        <span className="text-xs text-surface-200 bg-surface-800 px-3 py-1.5 rounded-full border border-surface-700">
          共 {tasks.length} 项进行中
        </span>
      </div>

      <div className="space-y-3">
        {tasks.length === 0 ? (
          <div className="bg-surface-800 rounded-xl border border-surface-700 px-5 py-16 text-center">
            <p className="text-surface-200 text-sm">暂无进行中的回访</p>
          </div>
        ) : (
          tasks.map((task) => {
            const risk = riskLabel[task.riskLevel] || riskLabel.LOW;
            const isExpanded = expandedId === task.id;
            const isSubmittingOpinion = submitting === `opinion-${task.id}`;
            const isSubmittingBatch = submitting === `batch-${task.id}`;

            return (
              <div
                key={task.id}
                className={clsx(
                  'bg-surface-800 rounded-xl border border-surface-700 overflow-hidden transition-all',
                  task.riskLevel === 'HIGH' && 'border-l-4 border-l-red-500',
                  task.riskLevel === 'MEDIUM' && 'border-l-4 border-l-amber-500',
                  task.riskLevel === 'LOW' && 'border-l-4 border-l-green-500'
                )}
              >
                <div
                  className="px-5 py-4 cursor-pointer hover:bg-surface-700/30 transition-colors"
                  onClick={() => expandTask(task.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-surface-50">{task.taskNo}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${risk.cls}`}>
                        {risk.text}
                      </span>
                      <span className="text-xs text-surface-200">{task.drugName}</span>
                      <span className="text-xs text-surface-200">· {task.storeName}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-surface-200">处理人: {task.assigneeName}</span>
                      <Link
                        href={`/tasks/${task.id}`}
                        className="text-xs text-primary-400 hover:text-primary-300"
                        onClick={(e) => e.stopPropagation()}
                      >
                        详情 →
                      </Link>
                      <svg
                        className={clsx('w-4 h-4 text-surface-200 transition-transform', isExpanded && 'rotate-90')}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-3 mt-3">
                    {[
                      { label: '药师意见', done: task.hasPharmacistOpinion },
                      { label: '批号效期', done: task.hasBatchExpiry },
                      { label: '医保流水', done: task.hasInsuranceRecord },
                      { label: '处方照片', done: task.hasPrescriptionPhoto },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className={clsx(
                          'p-2.5 rounded-lg border text-center',
                          item.done
                            ? 'bg-green-500/5 border-green-500/20'
                            : 'bg-amber-500/5 border-amber-500/20'
                        )}
                      >
                        <p className="text-xs text-surface-200">{item.label}</p>
                        <p className={clsx('text-sm font-medium mt-0.5', item.done ? 'text-green-400' : 'text-amber-400')}>
                          {item.done ? '已完成' : '待处理'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-surface-700 pt-4 space-y-5">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      {isPharmacist || isManager ? (
                        <div className="bg-surface-900/50 rounded-lg p-4 border border-surface-700">
                          <h3 className="text-sm font-medium text-surface-50 mb-3 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                            药师意见
                          </h3>
                          {task.pharmacistOpinion ? (
                            <div className="space-y-2 text-sm">
                              <p className="text-surface-200">
                                药师: <span className="text-surface-50">{task.pharmacistOpinion.pharmacistName || '-'}</span>
                              </p>
                              <p className="text-surface-200">
                                意见: <span className="text-surface-50">{task.pharmacistOpinion.opinion}</span>
                              </p>
                              <p className="text-surface-200">
                                审核结果:
                                <span className={task.pharmacistOpinion.isApproved ? 'text-green-400 ml-1' : 'text-red-400 ml-1'}>
                                  {task.pharmacistOpinion.isApproved ? '通过' : '不通过'}
                                </span>
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <textarea
                                value={opinionText}
                                onChange={(e) => setOpinionText(e.target.value)}
                                placeholder="请输入药师意见..."
                                rows={3}
                                className="w-full px-3 py-2 bg-surface-900 border border-surface-700 rounded-lg text-sm text-surface-50 placeholder-surface-200 focus:outline-none focus:border-primary-500 resize-none"
                              />
                              <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2 text-sm text-surface-200">
                                  <input
                                    type="radio"
                                    name={`approve-${task.id}`}
                                    checked={isApproved}
                                    onChange={() => setIsApproved(true)}
                                    className="accent-green-500"
                                  />
                                  <span>通过</span>
                                </label>
                                <label className="flex items-center gap-2 text-sm text-surface-200">
                                  <input
                                    type="radio"
                                    name={`approve-${task.id}`}
                                    checked={!isApproved}
                                    onChange={() => setIsApproved(false)}
                                    className="accent-red-500"
                                  />
                                  <span>不通过</span>
                                </label>
                              </div>
                              <button
                                onClick={() => handleSubmitOpinion(task.id)}
                                disabled={isSubmittingOpinion || !opinionText.trim()}
                                className="w-full py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
                              >
                                {isSubmittingOpinion ? '提交中...' : '提交药师意见'}
                              </button>
                            </div>
                          )}
                        </div>
                      ) : null}

                      <div className="bg-surface-900/50 rounded-lg p-4 border border-surface-700">
                        <h3 className="text-sm font-medium text-surface-50 mb-3 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
                          批号效期
                        </h3>
                        {task.batchExpiry ? (
                          <div className="space-y-2 text-sm">
                            <p className="text-surface-200">
                              批号: <span className="text-surface-50 font-mono">{task.batchExpiry.batchNo}</span>
                            </p>
                            <p className="text-surface-200">
                              生产: <span className="text-surface-50">{task.batchExpiry.productionDate?.toString().split('T')[0] || '-'}</span>
                            </p>
                            <p className="text-surface-200">
                              有效期: <span className="text-surface-50">{task.batchExpiry.expiryDate?.toString().split('T')[0] || '-'}</span>
                            </p>
                            <p className="text-surface-200">
                              保质期: <span className="text-surface-50">{task.batchExpiry.shelfLife || '-'}</span>
                            </p>
                            <p className="text-surface-200">
                              核验人: <span className="text-surface-50">{task.batchExpiry.verifiedBy || '-'}</span>
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2.5">
                            <input
                              type="text"
                              value={batchNo}
                              onChange={(e) => setBatchNo(e.target.value)}
                              placeholder="批号"
                              className="w-full px-3 py-2 bg-surface-900 border border-surface-700 rounded-lg text-sm text-surface-50 placeholder-surface-200 focus:outline-none focus:border-primary-500"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-xs text-surface-200 mb-1 block">生产日期</label>
                                <input
                                  type="date"
                                  value={productionDate}
                                  onChange={(e) => setProductionDate(e.target.value)}
                                  className="w-full px-3 py-2 bg-surface-900 border border-surface-700 rounded-lg text-sm text-surface-50 focus:outline-none focus:border-primary-500"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-surface-200 mb-1 block">有效期至</label>
                                <input
                                  type="date"
                                  value={expiryDate}
                                  onChange={(e) => setExpiryDate(e.target.value)}
                                  className="w-full px-3 py-2 bg-surface-900 border border-surface-700 rounded-lg text-sm text-surface-50 focus:outline-none focus:border-primary-500"
                                />
                              </div>
                            </div>
                            <input
                              type="text"
                              value={shelfLife}
                              onChange={(e) => setShelfLife(e.target.value)}
                              placeholder="保质期（如：24个月）"
                              className="w-full px-3 py-2 bg-surface-900 border border-surface-700 rounded-lg text-sm text-surface-50 placeholder-surface-200 focus:outline-none focus:border-primary-500"
                            />
                            <button
                              onClick={() => handleSubmitBatch(task.id)}
                              disabled={isSubmittingBatch || !batchNo.trim() || !productionDate || !expiryDate || !shelfLife.trim()}
                              className="w-full py-2 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
                            >
                              {isSubmittingBatch ? '提交中...' : '录入批号效期'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
