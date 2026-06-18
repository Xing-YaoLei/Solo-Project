import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/records')({
  component: RecordsLayout,
})

function RecordsLayout() {
  return <Outlet />
}
