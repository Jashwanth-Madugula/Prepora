# Authentication & Security Upgrades

This document details the security improvements implemented in Prepora's authentication, JWT, and session management systems.

---

## 🛠️ Summary of Changes

### 1. New `/api/auth/me` Endpoint
*   **Path**: `/api/auth/me` (GET)
*   **Purpose**: Returns metadata for the currently authenticated user session.
*   **Security**: Uses the secure HTTP-Only `accessToken` cookie. Strips out credentials, token hashes, and internal verification flags before responding to the frontend.

### 2. Secret Fail-Fast Startup Validation
*   **Module**: [jwt.ts](file:///d:/prepora/src/lib/jwt.ts) and [mail.ts](file:///d:/prepora/src/lib/mail.ts)
*   **What changed**: All static fallback strings (e.g. `"access-secret-key-change-me"`) have been removed. The application now checks for mandatory secrets at startup and throws descriptive initialization errors if any are missing.
*   **Enforced Variables**:
    *   `JWT_ACCESS_SECRET`
    *   `JWT_REFRESH_SECRET`
    *   At least one email configuration method (`EMAILJS_PRIVATE_KEY` or `SMTP_PASS`/`EMAIL_PASS`).

### 3. Encrypted/Hashed Refresh Tokens
*   **Module**: [token-hash.ts](file:///d:/prepora/src/lib/token-hash.ts) (New helper)
*   **What changed**: Refresh tokens are now hashed using `bcryptjs` (using salt strength `10`) prior to database storage.
*   **Why**: If the database is compromised, attackers cannot harvest active refresh tokens to impersonate users since they only have access to token hashes.

### 4. Refresh Token Rotation (RTR)
*   **Module**: [refresh-token/route.ts](file:///d:/prepora/src/app/api/auth/refresh-token/route.ts)
*   **What changed**: On every token refresh request, a new access token AND a new refresh token are generated. The new refresh token is hashed, stored in MongoDB (overwriting the old hash), and set in cookies.
*   **Why**: Prevents refresh token reuse attacks. If a refresh token is stolen, the first use invalidates it, and subsequent reuse attempts fail.

### 5. Multi-Session Password Invalidation
*   **Module**: [reset-password/route.ts](file:///d:/prepora/src/app/api/auth/reset-password/route.ts) and [change-password/route.ts](file:///d:/prepora/src/app/api/user/change-password/route.ts)
*   **What changed**: Updating or resetting user passwords now deletes the stored `refreshToken` in the database.
*   **Why**: Instantly logs out all active sessions on other browsers or devices.

---

## 🔄 Backward Compatibility & Migrations

> [!TIP]
> **Zero-Downtime Session Migration:**
> To ensure that currently active users are not logged out, a dynamic migration strategy is used during token verification:
> 1. The verify route checks if the stored token starts with a bcrypt prefix (`$2a$`, `$2b$`, `$2y$`).
> 2. If it is a bcrypt hash, it verifies using `bcrypt.compare()`.
> 3. If it is raw plain-text, it checks for an exact string match.
> 4. Once verified, RTR kicks in and replaces the plain-text token with a brand-new hashed token, silently upgrading the session on the fly.
