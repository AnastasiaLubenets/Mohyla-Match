import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = process.cwd();

function source(path: string) {
  return readFileSync(join(root, path), "utf8");
}

test("account deletion uses a server-only Supabase admin client", () => {
  const adminClient = source("src/lib/supabase/admin.ts");
  const env = source("src/lib/config/env.ts");

  assert.match(adminClient, /import "server-only"/);
  assert.match(adminClient, /createClient<Database>/);
  assert.match(adminClient, /getSupabaseAdminConfig/);
  assert.match(env, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.doesNotMatch(env, /NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY/);
});

test("delete account route deletes only the authenticated user from Auth", () => {
  const route = source("src/app/profile/delete/route.ts");
  const action = source("src/lib/profile/delete.ts");

  assert.match(route, /deleteMyAccount/);
  assert.match(action, /supabase\.auth\.getUser\(\)/);
  assert.match(action, /adminSupabase\.auth\.admin\.deleteUser\(context\.user\.id\)/);
  assert.match(action, /context\.supabase\.auth\.signOut\(\{ scope: "local" \}\)/);
  assert.match(action, /name\.startsWith\("sb-"\)/);
  assert.match(action, /response\.cookies\.delete\(name\)/);
  assert.match(action, /redirectTo\(request, "\/"\)/);
  assert.doesNotMatch(action, /account-deleted/);
  assert.doesNotMatch(action, /pathWithParams\("\/signup"/);
  assert.doesNotMatch(action, /delete_my_profile/);
  assert.doesNotMatch(action, /formData\.get\(["']userId["']\)/);
  assert.doesNotMatch(action, /formData\.get\(["']targetUserId["']\)/);
});

test("delete account UI requires explicit irreversible confirmation", () => {
  const dangerZone = source("src/components/profile/delete-profile-danger-zone.tsx");
  const profilePage = source("src/app/profile/page.tsx");

  assert.match(
    dangerZone,
    /This permanently deletes your Mohyla Match account and all profile\s+data\. This action cannot be undone\./,
  );
  assert.match(dangerZone, /Type DELETE to confirm/);
  assert.match(dangerZone, /Deleting account\.\.\./);
  assert.match(dangerZone, /Delete account/);
  assert.match(profilePage, /We could not delete your account/);
});

test("old profile-only database deletion API is removed", () => {
  const migration = source(
    "supabase/migrations/20261007010525_permanent_account_deletion.sql",
  );
  const databaseTypes = source("src/types/database.ts");

  assert.match(migration, /drop function if exists public\.delete_my_profile\(\)/);
  assert.match(migration, /admin_actions_admin_user_id_fkey/);
  assert.match(migration, /admin_actions_report_id_fkey/);
  assert.match(migration, /product_events_match_id_fkey/);
  assert.match(migration, /on delete set null/);
  assert.match(migration, /deferrable initially deferred/);
  assert.doesNotMatch(databaseTypes, /delete_my_profile/);
});

test("account state verifies the Auth user instead of trusting stale claims", () => {
  const state = source("src/lib/auth/state.ts");

  assert.match(state, /supabase\.auth\.getUser\(\)/);
  assert.doesNotMatch(state, /supabase\.auth\.getClaims\(\)/);
});

test("same-email re-registration returns through the normal role-selection flow", () => {
  const integration = source("scripts/phase3-auth-integration.mjs");
  const signupPage = source("src/app/signup/page.tsx");

  assert.match(integration, /account deletion redirects to the welcome page/);
  assert.match(integration, /Find your people\./);
  assert.match(integration, /repeat signup starts from role selection/);
  assert.match(integration, /Student/);
  assert.match(integration, /Faculty/);
  assert.doesNotMatch(integration, /account-deleted/);
  assert.doesNotMatch(signupPage, /account-deleted/);
});
