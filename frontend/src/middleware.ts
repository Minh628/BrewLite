import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_PATHS = ['/checkout'];
const AUTH_PATHS = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('brewlite-auth')?.value;

  const isProtectedPath = PROTECTED_PATHS.some((path) => pathname.startsWith(path));
  const isAuthPath = AUTH_PATHS.some((path) => pathname.startsWith(path));

  if (isProtectedPath) {
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('returnUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (isAuthPath && token) {
    const returnUrl = request.nextUrl.searchParams.get('returnUrl') ?? '/checkout';
    return NextResponse.redirect(new URL(returnUrl, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/checkout/:path*', '/login', '/register'],
};
