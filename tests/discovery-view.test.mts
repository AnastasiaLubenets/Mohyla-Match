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
        goal: ["build-app", "research-project"],
        program: ["Computer Science", "Economics"],
        q: "python",
        skill: ["react", "figma"],
        status: "saved",
        view: "recommended",
        year: ["3", "4"],
      },
      "all",
    ),
    "/app?view=all&goal=build-app&goal=research-project&program=Computer+Science&program=Economics&q=python&skill=react&skill=figma&year=3&year=4",
  );
});

test("discovery tab links deduplicate repeated query values", () => {
  assert.equal(
    discoveryViewHref(
      {
        interest: ["startups", "startups", "  "],
        view: "all",
      },
      "recommended",
    ),
    "/app?view=recommended&interest=startups",
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

test("discover filters use searchable multi-selects and full taxonomy loader", () => {
  const appPageSource = readFileSync(
    join(repoRoot, "src/app/app/page.tsx"),
    "utf8",
  );
  const matchingDataSource = readFileSync(
    join(repoRoot, "src/lib/matching/data.ts"),
    "utf8",
  );
  const filterFormSource = readFileSync(
    join(repoRoot, "src/components/matching/discovery-filter-form.tsx"),
    "utf8",
  );
  const multiSelectSource = readFileSync(
    join(repoRoot, "src/components/matching/discovery-multi-select.tsx"),
    "utf8",
  );

  assert.match(
    appPageSource,
    /loadDiscoveryFilterOptions\(supabase\)/,
    "Discover should load filter choices from reference taxonomy tables",
  );
  assert.match(
    appPageSource,
    /<DiscoveryFilterForm[\s\S]*?filters=\{filters\}[\s\S]*?options=\{options\}/,
    "Discover should render the shared filter form",
  );
  assert.match(
    filterFormSource,
    /<DiscoveryMultiSelect[\s\S]*?name="skill"/,
    "Skills should use the shared searchable multi-select control",
  );
  assert.match(
    filterFormSource,
    /<DiscoveryMultiSelect[\s\S]*?name="interest"/,
    "Interests should use the shared searchable multi-select control",
  );
  assert.doesNotMatch(
    appPageSource,
    /function SelectField|<select/,
    "Discover filters should not use browser-native select controls",
  );
  assert.match(
    matchingDataSource,
    /\.from\("academic_programs"\)[\s\S]*?\.eq\("is_active", true\)/,
    "Academic program options should come from active reference rows",
  );
  assert.match(
    matchingDataSource,
    /\.from\("skills"\)[\s\S]*?\.eq\("is_active", true\)/,
    "Skill options should come from active reference rows",
  );
  assert.match(
    multiSelectSource,
    /searchDiscoveryFilterOptions\(options, query\)/,
    "Filter dropdowns should support partial text search",
  );
  assert.match(
    multiSelectSource,
    /name=\{name\} type="hidden"/,
    "Selected values should submit as repeated query params",
  );
  assert.match(
    appPageSource,
    /<aside className="[^"]*xl:overflow-y-auto/,
    "The desktop filter rail should scroll instead of clipping lower dropdowns",
  );
  assert.doesNotMatch(
    appPageSource,
    /<aside className="[^"]*xl:overflow-hidden/,
    "The desktop filter rail must not hide overflowing dropdown content",
  );
  assert.match(
    multiSelectSource,
    /role="group"/,
    "Filter option lists should keep checkbox semantics instead of an invalid listbox wrapper",
  );
  assert.doesNotMatch(
    multiSelectSource,
    /role="listbox"|aria-multiselectable/,
    "Checkbox filter options should not be wrapped in incomplete listbox semantics",
  );
});

test("discover filter dropdowns share one outside-click and escape controller", () => {
  const filterFormSource = readFileSync(
    join(repoRoot, "src/components/matching/discovery-filter-form.tsx"),
    "utf8",
  );
  const multiSelectSource = readFileSync(
    join(repoRoot, "src/components/matching/discovery-multi-select.tsx"),
    "utf8",
  );

  assert.match(
    filterFormSource,
    /const \[openDropdown, setOpenDropdown\]/,
    "The filter rail should keep exactly one active dropdown key",
  );
  assert.match(
    filterFormSource,
    /document\.addEventListener\("pointerdown", handlePointerDown\)/,
    "Open dropdowns should close on outside pointer interaction",
  );
  assert.match(
    filterFormSource,
    /document\.addEventListener\("keydown", handleKeyDown\)/,
    "Open dropdowns should close on Escape",
  );
  assert.match(
    filterFormSource,
    /document\.removeEventListener\("pointerdown", handlePointerDown\)/,
    "Document pointer listeners should be cleaned up",
  );
  assert.match(
    filterFormSource,
    /openRoot\?\.contains\(target\)/,
    "Clicks inside the active dropdown should not close it",
  );
  assert.match(
    multiSelectSource,
    /open: boolean/,
    "Multi-select dropdown visibility should be controlled by the shared form",
  );
  assert.match(
    multiSelectSource,
    /onOpenChange\(!open\)/,
    "A dropdown button should request the shared open-state change",
  );
  assert.doesNotMatch(
    multiSelectSource,
    /const \[open, setOpen\] = useState\(false\)/,
    "Individual filters should not keep independent open state",
  );
});
