import clsx from 'clsx';

interface StatusPillProps {
  status: 'pending' | 'approved' | 'rejected' | 'materials_missing' | 'submitted' | 'missing' | 'verified';
  size?: 'sm' | 'md';
}

const statusConfig = {
  pending: { label: '待审核', className: 'status-pending' },
  approved: { label: '已通过', className: 'status-approved' },
  rejected: { label: '已拒绝', className: 'status-rejected' },
  materials_missing: { label: '材料缺失', className: 'status-missing' },
  submitted: { label: '已提交', className: 'status-approved' },
  missing: { label: '缺失', className: 'status-missing' },
  verified: { label: '已核验', className: 'status-pending' },
};

export default function StatusPill({ status, size = 'md' }: StatusPillProps) {
  const config = statusConfig[status];

  return (
    <span
      className={clsx(
        'status-pill',
        config.className,
        size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs'
      )}
    >
      {config.label}
    </span>
  );
}
