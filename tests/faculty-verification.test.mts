import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = process.cwd();

function source(path: string) {
  return readFileSync(join(root, path), "utf8");
}

const migration = source(
  "supabase/migrations/20261008010854_faculty_shared_code_verification.sql",
);

test("faculty selection goes to shared-code verification while student registration stays unchanged", () => {
  const setupPage = source("src/app/account/setup/page.tsx");
  const onboardingServer = source("src/lib/onboarding/server.ts");
  const verificationForm = source("src/components/faculty-verification-form.tsx");
  const verificationRoute = source(
    "src/app/account/setup/faculty-verification/route.ts",
  );

  assert.match(setupPage, /Verify your faculty status/);
  assert.match(setupPage, /FacultyVerificationForm/);
  assert.match(setupPage, /verifyFaculty/);
  assert.match(onboardingServer, /if \(role === "faculty"\)/);
  assert.match(onboardingServer, /facultyVerificationPath\(\)/);
  assert.match(onboardingServer, /selected_role: role/);
  assert.match(verificationForm, /type=\{showCode \? "text" : "password"\}/);
  assert.match(verificationForm, /Verify &amp; continue/);
  assert.match(verificationForm, /Back to role selection/);
  assert.match(verificationRoute, /verifyFacultyCodeAndContinue/);
});

test("faculty verification code is validated only on the server", () => {
  const helper = source("src/lib/onboarding/faculty-verification.ts");
  const envExample = source(".env.example");

  assert.match(helper, /import "server-only"/);
  assert.match(helper, /FACULTY_VERIFICATION_CODE/);
  assert.match(helper, /supabase\.auth\.getUser\(\)/);
  assert.match(helper, /timingSafeEqual/);
  assert.match(helper, /createSupabaseAdminClient/);
  assert.match(helper, /faculty_verification_attempts/);
  assert.match(helper, /maxUserFailuresPerWindow/);
  assert.match(helper, /maxIpFailuresPerWindow/);
  assert.doesNotMatch(helper, /NEXT_PUBLIC_FACULTY_VERIFICATION_CODE/);
  assert.doesNotMatch(envExample, /NEXT_PUBLIC_FACULTY_VERIFICATION_CODE/);
  assert.match(envExample, /FACULTY_VERIFICATION_CODE=/);
});

test("database guards prevent browser-side faculty self-verification and direct RPC bypass", () => {
  assert.match(migration, /faculty_verification_status public\.faculty_verification_status not null default 'unverified'/);
  assert.match(migration, /private\.prevent_account_role_self_verification/);
  assert.match(migration, /faculty_verification_status = 'unverified'::public\.faculty_verification_status/);
  assert.match(
    migration,
    /old\.onboarding_completed_at is null and selected_account_role is not null[\s\S]*?new\.account_role := selected_account_role/,
  );
  assert.match(
    migration,
    /if selected_role = 'faculty'::public\.account_role[\s\S]*?Faculty verification is required before choosing Faculty\./,
  );
  assert.match(
    migration,
    /p\.account_role = 'faculty'::public\.account_role[\s\S]*?p\.faculty_verification_status = 'verified'::public\.faculty_verification_status/,
  );
  assert.match(migration, /revoke all on public\.faculty_verification_attempts from public, anon, authenticated/);
  assert.match(migration, /grant select, insert, delete on public\.faculty_verification_attempts to service_role/);
});

test("unverified faculty accounts are routed to verification before faculty onboarding", () => {
  const setupPage = source("src/app/account/setup/page.tsx");
  const onboardingServer = source("src/lib/onboarding/server.ts");

  assert.match(setupPage, /selectedFacultyVerificationStatus !== "verified"/);
  assert.match(setupPage, /return <FacultyVerificationStep/);
  assert.match(onboardingServer, /selectedRole\.faculty_verification_status !== "verified"/);
  assert.match(onboardingServer, /Verify your faculty status to continue\./);
});

test("faculty verification labels are not visible in app UI", () => {
  const facultyDirectoryList = source(
    "src/components/matching/faculty-directory-list.tsx",
  );
  const fullProfile = source("src/components/profile/full-student-profile.tsx");
  const myProfile = source("src/components/profile/my-profile-dashboard.tsx");
  const editProfile = source("src/components/profile/profile-edit-form.tsx");
  const facultyFilters = source(
    "src/lib/matching/faculty-discovery-filters.ts",
  );
  const visibleSources = [
    facultyDirectoryList,
    fullProfile,
    myProfile,
    editProfile,
    facultyFilters,
  ].join("\n");

  assert.doesNotMatch(
    visibleSources,
    /Verified Faculty|Unverified Faculty|Verified faculty|Unverified faculty|VERIFIED|UNVERIFIED|Verification status|verification status/,
  );
  assert.doesNotMatch(facultyDirectoryList, /verificationStatus ===/);
  assert.doesNotMatch(facultyFilters, /profile\.verificationStatus/);
});
