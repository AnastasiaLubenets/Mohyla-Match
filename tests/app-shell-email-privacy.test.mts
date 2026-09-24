import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

async function readRepoFile(path: string) {
  return readFile(resolve(repoRoot, path), "utf8");
}

function assertHasClassLine(
  source: string,
  requiredTokens: readonly string[],
  message: string,
) {
  const matchingLine = source
    .split("\n")
    .find((line) => requiredTokens.every((token) => line.includes(token)));

  assert.ok(matchingLine, message);
}

test("hidden scrollbar utility hides the visual scrollbar without disabling scroll", async () => {
  const globals = await readRepoFile("src/app/globals.css");
  const utilityBlock = globals.match(/\.scrollbar-hidden\s*{[^}]+}/)?.[0] ?? "";

  assert.match(utilityBlock, /scrollbar-width:\s*none/);
  assert.match(utilityBlock, /-ms-overflow-style:\s*none/);
  assert.doesNotMatch(utilityBlock, /overflow\s*:\s*hidden/);
  assert.match(globals, /\.scrollbar-hidden::\-webkit-scrollbar\s*{/);
  assert.match(globals, /display:\s*none/);
  assert.match(globals, /width:\s*0/);
  assert.match(globals, /height:\s*0/);
});

test("authenticated app center scroll containers keep overflow-y auto with hidden scrollbars", async () => {
  const [
    discoverPage,
    savedPage,
    profilePage,
    studentProfilePage,
    editProfilePage,
  ] = await Promise.all([
    readRepoFile("src/app/app/page.tsx"),
    readRepoFile("src/app/saved/page.tsx"),
    readRepoFile("src/app/profile/page.tsx"),
    readRepoFile("src/app/profiles/[userId]/page.tsx"),
    readRepoFile("src/app/profile/edit/page.tsx"),
  ]);

  assertHasClassLine(
    discoverPage,
    ["scrollbar-hidden", "xl:overflow-y-auto", "xl:flex-1"],
    "/app error state center container should remain scrollable.",
  );
  assertHasClassLine(
    discoverPage,
    ["scrollbar-hidden", "xl:overflow-y-auto", "xl:-mx-4", "xl:px-4", "xl:pb-16"],
    "/app feed center container should hide the visual scrollbar while preserving room for card shadows.",
  );
  assertHasClassLine(
    savedPage,
    ["scrollbar-hidden", "xl:overflow-y-auto", "xl:h-full"],
    "/saved error state center container should remain scrollable.",
  );
  assertHasClassLine(
    savedPage,
    ["scrollbar-hidden", "xl:overflow-y-auto", "xl:pr-2"],
    "/saved center container should hide the visual scrollbar.",
  );
  assertHasClassLine(
    profilePage,
    ["scrollbar-hidden", "xl:overflow-y-auto", "xl:h-full"],
    "/profile error state center container should remain scrollable.",
  );
  assertHasClassLine(
    profilePage,
    ["scrollbar-hidden", "xl:overflow-y-auto", "xl:pr-2"],
    "/profile center container should hide the visual scrollbar.",
  );
  assertHasClassLine(
    studentProfilePage,
    ["scrollbar-hidden", "xl:overflow-y-auto", "xl:pr-2"],
    "/profiles/[userId] center container should hide the visual scrollbar.",
  );
  assertHasClassLine(
    editProfilePage,
    ["scrollbar-hidden", "lg:overflow-y-auto", "lg:flex-1"],
    "/profile/edit center container should hide the visual scrollbar.",
  );
});

test("fixed app shell keeps fixed rails and top bar behavior", async () => {
  const [chrome, discoverPage] = await Promise.all([
    readRepoFile("src/components/matching/app-chrome.tsx"),
    readRepoFile("src/app/app/page.tsx"),
  ]);

  assert.match(chrome, /xl:h-screen xl:overflow-hidden/);
  assert.match(chrome, /shrink-0 border-b border-blue-100/);
  assert.match(chrome, /xl:h-screen xl:min-h-0 xl:overflow-hidden/);
  assert.match(chrome, /xl:overflow-hidden/);
  assert.match(discoverPage, /xl:h-screen xl:overflow-hidden/);
});

test("own profile reads the current authenticated user's email dynamically", async () => {
  const [profilePage, dashboard] = await Promise.all([
    readRepoFile("src/app/profile/page.tsx"),
    readRepoFile("src/components/profile/my-profile-dashboard.tsx"),
  ]);

  assert.match(profilePage, /supabase\.auth\.getUser\(\)/);
  assert.match(profilePage, /function splitLoginEmail/);
  assert.match(profilePage, /loginEmail={loginEmail}/);
  assert.match(dashboard, /LoginEmailParts/);
  assert.match(dashboard, /loginEmail:\s*LoginEmailParts \| null/);
  assert.match(dashboard, /Login email/);
  assert.match(dashboard, /break-all/);
  assert.doesNotMatch(profilePage, /anastasiia\.lubenets@ukma\.edu\.ua/);
  assert.doesNotMatch(dashboard, /anastasiia\.lubenets@ukma\.edu\.ua/);
  assert.doesNotMatch(dashboard, /Kept private in Supabase Auth/);
});

test("other profile, discover, and saved pages do not read or expose auth email", async () => {
  const pages = await Promise.all([
    readRepoFile("src/app/profiles/[userId]/page.tsx"),
    readRepoFile("src/app/app/page.tsx"),
    readRepoFile("src/app/saved/page.tsx"),
    readRepoFile("src/lib/profile/data.ts"),
    readRepoFile("src/lib/matching/data.ts"),
  ]);

  for (const source of pages) {
    assert.doesNotMatch(source, /auth\.getUser\(\)/);
    assert.doesNotMatch(source, /loginEmail/);
    assert.doesNotMatch(source, /contact_email/);
    assert.doesNotMatch(source, /anastasiia\.lubenets@ukma\.edu\.ua/);
  }
});
