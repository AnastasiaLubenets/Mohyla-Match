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
const mailpitUrl = process.env.MAILPIT_URL ?? "http://127.0.0.1:54324";

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

function mailpitApi(pathname) {
  return new URL(pathname, mailpitUrl).toString();
}

async function readJson(response, label) {
  if (!response.ok) {
    throw new Error(`${label}: expected 2xx, got ${response.status}`);
  }

  return response.json();
}

async function clearMailpitMessages() {
  const response = await fetch(mailpitApi("/api/v1/messages"), {
    method: "DELETE",
  });

  if (!response.ok && response.status !== 404) {
    throw new Error(
      `clear Mailpit messages: expected 2xx/404, got ${response.status}`,
    );
  }
}

function collectMailAddresses(value) {
  if (!value) {
    return [];
  }

  if (typeof value === "string") {
    return [value];
  }

  if (Array.isArray(value)) {
    return value.flatMap(collectMailAddresses);
  }

  if (typeof value === "object") {
    const mailbox = value.Mailbox ?? value.mailbox;
    const domain = value.Domain ?? value.domain;

    return [
      value.Address,
      value.address,
      value.Email,
      value.email,
      mailbox && domain ? `${mailbox}@${domain}` : null,
    ].filter(Boolean);
  }

  return [];
}

function mailpitRecipients(message) {
  return [
    ...collectMailAddresses(message.To),
    ...collectMailAddresses(message.to),
    ...collectMailAddresses(message.Recipients),
    ...collectMailAddresses(message.recipients),
  ].map((email) => email.toLowerCase());
}

function mailpitMessageId(message) {
  return message.ID ?? message.Id ?? message.id;
}

async function loadMailpitMessage(messageId) {
  const response = await fetch(
    mailpitApi(`/api/v1/message/${encodeURIComponent(messageId)}`),
  );

  return readJson(response, `load Mailpit message ${messageId}`);
}

async function waitForConfirmationEmail(email) {
  const expectedEmail = email.toLowerCase();
  const deadline = Date.now() + 30_000;
  let lastError = null;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(mailpitApi("/api/v1/messages?limit=50"));
      const mailbox = await readJson(response, "list Mailpit messages");
      const messages = mailbox.messages ?? mailbox.Messages ?? [];
      const summary = messages.find((message) =>
        mailpitRecipients(message).includes(expectedEmail),
      );
      const messageId = summary ? mailpitMessageId(summary) : null;

      if (messageId) {
        return loadMailpitMessage(messageId);
      }
    } catch (error) {
      lastError = error;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(
    `timed out waiting for Mailpit confirmation email for ${email}${
      lastError ? `: ${lastError.message}` : ""
    }`,
  );
}

