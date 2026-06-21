'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  CaseType,
  CaseStage,
  FeeType,
  MaterialType,
  MaterialStatus,
} from '@legal/shared';
import type {
  CaseDetailDTO,
  AssistantReviewDTO,
  LawyerSupplementDTO,
  MissingMaterialDTO,
} from '@legal/shared';
import { useCaseDetail } from '@/lib/hooks';
import api from '@/lib/api';
import StatusBadge from '@/components/StatusBadge';
import TimelineView from '@/components/TimelineView';
import ConflictCheckCard from '@/components/ConflictCheckCard';

const caseTypeLabels: Record<CaseType, string> = {
  [CaseType.CIVIL]: '民事',
  [CaseType.CRIMINAL]: '刑事',
  [CaseType.ADMINISTRATIVE]: '行政',
  [CaseType.ARBITRATION]: '仲裁',
  [CaseType.LABOR]: '劳动',
  [CaseType.INTELLECTUAL_PROPERTY]: '知识产权',
  [CaseType.CONTRACT]: '合同',
  [CaseType.TORT]: '侵权',
  [CaseType.FAMILY]: '家事',
  [CaseType.REAL_ESTATE]: '房产',
  [CaseType.CORPORATE]: '公司',
  [CaseType.OTHER]: '其他',
};

const caseStageLabels: Record<CaseStage, string> = {
  [CaseStage.PRE_TRIAL]: '诉前',
  [CaseStage.FILING]: '立案',
  [CaseStage.DISCOVERY]: '证据发现',
  [CaseStage.MEDIATION]: '调解',
  [CaseStage.TRIAL]: '审理',
  [CaseStage.APPEAL]: '上诉',
  [CaseStage.ENFORCEMENT]: '执行',
  [CaseStage.SETTLEMENT]: '和解',
};

const feeTypeLabels: Record<FeeType, string> = {
  [FeeType.HOURLY]: '计时收费',
  [FeeType.FIXED]: '固定收费',
  [FeeType.CONTINGENCY]: '风险代理',
  [FeeType.RETAINER]: '常年顾问',
  [FeeType.MIXED]: '混合收费',
};

const materialTypeLabels: Record<MaterialType, string> = {
  [MaterialType.ID_CARD]: '身份证件',
  [MaterialType.POWER_OF_ATTORNEY]: '授权委托书',
  [MaterialType.EVIDENCE_DOC]: '证据材料',
  [MaterialType.CONTRACT]: '合同',
  [MaterialType.COURT_DOCUMENT]: '法院文书',
  [MaterialType.FINANCIAL_RECORD]: '财务记录',
  [MaterialType.CORRESPONDENCE]: '往来函件',
  [MaterialType.PHOTO]: '照片',
  [MaterialType.VIDEO]: '视频',
  [MaterialType.AUDIO]: '音频',
  [MaterialType.OTHER]: '其他',
};

const materialStatusConfig: Record<MaterialStatus, { label: string; className: string }> = {
  [MaterialStatus.PENDING]: { label: '待审核', className: 'bg-blue-100 text-blue-700' },
  [MaterialStatus.APPROVED]: { label: '已通过', className: 'bg-green-100 text-green-700' },
  [MaterialStatus.REJECTED]: { label: '已驳回', className: 'bg-red-100 text-red-700' },
  [MaterialStatus.MISSING]: { label: '缺失', className: 'bg-orange-100 text-orange-700' },
  [MaterialStatus.RESUBMITTED]: { label: '已重新提交', className: 'bg-purple-100 text-purple-700' },
};

const tabs = [
  { id: 'overview', label: '案件概览' },
  { id: 'materials', label: '材料清单' },
  { id: 'review', label: '审核工作流' },
  { id: 'timeline', label: '时间轴' },
  { id: 'conflict', label: '冲突检查' },
];

export default function CaseDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: caseDetail, loading, refetch } = useCaseDetail(id);
  const [activeTab, setActiveTab] = useState('overview');

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <p className="text-slate-400">加载中...</p>
      </div>
    );
  }

  if (!caseDetail) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-slate-400 mb-4">案件不存在</p>
        <Link href="/cases" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
          返回案件列表
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/cases" className="text-slate-400 hover:text-slate-600 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-800">{caseDetail.title}</h1>
            <StatusBadge status={caseDetail.status} size="md" />
          </div>
          <p className="text-sm text-slate-500 mt-1">
            编号: {caseDetail.id.slice(0, 8).toUpperCase()} · 创建于{' '}
            {new Date(caseDetail.createdAt).toLocaleDateString('zh-CN')}
          </p>
        </div>
      </div>

      <div className="border-b border-slate-200">
        <nav className="flex gap-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'overview' && <OverviewTab detail={caseDetail} />}
      {activeTab === 'materials' && <MaterialsTab detail={caseDetail} onRefetch={refetch} />}
      {activeTab === 'review' && <ReviewTab detail={caseDetail} onRefetch={refetch} />}
      {activeTab === 'timeline' && <TimelineTab detail={caseDetail} />}
      {activeTab === 'conflict' && <ConflictTab detail={caseDetail} onRefetch={refetch} />}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex py-3">
      <span className="w-32 shrink-0 text-sm text-slate-500">{label}</span>
      <span className="text-sm text-slate-800">{value || '-'}</span>
    </div>
  );
}

