import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireSession } from '@repo/auth/guards-middleware';

const SUPPORTED_LOCALES = ['fr', 'en'] as const;
type Locale = (typeof SUPPORTED_LOCALES)[number];
const DEFAULT_LOCALE: Locale = 'fr';
const LOCALE_COOKIE = 'zedos_locale';

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

function isLocale(value: string | undefined): value is Locale {
  if (!value) return false;
  return SUPPORTED_LOCALES.includes(value as Locale);
}

function getPreferredLocale(request: NextRequest): Locale {
  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  if (isLocale(cookieLocale)) {
    return cookieLocale;
  }
  return DEFAULT_LOCALE;
}

function stripLocalePrefix(pathname: string): {
  locale: Locale | null;
  unlocalizedPathname: string;
} {
  const segments = pathname.split('/');
  const maybeLocale = segments[1];
  if (!isLocale(maybeLocale)) {
    return { locale: null, unlocalizedPathname: pathname };
  }

  const rest = segments.slice(2).join('/');
  return {
    locale: maybeLocale,
    unlocalizedPathname: rest ? `/${rest}` : '/',
  };
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { locale, unlocalizedPathname } = stripLocalePrefix(pathname);

  const isInternalOrAssetPath =
    unlocalizedPathname.startsWith('/_next') ||
    unlocalizedPathname.startsWith('/api') ||
    unlocalizedPathname.startsWith('/share') ||
    /\.(ico|png|jpg|jpeg|gif|svg|webp|txt|xml|webmanifest)$/i.test(unlocalizedPathname);

  if (!locale && !isInternalOrAssetPath) {
    const preferredLocale = getPreferredLocale(request);
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname =
      unlocalizedPathname === '/'
        ? `/${preferredLocale}`
        : `/${preferredLocale}${unlocalizedPathname}`;
    return NextResponse.redirect(redirectUrl);
  }

  if (isPublicPath(unlocalizedPathname)) {
    if (!locale) {
      return NextResponse.next();
    }

    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = unlocalizedPathname;
    const response = NextResponse.rewrite(rewriteUrl);
    response.cookies.set(LOCALE_COOKIE, locale, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    });
    return response;
  }

  const sessionResult = await requireSession(request);
  if (sessionResult.isErr()) {
    const dest = request.nextUrl.clone();
    const signInPath = locale ? `/${locale}/sign-in` : '/sign-in';
    dest.pathname = signInPath;
    dest.searchParams.set(
      'from',
      `${pathname}${request.nextUrl.search}`
    );
    return NextResponse.redirect(dest);
  }

  if (locale) {
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = unlocalizedPathname;
    const response = NextResponse.rewrite(rewriteUrl);
    response.cookies.set(LOCALE_COOKIE, locale, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    });
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
