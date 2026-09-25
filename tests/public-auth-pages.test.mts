import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = process.cwd();

function source(path: string) {
  return readFileSync(join(root, path), "utf8");
}

test("public landing keeps real auth navigation and static demo content", () => {
  const page = source("src/app/page.tsx");

  assert.ok(page.includes('href="/signup"'));
  assert.ok(page.includes('href="/login"'));
  assert.ok(page.includes("Find your people."));
  assert.ok(page.includes("Build something"));
  assert.ok(page.includes("Student collaboration network"));
  assert.doesNotMatch(page, /createSupabase|from\(|rpc\(/);
});

test("signup page keeps the auth action and required real fields", () => {
  const page = source("src/app/signup/page.tsx");
  const route = source("src/app/auth/signup/route.ts");

  assert.ok(page.includes('action="/auth/signup"'));
  assert.match(page, /name: "full_name"/);
  assert.match(page, /name: "email"/);
  assert.match(page, /name="password"/);
  assert.match(page, /name="password_confirmation"/);
  assert.match(page, /Join Mohyla Match/);
  assert.match(route, /signupMetadataForFullName\(fullName\)/);
  assert.doesNotMatch(route, /service_role|SUPABASE_SERVICE_ROLE_KEY/);
});

test("login page preserves next routing and avoids fake password reset UI", () => {
  const page = source("src/app/login/page.tsx");

  assert.ok(page.includes('action="/auth/login"'));
  assert.match(page, /name="next"/);
  assert.match(page, /name: "email"/);
  assert.match(page, /name="password"/);
  assert.doesNotMatch(page, /forgot-password|Remember me/i);
});
