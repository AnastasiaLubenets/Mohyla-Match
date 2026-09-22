import assert from "node:assert/strict";
import test from "node:test";

import {
  contactClipboardUnavailableError,
  contactCopyFallbackError,
  contactEmailCopiedLabel,
  requestAndCopyProfileEmail,
} from "../src/lib/matching/contact-copy.ts";

test("contact copy requests permitted email and writes it to clipboard", async () => {
  const requestedTargets: string[] = [];
  const copiedEmails: string[] = [];

  const result = await requestAndCopyProfileEmail({
    requestContact: async (targetUserId) => {
      requestedTargets.push(targetUserId);

      return {
        ok: true,
        payload: {
          email: "peer@example.test",
          fullName: "Peer Profile",
        },
      };
    },
    targetUserId: "00000000-0000-4000-8000-000000000901",
    writeClipboard: async (email) => {
      copiedEmails.push(email);
    },
  });

  assert.deepEqual(requestedTargets, [
    "00000000-0000-4000-8000-000000000901",
  ]);
  assert.deepEqual(copiedEmails, ["peer@example.test"]);
  assert.deepEqual(result, { fullName: "Peer Profile", status: "copied" });
  assert.equal(contactEmailCopiedLabel, "Email copied");
});

test("contact copy returns a safe endpoint error without writing clipboard", async () => {
  const copiedEmails: string[] = [];

  const result = await requestAndCopyProfileEmail({
    requestContact: async () => ({
      ok: false,
      payload: { error: "Direct email contact is not available for this profile." },
    }),
    targetUserId: "00000000-0000-4000-8000-000000000902",
    writeClipboard: async (email) => {
      copiedEmails.push(email);
    },
  });

  assert.deepEqual(copiedEmails, []);
  assert.deepEqual(result, {
    error: "Direct email contact is not available for this profile.",
    status: "error",
  });
});

test("contact copy hides malformed responses behind a generic error", async () => {
  const result = await requestAndCopyProfileEmail({
    requestContact: async () => ({
      ok: true,
      payload: { message: "raw database error" },
    }),
    targetUserId: "00000000-0000-4000-8000-000000000903",
    writeClipboard: async () => {
      throw new Error("should not write without an email");
    },
  });

  assert.deepEqual(result, {
    error: contactCopyFallbackError,
    status: "error",
  });
});

test("contact copy handles clipboard failure without exposing the email", async () => {
  const result = await requestAndCopyProfileEmail({
    requestContact: async () => ({
      ok: true,
      payload: { email: "peer@example.test" },
    }),
    targetUserId: "00000000-0000-4000-8000-000000000904",
    writeClipboard: async () => {
      throw new Error("clipboard blocked");
    },
  });

  assert.deepEqual(result, {
    error: contactClipboardUnavailableError,
    status: "error",
  });
});
