import { createFileRoute, Navigate } from '@tanstack/react-router'

function Index() {
  const token = localStorage.getItem('access_token')
  return <Navigate to={token ? '/schedule' : '/login'} />
}

export const Route = createFileRoute('/')({
  component: Index,
})
