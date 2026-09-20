import assert from "node:assert/strict";
import test from "node:test";

import { getAppOrigin, getAppUrl } from "../src/lib/auth/origin.ts";

const envKeys = [
  "NEXT_PUBLIC_SITE_URL",
  "SITE_URL",
  "NEXT_PUBLIC_VERCEL_URL",
  "VERCEL_URL",
  "VERCEL_ENV",
] as const;

type EnvPatch = Partial<Record<(typeof envKeys)[number], string>>;

function makeRequest(url: string, headers: Record<string, string> = {}) {
  return {
    headers: new Headers(headers),
    nextUrl: new URL(url),
    url,
  };
}

function withEnv(patch: EnvPatch, callback: () => void) {
  const original = new Map<string, string | undefined>();

  envKeys.forEach((key) => {
    original.set(key, process.env[key]);
    delete process.env[key];
  });

  Object.entries(patch).forEach(([key, value]) => {
    process.env[key] = value;
  });

  try {
    callback();
  } finally {
    original.forEach((value, key) => {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    });
  }
}

test("configured site URL wins over a localhost request URL", () => {
  withEnv(
    { NEXT_PUBLIC_SITE_URL: "https://mohyla-match.example" },
    () => {
      const request = makeRequest("http://localhost:3000/auth/signup");

      assert.equal(getAppOrigin(request), "https://mohyla-match.example");
      assert.equal(
        getAppUrl(request, "/auth/confirm").toString(),
        "https://mohyla-match.example/auth/confirm",
      );
    },
  );
});

test("Vercel host-only deployment URLs are normalized to HTTPS", () => {
  withEnv({ VERCEL_URL: "mohyla-match.vercel.app" }, () => {
    const request = makeRequest("http://localhost:3000/auth/signup");

    assert.equal(getAppOrigin(request), "https://mohyla-match.vercel.app");
  });
});

test("local development keeps the localhost origin when no site URL is configured", () => {
  withEnv({}, () => {
    const request = makeRequest("http://localhost:3000/auth/signup");

    assert.equal(getAppOrigin(request), "http://localhost:3000");
  });
});

test("forwarded production origin is used ahead of an internal localhost URL", () => {
  withEnv({}, () => {
    const request = makeRequest("http://localhost:3000/auth/signup", {
      "x-forwarded-host": "app.example",
      "x-forwarded-proto": "https",
    });

    assert.equal(getAppOrigin(request), "https://app.example");
  });
});

test("forwarded production origin is used ahead of a localhost site URL", () => {
  withEnv({ NEXT_PUBLIC_SITE_URL: "http://localhost:3000" }, () => {
    const request = makeRequest("http://localhost:3000/auth/signup", {
      "x-forwarded-host": "app.example",
      "x-forwarded-proto": "https",
    });

    assert.equal(getAppOrigin(request), "https://app.example");
  });
});

test("localhost site URL does not beat a Vercel deployment URL", () => {
  withEnv(
    {
      NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
      VERCEL_ENV: "production",
      VERCEL_URL: "mohyla-match-production.vercel.app",
    },
    () => {
      const request = makeRequest("http://localhost:3000/auth/signup");

      assert.equal(
        getAppOrigin(request),
        "https://mohyla-match-production.vercel.app",
      );
    },
  );
});
