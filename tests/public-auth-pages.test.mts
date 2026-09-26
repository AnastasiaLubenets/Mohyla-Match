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
  assert.match(page, /Email or password is incorrect\./);
  assert.doesNotMatch(page, /confirmed|confirmation/i);
  assert.doesNotMatch(page, /forgot-password|Remember me/i);
});

test("auth email fields accept complete student emails without a visual suffix badge", () => {
  const loginPage = source("src/app/login/page.tsx");
  const signupPage = source("src/app/signup/page.tsx");

  assert.doesNotMatch(loginPage, /addon=\{/);
  assert.doesNotMatch(signupPage, /addon=\{/);
  assert.doesNotMatch(loginPage, /rounded-full bg-\[#edf4ff\][\s\S]*@ukma\.edu\.ua/);
  assert.doesNotMatch(signupPage, /rounded-full bg-\[#edf4ff\][\s\S]*@ukma\.edu\.ua/);
  assert.match(loginPage, /helper="Use your @ukma\.edu\.ua student email"/);
  assert.match(signupPage, /helper="Use your @ukma\.edu\.ua student email"/);
});

test("auth shell uses stable benefit descriptions as React keys", () => {
  const shell = source("src/components/auth/auth-page-shell.tsx");

  assert.match(shell, /key=\{benefit\.description\}/);
  assert.doesNotMatch(shell, /key=\{benefit\.title\}/);
});

test("auth desktop shell keeps the approved wide top-aligned watercolor composition", () => {
  const shell = source("src/components/auth/auth-page-shell.tsx");
  const header = source("src/components/public/public-header.tsx");
  const globals = source("src/app/globals.css");

  assert.match(header, /max-w-\[1800px\]/);
  assert.match(shell, /max-w-\[1800px\]/);
  assert.match(shell, /lg:items-start/);
  assert.doesNotMatch(shell, /lg:items-center/);
  assert.match(shell, /max-w-\[43rem\]/);
  assert.doesNotMatch(shell, /max-w-\[38rem\]/);
  assert.match(shell, /lg:-top-28/);
  assert.match(shell, /auth-watercolor-image object-cover object-right-bottom/);
  assert.match(globals, /\.public-auth-shell input:-webkit-autofill/);
  assert.match(globals, /mix-blend-mode: multiply/);
});
