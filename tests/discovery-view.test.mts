import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import {
  createDiscoveryView,
  discoveryViewHref,
} from "../src/lib/matching/discovery-view.ts";

const repoRoot = process.cwd();

test("discovery view defaults to recommended", () => {
  assert.equal(createDiscoveryView(undefined), "recommended");
  assert.equal(createDiscoveryView("recommended"), "recommended");
  assert.equal(createDiscoveryView("unknown"), "recommended");
});

test("discovery view accepts all students", () => {
  assert.equal(createDiscoveryView("all"), "all");
  assert.equal(createDiscoveryView(["all", "recommended"]), "all");
});

test("discovery tab links preserve filters and search but drop transient status", () => {
  assert.equal(
    discoveryViewHref(
      {
        error: "action-failed",
        goal: "build-app",
        program: "Computer Science",
        q: "python",
        status: "saved",
        view: "recommended",
      },
      "all",
    ),
    "/app?view=all&goal=build-app&program=Computer+Science&q=python",
  );
});

test("all students uses the compact directory list instead of discovery cards", () => {
  const appPageSource = readFileSync(
    join(repoRoot, "src/app/app/page.tsx"),
    "utf8",
  );
  const allStudentsListSource = readFileSync(
    join(repoRoot, "src/components/matching/all-students-list.tsx"),
    "utf8",
  );

  assert.match(
    appPageSource,
    /view === "all"\s*\?\s*\([\s\S]*?<AllStudentsList/,
    "the all-students tab should render the compact list component",
  );
  assert.match(
    appPageSource,
    /:\s*\([\s\S]*?<RecommendedFeed/,
    "the recommended tab should keep the existing discovery feed",
  );
  assert.doesNotMatch(
    allStudentsListSource,
    /<DiscoveryCard/,
    "all-students rows should not reuse the large recommendation card",
  );
  assert.match(
    allStudentsListSource,
    /<SystemAvatar[\s\S]*?size="md"/,
    "all-students rows should render the academic-program avatar",
  );
  assert.match(
    allStudentsListSource,
    /limit=\{3\}/,
    "all-students rows should keep skills compact",
  );
  assert.match(
    allStudentsListSource,
    /View profile/,
    "all-students rows should provide profile access",
  );
  assert.match(
    allStudentsListSource,
    /ContactReveal/,
    "all-students rows should keep the explicit secure email action",
  );
  assert.doesNotMatch(
    allStudentsListSource,
    /mailto:/,
    "the compact directory should not expose raw email links",
  );
});

test("recommended skip is local-only and never posts to the legacy route", () => {
  const discoveryCardSource = readFileSync(
    join(repoRoot, "src/components/matching/discovery-card.tsx"),
    "utf8",
  );
  const recommendedFeedSource = readFileSync(
    join(repoRoot, "src/components/matching/recommended-feed.tsx"),
    "utf8",
  );

  assert.doesNotMatch(
    discoveryCardSource,
    /action="\/app\/action"/,
    "the visible Skip control should not post to /app/action",
  );
  assert.match(
    discoveryCardSource,
    /type="button"[\s\S]*?<span>Skip<\/span>/,
    "Skip should be a client-side button",
  );
  assert.match(
    discoveryCardSource,
    /onSkip\?\.\(candidate\.userId\)/,
    "Skip should call the local dismissal callback",
  );
  assert.match(
    recommendedFeedSource,
    /useState<ReadonlySet<string>>/,
    "recommended feed should keep dismissed ids in memory",
  );
  assert.match(
    recommendedFeedSource,
    /setDismissedIds/,
    "recommended feed should dismiss skipped cards locally",
  );
  assert.doesNotMatch(
    recommendedFeedSource,
    /localStorage|sessionStorage|fetch\(|\/app\/action/,
    "local skip state must not be persisted or sent over the network",
  );
});

test("block controls and routes are not user-facing", () => {
  const matchingActionsSource = readFileSync(
    join(repoRoot, "src/lib/matching/actions.ts"),
    "utf8",
  );
  const profileActionPanelSource = readFileSync(
    join(repoRoot, "src/components/matching/profile-action-panel.tsx"),
    "utf8",
  );
  const profileSafetyMenuSource = readFileSync(
    join(repoRoot, "src/components/profile/profile-safety-menu.tsx"),
    "utf8",
  );

  assert.equal(
    existsSync(join(repoRoot, "src/app/profiles/block/route.ts")),
    false,
    "the profile block route should be removed",
  );
  assert.doesNotMatch(
    matchingActionsSource,
    /blockProfile|block_user|block-failed/,
    "matching actions should not expose a block action",
  );
  assert.doesNotMatch(
    profileActionPanelSource + profileSafetyMenuSource,
    /\/profiles\/block|Block profile|Block user|Block this profile/,
    "profile surfaces should not render block controls",
  );
});

test("tab feed load failures stay inside the results block", () => {
  const appPageSource = readFileSync(
    join(repoRoot, "src/app/app/page.tsx"),
    "utf8",
  );
  const allStudentsListSource = readFileSync(
    join(repoRoot, "src/components/matching/all-students-list.tsx"),
    "utf8",
  );

  assert.doesNotMatch(
    appPageSource,
    /Discovery unavailable/,
    "a feed load failure must not replace the full Discover shell",
  );
  assert.doesNotMatch(
    appPageSource,
    /if\s*\(\s*candidatesResult\.error\s*\)\s*{\s*return\s*\(/,
    "candidate loader errors should not use a page-level early return",
  );
  assert.match(
    appPageSource,
    /<AllStudentsList[\s\S]*?loadError=\{candidatesResult\.error\}/,
    "all-students loader errors should be passed to the result block",
  );
  assert.match(
    appPageSource,
    /<RecommendedFeed[\s\S]*?loadError=\{candidatesResult\.error\}/,
    "recommended loader errors should be passed to the result block",
  );
  assert.match(
    allStudentsListSource,
    /Could not load students\. Try again\./,
    "all-students failures should show the requested inline error",
  );
});

test("all students loader calls the production RPC with an explicit limit", () => {
  const matchingDataSource = readFileSync(
    join(repoRoot, "src/lib/matching/data.ts"),
    "utf8",
  );

  assert.match(
    matchingDataSource,
    /loadAllDiscoveryProfiles\([\s\S]*?limit = 500/,
    "the all-students loader should default to the RPC's production-safe cap",
  );
  assert.match(
    matchingDataSource,
    /rpc\("get_all_discovery_profiles",\s*{\s*profile_limit: limit,\s*}\)/,
    "the all-students RPC should not depend on a no-argument call path",
  );
  assert.doesNotMatch(
    matchingDataSource,
    /get_all_discovery_profiles",\s*{}\)/,
    "the all-students RPC should never be called with an empty args object",
  );
});
