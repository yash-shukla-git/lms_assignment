import { NextRequest, NextResponse } from 'next/server';

const ROLE_HOME: Record<string, string> = {
  borrower: '/apply',
  sales: '/dashboard/sales',
  sanction: '/dashboard/sanction',
  disbursement: '/dashboard/disbursement',
  collection: '/dashboard/collection',
  admin: '/dashboard/sales',
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value;
  const role = request.cookies.get('role')?.value;

  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');
  const isApply = pathname.startsWith('/apply');
  const isDashboard = pathname.startsWith('/dashboard');

  if (isAuthPage) {
    if (token && role) {
      const dest = ROLE_HOME[role] ?? '/dashboard/sales';
      return NextResponse.redirect(new URL(dest, request.url));
    }
    return NextResponse.next();
  }

  if (isApply) {
    if (!token || role !== 'borrower') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  if (isDashboard) {
    if (!token || !role || role === 'borrower') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/login', '/register', '/apply/:path*', '/dashboard/:path*'],
};
