import assert from "node:assert/strict";
import test from "node:test";

import { pathWithMergedParams } from "../src/lib/matching/return-path.ts";

test("matching return paths preserve existing source query params", () => {
  assert.equal(
    pathWithMergedParams("/profiles/target?from=saved", { status: "saved" }),
    "/profiles/target?from=saved&status=saved",
  );
});

test("matching return paths replace existing status and remove empty params", () => {
  assert.equal(
    pathWithMergedParams("/profiles/target?from=discover&status=saved", {
      error: null,
      status: "unsaved",
    }),
    "/profiles/target?from=discover&status=unsaved",
  );
});
