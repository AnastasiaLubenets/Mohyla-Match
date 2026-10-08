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

test("public landing is a single-viewport watercolor entry screen", () => {
  const page = source("src/app/page.tsx");

  assert.match(page, /relative h-screen min-h-\[100dvh\] overflow-hidden bg-transparent/);
  assert.match(page, /<PublicWatercolor[\s\S]*<PublicHeader active="landing"/);
  assert.match(page, /className="absolute inset-0 z-0 min-h-full w-full"/);
  assert.match(page, /imageClassName="object-cover object-right-bottom"/);
  assert.match(page, /preserveQuality/);
  assert.match(page, /sizes="100vw"/);
  assert.match(page, /h-\[calc\(100dvh-6rem\)\]/);
  assert.equal(page.match(/<section/g)?.length, 1);
  assert.doesNotMatch(page, /bottomBenefits/);
  assert.doesNotMatch(page, /PublicBenefit/);
  assert.doesNotMatch(page, /More[\s\S]*Brighter[\s\S]*ideas/);
  assert.doesNotMatch(page, /Connects/);
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

test("signup keeps benefits inline under the form and no bottom panel remains", () => {
  const shell = source("src/components/auth/auth-page-shell.tsx");
  const signupPage = source("src/app/signup/page.tsx");
  const loginPage = source("src/app/login/page.tsx");

  assert.doesNotMatch(signupPage, /benefitsPlacement/);
  assert.doesNotMatch(loginPage, /benefitsPlacement=/);
  assert.doesNotMatch(shell, /benefitsPlacement/);
  assert.doesNotMatch(shell, /hasBottomPanel/);
  assert.match(signupPage, /benefitsDividers/);
  assert.doesNotMatch(loginPage, /benefitsDividers/);
  assert.match(shell, /sm:divide-x sm:divide-\[#dce7f7\]/);
  assert.match(shell, /public-auth-inline-benefits/);
  assert.match(shell, /\{children\}[\s\S]*<div className=\{benefitsClassName\}>/);
  assert.doesNotMatch(shell, /public-auth-bottom-benefits/);
  assert.doesNotMatch(shell, /lg:fixed lg:inset-x-0 lg:bottom-0/);
  assert.doesNotMatch(shell, /lg:h-\[6\.25rem\]/);
  assert.doesNotMatch(signupPage, /watercolorPlacement=/);
  assert.doesNotMatch(loginPage, /watercolorPlacement=/);
  assert.match(signupPage, /Meet like-minded students/);
  assert.match(signupPage, /Find project teammates/);
  assert.match(signupPage, /Turn ideas into real projects/);
  assert.match(loginPage, /Find collaborators/);
  assert.match(loginPage, /Return to saved profiles/);
  assert.match(loginPage, /Keep building/);
});

test("signup and login forms render inside contained auth cards", () => {
  const signupPage = source("src/app/signup/page.tsx");
  const loginPage = source("src/app/login/page.tsx");

  assert.match(signupPage, /<section className="mt-7 rounded-\[1\.35rem\] border border-\[#dce7f7\] bg-white\/92 p-5 shadow-\[0_18px_50px_rgba\(37,76,139,0\.11\)\] backdrop-blur sm:p-7">/);
  assert.match(signupPage, /<form action="\/auth\/signup"[\s\S]*Already have an account\?/);
  assert.match(signupPage, /Already have an account\?[\s\S]*<\/section>/);
  assert.match(loginPage, /<section className="mt-7 rounded-\[1\.35rem\] border border-\[#dce7f7\] bg-white\/92 p-5 shadow-\[0_18px_50px_rgba\(37,76,139,0\.11\)\] backdrop-blur sm:p-7">/);
  assert.match(loginPage, /bg-white\/92/);
  assert.match(loginPage, /shadow-\[0_18px_50px_rgba\(37,76,139,0\.11\)\]/);
  assert.match(loginPage, /backdrop-blur/);
});

test("auth shell uses one full-bleed watercolor background without a solid left panel", () => {
  const shell = source("src/components/auth/auth-page-shell.tsx");
  const header = source("src/components/public/public-header.tsx");
  const globals = source("src/app/globals.css");
  const watercolor = source("src/components/public/public-watercolor.tsx");

  assert.match(shell, /<PublicHeader active=\{active\} \/>/);
  assert.doesNotMatch(shell, /layout="auth"/);
  assert.doesNotMatch(header, /layout\?:|layout =|headerLayoutClasses|auth:|landing:/);
  assert.match(header, /<header className="relative z-20 w-screen">/);
  assert.match(header, /max-w-\[1800px\]/);
  assert.match(header, /lg:px-12 xl:px-\[clamp\(5rem,4vw,6rem\)\]/);
  assert.match(shell, /lg:items-start/);
  assert.doesNotMatch(shell, /lg:items-center/);
  assert.match(shell, /max-w-\[43rem\]/);
  assert.match(shell, /public-auth-shell relative min-h-screen overflow-x-hidden bg-transparent/);
  assert.doesNotMatch(shell, /bg-\[#f8fbff\]/);
  assert.doesNotMatch(shell, /watercolorPlacement/);
  assert.match(shell, /auth-watercolor--full-bleed absolute inset-0/);
  assert.match(shell, /<PublicWatercolor[\s\S]*<PublicHeader/);
  assert.match(shell, /auth-watercolor-image object-cover object-right-bottom/);
  assert.match(shell, /preserveQuality/);
  assert.match(shell, /sizes="100vw"/);
  assert.doesNotMatch(shell, /auth-watercolor--right-of-content/);
  assert.match(watercolor, /quality=\{preserveQuality \? 100 : undefined\}/);
  assert.match(watercolor, /unoptimized=\{preserveQuality\}/);
  assert.match(watercolor, /sizes = "\(max-width: 768px\) 100vw, 58vw"/);
  assert.match(watercolor, /sizes=\{sizes\}/);
  assert.match(globals, /\.public-auth-shell input:-webkit-autofill/);
  assert.match(globals, /mix-blend-mode: normal/);
  assert.doesNotMatch(globals, /mix-blend-mode: multiply/);
  assert.match(globals, /\.public-auth-shell \.auth-watercolor[\s\S]*mask-image: none/);
  assert.doesNotMatch(globals, /linear-gradient\(\s*90deg,\s*transparent/);
});

test("root layout uses local fonts instead of Turbopack-sensitive Google font modules", () => {
  const layout = source("src/app/layout.tsx");

  assert.match(layout, /from "next\/font\/local"/);
  assert.doesNotMatch(layout, /from "next\/font\/google"/);
  assert.match(layout, /--font-geist-sans/);
  assert.match(layout, /--font-geist-mono/);
  assert.match(layout, /--font-display/);
  assert.match(layout, /fonts\/geist-400\.ttf/);
  assert.match(layout, /fonts\/geist-mono-400\.ttf/);
  assert.match(layout, /fonts\/cormorant-garamond-700\.ttf/);
});
