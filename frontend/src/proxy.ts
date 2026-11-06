import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "dt_session";

/**
 * Optimistic redirect for signed-out visitors. This only checks that a session
 * cookie exists; the Express API validates the session on every request, and the
 * client returns to /login whenever the API answers 401.
 */
export function proxy(request: NextRequest) {
  if (request.cookies.has(SESSION_COOKIE)) return NextResponse.next();

  const loginUrl = new URL("/login", request.url);
  const target = request.nextUrl.pathname + request.nextUrl.search;
  if (target !== "/") loginUrl.searchParams.set("from", target);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/dashboard/:path*", "/doctors/:path*", "/patients/:path*", "/users/:path*", "/doctor/:path*"],
};
