import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";

import nextConfig from "../../next.config";
import { middleware } from "@/middleware";

describe("security headers", () => {
  it("applies baseline browser hardening headers to every route", async () => {
    const entries = await nextConfig.headers?.();
    const globalHeaders = entries?.find((entry) => entry.source === "/:path*");
    const headers = new Map(
      globalHeaders?.headers.map((header) => [header.key, header.value]),
    );

    expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(headers.get("Referrer-Policy")).toBe(
      "strict-origin-when-cross-origin",
    );
    expect(headers.get("X-Frame-Options")).toBe("DENY");
    expect(headers.get("Permissions-Policy")).toContain("camera=()");
  });

  it("emits a per-request nonce CSP without unsafe-inline/unsafe-eval scripts", () => {
    const response = middleware(new NextRequest("http://localhost/dashboard"));
    const csp = response.headers.get("Content-Security-Policy") ?? "";

    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("media-src 'self' blob:");
    expect(csp).toContain("worker-src 'self'");
    expect(csp).toMatch(/script-src [^;]*'nonce-[A-Za-z0-9+/=]+'/);
    expect(csp).toContain("'strict-dynamic'");

    const scriptSrc = csp
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith("script-src"));

    // Production posture: no unsafe-inline / unsafe-eval for scripts.
    expect(scriptSrc).not.toContain("unsafe-eval");
    expect(scriptSrc).not.toContain("unsafe-inline");
  });

  it("issues a fresh nonce per request", () => {
    const first = middleware(new NextRequest("http://localhost/"));
    const second = middleware(new NextRequest("http://localhost/"));

    expect(first.headers.get("Content-Security-Policy")).not.toBe(
      second.headers.get("Content-Security-Policy"),
    );
  });
});
