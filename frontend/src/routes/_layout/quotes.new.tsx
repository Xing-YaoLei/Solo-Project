import { createFileRoute } from '@tanstack/react-router'
import QuoteDetailPage from './quotes.$id'

export const Route = createFileRoute('/_layout/quotes.new')({
  component: () => <QuoteDetailPage />,
})
