'use client';

import { useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  CaseType,
  CaseStage,
  FeeType,
  MaterialType,
  MaterialStatus,
  PaymentStatus,
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

function getFileUrl(fileUrl: string): string {
  if (!fileUrl) return '#';
  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://') || fileUrl.startsWith('blob:')) {
    return fileUrl;
  }
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  return `${base}${fileUrl}`;
}

const paymentStatusConfig: Record<PaymentStatus, { label: string; className: string }> = {
  [PaymentStatus.UNPAID]: { label: '未付款', className: 'bg-slate-100 text-slate-700' },
  [PaymentStatus.PARTIAL]: { label: '部分付款', className: 'bg-amber-100 text-amber-700' },
  [PaymentStatus.PAID]: { label: '已付款', className: 'bg-green-100 text-green-700' },
  [PaymentStatus.OVERDUE]: { label: '逾期', className: 'bg-red-100 text-red-700' },
  [PaymentStatus.REFUNDED]: { label: '已退款', className: 'bg-gray-100 text-gray-600' },
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
  const [actionMsg, setActionMsg] = useState('');

  const showMsg = (msg: string) => {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(''), 3000);
  };

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
        <p className="text-slate-400 mb-4">案件不存在或需要登录后查看</p>
        <Link href="/login" className="text-blue-600 hover:text-blue-700 text-sm font-medium mr-4">
          去登录
        </Link>
        <Link href="/cases" className="text-slate-500 hover:text-slate-700 text-sm font-medium">
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
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-800">{caseDetail.title}</h1>
            <StatusBadge status={caseDetail.status} size="md" />
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                paymentStatusConfig[caseDetail.paymentStatus]?.className || 'bg-gray-100 text-gray-600'
              }`}
            >
              {paymentStatusConfig[caseDetail.paymentStatus]?.label || caseDetail.paymentStatus}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            编号: {caseDetail.id.slice(0, 8).toUpperCase()} · 创建于{' '}
            {new Date(caseDetail.createdAt).toLocaleDateString('zh-CN')}
          </p>
        </div>
      </div>

      {actionMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2.5 rounded-lg text-sm">
          {actionMsg}
        </div>
      )}

      <div className="border-b border-slate-200">
        <nav className="flex gap-0 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
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

      {activeTab === 'overview' && <OverviewTab detail={caseDetail} onNotify={showMsg} onRefetch={refetch} />}
      {activeTab === 'materials' && <MaterialsTab detail={caseDetail} onNotify={showMsg} onRefetch={refetch} />}
      {activeTab === 'review' && <ReviewTab detail={caseDetail} onNotify={showMsg} onRefetch={refetch} />}
      {activeTab === 'timeline' && <TimelineTab detail={caseDetail} />}
      {activeTab === 'conflict' && <ConflictTab detail={caseDetail} onNotify={showMsg} onRefetch={refetch} />}
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

function OverviewTab({ detail, onNotify, onRefetch }: { detail: CaseDetailDTO; onNotify: (m: string) => void; onRefetch: () => void }) {
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(detail.paymentStatus);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [savingPayment, setSavingPayment] = useState(false);

  const handleSavePayment = async () => {
    setSavingPayment(true);
    try {
      await api.patch(`/cases/${detail.id}/payment-status`, {
        paymentStatus,
        paymentMethod: paymentMethod || undefined,
        note: paymentNote || undefined,
      });
      onNotify('回款状态已更新');
      onRefetch();
    } catch (e: any) {
      onNotify(e.response?.data?.message || '更新失败');
    } finally {
      setSavingPayment(false);
    }
  };

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
          <InfoRow label="回款状态" value={
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${paymentStatusConfig[detail.paymentStatus]?.className || ''}`}>
              {paymentStatusConfig[detail.paymentStatus]?.label || detail.paymentStatus}
            </span>
          } />
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

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden lg:col-span-2">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-800">承办 & 回款</h3>
        </div>
        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="divide-y divide-slate-100">
            <InfoRow label="承办律师" value={detail.lawyerName} />
            <InfoRow label="助理" value={detail.assistantName} />
            <InfoRow label="收费方式" value={detail.feeType ? feeTypeLabels[detail.feeType] : '-'} />
            <InfoRow label="约定费用" value={detail.feeAmount ? `¥${Number(detail.feeAmount).toLocaleString()}` : '-'} />
            <InfoRow label="庭审地点" value={detail.trialLocation} />
            <InfoRow
              label="下次庭审"
              value={detail.nextTrialDate ? new Date(detail.nextTrialDate).toLocaleString('zh-CN') : '-'}
            />
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">回款状态</label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {Object.entries(paymentStatusConfig).map(([value, cfg]) => (
                  <option key={value} value={value}>{cfg.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">付款方式（选填）</label>
              <input
                type="text"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                placeholder="如：银行转账、支付宝、微信..."
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">备注（选填）</label>
              <textarea
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
                rows={2}
                placeholder="回款备注..."
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
            </div>
            <button
              onClick={handleSavePayment}
              disabled={savingPayment}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              {savingPayment ? '保存中...' : '保存回款状态'}
            </button>
          </div>
        </div>
        {detail.riskWarnings && detail.riskWarnings.length > 0 && (
          <div className="border-t border-slate-100 p-6">
            <h4 className="text-sm font-medium text-slate-700 mb-3">风险提示</h4>
            <ul className="space-y-1.5">
              {detail.riskWarnings.map((w, i) => (
                <li key={i} className="text-sm text-amber-700 flex items-start gap-2">
                  <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                  {w}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function MaterialsTab({ detail, onNotify, onRefetch }: { detail: CaseDetailDTO; onNotify: (m: string) => void; onRefetch: () => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [resubmitMaterialId, setResubmitMaterialId] = useState<string | null>(null);
  const [showAddMissing, setShowAddMissing] = useState(false);
  const [showMarkMissingPages, setShowMarkMissingPages] = useState<string | null>(null);
  const [missingPagesInput, setMissingPagesInput] = useState('');
  const [missingNote, setMissingNote] = useState('');
  const [newMissingMaterial, setNewMissingMaterial] = useState({
    name: '',
    materialType: MaterialType.EVIDENCE_DOC,
    note: '',
  });
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleApprove = async (materialId: string) => {
    try {
      await api.post(`/cases/${detail.id}/materials/${materialId}/approve`);
      onNotify('材料已通过审核');
      onRefetch();
    } catch (e: any) {
      onNotify(e.response?.data?.message || '操作失败');
    }
  };

  const handleReject = async (materialId: string) => {
    const note = prompt('请输入驳回原因：');
    if (note === null) return;
    try {
      await api.post(`/cases/${detail.id}/materials/${materialId}/reject`, { note });
      onNotify('材料已驳回');
      onRefetch();
    } catch (e: any) {
      onNotify(e.response?.data?.message || '操作失败');
    }
  };

  const handleResubmitClick = (materialId: string) => {
    setResubmitMaterialId(materialId);
    fileInputRef.current?.click();
  };

  const handleResubmitFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !resubmitMaterialId) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      await api.post(`/cases/${detail.id}/materials/${resubmitMaterialId}/resubmit`, {
        fileUrl: data.fileUrl,
        fileSize: data.fileSize,
      });
      onNotify('材料已重新提交');
      onRefetch();
    } catch (e: any) {
      onNotify(e.response?.data?.message || '操作失败');
    } finally {
      setUploading(false);
      setResubmitMaterialId(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleMarkMissingPages = async (materialId: string) => {
    const pages = missingPagesInput
      .split(/[,，\s]+/)
      .map((s) => parseInt(s.trim()))
      .filter((n) => !isNaN(n) && n > 0);

    if (pages.length === 0) {
      onNotify('请输入有效的页码');
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/cases/${detail.id}/materials/${materialId}/mark-missing-pages`, {
        missingPages: pages,
        note: missingNote,
      });
      onNotify('缺页已标记，补传提醒已发送');
      onRefetch();
      setShowMarkMissingPages(null);
      setMissingPagesInput('');
      setMissingNote('');
    } catch (e: any) {
      onNotify(e.response?.data?.message || '操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddMissingMaterial = async () => {
    if (!newMissingMaterial.name.trim()) {
      onNotify('请输入材料名称');
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/cases/${detail.id}/materials/add-missing`, {
        name: newMissingMaterial.name,
        materialType: newMissingMaterial.materialType,
        note: newMissingMaterial.note,
      });
      onNotify('缺失材料已添加，补传提醒已发送');
      onRefetch();
      setShowAddMissing(false);
      setNewMissingMaterial({ name: '', materialType: MaterialType.EVIDENCE_DOC, note: '' });
    } catch (e: any) {
      onNotify(e.response?.data?.message || '操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleResubmitFile}
      />

      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-slate-700">材料清单</h3>
        <button
          onClick={() => setShowAddMissing(true)}
          className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          添加缺失材料
        </button>
      </div>

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
                    <td className="px-5 py-3 text-slate-800 font-medium">
                      {material.fileUrl ? (
                        <a
                          href={getFileUrl(material.fileUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700"
                        >
                          {material.name}
                        </a>
                      ) : (
                        <span className="text-slate-600">{material.name}</span>
                      )}
                    </td>
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
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        <button
                          onClick={() => {
                            setShowMarkMissingPages(material.id);
                            setMissingPagesInput(material.missingPages?.join(', ') || '');
                          }}
                          className="text-orange-600 hover:text-orange-700 text-xs font-medium px-2 py-1 rounded hover:bg-orange-50"
                          title="标记缺页"
                        >
                          标记缺页
                        </button>
                        {(material.status === MaterialStatus.PENDING ||
                          material.status === MaterialStatus.RESUBMITTED ||
                          material.status === MaterialStatus.MISSING) && (
                          <>
                            <button
                              onClick={() => handleApprove(material.id)}
                              className="text-green-600 hover:text-green-700 text-xs font-medium px-2 py-1 rounded hover:bg-green-50"
                            >
                              通过
                            </button>
                            <button
                              onClick={() => handleReject(material.id)}
                              className="text-red-600 hover:text-red-700 text-xs font-medium px-2 py-1 rounded hover:bg-red-50"
                            >
                              驳回
                            </button>
                          </>
                        )}
                        {(material.status === MaterialStatus.REJECTED || material.status === MaterialStatus.MISSING) && (
                          <button
                            onClick={() => handleResubmitClick(material.id)}
                            disabled={uploading && resubmitMaterialId === material.id}
                            className="text-blue-600 hover:text-blue-700 text-xs font-medium px-2 py-1 rounded hover:bg-blue-50 disabled:opacity-50"
                          >
                            {uploading && resubmitMaterialId === material.id ? '上传中...' : '重新提交'}
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

      {showAddMissing && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">添加缺失材料</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">材料名称</label>
                <input
                  type="text"
                  value={newMissingMaterial.name}
                  onChange={(e) => setNewMissingMaterial({ ...newMissingMaterial, name: e.target.value })}
                  placeholder="如：身份证复印件、授权委托书..."
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">材料类型</label>
                <select
                  value={newMissingMaterial.materialType}
                  onChange={(e) => setNewMissingMaterial({ ...newMissingMaterial, materialType: e.target.value as MaterialType })}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  {Object.entries(materialTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">备注（选填）</label>
                <textarea
                  value={newMissingMaterial.note}
                  onChange={(e) => setNewMissingMaterial({ ...newMissingMaterial, note: e.target.value })}
                  rows={2}
                  placeholder="补充说明..."
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddMissing(false);
                  setNewMissingMaterial({ name: '', materialType: MaterialType.EVIDENCE_DOC, note: '' });
                }}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
              >
                取消
              </button>
              <button
                onClick={handleAddMissingMaterial}
                disabled={submitting}
                className="bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {submitting ? '提交中...' : '添加并通知'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showMarkMissingPages && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">标记缺页</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">缺失页码</label>
                <input
                  type="text"
                  value={missingPagesInput}
                  onChange={(e) => setMissingPagesInput(e.target.value)}
                  placeholder="如：3, 5, 7-9 或 3 5 7"
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
                <p className="text-xs text-slate-500 mt-1">用逗号、空格或顿号分隔多个页码</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">备注（选填）</label>
                <textarea
                  value={missingNote}
                  onChange={(e) => setMissingNote(e.target.value)}
                  rows={2}
                  placeholder="缺页原因或说明..."
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowMarkMissingPages(null);
                  setMissingPagesInput('');
                  setMissingNote('');
                }}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
              >
                取消
              </button>
              <button
                onClick={() => handleMarkMissingPages(showMarkMissingPages)}
                disabled={submitting}
                className="bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {submitting ? '提交中...' : '标记并通知'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ReviewTab({ detail, onNotify, onRefetch }: { detail: CaseDetailDTO; onNotify: (m: string) => void; onRefetch: () => void }) {
  const [reviewForm, setReviewForm] = useState({
    identityVerified: false,
    identityNote: '',
    evidenceChecklistComplete: false,
    evidenceNote: '',
    reviewNote: '',
    materialsApproved: [] as string[],
    materialsRejected: [] as string[],
    materialsMissing: [] as MissingMaterialDTO[],
  });

  const [supplementForm, setSupplementForm] = useState({
    caseStage: CaseStage.PRE_TRIAL,
    trialDate: '',
    trialLocation: '',
    feeType: FeeType.HOURLY,
    feeAmount: String(detail.feeAmount || ''),
    feeNote: detail.feeNote || '',
    riskWarnings: [...(detail.riskWarnings || [])],
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
        materialsMissing: reviewForm.materialsMissing,
        reviewNote: reviewForm.reviewNote || undefined,
      };
      await api.post(`/cases/${detail.id}/assistant-review`, payload);
      onNotify('助理审核已提交');
      onRefetch();
    } catch (e: any) {
      onNotify(e.response?.data?.message || '提交失败');
    }
  };

  const handleLawyerSupplement = async () => {
    if (!supplementForm.feeAmount) {
      onNotify('请填写费用金额');
      return;
    }
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
      onNotify('律师补充信息已保存，案件已进入进行中状态');
      onRefetch();
    } catch (e: any) {
      onNotify(e.response?.data?.message || '提交失败');
    }
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
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800">助理审核</h3>
          <span className="text-xs text-slate-500">核对身份 + 证据清单 + 材料审核</span>
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
              <h4 className="text-sm font-medium text-slate-700">材料审核（通过/驳回切换）</h4>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg">
                {detail.materials.map((material) => (
                  <div key={material.id} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-800">{material.name}</p>
                      <p className="text-xs text-slate-500">
                        {materialTypeLabels[material.type]} · v{material.version} · 页数: {material.pageTotal || '未知'}
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
              placeholder="整体审核备注（选填，若材料不完整请写入要求）"
              rows={3}
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>

          <div className="rounded-lg bg-blue-50 border border-blue-100 p-4">
            <p className="text-xs text-blue-700 leading-relaxed">
              <strong>提交结果：</strong>若身份核验 × 或证据清单 × 或存在待审核/缺失材料 → 状态转为「材料不完整」，客户会收到补传通知；
              全部通过 → 自动触发利益冲突检查。
            </p>
          </div>

          <button
            onClick={handleAssistantReview}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            提交审核结果
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800">律师补充</h3>
          <span className="text-xs text-slate-500">冲突检查通过后，设定阶段/庭审/费用</span>
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
              <label className="block text-sm font-medium text-slate-700 mb-1.5">费用金额（元）</label>
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
            <label className="block text-sm font-medium text-slate-700 mb-1.5">费用备注</label>
            <textarea
              value={supplementForm.feeNote}
              onChange={(e) => setSupplementForm({ ...supplementForm, feeNote: e.target.value })}
              rows={2}
              placeholder="费用说明（选填）"
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">风险提示</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newRiskWarning}
                onChange={(e) => setNewRiskWarning(e.target.value)}
                placeholder="输入风险提示内容，回车或点添加"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newRiskWarning.trim()) {
                    e.preventDefault();
                    setSupplementForm({
                      ...supplementForm,
                      riskWarnings: [...supplementForm.riskWarnings, newRiskWarning.trim()],
                    });
                    setNewRiskWarning('');
                  }
                }}
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
            提交补充信息（案件转入进行中）
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

function ConflictTab({ detail, onNotify, onRefetch }: { detail: CaseDetailDTO; onNotify: (m: string) => void; onRefetch: () => void }) {
  const handleArchive = async (checkId: string) => {
    if (!confirm('确认将此冲突检查结果永久归档？归档后将不可修改，用于后续委托争议存证。')) return;
    try {
      await api.post(`/conflict-checks/${checkId}/archive`, {
        archivePath: `/archives/conflict/${detail.id}/${checkId}.pdf`,
      });
      onNotify('冲突检查结果已独立归档');
      onRefetch();
    } catch (e: any) {
      onNotify(e.response?.data?.message || '归档失败');
    }
  };

  const handlePerformCheck = async () => {
    try {
      await api.post(`/cases/${detail.id}/conflict-checks`, {});
      onNotify('冲突检查已完成');
      onRefetch();
    } catch (e: any) {
      onNotify(e.response?.data?.message || '检查失败');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={handlePerformCheck}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          立即执行冲突检查
        </button>
      </div>
      {detail.conflictChecks && detail.conflictChecks.length > 0 ? (
        detail.conflictChecks.map((check) => (
          <ConflictCheckCard key={check.id} check={check as any} onArchive={() => handleArchive(check.id)} />
        ))
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <svg className="mx-auto w-12 h-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
          <p className="mt-3 text-sm text-slate-400">暂无冲突检查记录，点击右上角「立即执行冲突检查」开始</p>
        </div>
      )}
    </div>
  );
}
