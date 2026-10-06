import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

function readRepoFile(path: string) {
  return readFileSync(join(repoRoot, path), "utf8");
}

function countMatches(source: string, pattern: RegExp) {
  return source.match(pattern)?.length ?? 0;
}

test("discover candidates load real social links and only real recommendation scores", () => {
  const matchingDataSource = readRepoFile("src/lib/matching/data.ts");

  assert.match(
    matchingDataSource,
    /socialLinks: ProfileSocialLink\[\]/,
    "Discovery candidates should carry real profile social links",
  );
  assert.match(
    matchingDataSource,
    /function loadCandidateSocialLinks[\s\S]*?\.from\("profile_social_links"\)[\s\S]*?\.in\("user_id", uniqueUserIds\)/,
    "Discover cards should load social links from existing profile_social_links rows",
  );
  assert.match(
    matchingDataSource,
    /isSocialPlatform\(link\.platform\)/,
    "Loaded social links should be limited to supported platforms",
  );
  assert.match(
    matchingDataSource,
    /loadDiscoveryCandidates[\s\S]*?mapDiscoveryCandidate\([\s\S]*?candidate\.compatibility_score/,
    "Recommended cards should use the real RPC compatibility score",
  );
  assert.match(
    matchingDataSource,
    /loadAllDiscoveryProfiles[\s\S]*?mapDiscoveryCandidate\([\s\S]*?socialLinks\.socialLinksByUserId\.get\(profile\.user_id\),\s*null,/,
    "All students should not render the placeholder all-students score as a fabricated match percentage",
  );
});

test("student recommendation card places actions in the upper profile area", () => {
  const discoveryCardSource = readRepoFile(
    "src/components/matching/discovery-card.tsx",
  );

  assert.equal(
    countMatches(discoveryCardSource, /<ContactReveal/g),
    1,
    "The student recommendation card should render exactly one Get email action",
  );
  assert.match(
    discoveryCardSource,
    /const matchPercentage = formatMatchPercentage\(candidate\.compatibilityScore\);/,
    "The match percentage should be derived from the candidate score",
  );
  assert.match(
    discoveryCardSource,
    /<MatchPercentageIndicator percentage=\{matchPercentage\} \/>[\s\S]*?<SaveProfileButton/,
    "The UsersRound match indicator should appear immediately before the bookmark control",
  );
  assert.match(
    discoveryCardSource,
    /studentBookmarkButtonClassName =\s*"[^"]*group[^"]*border-0[^"]*bg-transparent[^"]*shadow-none[^"]*transition-colors[^"]*duration-200[^"]*hover:bg-transparent/,
    "The student bookmark button hit target should stay visually transparent, including on hover",
  );
  assert.match(
    discoveryCardSource,
    /studentBookmarkIconClassName =\s*"h-\[1\.375rem\] w-\[1\.375rem\] transition-\[fill,color\] duration-200";/,
    "The visible bookmark icon should be slightly larger than the default 20px icon",
  );
  assert.match(
    discoveryCardSource,
    /previewFillOnHover/,
    "Unsaved student card bookmarks should preview the filled state on hover",
  );
  assert.match(
    discoveryCardSource,
    /<SocialLinksList[\s\S]*?appearance="bare"[\s\S]*?compact[\s\S]*?links=\{candidate\.socialLinks\}/,
    "Social icons should render below the profile information only from populated candidate links",
  );

  const contactIndex = discoveryCardSource.indexOf("<ContactReveal");
  const metadataIndex = discoveryCardSource.indexOf(
    '<div className="mt-5 grid gap-5 border-y',
  );
  const footerIndex = discoveryCardSource.indexOf("<footer");

  assert.ok(
    contactIndex > -1 && metadataIndex > -1 && contactIndex < metadataIndex,
    "Get email should be above the metadata divider, not in the bottom action area",
  );
  assert.equal(
    discoveryCardSource.slice(footerIndex).includes("<ContactReveal"),
    false,
    "The old bottom-centered Get email button should be gone",
  );
});

test("all-students rows omit unavailable match percentages and keep one email action", () => {
  const allStudentsSource = readRepoFile(
    "src/components/matching/all-students-list.tsx",
  );

  assert.match(
    allStudentsSource,
    /const matchPercentage = formatMatchPercentage\(candidate\.compatibilityScore\);/,
    "All-students rows should use the same formatter when a real score is available",
  );
  assert.match(
    allStudentsSource,
    /<MatchPercentageIndicator percentage=\{matchPercentage\} \/>/,
    "All-students rows should share the match indicator while still receiving null for fabricated scores",
  );
  assert.match(
    allStudentsSource,
    /<SocialLinksList[\s\S]*?appearance="bare"[\s\S]*?compact[\s\S]*?links=\{candidate\.socialLinks\}/,
    "All-students rows should reuse the existing compact social-link renderer",
  );
  assert.match(
    allStudentsSource,
    /studentBookmarkButtonClassName =\s*"[^"]*group[^"]*border-0[^"]*bg-transparent[^"]*shadow-none[^"]*transition-colors[^"]*duration-200[^"]*hover:bg-transparent/,
    "All-students bookmark hit targets should keep the same square-free treatment",
  );
  assert.match(
    allStudentsSource,
    /iconClassName=\{studentBookmarkIconClassName\}/,
    "All-students rows should apply the same larger standalone bookmark icon",
  );
  assert.equal(
    countMatches(allStudentsSource, /<ContactReveal/g),
    1,
    "All-students rows should keep exactly one Get email action",
  );
});

