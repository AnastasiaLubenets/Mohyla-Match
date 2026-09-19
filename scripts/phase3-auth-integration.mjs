import assert from "node:assert/strict";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.API_URL ?? "";
const anonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.ANON_KEY ??
  "";
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.SERVICE_ROLE_KEY ??
  "";
const appBaseUrl = process.env.APP_BASE_URL ?? "http://127.0.0.1:3000";

assert.ok(supabaseUrl, "NEXT_PUBLIC_SUPABASE_URL or API_URL is required");
assert.ok(
  anonKey,
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or ANON_KEY is required",
);
assert.ok(
  serviceRoleKey,
  "SUPABASE_SERVICE_ROLE_KEY or SERVICE_ROLE_KEY is required",
);

const authOptions = {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
};

const anon = createClient(supabaseUrl, anonKey, authOptions);
const service = createClient(supabaseUrl, serviceRoleKey, authOptions);
const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const password = "phase3-password";
const allowedDomain = "phase3-auth.test";
const blockedDomain = "phase3-blocked.test";
const usersToDelete = [];

async function expectNoSupabaseError(result, label) {
  if (result.error) {
    throw new Error(`${label}: ${result.error.message}`);
  }

  return result.data;
}

async function cleanup() {
  await service
    .from("signup_email_domains")
    .delete()
    .in("domain", [allowedDomain, blockedDomain]);

  await Promise.allSettled(
    usersToDelete.map((userId) => service.auth.admin.deleteUser(userId)),
  );
}

function appUrl(pathname) {
  return new URL(pathname, appBaseUrl).toString();
}

function getSetCookieHeaders(response) {
  if (typeof response.headers.getSetCookie === "function") {
    return response.headers.getSetCookie();
  }

  const singleHeader = response.headers.get("set-cookie");
  return singleHeader ? [singleHeader] : [];
}

function applySetCookies(cookieJar, response) {
  getSetCookieHeaders(response).forEach((setCookie) => {
    const parts = setCookie.split(";").map((part) => part.trim());
    const [cookiePair] = parts;
    const separatorIndex = cookiePair.indexOf("=");

    if (separatorIndex === -1) {
      return;
    }

    const name = cookiePair.slice(0, separatorIndex);
    const value = cookiePair.slice(separatorIndex + 1);
    const clearsCookie =
      value === "" ||
      parts.some((part) => part.toLowerCase() === "max-age=0");

    if (clearsCookie) {
      cookieJar.delete(name);
      return;
    }

    cookieJar.set(name, value);
  });
}

function cookieHeader(cookieJar) {
  return [...cookieJar.entries()]
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
}

async function postForm(pathname, fields, cookieJar = new Map()) {
  const response = await fetch(appUrl(pathname), {
    method: "POST",
    redirect: "manual",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      ...(cookieJar.size ? { cookie: cookieHeader(cookieJar) } : {}),
    },
    body: new URLSearchParams(fields),
  });

  applySetCookies(cookieJar, response);
  return response;
}

async function getPath(pathname, cookieJar = new Map()) {
  const response = await fetch(appUrl(pathname), {
    redirect: "manual",
    headers: cookieJar.size ? { cookie: cookieHeader(cookieJar) } : {},
  });

  applySetCookies(cookieJar, response);
  return response;
}

function assertRedirect(response, expectedPathname, label) {
  assert.ok(
    [303, 307, 308].includes(response.status),
    `${label}: expected redirect, got ${response.status}`,
  );

  const location = response.headers.get("location");
  assert.ok(location, `${label}: redirect must include location`);
  assert.equal(new URL(location, appBaseUrl).pathname, expectedPathname, label);
}

async function createConfirmedUser(email) {
  const { user } = await expectNoSupabaseError(
    await service.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    }),
    `create confirmed user ${email}`,
  );

  assert.ok(user?.id, `confirmed user id exists for ${email}`);
  assert.ok(user.email, `confirmed user email exists for ${email}`);
  usersToDelete.push(user.id);
  return user;
}

