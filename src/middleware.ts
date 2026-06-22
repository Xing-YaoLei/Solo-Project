import { NextResponse, type NextRequest } from 'next/server';

const COOKIE_NAME = 'session_user_email';

const EMAIL_TO_ROLE: Record<string, 'MANAGEMENT' | 'EXECUTOR' | 'REVIEWER'> = {
  'management@company.com': 'MANAGEMENT',
  'executor@company.com': 'EXECUTOR',
  'executor2@company.com': 'EXECUTOR',
  'reviewer@company.com': 'REVIEWER',
};

function readRole(req: NextRequest): 'MANAGEMENT' | 'EXECUTOR' | 'REVIEWER' | null {
  const email = req.cookies.get(COOKIE_NAME)?.value ?? process.env.MOCK_USER_EMAIL ?? 'management@company.com';
  return EMAIL_TO_ROLE[email] ?? 'MANAGEMENT';
}

const PUBLIC_PATHS = new Set(['/login', '/_next', '/_rsc', '/favicon.ico', '/api']);
const ANALYTICS_VIEWS = new Set(['MANAGEMENT', 'REVIEWER']);
const IMPORT_VIEWS = new Set(['MANAGEMENT']);
const DASHBOARD_VIEWS = new Set(['MANAGEMENT', 'REVIEWER']);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if ([...PUBLIC_PATHS].some((p) => pathname.startsWith(p)) || pathname === '/') {
    return NextResponse.next();
  }

  const role = readRole(req);

  if (!role) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith('/dashboard') && !DASHBOARD_VIEWS.has(role)) {
    const url = req.nextUrl.clone();
    url.pathname = '/my-tasks';
    url.searchParams.set('forbidden', 'dashboard');
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith('/analytics') && !ANALYTICS_VIEWS.has(role)) {
    const url = req.nextUrl.clone();
    url.pathname = '/my-tasks';
    url.searchParams.set('forbidden', 'analytics');
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith('/import') && !IMPORT_VIEWS.has(role)) {
    const url = req.nextUrl.clone();
    url.pathname = '/my-tasks';
    url.searchParams.set('forbidden', 'import');
    return NextResponse.redirect(url);
  }

  if (pathname === '/audits' && !DASHBOARD_VIEWS.has(role)) {
    const url = req.nextUrl.clone();
    url.pathname = '/my-tasks';
    url.searchParams.set('forbidden', 'audits');
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
