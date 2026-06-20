import { createRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Route as rootRoute } from '../__root'
import { createVerification } from '../../api/verifications'
import { getEvents } from '../../api/events'
import VerificationForm from '../../components/VerificationForm'
import type { CreateVerificationRequest } from '../../types'

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/verifications/new',
  component: NewVerificationPage,
})

function NewVerificationPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: events = [] } = useQuery({
    queryKey: ['events'],
    queryFn: getEvents,
  })

  const mutation = useMutation({
    mutationFn: createVerification,
    onSuccess: (newTicket) => {
      queryClient.invalidateQueries({ queryKey: ['verifications'] })
      navigate({ to: '/verifications/$id', params: { id: newTicket.id } })
    },
    onError: (err) => {
      console.error('创建失败:', err)
      alert('创建核销单据失败，请重试')
    },
  })

  const handleSubmit = (data: CreateVerificationRequest) => {
    mutation.mutate(data)
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate({ to: '/verifications' })}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
        </button>
        <h2 className="text-xl font-semibold text-gray-900">新建核销单据</h2>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <VerificationForm
          events={events}
          onSubmit={handleSubmit}
          loading={mutation.isPending}
        />
      </div>
    </div>
  )
}
