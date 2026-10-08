import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import {
  customAvatarOptions,
  getProgramAvatarContainerClasses,
  getCustomAvatarSrc,
  getMappedProgramAvatarKey,
  getProgramAvatarSrc,
  mappedProgramAvatarKeys,
  programAvatarContainerClasses,
  programAvatarImageClasses,
  programAvatarSrcByKey,
  profileAvatarModes,
  resolveProgramAvatarVariantKey,
  resolveProfileAvatar,
  systemAvatarRadiusClass,
  systemAvatarSizeClasses,
} from "../src/lib/profile/program-avatar.ts";

const repoRoot = process.cwd();

const systemAvatarPlacementSources = [
  "src/app/app/page.tsx",
  "src/app/profile/edit/page.tsx",
  "src/components/matching/all-students-list.tsx",
  "src/components/matching/app-chrome.tsx",
  "src/components/matching/discovery-card.tsx",
  "src/components/matching/discovery-top-bar.tsx",
  "src/components/matching/faculty-directory-list.tsx",
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
    "/avatars/programs/program-economics-v2.png",
  );
  assert.equal(
    getProgramAvatarSrc("faculty-informatics--program-computer-science"),
    "/avatars/programs/program-computer-science-v2.png",
  );
  assert.equal(
    getProgramAvatarSrc(
      "faculty-informatics--program-applied-mathematics",
    ),
    "/avatars/programs/program-applied-mathematics-v2.png",
  );
});

test("two users in the same program resolve to the same artwork", () => {
  const firstUser = getProgramAvatarSrc(
    "faculty-economics--program-marketing",
  );
  const secondUser = getProgramAvatarSrc(
    "faculty-economics--program-marketing",
  );

  assert.equal(firstUser, "/avatars/programs/program-marketing-v2.png");
  assert.equal(secondUser, firstUser);
});

test("changing academic program changes the resolved artwork", () => {
  const before = getProgramAvatarSrc("faculty-economics--program-economics");
  const after = getProgramAvatarSrc("faculty-economics--program-marketing");

  assert.equal(before, "/avatars/programs/program-economics-v2.png");
  assert.equal(after, "/avatars/programs/program-marketing-v2.png");
  assert.notEqual(after, before);
});

test("direct avatar variant key wins for live profile-edit program previews", () => {
  assert.equal(
    getProgramAvatarSrc(
      "faculty-economics--program-economics",
      "program-computer-science",
    ),
    "/avatars/programs/program-computer-science-v2.png",
  );
});

test("legacy program keys resolve through supplied replacement artwork", () => {
  assert.equal(
    getProgramAvatarSrc("faculty-history--program-archaeology"),
    "/avatars/programs/program-history-v2.png",
  );
  assert.equal(
    getProgramAvatarSrc("faculty-humanities--program-english-and-ukrainian-language"),
    "/avatars/programs/program-language-literature-comparative-studies-v2.png",
  );
  assert.equal(
    getProgramAvatarSrc("faculty-informatics--program-big-data-analytics"),
    "/avatars/programs/program-applied-mathematics-v2.png",
  );
});

test("unmapped program keys fall back safely", () => {
  assert.equal(getMappedProgramAvatarKey("legacy-geometric-avatar"), null);
  assert.equal(
    getProgramAvatarSrc("faculty-test--program-not-in-production"),
    null,
  );
});

test("profile avatar resolver supports default, program and custom modes", () => {
  assert.deepEqual(profileAvatarModes, ["default", "program", "custom"]);

  assert.deepEqual(
    resolveProfileAvatar({
      avatarMode: "default",
      systemAvatarKey: "faculty-economics--program-economics",
    }),
    { key: "default", kind: "default", mode: "default", src: null },
  );

  assert.deepEqual(
    resolveProfileAvatar({
      avatarMode: "program",
      systemAvatarKey: "faculty-economics--program-economics",
    }),
    {
      key: "program-economics",
      kind: "image",
      mode: "program",
      src: "/avatars/programs/program-economics-v2.png",
    },
  );

  assert.deepEqual(
    resolveProfileAvatar({
      avatarMode: "custom",
      customAvatarKey: "avatar-01",
      systemAvatarKey: "faculty-economics--program-economics",
    }),
    {
      key: "avatar-01",
      kind: "image",
      mode: "custom",
      src: "/avatars/custom/avatar-01.png",
    },
  );

  assert.deepEqual(
    resolveProfileAvatar({
      avatarMode: "custom",
      customAvatarKey: "missing-avatar",
      systemAvatarKey: "faculty-economics--program-economics",
    }),
    { key: "default", kind: "default", mode: "default", src: null },
  );
});

test("faculty program avatar candidates use primary then deterministic valid program", () => {
  assert.equal(
    resolveProgramAvatarVariantKey(
      [
        {
          avatarVariantKey: "program-economics",
          id: 2,
          isPrimary: false,
          name: "Economics",
          slug: "economics",
        },
        {
          avatarVariantKey: "program-computer-science",
          id: 3,
          isPrimary: true,
          name: "Computer Science",
          slug: "computer-science",
        },
      ],
      "legacy-geometric-avatar",
    ),
    "program-computer-science",
  );

  assert.equal(
    resolveProgramAvatarVariantKey(
      [
        {
          avatarVariantKey: "program-marketing",
          id: 8,
          name: "Marketing",
          slug: "marketing",
        },
        {
          avatarVariantKey: "program-law",
          id: 4,
          name: "Law",
          slug: "law",
        },
      ],
      "legacy-geometric-avatar",
    ),
    "program-law",
  );
});

