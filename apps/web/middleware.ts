import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireSession } from '@repo/auth/guards-middleware';

function isPublicPath(pathname: string): boolean {
  if (pathname.startsWith('/api/auth')) return true;
  // Stripe webhook must bypass session auth, signature is the guard.
  if (pathname === '/api/stripe/webhook') return true;
  if (pathname.startsWith('/_next')) return true;
  if (pathname.startsWith('/share')) return true;
  if (
    pathname === '/' ||
    pathname === '/sign-in' ||
    pathname === '/sign-up' ||
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/forgot-password' ||
    pathname === '/reset-password'
  ) {
    return true;
  }
  if (/\.(ico|png|jpg|jpeg|gif|svg|webp|txt|xml|webmanifest)$/i.test(pathname)) {
    return true;
  }
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const sessionResult = await requireSession(request);
  if (sessionResult.isErr()) {
    const dest = request.nextUrl.clone();
    dest.pathname = '/sign-in';
    dest.searchParams.set(
      'from',
      `${pathname}${request.nextUrl.search}`
    );
    return NextResponse.redirect(dest);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
