import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { useAuthStore, UserRole } from '@/store/auth';
import { Lock, Shield } from 'lucide-react';
import '@/styles/globals.css';

const MANAGER_ROUTES = ['/reports', '/properties'];
const ADMIN_ROUTES = ['/users'];

const isRestrictedRoute = (pathname: string): boolean => {
  return MANAGER_ROUTES.includes(pathname) || ADMIN_ROUTES.includes(pathname);
};

const checkRoutePermission = (
  pathname: string,
  userRole: UserRole | undefined,
  userLoaded: boolean
): { allowed: boolean; reason?: string; pending?: boolean } => {
  if (!isRestrictedRoute(pathname)) {
    return { allowed: true };
  }

  if (!userLoaded || !userRole) {
    return { allowed: false, pending: true };
  }

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

function PermissionPending() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="card p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-yellow-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">正在验证权限</h2>
        <p className="text-gray-500">请稍候，正在确认您的访问权限...</p>
      </div>
    </div>
  );
}

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const { token, user, initialized, initFromStorage, fetchProfile } = useAuthStore();
  const [isHydrated, setIsHydrated] = useState(false);
  const [profileFetched, setProfileFetched] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
    if (!initialized) {
      initFromStorage();
    }
  }, [initialized, initFromStorage]);

  useEffect(() => {
    if (!isHydrated) return;

    if (router.pathname === '/login') return;

    if (!token) {
      router.replace('/login');
      return;
    }

    if (!user && !profileFetched) {
      setProfileFetched(true);
      fetchProfile();
    }
  }, [isHydrated, token, user, router, fetchProfile, profileFetched]);

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  if (router.pathname === '/login') {
    return <Component {...pageProps} />;
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">正在跳转登录页...</div>
      </div>
    );
  }

  const userLoaded = !!user;
  const permission = checkRoutePermission(router.pathname, user?.role, userLoaded);

  if (!permission.allowed) {
    if (permission.pending) {
      return <PermissionPending />;
    }
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
