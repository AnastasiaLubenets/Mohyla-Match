import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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
    /:\s*\([\s\S]*?<DiscoveryFeed/,
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
