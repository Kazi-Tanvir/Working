import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ACCESS_COOKIE_NAME } from "@/lib/auth";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(ACCESS_COOKIE_NAME)?.value;

  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");

  // 1. If user is logged in and visits login or register, redirect to dashboard / home
  if (isAuthPage && token) {
    const redirectUrl = new URL("/", request.url);
    return NextResponse.redirect(redirectUrl);
  }

  // 2. Pass headers for downstream user tracking if token exists
  const response = NextResponse.next();
  if (token) {
    response.headers.set("x-has-session", "1");
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
