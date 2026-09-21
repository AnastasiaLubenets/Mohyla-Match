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
  const actualUrl = new URL(location, appBaseUrl);
  assert.equal(
    actualUrl.pathname,
    expectedPathname,
    `${label}: redirected to ${actualUrl.pathname}${actualUrl.search}`,
  );
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

async function readPageText(response, label) {
  assert.equal(response.status, 200, `${label}: expected 200`);
  return response.text();
}

function assertTextContains(body, expectedText, label) {
  assert.ok(
    body.includes(expectedText),
    `${label}: expected page to include "${expectedText}"`,
  );
}

function assertTextExcludes(body, forbiddenText, label) {
  assert.ok(
    !body.includes(forbiddenText),
    `${label}: expected page to omit "${forbiddenText}"`,
  );
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
      .eq("slug", "faculty-informatics")
      .single(),
    "load onboarding faculty",
  );
  const otherFaculty = await expectNoSupabaseError(
    await service
      .from("faculties")
      .select("id,avatar_theme_key")
      .eq("slug", "faculty-humanities")
      .single(),
    "load second onboarding faculty",
  );
  const program = await expectNoSupabaseError(
    await service
      .from("academic_programs")
      .select("id,faculty_id,avatar_variant_key")
      .eq("slug", "computer-science")
      .single(),
    "load onboarding program",
  );
  const otherProgram = await expectNoSupabaseError(
    await service
      .from("academic_programs")
      .select("id,faculty_id,avatar_variant_key")
      .eq("slug", "history")
      .single(),
    "load other faculty program",
  );
  const skills = await expectNoSupabaseError(
    await service
      .from("skills")
      .select("id,slug")
      .in("slug", ["react", "figma", "python", "ui-ux"])
      .eq("is_active", true),
    "load onboarding skills",
  );
  const interests = await expectNoSupabaseError(
    await service
      .from("interests")
      .select("id,slug")
      .in("slug", ["startups", "education"])
      .eq("is_active", true),
    "load onboarding interests",
  );
  const goals = await expectNoSupabaseError(
    await service
      .from("collaboration_goals")
      .select("id,slug")
      .in("slug", ["project-teammate", "study-partner"])
      .eq("is_active", true),
    "load onboarding goals",
  );
  const skillBySlug = new Map(skills.map((skill) => [skill.slug, skill]));
  const interestBySlug = new Map(
    interests.map((interest) => [interest.slug, interest]),
  );
  const goalBySlug = new Map(goals.map((goal) => [goal.slug, goal]));

  assert.ok(skillBySlug.get("react")?.id, "offer skill fixture exists");
  assert.ok(skillBySlug.get("figma")?.id, "looking-for skill fixture exists");
  assert.ok(skillBySlug.get("python")?.id, "edit offer skill fixture exists");
  assert.ok(
    skillBySlug.get("ui-ux")?.id,
    "edit looking-for skill fixture exists",
  );
  assert.ok(
    interestBySlug.get("startups")?.id,
    "interest fixture exists",
  );
  assert.ok(
    interestBySlug.get("education")?.id,
    "edit interest fixture exists",
  );
  assert.ok(
    goalBySlug.get("project-teammate")?.id,
    "collaboration goal fixture exists",
  );
  assert.ok(goalBySlug.get("study-partner")?.id, "edit goal fixture exists");
  assert.notEqual(
    faculty.id,
    otherProgram.faculty_id,
    "cross-faculty program fixture belongs to another faculty",
  );
  assert.equal(
    otherFaculty.id,
    otherProgram.faculty_id,
    "second faculty owns the second program fixture",
  );

  return {
    editGoal: goalBySlug.get("study-partner"),
    editInterest: interestBySlug.get("education"),
    editLookingForSkill: skillBySlug.get("ui-ux"),
    editOfferSkill: skillBySlug.get("python"),
    faculty,
    goal: goalBySlug.get("project-teammate"),
    interest: interestBySlug.get("startups"),
    offerSkill: skillBySlug.get("react"),
    lookingForSkill: skillBySlug.get("figma"),
    otherFaculty,
    otherProgram,
    program,
  };
}