function OverviewTab({ detail }: { detail: CaseDetailDTO }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-800">基本信息</h3>
        </div>
        <div className="px-6 divide-y divide-slate-100">
          <InfoRow label="案件名称" value={detail.title} />
          <InfoRow label="案件类型" value={caseTypeLabels[detail.caseType]} />
          <InfoRow label="案件阶段" value={detail.caseStage ? caseStageLabels[detail.caseStage] : '-'} />
          <InfoRow label="状态" value={<StatusBadge status={detail.status} />} />
          <InfoRow label="创建时间" value={new Date(detail.createdAt).toLocaleString('zh-CN')} />
          <InfoRow label="更新时间" value={new Date(detail.updatedAt).toLocaleString('zh-CN')} />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-800">当事人信息</h3>
        </div>
        <div className="px-6 divide-y divide-slate-100">
          <InfoRow label="委托人" value={detail.clientName} />
          <InfoRow label="身份证号" value={detail.clientIdNumber} />
          <InfoRow label="联系电话" value={detail.clientPhone} />
          <InfoRow label="电子邮箱" value={detail.clientEmail} />
          <InfoRow label="对方当事人" value={detail.opposingPartyName} />
          <InfoRow label="对方证件号" value={detail.opposingPartyIdNumber} />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden lg:col-span-2">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-800">案件描述</h3>
        </div>
        <div className="px-6 py-4">
          <p className="text-sm text-slate-700 whitespace-pre-wrap">{detail.description}</p>
        </div>
      </div>

      {(detail.lawyerName || detail.assistantName || detail.feeType) && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden lg:col-span-2">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
            <h3 className="text-sm font-semibold text-slate-800">承办信息</h3>
          </div>
          <div className="px-6 divide-y divide-slate-100">
            <InfoRow label="承办律师" value={detail.lawyerName} />
            <InfoRow label="助理" value={detail.assistantName} />
            <InfoRow label="收费方式" value={detail.feeType ? feeTypeLabels[detail.feeType] : '-'} />
            <InfoRow label="庭审地点" value={detail.trialLocation} />
            <InfoRow
              label="下次庭审"
              value={detail.nextTrialDate ? new Date(detail.nextTrialDate).toLocaleString('zh-CN') : '-'}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function MaterialsTab({ detail, onRefetch }: { detail: CaseDetailDTO; onRefetch: () => void }) {
  const handleApprove = async (materialId: string) => {
    try {
      await api.post(`/cases/${detail.id}/materials/${materialId}/approve`);
      onRefetch();
    } catch {}
  };

  const handleReject = async (materialId: string) => {
    try {
      await api.post(`/cases/${detail.id}/materials/${materialId}/reject`);
      onRefetch();
    } catch {}
  };

  const handleResubmit = async (materialId: string) => {
    try {
      await api.post(`/cases/${detail.id}/materials/${materialId}/resubmit`);
      onRefetch();
    } catch {}
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-5 py-3 font-medium text-slate-500">材料名称</th>
              <th className="text-left px-5 py-3 font-medium text-slate-500">类型</th>
              <th className="text-left px-5 py-3 font-medium text-slate-500">状态</th>
              <th className="text-left px-5 py-3 font-medium text-slate-500">版本</th>
              <th className="text-left px-5 py-3 font-medium text-slate-500">页数</th>
              <th className="text-left px-5 py-3 font-medium text-slate-500">上传时间</th>
              <th className="text-left px-5 py-3 font-medium text-slate-500">审核备注</th>
              <th className="text-right px-5 py-3 font-medium text-slate-500">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {detail.materials.length === 0 && (
              <tr>
                <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                  暂无材料
                </td>
              </tr>
            )}
            {detail.materials.map((material) => {
              const statusConfig = materialStatusConfig[material.status] || {
                label: material.status,
                className: 'bg-gray-100 text-gray-600',
              };

              return (
                <tr key={material.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 text-slate-800 font-medium">{material.name}</td>
                  <td className="px-5 py-3 text-slate-600">
                    {materialTypeLabels[material.type] || material.type}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.className}`}
                    >
                      {statusConfig.label}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-600">v{material.version}</td>
                  <td className="px-5 py-3 text-slate-600">
                    {material.pageTotal || '-'}
                    {material.missingPages && material.missingPages.length > 0 && (
                      <span className="text-orange-500 text-xs ml-1">
                        (缺{material.missingPages.join(',')}页)
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-slate-600">
                    {new Date(material.uploadedAt).toLocaleDateString('zh-CN')}
                  </td>
                  <td className="px-5 py-3 text-slate-600 max-w-[150px] truncate">
                    {material.reviewNote || '-'}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {(material.status === MaterialStatus.PENDING ||
                        material.status === MaterialStatus.RESUBMITTED) && (
                        <>
                          <button
                            onClick={() => handleApprove(material.id)}
                            className="text-green-600 hover:text-green-700 text-xs font-medium"
                          >
                            通过
                          </button>
                          <button
                            onClick={() => handleReject(material.id)}
                            className="text-red-600 hover:text-red-700 text-xs font-medium"
                          >
                            驳回
                          </button>
                        </>
                      )}
                      {material.status === MaterialStatus.REJECTED && (
                        <button
                          onClick={() => handleResubmit(material.id)}
                          className="text-blue-600 hover:text-blue-700 text-xs font-medium"
                        >
                          重新提交
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ReviewTab({ detail, onRefetch }: { detail: CaseDetailDTO; onRefetch: () => void }) {
  const [reviewForm, setReviewForm] = useState({
    identityVerified: false,
    identityNote: '',
    evidenceChecklistComplete: false,
    evidenceNote: '',
    reviewNote: '',
    materialsApproved: [] as string[],
    materialsRejected: [] as string[],
  });

  const [supplementForm, setSupplementForm] = useState({
    caseStage: CaseStage.PRE_TRIAL,
    trialDate: '',
    trialLocation: '',
    feeType: FeeType.HOURLY,
    feeAmount: '',
    feeNote: '',
    riskWarnings: [] as string[],
    supplementNote: '',
  });

  const [newRiskWarning, setNewRiskWarning] = useState('');

  const handleAssistantReview = async () => {
    try {
      const payload: AssistantReviewDTO = {
        caseId: detail.id,
        identityVerified: reviewForm.identityVerified,
        identityNote: reviewForm.identityNote || undefined,
        evidenceChecklistComplete: reviewForm.evidenceChecklistComplete,
        evidenceNote: reviewForm.evidenceNote || undefined,
        materialsApproved: reviewForm.materialsApproved,
        materialsRejected: reviewForm.materialsRejected,
        materialsMissing: [],
        reviewNote: reviewForm.reviewNote || undefined,
      };
      await api.post(`/cases/${detail.id}/assistant-review`, payload);
      onRefetch();
    } catch {}
  };

  const handleLawyerSupplement = async () => {
    try {
      const payload: LawyerSupplementDTO = {
        caseId: detail.id,
        caseStage: supplementForm.caseStage,
        trialDate: supplementForm.trialDate || undefined,
        trialLocation: supplementForm.trialLocation || undefined,
        feeType: supplementForm.feeType,
        feeAmount: Number(supplementForm.feeAmount),
        feeNote: supplementForm.feeNote || undefined,
        riskWarnings: supplementForm.riskWarnings,
        supplementNote: supplementForm.supplementNote || undefined,
      };
      await api.post(`/cases/${detail.id}/lawyer-supplement`, payload);
      onRefetch();
    } catch {}
  };

  const toggleMaterialApprove = (materialId: string) => {
    setReviewForm((prev) => ({
      ...prev,
      materialsApproved: prev.materialsApproved.includes(materialId)
        ? prev.materialsApproved.filter((id) => id !== materialId)
        : [...prev.materialsApproved, materialId],
      materialsRejected: prev.materialsRejected.filter((id) => id !== materialId),
    }));
  };

  const toggleMaterialReject = (materialId: string) => {
    setReviewForm((prev) => ({
      ...prev,
      materialsRejected: prev.materialsRejected.includes(materialId)
        ? prev.materialsRejected.filter((id) => id !== materialId)
        : [...prev.materialsRejected, materialId],
      materialsApproved: prev.materialsApproved.filter((id) => id !== materialId),
    }));
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-800">助理审核</h3>
        </div>
        <div className="p-6 space-y-5">
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-slate-700">身份核验</h4>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={reviewForm.identityVerified}
                onChange={(e) =>
                  setReviewForm({ ...reviewForm, identityVerified: (e.target as HTMLInputElement).checked })
                }
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700">委托人身份已核验</span>
            </label>
            <textarea
              value={reviewForm.identityNote}
              onChange={(e) => setReviewForm({ ...reviewForm, identityNote: e.target.value })}
              placeholder="身份核验备注（选填）"
              rows={2}
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-medium text-slate-700">证据清单</h4>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={reviewForm.evidenceChecklistComplete}
                onChange={(e) =>
                  setReviewForm({ ...reviewForm, evidenceChecklistComplete: (e.target as HTMLInputElement).checked })
                }
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700">证据清单已完整</span>
            </label>
            <textarea
              value={reviewForm.evidenceNote}
              onChange={(e) => setReviewForm({ ...reviewForm, evidenceNote: e.target.value })}
              placeholder="证据审查备注（选填）"
              rows={2}
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>

          {detail.materials.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-slate-700">材料审核</h4>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg">
                {detail.materials.map((material) => (
                  <div key={material.id} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-800">{material.name}</p>
                      <p className="text-xs text-slate-500">
                        {materialTypeLabels[material.type]} · v{material.version}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => toggleMaterialApprove(material.id)}
                        className={`px-3 py-1 text-xs font-medium rounded-md border transition-colors ${
                          reviewForm.materialsApproved.includes(material.id)
                            ? 'bg-green-100 border-green-300 text-green-700'
                            : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        通过
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleMaterialReject(material.id)}
                        className={`px-3 py-1 text-xs font-medium rounded-md border transition-colors ${
                          reviewForm.materialsRejected.includes(material.id)
                            ? 'bg-red-100 border-red-300 text-red-700'
                            : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        驳回
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">审核备注</label>
            <textarea
              value={reviewForm.reviewNote}
              onChange={(e) => setReviewForm({ ...reviewForm, reviewNote: e.target.value })}
              placeholder="审核备注（选填）"
              rows={3}
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>

          <button
            onClick={handleAssistantReview}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            提交审核
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-800">律师补充</h3>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">案件阶段</label>
              <select
                value={supplementForm.caseStage}
                onChange={(e) =>
                  setSupplementForm({
                    ...supplementForm,
                    caseStage: e.target.value as CaseStage,
                  })
                }
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {Object.entries(caseStageLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">收费方式</label>
              <select
                value={supplementForm.feeType}
                onChange={(e) =>
                  setSupplementForm({
                    ...supplementForm,
                    feeType: e.target.value as FeeType,
                  })
                }
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {Object.entries(feeTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">庭审日期</label>
              <input
                type="date"
                value={supplementForm.trialDate}
                onChange={(e) =>
                  setSupplementForm({ ...supplementForm, trialDate: e.target.value })
                }
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">庭审地点</label>
              <input
                type="text"
                value={supplementForm.trialLocation}
                onChange={(e) =>
                  setSupplementForm({ ...supplementForm, trialLocation: e.target.value })
                }
                placeholder="请输入庭审地点"
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">费用金额</label>
              <input
                type="number"
                value={supplementForm.feeAmount}
                onChange={(e) =>
                  setSupplementForm({ ...supplementForm, feeAmount: e.target.value })
                }
                placeholder="请输入费用金额"
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">风险提示</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newRiskWarning}
                onChange={(e) => setNewRiskWarning(e.target.value)}
                placeholder="输入风险提示内容"
                className="flex-1 border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => {
                  if (newRiskWarning.trim()) {
                    setSupplementForm({
                      ...supplementForm,
                      riskWarnings: [...supplementForm.riskWarnings, newRiskWarning.trim()],
                    });
                    setNewRiskWarning('');
                  }
                }}
                className="px-4 py-2.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                添加
              </button>
            </div>
            {supplementForm.riskWarnings.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {supplementForm.riskWarnings.map((warning, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-md px-3 py-2"
                  >
                    <span className="text-xs text-amber-700 flex-1">{warning}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setSupplementForm({
                          ...supplementForm,
                          riskWarnings: supplementForm.riskWarnings.filter((_, i) => i !== index),
                        })
                      }
                      className="text-amber-500 hover:text-amber-700"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">补充说明</label>
            <textarea
              value={supplementForm.supplementNote}
              onChange={(e) =>
                setSupplementForm({ ...supplementForm, supplementNote: e.target.value })
              }
              placeholder="补充说明（选填）"
              rows={3}
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>

          <button
            onClick={handleLawyerSupplement}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            提交补充信息
          </button>
        </div>
      </div>
    </div>
  );
}

function TimelineTab({ detail }: { detail: CaseDetailDTO }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <TimelineView events={detail.timeline || []} />
    </div>
  );
}

function ConflictTab({ detail, onRefetch }: { detail: CaseDetailDTO; onRefetch: () => void }) {
  const handleArchive = async () => {
    try {
      await api.post(`/cases/${detail.id}/conflict-check/archive`);
      onRefetch();
    } catch {}
  };

  return (
    <div className="space-y-4">
      {detail.conflictChecks && detail.conflictChecks.length > 0 ? (
        detail.conflictChecks.map((check, index) => (
          <ConflictCheckCard key={index} check={check} onArchive={handleArchive} />
        ))
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <svg className="mx-auto w-12 h-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
          <p className="mt-3 text-sm text-slate-400">暂无冲突检查记录</p>
        </div>
      )}
    </div>
  );
}
