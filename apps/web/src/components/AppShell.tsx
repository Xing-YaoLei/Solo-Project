'use client';

import Sidebar from './Sidebar';
import { AuthProvider } from '@/lib/auth';

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-slate-50">
          {children}
        </main>
      </div>
    </AuthProvider>
  );
}
