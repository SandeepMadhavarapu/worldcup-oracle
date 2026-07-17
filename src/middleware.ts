// Per-request nonce-based Content-Security-Policy (official Next.js pattern).
//
// Why middleware instead of the static header list in next.config.ts: a static
// CSP cannot carry a nonce, which forces 'unsafe-inline' (and with it, any
// future XSS runs). Here every document request gets a fresh nonce; Next reads
// it from the forwarded CSP request header and stamps it onto the inline
// scripts it emits, so 'unsafe-inline' can be dropped for scripts entirely.
// 'unsafe-eval' is included in development only (React Refresh needs it).

import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  const isDev = process.env.NODE_ENV === "development";
  const scriptSrc = [
    "'self'",
    `'nonce-${nonce}'`,
    "'strict-dynamic'",
    ...(isDev ? ["'unsafe-eval'", "'unsafe-inline'"] : []),
  ].join(" ");

  const contentSecurityPolicy = [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "img-src 'self' data: blob:",
    "media-src 'self' blob:",
    "font-src 'self' data:",
    // Inline style attributes (framer-motion, chart libs) still need this;
    // scripts do not.
    "style-src 'self' 'unsafe-inline'",
    `script-src ${scriptSrc}`,
    // The service worker script carries no nonce; scope workers explicitly.
    "worker-src 'self'",
    "connect-src 'self' https://api.football-data.org ws: wss:",
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", contentSecurityPolicy);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", contentSecurityPolicy);

  return response;
}

export const config = {
  matcher: [
    // All request paths except static assets and images, which cannot execute
    // script and would only churn the nonce cache.
    {
      source: "/((?!_next/static|_next/image|favicon.ico|icons/|images/|og-card.webp|sw.js|offline.html).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
