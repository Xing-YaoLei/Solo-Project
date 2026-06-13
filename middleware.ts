import { NextResponse, type NextRequest } from "next/server";
import { AuthUser } from "./lib/permissions";

const SESSION_COOKIE = "coffee_session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/login" || pathname.startsWith("/_next") || pathname.startsWith("/public")) {
    return NextResponse.next();
  }

  const cookie = request.cookies.get(SESSION_COOKIE);
  if (!cookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const session = JSON.parse(
      Buffer.from(cookie.value, "base64").toString("utf-8")
    ) as { user: AuthUser; expiresAt: string };

    if (new Date(session.expiresAt) < new Date()) {
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete(SESSION_COOKIE);
      return response;
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", session.user.id);
    requestHeaders.set("x-user-role", session.user.role);
    requestHeaders.set("x-user-store-id", session.user.storeId || "");

    if (pathname.startsWith("/dashboard/stores/") && session.user.role !== "manager") {
      const segments = pathname.split("/");
      const storeId = segments[3];
      if (session.user.storeId && session.user.storeId !== storeId) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }

    return NextResponse.next({ request: { headers: requestHeaders } });
  } catch {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete(SESSION_COOKIE);
    return response;
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
