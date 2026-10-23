import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function source(path: string) {
  return readFileSync(path, "utf8");
}

const globals = source("src/app/globals.css");
const landing = source("src/app/page.tsx");
const discover = source("src/app/app/page.tsx");
const faculty = source("src/app/app/faculty/page.tsx");
const saved = source("src/app/saved/page.tsx");
const profile = source("src/app/profile/page.tsx");
const appChrome = source("src/components/matching/app-chrome.tsx");
const allStudents = source("src/components/matching/all-students-list.tsx");
const discoveryCard = source("src/components/matching/discovery-card.tsx");
const facultyDirectory = source("src/components/matching/faculty-directory-list.tsx");
const fullProfile = source("src/components/profile/full-student-profile.tsx");
const profileDashboard = source("src/components/profile/my-profile-dashboard.tsx");
const savedCard = source("src/components/matching/saved-profile-card.tsx");
const avatarSizes = source("src/lib/profile/program-avatar.ts");

test("global density uses shared component tokens instead of document scaling", () => {
  assert.match(globals, /--mm-body-font-size: 0\.875rem/);
  assert.match(globals, /--mm-label-font-size: 0\.75rem/);
  assert.match(globals, /--mm-control-font-size: 1rem/);
  assert.match(globals, /--mm-button-font-size: 0\.75rem/);
  assert.match(globals, /--mm-chip-font-size: 0\.6875rem/);
  assert.match(globals, /--mm-filter-title-size: 1\.25rem/);
  assert.match(globals, /--mm-profile-name-size: 1\.375rem/);
  assert.match(globals, /--mm-button-height: 2\.75rem/);
  assert.match(globals, /--mm-control-height: 2\.875rem/);
  assert.match(globals, /--mm-card-padding: 0\.9375rem/);
  assert.match(globals, /--mm-content-gutter: 0\.875rem/);
  assert.match(globals, /--mm-icon-size: 1\.125rem/);
  assert.match(globals, /--mm-sidebar-width: 14rem/);
  assert.match(globals, /--mm-filter-rail-width: 17rem/);
  assert.match(globals, /--mm-profile-rail-width: 16rem/);
  assert.match(globals, /\.mm-control[\s\S]*min-height: var\(--mm-control-height\)/);
  assert.match(globals, /\.mm-button[\s\S]*min-height: var\(--mm-button-height\)/);
  assert.match(globals, /\.mm-panel[\s\S]*padding: var\(--mm-card-padding\)/);
  assert.match(globals, /\.mm-chip[\s\S]*font-size: var\(--mm-chip-font-size\)/);
  assert.match(globals, /\.mm-icon[\s\S]*width: var\(--mm-icon-size\)/);
  assert.doesNotMatch(globals, /\bzoom\s*:/i);
  assert.doesNotMatch(globals, /(?:html|body)[^{]*\{[^}]*transform\s*:\s*scale\(/i);
});

test("authenticated pages share the compact shell and rail grids", () => {
  assert.match(appChrome, /mm-app-grid grid min-h-screen/);
  assert.match(discover, /mm-app-content mm-workspace-grid/);
  assert.match(faculty, /mm-app-content mm-workspace-grid/);
  assert.match(saved, /mm-app-content mm-profile-grid/);
  assert.match(profile, /mm-app-content mm-profile-grid/);
  assert.match(discover, /mm-display-title/);
  assert.match(faculty, /mm-faculty-title/);
  assert.match(saved, /mm-page-title/);
  assert.match(profile, /mm-page-title/);
});

test("landing and avatar primitives use their compact physical dimensions", () => {
  assert.match(landing, /max-w-\[1125px\]/);
  assert.match(landing, /max-w-\[32\.25rem\]/);
  assert.match(landing, /mm-button/);
  assert.match(avatarSizes, /sm: "w-11 text-base"/);
  assert.match(avatarSizes, /md: "w-\[4\.5rem\] text-2xl"/);
  assert.match(avatarSizes, /lg: "w-24 text-3xl"/);
  assert.match(avatarSizes, /sm:w-\[9\.75rem\]/);
});

test("typography remains responsive while physical control sizes stay unchanged", () => {
  assert.match(globals, /@media \(min-width: 640px\)[\s\S]*--mm-body-font-size: 0\.8125rem/);
  assert.match(globals, /@media \(min-width: 640px\)[\s\S]*--mm-control-font-size: 0\.75rem/);
  assert.match(globals, /@media \(min-width: 1280px\)[\s\S]*--mm-display-title-size: 4\.25rem/);
  assert.match(globals, /@media \(min-width: 1536px\)[\s\S]*--mm-display-title-size: 4\.375rem/);
  assert.match(globals, /@media \(min-width: 768px\)[\s\S]*--mm-button-height: 2\.625rem/);
  assert.match(globals, /@media \(max-width: 639px\)[\s\S]*font-size: 1rem/);
  assert.match(globals, /@media \(min-width: 1024px\) and \(max-height: 800px\)/);
  assert.match(globals, /@media \(min-width: 1024px\) and \(max-height: 740px\)/);
});

test("profile names share one 22px typography token across authenticated surfaces", () => {
  for (const component of [
    allStudents,
    discoveryCard,
    facultyDirectory,
    fullProfile,
    profileDashboard,
    savedCard,
  ]) {
    assert.match(component, /mm-profile-name/);
  }
});