test("faculty program avatar candidates fall back without overriding custom avatars", () => {
  assert.equal(
    resolveProgramAvatarVariantKey([], "faculty-economics--program-economics"),
    "faculty-economics--program-economics",
  );

  assert.equal(
    resolveProgramAvatarVariantKey(
      [
        {
          avatarVariantKey: "program-not-in-production",
          id: 9,
          name: "Legacy Program",
          slug: "legacy-program",
        },
      ],
      "legacy-geometric-avatar",
    ),
    null,
  );

  assert.deepEqual(
    resolveProfileAvatar({
      avatarMode: "custom",
      avatarVariantKey: "program-computer-science",
      customAvatarKey: "avatar-01",
      systemAvatarKey: "faculty-economics--program-economics",
    }),
    {
      key: "avatar-01",
      kind: "image",
      mode: "custom",
      src: "/avatars/custom/avatar-01.png",
    },
  );
});

test("all supplied custom avatar options resolve to local PNG assets", () => {
  assert.equal(customAvatarOptions.length, 30);

  for (const avatar of customAvatarOptions) {
    assert.equal(getCustomAvatarSrc(avatar.key), avatar.src);
    assert.equal(
      existsSync(join(repoRoot, "public", "avatars", "custom", `${avatar.key}.png`)),
      true,
      `${avatar.key}.png should exist`,
    );
  }
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
    /getProgramAvatarContainerClasses/,
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
  assert.ok(programAvatarContainerClasses.split(/\s+/).includes(systemAvatarRadiusClass));
  assert.match(programAvatarContainerClasses, /\bp-0\b/);
  assert.doesNotMatch(programAvatarContainerClasses, /\bbg-\S+/);
  assert.doesNotMatch(programAvatarContainerClasses, /\bborder(?:-\S+)?\b/);

  assert.match(programAvatarImageClasses, /\bh-full\b/);
  assert.match(programAvatarImageClasses, /\bw-full\b/);
  assert.match(programAvatarImageClasses, /\bobject-cover\b/);
});

test("SystemAvatar renders all image-backed avatar modes through one image path", () => {
  const systemAvatarSource = readFileSync(
    join(repoRoot, "src/components/profile/system-avatar.tsx"),
    "utf8",
  );

  assert.match(systemAvatarSource, /resolveProfileAvatar/);
  assert.match(systemAvatarSource, /resolvedAvatar\.kind === "image"/);
  assert.match(systemAvatarSource, /src=\{resolvedAvatar\.src\}/);
  assert.doesNotMatch(
    systemAvatarSource,
    /getProgramAvatarSrc/,
    "SystemAvatar should not branch program artwork separately from custom artwork",
  );
});

test("all SystemAvatar placements use one shared square avatar radius", () => {
  assert.equal(systemAvatarRadiusClass, "rounded-[0.65rem]");
  assert.ok(
    getProgramAvatarContainerClasses()
      .split(/\s+/)
      .includes(systemAvatarRadiusClass),
  );

  const programAvatarSource = readFileSync(
    join(repoRoot, "src/lib/profile/program-avatar.ts"),
    "utf8",
  );
  assert.doesNotMatch(programAvatarSource, /topbar|rounded-xl/);

  const systemAvatarSource = readFileSync(
    join(repoRoot, "src/components/profile/system-avatar.tsx"),
    "utf8",
  );
  assert.match(systemAvatarSource, /systemAvatarRadiusClass/);
  assert.doesNotMatch(systemAvatarSource, /rounded-(?:full|lg|xl)/);
  assert.doesNotMatch(systemAvatarSource, /radius\??:/);

  for (const sourcePath of systemAvatarPlacementSources) {
    const source = readFileSync(join(repoRoot, sourcePath), "utf8");

    assert.doesNotMatch(
      source,
      /<SystemAvatar[\s\S]*?radius=/,
      `${sourcePath} should not override the shared SystemAvatar radius`,
    );
    assert.doesNotMatch(
      source,
      /rounded-\[1\.25rem\]/,
      `${sourcePath} should not hard-code the old avatar radius`,
    );
  }
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

test("profile edit form exposes a custom avatar picker without storing image URLs", () => {
  const source = readFileSync(
    join(repoRoot, "src/components/profile/profile-edit-form.tsx"),
    "utf8",
  );

  assert.match(source, /name="avatarMode"/);
  assert.match(source, /value="default"/);
  assert.match(source, /value="program"/);
  assert.match(source, /value="custom"/);
  assert.match(source, /name="customAvatarKey"/);
  assert.match(source, /customAvatarOptions\.map/);
  assert.match(source, /onAvatarModeChange\("custom"\)/);
  assert.doesNotMatch(
    source,
    /name="customAvatar(?:Url|Src)"/,
    "profiles should store only stable avatar keys",
  );
});

test("profile update path saves avatar mode and custom key columns", () => {
  const source = readFileSync(join(repoRoot, "src/lib/profile/update.ts"), "utf8");

  assert.match(source, /avatar_mode: avatarMode/);
  assert.match(source, /custom_avatar_key: avatarMode === "custom"/);
  assert.match(source, /\.from\("profiles"\)[\s\S]*?\.update\(/);
});

test("every mapped production program avatar asset exists", () => {
  assert.equal(
    Object.keys(programAvatarSrcByKey).length,
    mappedProgramAvatarKeys.length,
  );

  for (const key of mappedProgramAvatarKeys) {
    const src = programAvatarSrcByKey[key];

    assert.equal(getProgramAvatarSrc(key), src);
    assert.match(src, /^\/avatars\/programs\/program-[a-z0-9-]+-v2\.png$/);
    assert.equal(
      existsSync(join(repoRoot, "public", src.slice(1))),
      true,
      `${src} should exist`,
    );
  }
});
