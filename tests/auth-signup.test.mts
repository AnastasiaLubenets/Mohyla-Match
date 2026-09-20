import assert from "node:assert/strict";
import test from "node:test";

import { destinationForSignupResult } from "../src/lib/auth/signup.ts";

test("email confirmation disabled redirects signed-in signup sessions to onboarding", () => {
  assert.equal(
    destinationForSignupResult({
      data: {
        session: {
          access_token: "test-access-token",
        },
      },
    }),
    "/account/setup",
  );
});

test("email confirmation enabled keeps signups without a session in check-email state", () => {
  assert.equal(
    destinationForSignupResult({
      data: {
        session: null,
      },
    }),
    "/signup?status=check-email",
  );
});
