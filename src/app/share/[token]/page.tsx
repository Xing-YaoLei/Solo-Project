import { notFound } from 'next/navigation'
import ShareDashboard from './ShareDashboard'

interface PageProps {
  params: { token: string }
}

export default function SharePage({ params }: PageProps) {
  const token = params.token
  if (!token) {
    notFound()
  }
  return <ShareDashboard token={token} />
}
