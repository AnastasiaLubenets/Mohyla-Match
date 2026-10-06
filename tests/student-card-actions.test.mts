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
    /aria-label=\{`Match score \$\{matchPercentage\}`\}[\s\S]*?\{matchPercentage\}[\s\S]*?<SaveProfileButton/,
    "The plain match percentage should appear immediately before the bookmark control",
  );
  assert.match(
    discoveryCardSource,
    /<SocialLinksList compact links=\{candidate\.socialLinks\} \/>/,
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
    /matchPercentage \? \(/,
    "All-students rows should omit the percentage when no real score is available",
  );
  assert.match(
    allStudentsSource,
    /<SocialLinksList compact links=\{candidate\.socialLinks\} \/>/,
    "All-students rows should reuse the existing compact social-link renderer",
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
});
