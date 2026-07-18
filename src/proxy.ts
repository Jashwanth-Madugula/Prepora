/**
 * @file src/proxy.ts
 * @category Route Proxy / Request Filter Middleware
 *
 * Why this code exists:
 * Acts as a centralized security filter intercepting requests before reaching Next.js App Router routes.
 * 
 *
 * What problem it solves:
 * - Enforces CSRF origin checks for mutative HTTP calls, validates active user session JWTs, and performs automatic refresh token rotation (RTR) on the fly.
 *
 * How it works internally:
 * - Checks the pathname. If it is public auth, redirects active users to the dashboard. If it is protected, verifies cookies (accessToken and refreshToken). Automatically performs fetch POST token rotations if expired.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Checks if a JWT token has expired or is invalid.
 * Works by decoding the Base64 payload of the JWT and comparing the 'exp' timestamp with current time.
 * This is done without verifying the signature (which should be done on the server/db Connect step),
 * to allow fast, lightweight client-side or proxy checks.
 */
function isTokenExpired(token: string): boolean {
  try {
    // JWT format consists of three parts separated by dots: Header.Payload.Signature
    const parts = token.split(".");
    if (parts.length !== 3) return true; // Invalid token format
    
    // Replace URL-safe base64 characters back to standard base64 characters
    const payloadBase64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    // Decode the base64 string to a JSON string, then parse it
    const decodedPayload = JSON.parse(atob(payloadBase64));
    
    // Check if the expiration timestamp (exp) exists and is in the past (exp is in seconds, so multiply by 1000)
    if (decodedPayload.exp && decodedPayload.exp * 1000 < Date.now()) {
      return true; // Token has expired
    }
    return false; // Token is still active
  } catch {
    return true; // Any decoding error signifies an invalid/expired token
  }
}

/**
 * Proxy middleware execution hook.
 * Inspects request headers and cookies, enforcing security policies (CSRF and JWT Auth)
 * before routing the request forward to Next.js routes.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. CSRF Protection for mutative requests to API routes (POST, PUT, DELETE, PATCH)
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
        const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0].trim();
        const appHost = (forwardedHost || host || "").split(":")[0];
        
        // Block request if origin hostname doesn't match the host header.
        // We exclude localhost and 127.0.0.1 dynamically to facilitate development.
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
  // Read access and refresh tokens from HTTP cookies
  const accessToken = request.cookies.get("accessToken")?.value;
  const refreshToken = request.cookies.get("refreshToken")?.value;
  
  // Verify token expiry status
  const isTokenValid = accessToken && !isTokenExpired(accessToken);
  const isRefreshTokenValid = refreshToken && !isTokenExpired(refreshToken);

  // Define public authentication paths (routes accessible only to logged-out users)
  const isPublicAuthRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/verify-email");

  // Define protected paths (routes requiring a valid session)
  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/resumes") ||
    pathname.startsWith("/complete-profile") ||
    pathname.startsWith("/interview") ||
    pathname.startsWith("/mock-interview") ||
    pathname.startsWith("/resume-analyzer");

  // Router guard validation checks
  if (isProtectedRoute) {
    // If the access token is invalid (expired or missing)
    if (!isTokenValid) {
      // If the refresh token is also invalid, user must log in again
      if (!isRefreshTokenValid) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("from", pathname); // Save return path
        const response = NextResponse.redirect(loginUrl);
        // Clear stale credentials cookies
        response.cookies.delete("accessToken");
        response.cookies.delete("refreshToken");
        return response;
      }

      // Automatically refresh the access token if refresh token is valid (Refresh Token Rotation - RTR)
      try {
        const refreshUrl = new URL("/api/auth/refresh-token", request.url);
        // Fetch new tokens by calling our internal token refresh endpoint
        const refreshResponse = await fetch(refreshUrl, {
          method: "POST",
          headers: {
            cookie: `refreshToken=${refreshToken}`,
          },
        });

        if (refreshResponse.ok) {
          const response = NextResponse.next();
          
          // Copy Set-Cookie headers from the token refresh response to the browser response.
          // This sets the new rotated Access and Refresh tokens in client cookies.
          const setCookieHeaders = refreshResponse.headers.getSetCookie();
          setCookieHeaders.forEach((cookieStr) => {
            response.headers.append("set-cookie", cookieStr);
          });
          
          return response;
        }
      } catch (error) {
        console.error("Auto token refresh failed:", error);
      }

      // If token refresh fails for any reason, force clear cookies and redirect to login
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete("accessToken");
      response.cookies.delete("refreshToken");
      return response;
    }
  }

  if (isPublicAuthRoute) {
    // If user is already logged in with valid credentials, prevent accessing login/register page.
    // Instead, redirect them back to the active dashboard.
    if (isTokenValid || isRefreshTokenValid) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // Continue to the requested route normally
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