function applyFilters(query, filters) {
  return filters.reduce(
    (filteredQuery, [column, value]) => filteredQuery.eq(column, value),
    query,
  );
}

async function deleteOnboardingRows(table, filters, label) {
  await expectNoSupabaseError(
    await applyFilters(service.from(table).delete(), filters),
    label,
  );
}

async function insertOnboardingRow(table, row, label) {
  await expectNoSupabaseError(await service.from(table).insert(row), label);
}

async function countOnboardingCompletedEvents(userId) {
  const result = await service
    .from("product_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("event_name", "onboarding_completed");

  if (result.error) {
    throw new Error(
      `count onboarding_completed events: ${result.error.message}`,
    );
  }

  return result.count ?? 0;
}

function expectedAvatarKey(faculty, program) {
  return `${faculty.avatar_theme_key}--${program.avatar_variant_key}`;
}

async function seedProfileRelations(userId, taxonomy) {
  await expectNoSupabaseError(
    await service.from("profile_skills").insert([
      {
        user_id: userId,
        skill_id: taxonomy.offerSkill.id,
        direction: "offer",
      },
      {
        user_id: userId,
        skill_id: taxonomy.lookingForSkill.id,
        direction: "looking_for",
      },
    ]),
    "seed profile skill relations",
  );

  await expectNoSupabaseError(
    await service.from("profile_interests").insert({
      user_id: userId,
      interest_id: taxonomy.interest.id,
    }),
    "seed profile interest relation",
  );

  await expectNoSupabaseError(
    await service.from("profile_collaboration_goals").insert({
      user_id: userId,
      collaboration_goal_id: taxonomy.goal.id,
    }),
    "seed profile collaboration goal relation",
  );
}

async function seedCompletedProfile(
  userId,
  taxonomy,
  {
    deletedAt = null,
    fullName = "Phase Five Target",
    includeRequiredData = true,
    profileStatus = "active",
  } = {},
) {
  await expectNoSupabaseError(
    await service.from("profiles").insert({
      user_id: userId,
      full_name: fullName,
      faculty_id: taxonomy.faculty.id,
      academic_program_id: taxonomy.program.id,
      year_of_study: 2,
      bio: `${fullName} bio`,
      availability: "By arrangement",
      profile_status: profileStatus,
      onboarding_completed_at: includeRequiredData
        ? new Date().toISOString()
        : null,
      deleted_at: deletedAt,
    }),
    `seed ${fullName} profile`,
  );

  if (includeRequiredData) {
    await seedProfileRelations(userId, taxonomy);
  }
}

async function assertProfileUnavailable(cookieJar, userId, label) {
  assert.equal(
    (await getPath(`/profiles/${userId}`, cookieJar)).status,
    404,
    label,
  );
}

async function assertAppAccessible(cookieJar, label) {
  assert.equal((await getPath("/app", cookieJar)).status, 200, label);
}

async function assertAppReturnsToOnboarding(cookieJar, label) {
  assertRedirect(await getPath("/app", cookieJar), "/account/setup", label);
}

async function verifyOnboardingEligibilityToggle({
  cookieJar,
  deleteTable,
  deleteFilters,
  restoreTable,
  restoreRow,
  missingLabel,
  restoredLabel,
}) {
  await deleteOnboardingRows(deleteTable, deleteFilters, missingLabel);
  await assertAppReturnsToOnboarding(cookieJar, missingLabel);
  await insertOnboardingRow(restoreTable, restoreRow, restoredLabel);
  await assertAppAccessible(cookieJar, restoredLabel);
}

async function runOnboardingEligibilityRegression(
  cookieJar,
  userId,
  taxonomy,
  completedAt,
) {
  await verifyOnboardingEligibilityToggle({
    cookieJar,
    deleteTable: "profile_skills",
    deleteFilters: [
      ["user_id", userId],
      ["skill_id", taxonomy.offerSkill.id],
      ["direction", "offer"],
    ],
    restoreTable: "profile_skills",
    restoreRow: {
      user_id: userId,
      skill_id: taxonomy.offerSkill.id,
      direction: "offer",
    },
    missingLabel:
      "deleting the last offer skill removes /app eligibility",
    restoredLabel: "restoring an offer skill restores /app eligibility",
  });

  await insertOnboardingRow(
    "profile_skills",
    {
      user_id: userId,
      skill_id: taxonomy.lookingForSkill.id,
      direction: "looking_for",
    },
    "adding an optional looking-for skill succeeds",
  );
  await assertAppAccessible(
    cookieJar,
    "adding an optional looking-for skill keeps /app eligibility",
  );
  await deleteOnboardingRows(
    "profile_skills",
    [
      ["user_id", userId],
      ["skill_id", taxonomy.lookingForSkill.id],
      ["direction", "looking_for"],
    ],
    "deleting an optional looking-for skill succeeds",
  );
  await assertAppAccessible(
    cookieJar,
    "deleting an optional looking-for skill keeps /app eligibility",
  );

  await verifyOnboardingEligibilityToggle({
    cookieJar,
    deleteTable: "profile_interests",
    deleteFilters: [
      ["user_id", userId],
      ["interest_id", taxonomy.interest.id],
    ],
    restoreTable: "profile_interests",
    restoreRow: {
      user_id: userId,
      interest_id: taxonomy.interest.id,
    },
    missingLabel: "deleting the last interest removes /app eligibility",
    restoredLabel: "restoring an interest restores /app eligibility",
  });

  await verifyOnboardingEligibilityToggle({
    cookieJar,
    deleteTable: "profile_collaboration_goals",
    deleteFilters: [
      ["user_id", userId],
      ["collaboration_goal_id", taxonomy.goal.id],
    ],
    restoreTable: "profile_collaboration_goals",
    restoreRow: {
      user_id: userId,
      collaboration_goal_id: taxonomy.goal.id,
    },
    missingLabel:
      "deleting the last collaboration goal removes /app eligibility",
    restoredLabel:
      "restoring a collaboration goal restores /app eligibility",
  });

  const restoredProfile = await expectNoSupabaseError(
    await service
      .from("profiles")
      .select("onboarding_completed_at")
      .eq("user_id", userId)
      .single(),
    "load restored onboarding profile",
  );
  assert.equal(
    restoredProfile.onboarding_completed_at,
    completedAt,
    "transient onboarding incompleteness preserves original completion timestamp",
  );
  assert.equal(
    await countOnboardingCompletedEvents(userId),
    1,
    "onboarding_completed product event remains exactly once",
  );
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
    expectedAvatarKey(taxonomy.faculty, taxonomy.program),
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
    await postForm("/account/setup/looking-for", { skip: "true" }, cookieJar),
    "/account/setup",
    { step: "4" },
    "Step 3 can be skipped with zero looking-for skills",
  );

  const skippedLookingForSkills = await expectNoSupabaseError(
    await service
      .from("profile_skills")
      .select("skill_id")
      .eq("user_id", userId)
      .eq("direction", "looking_for"),
    "load skipped looking-for skills",
  );
  assert.equal(
    skippedLookingForSkills.length,
    0,
    "Step 3 skip stores zero looking-for skills",
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

  await assertAppAccessible(cookieJar, "completed active user can access app");
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
  await runOnboardingEligibilityRegression(
    cookieJar,
    userId,
    taxonomy,
    completedProfile.onboarding_completed_at,
  );

  return {
    completedAt: completedProfile.onboarding_completed_at,
    taxonomy,
  };
}

async function runProfileFlow(
  cookieJar,
  userId,
  userEmail,
  taxonomy,
  completedAt,
) {
  assertRedirect(await getPath("/profile"), "/login", "anonymous my profile");
  assertRedirect(
    await getPath("/profile/edit"),
    "/login",
    "anonymous edit profile",
  );

  const targetUser = await createConfirmedUser(
    `profile-target-${suffix}@${allowedDomain}`,
  );
  await seedCompletedProfile(targetUser.id, taxonomy, {
    fullName: "Phase Five Visible Target",
  });

  assertRedirect(
    await getPath(`/profiles/${targetUser.id}`),
    "/login",
    "anonymous other profile",
  );
  assertRedirect(
    await getPath(`/profiles/${userId}`, cookieJar),
    "/profile",
    "own full-profile route canonicalizes to my profile",
  );

  const ownProfileBody = await readPageText(
    await getPath("/profile", cookieJar),
    "own profile view",
  );
  assertTextContains(
    ownProfileBody,
    "Phase Four Integration",
    "own profile shows saved onboarding name",
  );
  assertTextContains(
    ownProfileBody,
    "Edit profile",
    "own profile includes edit action",
  );
  assertTextExcludes(
    ownProfileBody,
    userEmail,
    "own profile never renders corporate email",
  );

  const editProfileBody = await readPageText(
    await getPath("/profile/edit", cookieJar),
    "edit profile view",
  );
  assertTextContains(
    editProfileBody,
    "Edit profile",
    "edit profile page renders",
  );
  assertTextExcludes(
    editProfileBody,
    userEmail,
    "edit profile never renders corporate email",
  );

  assertRedirect(
    await postForm(
      "/profile/update",
      {
        fullName: "Zero Offer Profile",
        facultyId: taxonomy.faculty.id,
        academicProgramId: taxonomy.program.id,
        yearOfStudy: 2,
        lookingForSkillId: taxonomy.lookingForSkill.id,
        interestId: taxonomy.interest.id,
        collaborationGoalId: taxonomy.goal.id,
      },
      cookieJar,
    ),
    "/profile/edit",
    "profile edit requires at least one offered skill",
  );

  assertRedirect(
    await postForm(
      "/profile/update",
      {
        fullName: "Cross Faculty Profile",
        facultyId: taxonomy.faculty.id,
        academicProgramId: taxonomy.otherProgram.id,
        yearOfStudy: 2,
        offerSkillId: taxonomy.offerSkill.id,
        lookingForSkillId: taxonomy.lookingForSkill.id,
        interestId: taxonomy.interest.id,
        collaborationGoalId: taxonomy.goal.id,
      },
      cookieJar,
    ),
    "/profile/edit",
    "profile edit rejects cross-faculty program",
  );

  const beforeEditProfile = await expectNoSupabaseError(
    await service
      .from("profiles")
      .select("system_avatar_key,onboarding_completed_at")
      .eq("user_id", userId)
      .single(),
    "load profile before edit",
  );
  assert.equal(
    beforeEditProfile.onboarding_completed_at,
    completedAt,
    "profile flow starts with the onboarding completion timestamp",
  );

  assertRedirect(
    await postForm(
      "/profile/update",
      {
        fullName: "Phase Five Integration Updated",
        facultyId: taxonomy.otherFaculty.id,
        academicProgramId: taxonomy.otherProgram.id,
        yearOfStudy: 4,
        bio: "Updated profile bio",
        availability: "Evenings after classes",
        offerSkillId: taxonomy.editOfferSkill.id,
        lookingForSkillId: taxonomy.editLookingForSkill.id,
        interestId: taxonomy.editInterest.id,
        collaborationGoalId: taxonomy.editGoal.id,
      },
      cookieJar,
    ),
    "/profile",
    "valid profile edit redirects to my profile",
  );

  const updatedProfileBody = await readPageText(
    await getPath("/profile", cookieJar),
    "updated own profile view",
  );
  assertTextContains(
    updatedProfileBody,
    "Phase Five Integration Updated",
    "updated profile page shows changed name",
  );
  assertTextContains(
    updatedProfileBody,
    "Updated profile bio",
    "updated profile page shows changed bio",
  );
  assertTextContains(
    updatedProfileBody,
    "Evenings after classes",
    "updated profile page shows changed availability",
  );
  assertTextExcludes(
    updatedProfileBody,
    userEmail,
    "updated profile still omits corporate email",
  );

  const updatedProfile = await expectNoSupabaseError(
    await service
      .from("profiles")
      .select(
        "full_name,faculty_id,academic_program_id,year_of_study,bio,availability,system_avatar_key,onboarding_completed_at",
      )
      .eq("user_id", userId)
      .single(),
    "load profile after edit",
  );
  assert.equal(updatedProfile.full_name, "Phase Five Integration Updated");
  assert.equal(updatedProfile.faculty_id, taxonomy.otherFaculty.id);
  assert.equal(updatedProfile.academic_program_id, taxonomy.otherProgram.id);
  assert.equal(updatedProfile.year_of_study, 4);
  assert.equal(updatedProfile.bio, "Updated profile bio");
  assert.equal(updatedProfile.availability, "Evenings after classes");
  assert.equal(
    updatedProfile.system_avatar_key,
    expectedAvatarKey(taxonomy.otherFaculty, taxonomy.otherProgram),
    "profile edit keeps avatar database-derived",
  );
  assert.notEqual(
    updatedProfile.system_avatar_key,
    beforeEditProfile.system_avatar_key,
    "faculty/program edit changes the derived avatar key",
  );
  assert.equal(
    updatedProfile.onboarding_completed_at,
    completedAt,
    "profile edit preserves onboarding completion timestamp",
  );
  assert.equal(
    Object.hasOwn(updatedProfile, "corporate_email"),
    false,
    "profile storage returned to the app has no corporate_email field",
  );
  assert.equal(
    await countOnboardingCompletedEvents(userId),
    1,
    "profile edit does not duplicate onboarding_completed event",
  );

  const updatedSkills = await expectNoSupabaseError(
    await service
      .from("profile_skills")
      .select("skill_id,direction")
      .eq("user_id", userId),
    "load updated profile skills",
  );
  const skillByDirection = new Map(
    updatedSkills.map((skill) => [skill.direction, skill.skill_id]),
  );
  assert.equal(skillByDirection.get("offer"), taxonomy.editOfferSkill.id);
  assert.equal(
    skillByDirection.get("looking_for"),
    taxonomy.editLookingForSkill.id,
  );

  const updatedInterests = await expectNoSupabaseError(
    await service
      .from("profile_interests")
      .select("interest_id")
      .eq("user_id", userId),
    "load updated profile interests",
  );
  assert.deepEqual(
    updatedInterests.map((interest) => interest.interest_id),
    [taxonomy.editInterest.id],
  );

  const updatedGoals = await expectNoSupabaseError(
    await service
      .from("profile_collaboration_goals")
      .select("collaboration_goal_id")
      .eq("user_id", userId),
    "load updated profile goals",
  );
  assert.deepEqual(
    updatedGoals.map((goal) => goal.collaboration_goal_id),
    [taxonomy.editGoal.id],
  );

  await assertAppAccessible(
    cookieJar,
    "valid profile edit keeps active user eligible for /app",
  );

  const targetProfileBody = await readPageText(
    await getPath(`/profiles/${targetUser.id}`, cookieJar),
    "eligible other profile view",
  );
  assertTextContains(
    targetProfileBody,
    "Phase Five Visible Target",
    "eligible other profile is visible",
  );
  assertTextExcludes(
    targetProfileBody,
    targetUser.email,
    "other profile never renders corporate email",
  );
  assertTextExcludes(
    targetProfileBody,
    "Edit profile",
    "other profile has no edit action",
  );

  const incompleteTarget = await createConfirmedUser(
    `profile-incomplete-${suffix}@${allowedDomain}`,
  );
  await seedCompletedProfile(incompleteTarget.id, taxonomy, {
    fullName: "Phase Five Incomplete Target",
    includeRequiredData: false,
  });
  await assertProfileUnavailable(
    cookieJar,
    incompleteTarget.id,
    "incomplete target profile is unavailable",
  );

  const suspendedTarget = await createConfirmedUser(
    `profile-suspended-${suffix}@${allowedDomain}`,
  );
  await seedCompletedProfile(suspendedTarget.id, taxonomy, {
    fullName: "Phase Five Suspended Target",
    profileStatus: "suspended",
  });
  await assertProfileUnavailable(
    cookieJar,
    suspendedTarget.id,
    "suspended target profile is unavailable",
  );

  const deletedTarget = await createConfirmedUser(
    `profile-deleted-${suffix}@${allowedDomain}`,
  );
  await seedCompletedProfile(deletedTarget.id, taxonomy, {
    deletedAt: new Date().toISOString(),
    fullName: "Phase Five Deleted Target",
    profileStatus: "deleted",
  });
  await assertProfileUnavailable(
    cookieJar,
    deletedTarget.id,
    "deleted target profile is unavailable",
  );

  const blockedTarget = await createConfirmedUser(
    `profile-blocked-${suffix}@${allowedDomain}`,
  );
  await seedCompletedProfile(blockedTarget.id, taxonomy, {
    fullName: "Phase Five Blocked Target",
  });
  await expectNoSupabaseError(
    await service.from("blocks").insert({
      blocker_user_id: userId,
      blocked_user_id: blockedTarget.id,
    }),
    "seed profile block",
  );
  await assertProfileUnavailable(
    cookieJar,
    blockedTarget.id,
    "blocked target profile is unavailable",
  );

  await assertProfileUnavailable(
    cookieJar,
    "00000000-0000-4000-8000-000000009999",
    "guessed profile UUID is unavailable",
  );
}

async function runProfileDeletionFlow(cookieJar, userId, userEmail) {
  const profileBody = await readPageText(
    await getPath("/profile", cookieJar),
    "profile view before profile deletion",
  );
  assertTextContains(
    profileBody,
    "Danger zone",
    "own profile includes danger zone",
  );
  assertTextContains(
    profileBody,
    "Delete profile",
    "own profile includes delete profile action",
  );
  assertTextContains(
    profileBody,
    "This permanently deletes your Mohyla Match profile and its related data.",
    "delete profile confirmation copy is rendered",
  );

  assertRedirectWithParams(
    await postForm("/profile/delete", { confirmation: "NOT DELETE" }, cookieJar),
    "/profile",
    { error: "delete-failed" },
    "profile deletion requires exact confirmation",
  );
  const unchangedProfile = await expectNoSupabaseError(
    await service
      .from("profiles")
      .select("user_id")
      .eq("user_id", userId)
      .single(),
    "load profile after rejected deletion",
  );
  assert.equal(
    unchangedProfile.user_id,
    userId,
    "rejected profile deletion leaves profile unchanged",
  );

  assertRedirectWithParams(
    await postForm("/profile/delete", { confirmation: "DELETE" }, cookieJar),
    "/account/setup",
    { step: "1" },
    "profile deletion redirects to setup step 1",
  );

  const deletedProfile = await expectNoSupabaseError(
    await service
      .from("profiles")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle(),
    "load deleted profile row",
  );
  assert.equal(deletedProfile, null, "profile row is deleted");

  const authUser = await expectNoSupabaseError(
    await service.auth.admin.getUserById(userId),
    "load auth user after profile deletion",
  );
  assert.equal(
    authUser.user?.email,
    userEmail,
    "profile deletion keeps the auth account and login email",
  );

  assertRedirect(
    await getPath("/profile", cookieJar),
    "/account/setup",
    "deleted profile user is treated as onboarding incomplete",
  );

  const recreated = await runOnboardingFlow(cookieJar, userId);
  await assertAppAccessible(
    cookieJar,
    "same authenticated user can access app after recreating profile",
  );

  return recreated;
}

async function seedSuspendedProfile(userId) {
  const faculty = await expectNoSupabaseError(
    await service
      .from("faculties")
      .select("id")
      .eq("slug", "faculty-informatics")
      .single(),
    "load seeded faculty",
  );
  const program = await expectNoSupabaseError(
    await service
      .from("academic_programs")
      .select("id")
      .eq("slug", "computer-science")
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
  const onboardingResult = await runOnboardingFlow(
    realConfirmationCookies,
    allowedSignup.data.user.id,
  );
  await runProfileFlow(
    realConfirmationCookies,
    allowedSignup.data.user.id,
    realEmailSignupAddress,
    onboardingResult.taxonomy,
    onboardingResult.completedAt,
  );
  await runProfileDeletionFlow(
    realConfirmationCookies,
    allowedSignup.data.user.id,
    realEmailSignupAddress,
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
    await getPath("/profile", onboardingCookies),
    "/account/setup",
    "onboarding incomplete user cannot view my profile",
  );
  assertRedirect(
    await getPath("/profile/edit", onboardingCookies),
    "/account/setup",
    "onboarding incomplete user cannot edit profile",
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
  assertRedirect(
    await getPath("/profile", suspendedCookies),
    "/account/suspended",
    "suspended user cannot view my profile",
  );
  assertRedirect(
    await getPath("/profile/edit", suspendedCookies),
    "/account/suspended",
    "suspended user cannot edit profile",
  );
}

try {
  await run();
} finally {
  await cleanup();
}
