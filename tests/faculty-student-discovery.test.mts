import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = process.cwd();
const migration = readFileSync(
  join(
    root,
    "supabase/migrations/20261019110810_faculty_student_discovery_access.sql",
  ),
  "utf8",
);

test("Student discovery accepts active Student and Faculty callers while keeping Student targets", () => {
  for (const functionName of [
    "get_discovery_candidates",
    "get_all_discovery_profiles",
    "get_saved_profiles",
    "get_profile_connection_status",
  ]) {
    const functionStart = migration.indexOf(
      `create or replace function public.${functionName}`,
    );
    assert.notEqual(functionStart, -1, `${functionName} should be replaced`);
    const nextFunction = migration.indexOf(
      "create or replace function",
      functionStart + 1,
    );
    const functionSql = migration.slice(
      functionStart,
      nextFunction === -1 ? migration.length : nextFunction,
    );

    const callerCte = functionSql.match(
      /with caller as \(([\s\S]*?)\r?\n  \)(?:,|\r?\n  select)/,
    );
    assert.ok(callerCte, `${functionName} should retain a caller CTE`);
    assert.match(callerCte[1], /private\.is_active_onboarded\(p\.user_id\)/);
    assert.doesNotMatch(
      callerCte[1],
      /p\.account_role = 'student'::public\.account_role/,
    );
  }

  assert.match(
    migration,
    /where p\.account_role = 'student'::public\.account_role[\s\S]*?private\.is_active_onboarded\(p\.user_id\)/,
  );
  assert.match(
    migration,
    /private\.is_active_onboarded\(caller_id\)[\s\S]*?private\.is_active_onboarded_student\(target_user_id\)/,
  );
});

test("Student discovery keeps existing grants and enforces unavailable profile visibility", () => {
  assert.match(migration, /create or replace function private\.has_block_between/);
  assert.match(migration, /from public\.blocks b/);
  assert.match(migration, /not private\.has_block_between\(cs\.user_id, p\.user_id\)/);
  assert.match(migration, /not private\.has_block_between\(c\.user_id, p\.user_id\)/);
  assert.match(migration, /private\.is_active_onboarded_student\(target_user_id\)/);
  assert.doesNotMatch(migration, /grant\s+/i);
  assert.doesNotMatch(migration, /create policy|alter table .* disable row level security/i);
});

test("Student and Faculty discovery routes share active-account access without redirects", () => {
  const appPage = readFileSync(join(root, "src/app/app/page.tsx"), "utf8");
  const facultyPage = readFileSync(
    join(root, "src/app/app/faculty/page.tsx"),
    "utf8",
  );
  const sidebar = readFileSync(
    join(root, "src/components/matching/app-chrome.tsx"),
    "utf8",
  );

  assert.match(appPage, /requireAccountState\("\/app", \["active"\]\)/);
  assert.match(appPage, /loadDiscoveryCandidates\(supabase, 50\)/);
  assert.match(appPage, /loadAllDiscoveryProfiles\(supabase\)/);
  assert.match(appPage, /loadSavedProfiles\(supabase, 100\)/);
  assert.match(appPage, /<DiscoveryFilterPanel/);
  assert.match(appPage, /<RecommendedFeed/);
  assert.match(appPage, /<AllStudentsList/);
  assert.doesNotMatch(appPage, /redirect\("\/app\/faculty/);

  assert.match(
    facultyPage,
    /requireAccountState\("\/app\/faculty", \["active"\]\)/,
  );
  assert.match(facultyPage, /loadFacultyDiscoveryProfiles\(supabase\)/);
  assert.doesNotMatch(facultyPage, /redirect\("\/app"\)/);

  assert.match(sidebar, /href="\/app" label="Discover"/);
  assert.match(sidebar, /href="\/app\/faculty"[\s\S]*?label="Faculty"/);
  assert.doesNotMatch(sidebar, /accountRole|account_role/);
});
