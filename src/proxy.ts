import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return true;
    
    const payloadBase64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const decodedPayload = JSON.parse(atob(payloadBase64));
    
    if (decodedPayload.exp && decodedPayload.exp * 1000 < Date.now()) {
      return true;
    }
    return false;
  } catch {
    return true;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. CSRF Protection for mutative requests to API routes
  if (
    pathname.startsWith("/api") &&
    ["POST", "PUT", "DELETE", "PATCH"].includes(request.method)
  ) {
    const origin = request.headers.get("origin");
    const referer = request.headers.get("referer");
    const host = request.headers.get("host");

    const sourceUrl = origin || referer;
    if (sourceUrl) {
      try {
        const parsedSource = new URL(sourceUrl);
        const appHost = host ? host.split(":")[0] : "";
        
        // Block request if origin hostname doesn't match host (exclude localhost during development)
        if (
          parsedSource.hostname !== "localhost" && 
          parsedSource.hostname !== "127.0.0.1" && 
          parsedSource.hostname !== appHost
        ) {
          return new NextResponse(
            JSON.stringify({ message: "CSRF verification failed: Origin mismatch" }),
            { status: 403, headers: { "Content-Type": "application/json" } }
          );
        }
      } catch {
        return new NextResponse(
          JSON.stringify({ message: "CSRF verification failed: Invalid Origin/Referer header" }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }
    }
  }

  // 2. Protected and Public Route Guarding
  const accessToken = request.cookies.get("accessToken")?.value;
  const refreshToken = request.cookies.get("refreshToken")?.value;
  
  const isTokenValid = accessToken && !isTokenExpired(accessToken);
  const isRefreshTokenValid = refreshToken && !isTokenExpired(refreshToken);

  // Define public authentication paths
  const isPublicAuthRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/verify-email");

  // Define protected paths
  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/interview") ||
    pathname.startsWith("/mock-interview") ||
    pathname.startsWith("/resume-analyzer");

  if (isProtectedRoute) {
    if (!isTokenValid) {
      if (!isRefreshTokenValid) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("from", pathname);
        const response = NextResponse.redirect(loginUrl);
        response.cookies.delete("accessToken");
        response.cookies.delete("refreshToken");
        return response;
      }

      // Automatically refresh the access token
      try {
        const refreshUrl = new URL("/api/auth/refresh-token", request.url);
        const refreshResponse = await fetch(refreshUrl, {
          method: "POST",
          headers: {
            cookie: `refreshToken=${refreshToken}`,
          },
        });

        if (refreshResponse.ok) {
          const response = NextResponse.next();
          
          // Copy Set-Cookie headers to response
          const setCookieHeaders = refreshResponse.headers.getSetCookie();
          setCookieHeaders.forEach((cookieStr) => {
            response.headers.append("set-cookie", cookieStr);
          });
          
          return response;
        }
      } catch (error) {
        console.error("Auto token refresh failed:", error);
      }

      // If refresh failed, clear cookies and redirect to login
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete("accessToken");
      response.cookies.delete("refreshToken");
      return response;
    }
  }

  if (isPublicAuthRoute) {
    // If user is already logged in with valid credentials, prevent accessing login/register page
    if (isTokenValid || isRefreshTokenValid) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export default proxy;

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.).*)",
  ],
};
