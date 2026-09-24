import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import {
  getMappedProgramAvatarKey,
  getProgramAvatarSrc,
  mappedProgramAvatarKeys,
  programAvatarContainerClasses,
  programAvatarImageClasses,
  systemAvatarSizeClasses,
} from "../src/lib/profile/program-avatar.ts";

const repoRoot = process.cwd();

const systemAvatarPlacementSources = [
  "src/app/app/page.tsx",
  "src/app/profile/edit/page.tsx",
  "src/components/matching/app-chrome.tsx",
  "src/components/matching/discovery-card.tsx",
  "src/components/matching/match-card.tsx",
  "src/components/matching/saved-profile-card.tsx",
  "src/components/profile/profile-details.tsx",
  "src/components/profile/my-profile-dashboard.tsx",
  "src/components/profile/full-student-profile.tsx",
  "src/components/profile/profile-edit-form.tsx",
];

test("mapped academic program renders its stable image source", () => {
  assert.equal(
    getProgramAvatarSrc("faculty-economics--program-economics"),
    "/avatars/programs/program-economics.png",
  );
  assert.equal(
    getProgramAvatarSrc("faculty-informatics--program-computer-science"),
    "/avatars/programs/program-computer-science.png",
  );
  assert.equal(
    getProgramAvatarSrc(
      "faculty-informatics--program-applied-mathematics",
    ),
    "/avatars/programs/program-applied-mathematics.png",
  );
});

test("two users in the same program resolve to the same artwork", () => {
  const firstUser = getProgramAvatarSrc(
    "faculty-economics--program-marketing",
  );
  const secondUser = getProgramAvatarSrc(
    "faculty-economics--program-marketing",
  );

  assert.equal(firstUser, "/avatars/programs/program-marketing.png");
  assert.equal(secondUser, firstUser);
});

test("changing academic program changes the resolved artwork", () => {
  const before = getProgramAvatarSrc("faculty-economics--program-economics");
  const after = getProgramAvatarSrc("faculty-economics--program-marketing");

  assert.equal(before, "/avatars/programs/program-economics.png");
  assert.equal(after, "/avatars/programs/program-marketing.png");
  assert.notEqual(after, before);
});

test("direct avatar variant key wins for live profile-edit program previews", () => {
  assert.equal(
    getProgramAvatarSrc(
      "faculty-economics--program-economics",
      "program-computer-science",
    ),
    "/avatars/programs/program-computer-science.png",
  );
});

test("unmapped or legacy program keys fall back safely", () => {
  assert.equal(getMappedProgramAvatarKey("legacy-geometric-avatar"), null);
  assert.equal(
    getProgramAvatarSrc("faculty-test--program-not-in-production"),
    null,
  );
});

test("all current SystemAvatar sizes remain defined", () => {
  assert.deepEqual(Object.keys(systemAvatarSizeClasses), [
    "sm",
    "md",
    "lg",
    "xl",
    "discover",
  ]);

  for (const className of Object.values(systemAvatarSizeClasses)) {
    assert.match(className, /\bw-/);
    assert.doesNotMatch(className, /\b(?:h|min-h|max-h)-/);
  }
});

test("every SystemAvatar size variant preserves a 1:1 aspect ratio", () => {
  assert.match(programAvatarContainerClasses, /\baspect-square\b/);

  for (const [size, className] of Object.entries(systemAvatarSizeClasses)) {
    assert.match(
      className,
      /\bw-/,
      `${size} should define the avatar scale through width`,
    );
    assert.doesNotMatch(
      className,
      /\b(?:h|min-h|max-h)-/,
      `${size} should not define an independent height`,
    );
    assert.doesNotMatch(
      className,
      /\b(?:aspect-\S+)/,
      `${size} should inherit the shared aspect-square rule`,
    );
  }

  const systemAvatarSource = readFileSync(
    join(repoRoot, "src/components/profile/system-avatar.tsx"),
    "utf8",
  );

  assert.match(
    systemAvatarSource,
    /programAvatarContainerClasses/,
    "mapped artwork should use the shared square avatar container",
  );
  assert.match(
    systemAvatarSource,
    /flex aspect-square shrink-0/,
    "fallback initials avatar should also stay square",
  );
});

test("mapped program avatars render as clean edge-to-edge image tiles", () => {
  assert.match(programAvatarContainerClasses, /\baspect-square\b/);
  assert.match(programAvatarContainerClasses, /\boverflow-hidden\b/);
  assert.ok(
    programAvatarContainerClasses.split(/\s+/).includes("rounded-[1.25rem]"),
  );
  assert.match(programAvatarContainerClasses, /\bp-0\b/);
  assert.doesNotMatch(programAvatarContainerClasses, /\bbg-\S+/);
  assert.doesNotMatch(programAvatarContainerClasses, /\bborder(?:-\S+)?\b/);

  assert.match(programAvatarImageClasses, /\bh-full\b/);
  assert.match(programAvatarImageClasses, /\bw-full\b/);
  assert.match(programAvatarImageClasses, /\bobject-cover\b/);
});

test("program avatar placements do not add blue frame wrappers", () => {
  for (const sourcePath of systemAvatarPlacementSources) {
    const source = readFileSync(join(repoRoot, sourcePath), "utf8");

    assert.doesNotMatch(
      source,
      /overflow-hidden rounded-lg border border-blue-100 bg-blue-50/,
      `${sourcePath} should not wrap program artwork in the old blue frame`,
    );
    assert.doesNotMatch(
      source,
      /w-fit overflow-hidden rounded-\[1\.25rem\] border border-blue-100 bg-white/,
      `${sourcePath} should let SystemAvatar own the visible crop`,
    );
    assert.doesNotMatch(
      source,
      /className="[^"]*border-blue-100[^"]*bg-blue-50[^"]*"[\s\S]{0,300}<SystemAvatar/,
      `${sourcePath} should not add a visible blue bordered avatar wrapper`,
    );
  }
});

test("Discover and Saved avatar links stay visually neutral", () => {
  const framedLinkPattern =
    /className="[^"]*(?:overflow-hidden|border-blue-100|bg-blue-50)[^"]*"[\s\S]{0,300}<SystemAvatar/;

  for (const sourcePath of [
    "src/components/matching/discovery-card.tsx",
    "src/components/matching/saved-profile-card.tsx",
  ]) {
    const source = readFileSync(join(repoRoot, sourcePath), "utf8");

    assert.doesNotMatch(
      source,
      framedLinkPattern,
      `${sourcePath} should keep clickable avatar wrappers visually neutral`,
    );
  }
});

test("every mapped production program avatar asset exists", () => {
  for (const key of mappedProgramAvatarKeys) {
    assert.equal(
      existsSync(join(repoRoot, "public", "avatars", "programs", `${key}.png`)),
      true,
      `${key}.png should exist`,
    );
  }
});
