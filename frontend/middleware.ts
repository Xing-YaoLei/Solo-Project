import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { UserRole } from './lib/types';

const PUBLIC_PATHS = ['/login'];

const ROLE_PERMISSIONS: Record<string, UserRole[]> = {
  '/dashboard': ['advisor', 'technician', 'partsClerk', 'manager'],
  '/work-orders': ['advisor', 'technician', 'manager'],
  '/vehicles': ['advisor', 'manager'],
  '/parts': ['partsClerk', 'manager'],
  '/part-requests': ['technician', 'partsClerk', 'manager'],
  '/reminders': ['advisor', 'manager'],
  '/statistics': ['manager'],
  '/settings': ['manager'],
};

function isPublicPath(path: string): boolean {
  return PUBLIC_PATHS.some((publicPath) => path.startsWith(publicPath));
}

function getAllowedRoles(path: string): UserRole[] | null {
  for (const [route, roles] of Object.entries(ROLE_PERMISSIONS)) {
    if (path.startsWith(route)) {
      return roles;
    }
  }
  return null;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get('token')?.value;
  const userRole = request.cookies.get('userRole')?.value as UserRole | undefined;

  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const allowedRoles = getAllowedRoles(pathname);

  if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