async function seedSuspendedProfile(userId) {
  const faculty = await expectNoSupabaseError(
    await service
      .from("faculties")
      .select("id")
      .eq("slug", "development-informatics")
      .single(),
    "load seeded faculty",
  );
  const program = await expectNoSupabaseError(
    await service
      .from("academic_programs")
      .select("id")
      .eq("slug", "development-computer-science")
      .single(),
    "load seeded program",
  );

  await expectNoSupabaseError(
    await service.from("profiles").insert({
      user_id: userId,
      full_name: "Suspended Phase Three",
      faculty_id: faculty.id,
      academic_program_id: program.id,
      year_of_study: 2,
      system_avatar_key: "phase3-suspended",
      profile_status: "suspended",
    }),
    "seed suspended profile",
  );
}

async function run() {
  await cleanup();

  const emptyAllowlistSignup = await anon.auth.signUp({
    email: `empty-${suffix}@${allowedDomain}`,
    password,
    options: { emailRedirectTo: appUrl("/auth/confirm") },
  });
  assert.ok(emptyAllowlistSignup.error, "empty allowlist rejects signup");

  await expectNoSupabaseError(
    await service.from("signup_email_domains").insert({
      domain: allowedDomain,
      is_active: true,
    }),
    "insert allowed signup domain",
  );

  const allowedSignup = await anon.auth.signUp({
    email: `allowed-${suffix}@${allowedDomain}`,
    password,
    options: { emailRedirectTo: appUrl("/auth/confirm") },
  });
  assert.equal(allowedSignup.error, null, "allowed domain accepts signup");
  assert.ok(allowedSignup.data.user?.id, "allowed signup creates a user");
  usersToDelete.push(allowedSignup.data.user.id);

  const caseInsensitiveSignup = await anon.auth.signUp({
    email: `case-${suffix}@Phase3-Auth.Test`,
    password,
    options: { emailRedirectTo: appUrl("/auth/confirm") },
  });
  assert.equal(
    caseInsensitiveSignup.error,
    null,
    "case-insensitive domain accepts signup",
  );
  assert.ok(
    caseInsensitiveSignup.data.user?.id,
    "case-insensitive signup creates a user",
  );
  usersToDelete.push(caseInsensitiveSignup.data.user.id);

  const blockedSignup = await anon.auth.signUp({
    email: `blocked-${suffix}@${blockedDomain}`,
    password,
    options: { emailRedirectTo: appUrl("/auth/confirm") },
  });
  assert.ok(blockedSignup.error, "disallowed domain rejects signup");

  const malformedSignup = await anon.auth.signUp({
    email: "not-an-email",
    password,
    options: { emailRedirectTo: appUrl("/auth/confirm") },
  });
  assert.ok(malformedSignup.error, "malformed email rejects signup");

  assertRedirect(await getPath("/app"), "/login", "anonymous protected app");
  assertRedirect(
    await getPath("/account/setup"),
    "/login",
    "anonymous onboarding setup",
  );

  const onboardingUser = await createConfirmedUser(
    `onboarding-${suffix}@${allowedDomain}`,
  );
  const onboardingCookies = new Map();
  assertRedirect(
    await postForm(
      "/auth/login",
      {
        email: onboardingUser.email,
        password,
        next: "/app",
      },
      onboardingCookies,
    ),
    "/account/setup",
    "onboarding incomplete login",
  );
  assert.equal(
    (await getPath("/account/setup", onboardingCookies)).status,
    200,
    "onboarding incomplete user can view setup placeholder",
  );

  assertRedirect(
    await postForm("/auth/logout", {}, onboardingCookies),
    "/login",
    "logout redirects to login",
  );
  assertRedirect(
    await getPath("/app", onboardingCookies),
    "/login",
    "logout clears protected access",
  );

  const suspendedUser = await createConfirmedUser(
    `suspended-${suffix}@${allowedDomain}`,
  );
  await seedSuspendedProfile(suspendedUser.id);
  const suspendedCookies = new Map();
  assertRedirect(
    await postForm(
      "/auth/login",
      {
        email: suspendedUser.email,
        password,
        next: "/app",
      },
      suspendedCookies,
    ),
    "/account/suspended",
    "suspended login",
  );
  assert.equal(
    (await getPath("/account/suspended", suspendedCookies)).status,
    200,
    "suspended user can view suspended page",
  );
}

try {
  await run();
} finally {
  await cleanup();
}
