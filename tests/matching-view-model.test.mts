import assert from "node:assert/strict";
import test from "node:test";

import {
  buildHighlightLabels,
  clampCompatibilityScore,
  compatibilityTone,
  formatMatchedDate,
  isDiscoveryAction,
  isReportReason,
} from "../src/lib/matching/view-model.ts";

test("matching view model validates supported discovery actions", () => {
  assert.equal(isDiscoveryAction("connect"), true);
  assert.equal(isDiscoveryAction("save"), true);
  assert.equal(isDiscoveryAction("skip"), true);
  assert.equal(isDiscoveryAction("delete"), false);
});

test("matching view model validates report reasons", () => {
  assert.equal(isReportReason("spam"), true);
  assert.equal(isReportReason("fake-profile"), true);
  assert.equal(isReportReason("raw database error"), false);
});

test("compatibility scores are clamped and mapped to display tone", () => {
  assert.equal(clampCompatibilityScore(108), 100);
  assert.equal(clampCompatibilityScore(-4), 0);
  assert.equal(compatibilityTone(82), "strong");
  assert.equal(compatibilityTone(52), "good");
  assert.equal(compatibilityTone(18), "starter");
});

test("highlight labels describe matching explanations", () => {
  assert.deepEqual(
    buildHighlightLabels({
      matchedIOfferCount: 1,
      matchedTheyOfferCount: 2,
      sharedCollaborationGoalCount: 1,
      sharedInterestCount: 3,
    }),
    [
      "2 skills they offer match what you want",
      "1 skill you offer matches what they want",
      "3 shared interests",
      "1 shared goal",
    ],
  );
});

test("invalid match date falls back safely", () => {
  assert.equal(formatMatchedDate("not-a-date"), "Recently matched");
});
