import { AuditListTable } from '@/components/features/AuditListTable';

export default function MyTasksPage({
  searchParams,
}: {
  searchParams: any;
}) {
  return <AuditListTable scope="mine" searchParams={searchParams} />;
}
