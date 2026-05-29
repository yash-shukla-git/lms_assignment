import { NextRequest, NextResponse } from 'next/server';

const protectedPaths = ['/apply', '/dashboard'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  if (isProtected) {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    // TODO: decode token and redirect to role-specific dashboard
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/apply/:path*', '/dashboard/:path*'],
};
