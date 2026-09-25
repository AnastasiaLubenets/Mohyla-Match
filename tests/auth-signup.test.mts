import assert from "node:assert/strict";
import test from "node:test";

import {
  destinationForSignupError,
  destinationForSignupResult,
  normalizeSignupFullName,
  signupFullNameMaxLength,
  signupMetadataForFullName,
} from "../src/lib/auth/signup.ts";

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

test("duplicate signup redirects to login with already registered status", () => {
  assert.equal(
    destinationForSignupError("422: User already registered"),
    "/login?status=already-registered",
  );
  assert.equal(
    destinationForSignupError("user_repeated_signup"),
    "/login?status=already-registered",
  );
});

test("signup error classification keeps existing non-duplicate destinations", () => {
  assert.equal(
    destinationForSignupError("Signup is limited to verified corporate email domains."),
    "/signup?error=domain",
  );
  assert.equal(
    destinationForSignupError("Password should be at least 6 characters."),
    "/signup?error=password",
  );
  assert.equal(destinationForSignupError("Unexpected auth error"), "/signup?error=signup");
});

test("signup full name metadata is trimmed and bounded", () => {
  assert.equal(normalizeSignupFullName("  Anastasiia   L.  "), "Anastasiia L.");
  assert.equal(normalizeSignupFullName("   "), null);
  assert.equal(normalizeSignupFullName("A".repeat(signupFullNameMaxLength + 1)), null);
  assert.deepEqual(signupMetadataForFullName("Anastasiia L."), {
    full_name: "Anastasiia L.",
  });
});
