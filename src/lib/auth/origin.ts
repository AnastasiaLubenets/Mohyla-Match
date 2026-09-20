type OriginRequest = {
  headers: Pick<Headers, "get">;
  nextUrl?: { origin: string };
  url: string;
};

const configuredOriginEnvVars = [
  "NEXT_PUBLIC_SITE_URL",
  "SITE_URL",
  "NEXT_PUBLIC_VERCEL_URL",
  "VERCEL_URL",
] as const;

function firstHeaderValue(value: string | null): string | null {
  const first = value?.split(",").at(0)?.trim();
  return first ? first : null;
}

function normalizeOrigin(value: string | undefined): string | null {
  const trimmed = value?.trim().replace(/\/+$/, "");

  if (!trimmed) {
    return null;
  }

  const withProtocol = /^[a-z][a-z\d+.-]*:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const url = new URL(withProtocol);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }

    return url.origin;
  } catch {
    return null;
  }
}

function isLocalOrigin(origin: string): boolean {
  try {
    const hostname = new URL(origin).hostname.toLowerCase();
    return (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0" ||
      hostname === "::1" ||
      hostname.endsWith(".localhost")
    );
  } catch {
    return false;
  }
}

function configuredOrigins(): string[] {
  return configuredOriginEnvVars
    .map((envVar) => normalizeOrigin(process.env[envVar]))
    .filter((origin): origin is string => Boolean(origin));
}

function forwardedOrigin(request: OriginRequest): string | null {
  const host =
    firstHeaderValue(request.headers.get("x-forwarded-host")) ??
    firstHeaderValue(request.headers.get("host"));

  if (!host) {
    return null;
  }

  const proto =
    firstHeaderValue(request.headers.get("x-forwarded-proto")) ??
    (host.startsWith("localhost") ||
    host.startsWith("127.0.0.1") ||
    host.startsWith("[::1]")
      ? "http"
      : "https");

  return normalizeOrigin(`${proto}://${host}`);
}

function requestOrigin(request: OriginRequest): string | null {
  const origin = request.nextUrl?.origin ?? new URL(request.url).origin;
  return normalizeOrigin(origin);
}

export function getAppOrigin(request: OriginRequest): string {
  const configured = configuredOrigins();
  const current = [forwardedOrigin(request), requestOrigin(request)].filter(
    (origin): origin is string => Boolean(origin),
  );
  const origins = [...configured, ...current];

  const nonLocalOrigin = origins.find((origin) => !isLocalOrigin(origin));

  if (nonLocalOrigin) {
    return nonLocalOrigin;
  }

  const localOrigin = origins.at(0);

  if (localOrigin && process.env.VERCEL_ENV !== "production") {
    return localOrigin;
  }

  throw new Error(
    "Unable to determine a non-local application origin for auth redirects.",
  );
}

export function getAppUrl(request: OriginRequest, path: string): URL {
  return new URL(path, getAppOrigin(request));
}
