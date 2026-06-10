const LOCAL_SITE_URL = "http://localhost:3000";

function normalizeUrl(value: string | undefined): string | null {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  try {
    return new URL(trimmed).origin;
  } catch {
    return null;
  }
}

export function getPublicSiteUrl(): string {
  const explicitUrl = normalizeUrl(process.env.NEXT_PUBLIC_SITE_URL);

  if (explicitUrl) {
    return explicitUrl;
  }

  const vercelUrl = process.env.VERCEL_URL
    ? normalizeUrl(`https://${process.env.VERCEL_URL}`)
    : null;

  return vercelUrl ?? LOCAL_SITE_URL;
}
