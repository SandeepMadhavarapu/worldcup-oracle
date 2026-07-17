import { describe, expect, it } from "vitest";

import nextConfig from "../../next.config";

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

  it("ships a CSP without unsafe-eval outside development", async () => {
    const entries = await nextConfig.headers?.();
    const globalHeaders = entries?.find((entry) => entry.source === "/:path*");
    const csp =
      globalHeaders?.headers.find(
        (header) => header.key === "Content-Security-Policy",
      )?.value ?? "";

    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("media-src 'self' blob:");
    expect(csp).toContain("worker-src 'self'");
    // NODE_ENV is not "development" under vitest, matching the production build.
    expect(csp).not.toContain("unsafe-eval");
  });
});
