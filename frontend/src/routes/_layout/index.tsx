import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'

export const Route = createFileRoute('/_layout/')({
  component: IndexPage,
})

function IndexPage() {
  const navigate = useNavigate()
  useEffect(() => {
    navigate({ to: '/quotes' })
  }, [navigate])
  return null
}