test("discover social icons use stored URLs safely and render nothing when empty", () => {
  const socialLinksSource = readRepoFile(
    "src/components/profile/profile-social-links.tsx",
  );

  assert.match(
    socialLinksSource,
    /if \(links\.length === 0\) \{\s*return null;/,
    "Empty social-link lists should render nothing",
  );
  assert.match(
    socialLinksSource,
    /href=\{link\.url\}/,
    "Social icons should use the existing stored social URL",
  );
  assert.match(
    socialLinksSource,
    /target="_blank"/,
    "Social icons should open profiles in a new tab",
  );
  assert.match(
    socialLinksSource,
    /rel="noopener noreferrer"/,
    "Social icons should use safe external-link attributes",
  );
  assert.match(
    socialLinksSource,
    /appearance\?: "bare" \| "boxed";/,
    "Student Discover can request the social-icon-only presentation without changing the default renderer",
  );
  assert.match(
    socialLinksSource,
    /compact && appearance === "bare"[\s\S]*?"inline-flex h-9 w-9 items-center justify-center bg-transparent text-blue-800 transition-colors duration-200 hover:bg-transparent hover:text-blue-950/,
    "Bare compact social icons should not apply a visible border, background, or hover box",
  );
});

test("save profile button keeps saved state as a filled icon without requiring a square", () => {
  const saveButtonSource = readRepoFile(
    "src/components/matching/save-profile-button.tsx",
  );

  assert.match(
    saveButtonSource,
    /filled\s*\?\s*"fill-current"[\s\S]*"fill-none group-hover:fill-current"/,
    "Saved and unsaved-hover states should be communicated by filling the bookmark icon itself",
  );
  assert.match(
    saveButtonSource,
    /iconClassName\?: string;/,
    "Student cards should be able to size the icon without changing save behavior",
  );
  assert.match(
    saveButtonSource,
    /previewFillOnHover\?: boolean;/,
    "Student card bookmarks should opt into fill preview without changing save behavior",
  );
  assert.match(
    saveButtonSource,
    /<BookmarkIcon[\s\S]*?className=\{iconClassName\}[\s\S]*?filled=\{saved\}[\s\S]*?previewFillOnHover=\{previewFillOnHover\}/,
    "The custom icon size should flow through the existing semantic save button",
  );
});

test("match percentage indicator pairs UsersRound with real scores only", () => {
  const matchIndicatorSource = readRepoFile(
    "src/components/matching/match-percentage-indicator.tsx",
  );

  assert.match(
    matchIndicatorSource,
    /function UsersRoundIcon/,
    "The match indicator should include the UsersRound visual",
  );
  assert.match(
    matchIndicatorSource,
    /className="h-\[1\.0625rem\] w-\[1\.0625rem\]"/,
    "UsersRound should render at approximately 17px",
  );
  assert.match(
    matchIndicatorSource,
    /if \(!percentage\) \{\s*return null;/,
    "UsersRound should not render without a real match percentage",
  );
  assert.match(
    matchIndicatorSource,
    /aria-label=\{`Match score \$\{percentage\}`\}/,
    "The match group should keep the existing accessible score label",
  );
});
