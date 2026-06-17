import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/shortage')({
  component: ShortageLayout,
});

function ShortageLayout() {
  return <Outlet />;
}
