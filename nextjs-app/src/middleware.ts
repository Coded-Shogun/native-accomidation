/**
 * Middleware for authentication and authorization
 * Protects routes based on user roles
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';

// Define route access rules
const routeAccess = {
  // Public routes (no authentication required)
  public: ['/login', '/register', '/auth/error', '/api/auth'],

  // Student & resident self-service routes
  student: ['/student', '/api/student'],

  // Management routes
  management: ['/management', '/api/management'],

  // Front desk routes
  frontDesk: ['/front-desk', '/api/front-desk'],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/fonts')
  ) {
    return NextResponse.next();
  }

  // Check if route is public
  const isPublicRoute = routeAccess.public.some((route) =>
    pathname.startsWith(route)
  );

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Get session
  const session = await auth();

  // Redirect to login if not authenticated
  if (!session?.user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const { role } = session.user;

  // Student / resident routes
  if (routeAccess.student.some((route) => pathname.startsWith(route))) {
    if (['STUDENT', 'RESIDENT', 'PROPERTY_MANAGER', 'ADMIN'].includes(role)) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  // Management routes
  if (routeAccess.management.some((route) => pathname.startsWith(route))) {
    if (['PROPERTY_MANAGER', 'ADMIN'].includes(role)) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  // Front desk routes
  if (routeAccess.frontDesk.some((route) => pathname.startsWith(route))) {
    if (['FRONT_DESK', 'PROPERTY_MANAGER', 'ADMIN'].includes(role)) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  // Default: allow if authenticated
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
