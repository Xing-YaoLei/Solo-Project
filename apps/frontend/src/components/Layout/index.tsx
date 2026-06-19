import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuthStore } from '@/store/auth';

interface LayoutProps {
  children?: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user } = useAuthStore();

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar userRole={user?.role} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header user={user} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
