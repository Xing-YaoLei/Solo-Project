import { notFound } from 'next/navigation'
import ShareDashboard from './ShareDashboard'

interface PageProps {
  params: { token: string }
  searchParams: { role?: string }
}

export default function SharePage({ params, searchParams }: PageProps) {
  const token = params.token
  if (!token) {
    notFound()
  }
  const role = searchParams.role || 'admin'
  return <ShareDashboard role={role} />
}
