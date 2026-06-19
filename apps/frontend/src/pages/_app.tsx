import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { useAuthStore, UserRole } from '@/store/auth';
import { Lock } from 'lucide-react';
import '@/styles/globals.css';

const MANAGER_ROUTES = ['/reports', '/properties'];
const ADMIN_ROUTES = ['/users'];

const checkRoutePermission = (pathname: string, userRole: UserRole | undefined): { allowed: boolean; reason?: string } => {
  if (!userRole) return { allowed: true };

  if (ADMIN_ROUTES.includes(pathname) && userRole !== 'ADMIN') {
    return { allowed: false, reason: '该页面仅系统管理员可访问' };
  }

  if (MANAGER_ROUTES.includes(pathname) && userRole !== 'ADMIN' && userRole !== 'MANAGER') {
    return { allowed: false, reason: '该页面仅管理层可访问，请联系您的主管' };
  }

  return { allowed: true };
};

function PermissionDenied({ reason, onGoHome }: { reason: string; onGoHome: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="card p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">访问被拒绝</h2>
        <p className="text-gray-500 mb-6">{reason}</p>
        <button onClick={onGoHome} className="btn btn-primary">
          返回任务分派台
        </button>
      </div>
    </div>
  );
}

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const { token, user, initialized, initFromStorage, fetchProfile } = useAuthStore();
  const [isHydrated, setIsHydrated] = useState(false);
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    setIsHydrated(true);
    if (!initialized) {
      initFromStorage();
    }
  }, [initialized, initFromStorage]);

  useEffect(() => {
    if (!isHydrated) return;

    if (router.pathname === '/login') {
      setIsAuthed(true);
      return;
    }

    if (!token) {
      setIsAuthed(false);
      router.replace('/login');
      return;
    }

    setIsAuthed(true);

    if (!user) {
      fetchProfile();
    }
  }, [isHydrated, token, user, router, fetchProfile]);

  if (!isHydrated || isAuthed === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  if (!isAuthed || (!token && router.pathname !== '/login')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">正在跳转登录页...</div>
      </div>
    );
  }

  if (router.pathname === '/login') {
    return <Component {...pageProps} />;
  }

  const permission = checkRoutePermission(router.pathname, user?.role);
  if (!permission.allowed) {
    return (
      <PermissionDenied
        reason={permission.reason || '权限不足'}
        onGoHome={() => router.push('/')}
      />
    );
  }

  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}
