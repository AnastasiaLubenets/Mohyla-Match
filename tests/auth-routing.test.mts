import assert from "node:assert/strict";
import test from "node:test";

import {
  destinationForAccountState,
  logoutDestination,
  sanitizeNextPath,
} from "../src/lib/auth/routing.ts";

test("anonymous users are redirected away from protected routes", () => {
  assert.equal(destinationForAccountState("anonymous", "/app"), "/login?next=%2Fapp");
});

test("onboarding incomplete users are routed to setup", () => {
  assert.equal(destinationForAccountState("onboarding_incomplete", "/app"), "/account/setup");
});

test("suspended users are routed to the suspended account page", () => {
  assert.equal(destinationForAccountState("suspended", "/app"), "/account/suspended");
});

test("active users can continue to a safe requested route", () => {
  assert.equal(destinationForAccountState("active", "/app"), "/app");
});

test("active users opening setup are sent to the app", () => {
  assert.equal(destinationForAccountState("active", "/account/setup"), "/app");
});

test("unsafe next paths are not accepted", () => {
  assert.equal(sanitizeNextPath("https://example.test/app"), "/app");
  assert.equal(sanitizeNextPath("//example.test/app"), "/app");
});

test("logout returns users to login with a signed-out status", () => {
  assert.equal(logoutDestination(), "/login?status=signed-out");
});
