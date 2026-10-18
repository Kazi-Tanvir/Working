// src/middleware.ts
// Fail-Closed Clerk Middleware with default-deny staff RBAC

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isProtectedStaffRoute = createRouteMatcher([
  '/admin(.*)',
  '/api/orders/(.*)/status',
  '/api/orders/(.*)/verify-payment',
  '/api/courier(.*)',
]);

const isAdminOnlyRoute = createRouteMatcher([
  '/admin/products(.*)',
  '/admin/blacklist(.*)',
  '/admin/analytics(.*)',
  '/admin/settings(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isProtectedStaffRoute(req)) {
    return NextResponse.next();
  }

  const session = await auth.protect();
  const role = (session.sessionClaims?.metadata as { role?: string } | undefined)?.role;

  // Fail-Closed Default Deny: Reject any user lacking an explicit staff role
  if (role !== 'ADMIN' && role !== 'MODERATOR') {
    return new NextResponse('Forbidden: Staff Role Required', { status: 403 });
  }

  // Enforce Admin-Only Routes per Unified Permission Matrix
  if (isAdminOnlyRoute(req) && role !== 'ADMIN') {
    if (req.nextUrl.pathname.startsWith('/api/')) {
      return new NextResponse('Forbidden: Admin Role Required', { status: 403 });
    }
    return NextResponse.redirect(new URL('/admin/orders', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
