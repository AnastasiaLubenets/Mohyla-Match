import assert from "node:assert/strict";
import test from "node:test";

import {
  createDiscoveryView,
  discoveryViewHref,
} from "../src/lib/matching/discovery-view.ts";

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
