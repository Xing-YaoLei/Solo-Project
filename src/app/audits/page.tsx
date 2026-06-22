import { AuditListTable } from '@/components/features/AuditListTable';

export default function AllAuditsPage({
  searchParams,
}: {
  searchParams: any;
}) {
  return <AuditListTable scope="all" searchParams={searchParams} />;
}
