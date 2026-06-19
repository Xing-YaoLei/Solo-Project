import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useStore } from '@/store/useStore';

interface LayoutProps {
  title?: string;
  onRefresh?: () => void;
}

export function Layout({ title, onRefresh }: LayoutProps) {
  const { sidebarCollapsed } = useStore();

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          sidebarCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        <Header title={title || ''} onRefresh={onRefresh} />
        <main className="flex-1 p-6 overflow-auto scrollbar-thin animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;
