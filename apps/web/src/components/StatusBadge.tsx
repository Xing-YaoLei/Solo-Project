import { CaseStatus } from '@legal/shared';

const statusConfig: Record<CaseStatus, { label: string; className: string }> = {
  [CaseStatus.MATERIAL_SUBMITTED]: { label: '材料已提交', className: 'bg-blue-100 text-blue-800' },
  [CaseStatus.ASSISTANT_REVIEWING]: { label: '助理审核中', className: 'bg-indigo-100 text-indigo-800' },
  [CaseStatus.IDENTITY_VERIFIED]: { label: '身份已核验', className: 'bg-cyan-100 text-cyan-800' },
  [CaseStatus.CONFLICT_CHECKING]: { label: '冲突检查中', className: 'bg-amber-100 text-amber-800' },
  [CaseStatus.CONFLICT_PASSED]: { label: '冲突检查通过', className: 'bg-green-100 text-green-800' },
  [CaseStatus.CONFLICT_FAILED]: { label: '冲突检查未通过', className: 'bg-red-100 text-red-800' },
  [CaseStatus.EVIDENCE_REVIEWING]: { label: '证据审查中', className: 'bg-purple-100 text-purple-800' },
  [CaseStatus.MATERIAL_INCOMPLETE]: { label: '材料不完整', className: 'bg-orange-100 text-orange-800' },
  [CaseStatus.LAWYER_ASSIGNING]: { label: '律师指派中', className: 'bg-violet-100 text-violet-800' },
  [CaseStatus.LAWYER_SUPPLEMENTING]: { label: '律师补充中', className: 'bg-fuchsia-100 text-fuchsia-800' },
  [CaseStatus.CASE_ACTIVE]: { label: '案件进行中', className: 'bg-green-100 text-green-800' },
  [CaseStatus.CASE_CLOSED]: { label: '已结案', className: 'bg-slate-100 text-slate-700' },
  [CaseStatus.CASE_ARCHIVED]: { label: '已归档', className: 'bg-gray-100 text-gray-600' },
};

interface StatusBadgeProps {
  status: CaseStatus;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-800' };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'
      } ${config.className}`}
    >
      {config.label}
    </span>
  );
}
