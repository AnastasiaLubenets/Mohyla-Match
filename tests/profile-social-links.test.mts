import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import {
  getSocialPlatformLabel,
  normalizeProfileSocialLinks,
  normalizeSocialUrl,
  socialPlatformOptions,
} from "../src/lib/profile/social-links.ts";

const repoRoot = process.cwd();

test("social platform taxonomy includes the requested curated providers", () => {
  assert.deepEqual(
    socialPlatformOptions.map((platform) => platform.value),
    [
      "linkedin",
      "github",
      "orcid",
      "google-scholar",
      "researchgate",
      "instagram",
      "facebook",
      "twitter",
      "threads",
      "tiktok",
      "telegram",
      "discord",
      "behance",
      "dribbble",
      "youtube",
      "medium",
      "personal-website",
    ],
  );
});

test("social URL normalization accepts safe hostnames without a protocol", () => {
  assert.equal(
    normalizeSocialUrl("linkedin", "linkedin.com/in/anastasiia"),
    "https://linkedin.com/in/anastasiia",
  );
  assert.equal(
    normalizeSocialUrl("github", "https://github.com/mohyla-match"),
    "https://github.com/mohyla-match",
  );
  assert.equal(
    normalizeSocialUrl("personal-website", "portfolio.example.test"),
    "https://portfolio.example.test/",
  );
});

test("social URL validation rejects unsafe protocols and wrong provider hosts", () => {
  assert.equal(normalizeSocialUrl("github", "javascript:alert(1)"), null);
  assert.equal(normalizeSocialUrl("telegram", "data:text/html,hello"), null);
  assert.equal(normalizeSocialUrl("linkedin", "github.com/not-linkedin"), null);
  assert.equal(normalizeSocialUrl("youtube", "vimeo.com/video"), null);
});

test("social link normalization rejects duplicate platforms", () => {
  assert.deepEqual(
    normalizeProfileSocialLinks([
      { platform: "github", url: "github.com/one" },
      { platform: "github", url: "github.com/two" },
    ]),
    {
      error: `${getSocialPlatformLabel("github")} is already added.`,
      ok: false,
    },
  );
});

test("edit profile renders an add/remove social-link editor rather than empty platform fields", () => {
  const editFormSource = readFileSync(
    join(repoRoot, "src/components/profile/profile-edit-form.tsx"),
    "utf8",
  );

  assert.match(editFormSource, /title="Social links"/);
  assert.match(editFormSource, /Add social link/);
  assert.match(editFormSource, /name="socialPlatform"/);
  assert.match(editFormSource, /name="socialUrl"/);
  assert.match(editFormSource, /normalizeProfileSocialLinks\(socialLinks\)/);
  assert.doesNotMatch(
    editFormSource,
    /LinkedIn[\s\S]*Instagram[\s\S]*GitHub[\s\S]*Telegram[\s\S]*Personal website[\s\S]*<input/,
    "the editor should not render the full supported platform list as empty inputs",
  );
});

test("public and owner profile surfaces render social links only when populated", () => {
  const fullProfileSource = readFileSync(
    join(repoRoot, "src/components/profile/full-student-profile.tsx"),
    "utf8",
  );
  const myProfileSource = readFileSync(
    join(repoRoot, "src/components/profile/my-profile-dashboard.tsx"),
    "utf8",
  );

  assert.match(fullProfileSource, /profile\.socialLinks\.length > 0/);
  assert.match(fullProfileSource, /title: "Find me online"/);
  assert.match(fullProfileSource, /<SocialLinksList links=\{profile\.socialLinks\}/);
  assert.doesNotMatch(
    fullProfileSource,
    /No bio yet\./,
    "other-user full profiles should not render empty bio placeholder copy",
  );
  assert.match(myProfileSource, /profile\.socialLinks\.length > 0/);
  assert.match(myProfileSource, /<SocialLinksList compact links=\{profile\.socialLinks\}/);
});

test("public full profile hides empty sections while owner profile keeps completion prompts", () => {
  const fullProfileSource = readFileSync(
    join(repoRoot, "src/components/profile/full-student-profile.tsx"),
    "utf8",
  );
  const myProfileSource = readFileSync(
    join(repoRoot, "src/components/profile/my-profile-dashboard.tsx"),
    "utf8",
  );

  for (const guard of [
    "profile.offeredSkills.length > 0",
    "profile.interests.length > 0",
    "profile.wantedSkills.length > 0",
    "profile.collaborationGoals.length > 0",
    "profile.availability",
    "profile.socialLinks.length > 0",
  ]) {
    assert.match(
      fullProfileSource,
      new RegExp(guard.replaceAll(".", "\\.")),
      `${guard} should gate public profile section rendering`,
    );
  }

  assert.match(
    fullProfileSource,
    /profileSections\.length > 0/,
    "Public profile grids should disappear when no optional sections have content",
  );
  assert.doesNotMatch(
    fullProfileSource,
    /No offered skills|No academic interests|No collaboration goals|No availability|No looking-for skills/,
    "Other-user full profiles should not show empty completion placeholders",
  );
  assert.match(
    myProfileSource,
    /Choose at least one offered skill\./,
    "The owner profile should keep completion guidance",
  );
  assert.match(
    myProfileSource,
    /No academic interests selected\./,
    "The owner profile should still show empty owner sections",
  );
});

test("profile social links migration creates RLS-protected structured storage", () => {
  const migrationSource = readFileSync(
    join(
      repoRoot,
      "supabase/migrations/20261002185206_profile_social_links.sql",
    ),
    "utf8",
  );

  assert.match(migrationSource, /create table public\.profile_social_links/);
  assert.match(migrationSource, /unique \(user_id, platform\)/);
  assert.match(migrationSource, /alter table public\.profile_social_links enable row level security/);
  assert.match(migrationSource, /private\.can_view_profile\(user_id\)/);
  assert.match(migrationSource, /user_id = auth\.uid\(\)/);
  assert.match(migrationSource, /url ~\* '\^https\?\:\/\//);
  assert.doesNotMatch(migrationSource, /service_role/);
});