function extractConfirmationUrl(message) {
  const body = [
    message.HTML,
    message.Html,
    message.html,
    message.Text,
    message.text,
    message.Body,
    message.body,
  ]
    .filter((part) => typeof part === "string")
    .join("\n")
    .replaceAll("&amp;", "&");
  const urls = body.match(/https?:\/\/[^"'\s<>]+/g) ?? [];
  const confirmationUrl = urls.find((url) => {
    try {
      const parsedUrl = new URL(url);
      return (
        parsedUrl.pathname === "/auth/confirm" &&
        parsedUrl.searchParams.has("token_hash") &&
        parsedUrl.searchParams.get("type") === "email"
      );
    } catch {
      return false;
    }
  });

  assert.ok(
    confirmationUrl,
    "Mailpit signup confirmation email includes SSR token_hash link",
  );

  return confirmationUrl;
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

function encodeFormFields(fields) {
  const formFields = new URLSearchParams();

  Object.entries(fields).forEach(([name, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => formFields.append(name, String(item)));
      return;
    }

    if (value !== null && value !== undefined) {
      formFields.append(name, String(value));
    }
  });

  return formFields;
}

async function postForm(pathname, fields, cookieJar = new Map()) {
  const response = await fetch(appUrl(pathname), {
    method: "POST",
    redirect: "manual",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      ...(cookieJar.size ? { cookie: cookieHeader(cookieJar) } : {}),
    },
    body: encodeFormFields(fields),
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

function assertRedirectWithParams(
  response,
  expectedPathname,
  expectedParams,
  label,
) {
  assertRedirect(response, expectedPathname, label);

  const location = response.headers.get("location");
  const url = new URL(location, appBaseUrl);

  Object.entries(expectedParams).forEach(([name, value]) => {
    assert.equal(url.searchParams.get(name), value, `${label}: ${name}`);
  });
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

async function loadOnboardingTaxonomy() {
  const faculty = await expectNoSupabaseError(
    await service
      .from("faculties")
      .select("id,avatar_theme_key")
      .eq("slug", "development-informatics")
      .single(),
    "load onboarding faculty",
  );
  const program = await expectNoSupabaseError(
    await service
      .from("academic_programs")
      .select("id,avatar_variant_key")
      .eq("slug", "development-computer-science")
      .single(),
    "load onboarding program",
  );
  const otherProgram = await expectNoSupabaseError(
    await service
      .from("academic_programs")
      .select("id")
      .eq("slug", "development-literature")
      .single(),
    "load other faculty program",
  );
  const skills = await expectNoSupabaseError(
    await service
      .from("skills")
      .select("id,slug")
      .in("slug", ["react", "figma"]),
    "load onboarding skills",
  );
  const interests = await expectNoSupabaseError(
    await service
      .from("interests")
      .select("id,slug")
      .eq("slug", "technology"),
    "load onboarding interest",
  );
  const goals = await expectNoSupabaseError(
    await service
      .from("collaboration_goals")
      .select("id,slug")
      .eq("slug", "project-teammate"),
    "load onboarding goal",
  );
  const skillBySlug = new Map(skills.map((skill) => [skill.slug, skill]));
  const interest = interests[0];
  const goal = goals[0];

  assert.ok(skillBySlug.get("react")?.id, "offer skill fixture exists");
  assert.ok(skillBySlug.get("figma")?.id, "looking-for skill fixture exists");
  assert.ok(interest?.id, "interest fixture exists");
  assert.ok(goal?.id, "collaboration goal fixture exists");

  return {
    faculty,
    program,
    otherProgram,
    offerSkill: skillBySlug.get("react"),
    lookingForSkill: skillBySlug.get("figma"),
    interest,
    goal,
  };
}

async function runOnboardingFlow(cookieJar, userId) {
  const taxonomy = await loadOnboardingTaxonomy();

  assertRedirectWithParams(
    await getPath("/account/setup", cookieJar),
    "/account/setup",
    { step: "1" },
    "fresh setup resumes at Step 1",
  );

  assertRedirectWithParams(
    await postForm(
      "/account/setup/basic",
      {
        fullName: "Phase Four Integration",
        facultyId: taxonomy.faculty.id,
        academicProgramId: taxonomy.otherProgram.id,
        yearOfStudy: 2,
        bio: "Integration flow",
        availability: "Weekdays",
      },
      cookieJar,
    ),
    "/account/setup",
    { step: "1" },
    "program from another faculty is rejected",
  );

  assertRedirectWithParams(
    await postForm(
      "/account/setup/basic",
      {
        fullName: "Phase Four Integration",
        facultyId: taxonomy.faculty.id,
        academicProgramId: taxonomy.program.id,
        yearOfStudy: 2,
        bio: "Integration flow",
        availability: "Weekdays",
      },
      cookieJar,
    ),
    "/account/setup",
    { step: "2" },
    "valid Step 1 persists",
  );

  const savedProfile = await expectNoSupabaseError(
    await service
      .from("profiles")
      .select("full_name,system_avatar_key,onboarding_completed_at")
      .eq("user_id", userId)
      .single(),
    "load saved onboarding profile",
  );
  assert.equal(savedProfile.full_name, "Phase Four Integration");
  assert.equal(
    savedProfile.system_avatar_key,
    `${taxonomy.faculty.avatar_theme_key}--${taxonomy.program.avatar_variant_key}`,
    "system avatar key is server-derived",
  );
  assert.equal(
    savedProfile.onboarding_completed_at,
    null,
    "Step 1 does not complete onboarding",
  );

  assertRedirectWithParams(
    await getPath("/account/setup", cookieJar),
    "/account/setup",
    { step: "2" },
    "refresh resumes at Step 2 after Step 1",
  );

  assertRedirectWithParams(
    await postForm("/account/setup/offer", {}, cookieJar),
    "/account/setup",
    { step: "2" },
    "Step 2 cannot complete with zero offer skills",
  );

  assertRedirectWithParams(
    await postForm(
      "/account/setup/offer",
      { skillId: taxonomy.offerSkill.id },
      cookieJar,
    ),
    "/account/setup",
    { step: "3" },
    "Step 2 offer skill persists",
  );

  assertRedirectWithParams(
    await postForm("/account/setup/looking-for", {}, cookieJar),
    "/account/setup",
    { step: "3" },
    "Step 3 cannot complete with zero looking-for skills",
  );

  assertRedirectWithParams(
    await postForm(
      "/account/setup/looking-for",
      { skillId: taxonomy.lookingForSkill.id },
      cookieJar,
    ),
    "/account/setup",
    { step: "4" },
    "Step 3 looking-for skill persists",
  );

  assertRedirectWithParams(
    await getPath("/account/setup", cookieJar),
    "/account/setup",
    { step: "4" },
    "refresh resumes at Step 4 after skills",
  );

  assertRedirectWithParams(
    await postForm("/account/setup/build", {}, cookieJar),
    "/account/setup",
    { step: "4" },
    "Step 4 requires interest and collaboration goal",
  );

  assertRedirectWithParams(
    await postForm(
      "/account/setup/build",
      { interestId: taxonomy.interest.id },
      cookieJar,
    ),
    "/account/setup",
    { step: "4" },
    "Step 4 requires collaboration goal after interest",
  );

  assertRedirect(
    await postForm(
      "/account/setup/build",
      {
        interestId: taxonomy.interest.id,
        collaborationGoalId: taxonomy.goal.id,
      },
      cookieJar,
    ),
    "/app",
    "successful 4-step flow reaches app",
  );

  assert.equal(
    (await getPath("/app", cookieJar)).status,
    200,
    "completed active user can access app",
  );
  assertRedirect(
    await getPath("/account/setup", cookieJar),
    "/app",
    "completed active user cannot re-open setup",
  );

  const completedProfile = await expectNoSupabaseError(
    await service
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single(),
    "load completed onboarding profile",
  );
  assert.ok(
    completedProfile.onboarding_completed_at,
    "successful 4-step flow sets onboarding completion",
  );
  assert.equal(
    Object.hasOwn(completedProfile, "corporate_email"),
    false,
    "corporate email never enters profiles",
  );
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

  await clearMailpitMessages();
  const realEmailSignupAddress = `allowed-${suffix}@${allowedDomain}`;
  const allowedSignup = await anon.auth.signUp({
    email: realEmailSignupAddress,
    password,
    options: { emailRedirectTo: appUrl("/auth/confirm") },
  });
  assert.equal(allowedSignup.error, null, "allowed domain accepts signup");
  assert.ok(allowedSignup.data.user?.id, "allowed signup creates a user");
  usersToDelete.push(allowedSignup.data.user.id);

  const realConfirmationMessage =
    await waitForConfirmationEmail(realEmailSignupAddress);
  const realConfirmationCookies = new Map();
  assertRedirect(
    await getPath(
      extractConfirmationUrl(realConfirmationMessage),
      realConfirmationCookies,
    ),
    "/account/setup",
    "real signup email confirmation route",
  );
  await runOnboardingFlow(
    realConfirmationCookies,
    allowedSignup.data.user.id,
  );

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

  const confirmationLink = await expectNoSupabaseError(
    await service.auth.admin.generateLink({
      type: "signup",
      email: `confirm-${suffix}@${allowedDomain}`,
      password,
      options: {
        redirectTo: appUrl("/auth/confirm"),
      },
    }),
    "generate signup confirmation link",
  );
  assert.ok(
    confirmationLink.properties?.hashed_token,
    "signup confirmation link includes a token hash",
  );
  assert.ok(confirmationLink.user?.id, "signup confirmation user exists");
  usersToDelete.push(confirmationLink.user.id);

  const confirmationCookies = new Map();
  assertRedirect(
    await getPath(
      `/auth/confirm?token_hash=${encodeURIComponent(
        confirmationLink.properties.hashed_token,
      )}&type=signup`,
      confirmationCookies,
    ),
    "/account/setup",
    "email confirmation route",
  );
  assert.equal(
    (await getPath("/account/setup?step=1", confirmationCookies)).status,
    200,
    "confirmed user can access onboarding setup placeholder",
  );

  assertRedirect(await getPath("/app"), "/login", "anonymous protected app");
  assertRedirect(
    await getPath("/account/setup"),
    "/login",
    "anonymous onboarding setup",
  );
  assertRedirect(
    await postForm("/account/setup/basic", {
      fullName: "Anonymous Onboarding",
      facultyId: 1,
      academicProgramId: 1,
      yearOfStudy: 2,
    }),
    "/login",
    "anonymous cannot onboard",
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
    (await getPath("/account/setup?step=1", onboardingCookies)).status,
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
  assertRedirect(
    await getPath("/account/setup", suspendedCookies),
    "/account/suspended",
    "suspended user cannot onboard",
  );
}

try {
  await run();
} finally {
  await cleanup();
}
