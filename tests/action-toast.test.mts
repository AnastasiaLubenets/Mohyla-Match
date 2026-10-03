import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import {
  saveStatusToast,
  savedProfileToastMessages,
  toastExitMs,
  toastVisibleMs,
} from "../src/lib/matching/action-toast.ts";

const repoRoot = process.cwd();

function readRepoFile(path: string) {
  return readFileSync(join(repoRoot, path), "utf8");
}

test("save status maps to compact shared toast copy", () => {
  assert.deepEqual(savedProfileToastMessages, {
    saved: "Added to Saved",
    unsaved: "Removed from Saved",
  });
  assert.deepEqual(saveStatusToast("saved"), {
    id: "save-saved",
    message: "Added to Saved",
    tone: "success",
  });
  assert.deepEqual(saveStatusToast("unsaved"), {
    id: "save-unsaved",
    message: "Removed from Saved",
    tone: "success",
  });
  assert.equal(saveStatusToast("reported"), null);
});

test("get email uses the shared toast only after a successful copy", () => {
  const contactRevealSource = readRepoFile(
    "src/components/matching/contact-reveal.tsx",
  );

  assert.match(
    contactRevealSource,
    /import \{ showActionToast \} from "@\/components\/matching\/action-toast"/,
    "Get email should use the shared toast mechanism",
  );
  assert.match(
    contactRevealSource,
    /if \(result\.status === "copied"\) \{[\s\S]*?showActionToast\(\{ message: contactEmailCopiedLabel, tone: "success" \}\)/,
    "Email copied toast should only be shown after a successful clipboard write",
  );
  assert.doesNotMatch(
    contactRevealSource,
    /copiedName|border-green-200|bg-green-50|text-green-950/,
    "Get email should not render the old inline green confirmation",
  );
});

test("the shared toast is fixed, bottom-centered, timed, replaceable, and motion-safe", () => {
  const toastSource = readRepoFile("src/components/matching/action-toast.tsx");

  assert.equal(toastVisibleMs, 3000);
  assert.equal(toastExitMs, 180);
  assert.match(
    toastSource,
    /fixed inset-x-0 bottom-5[\s\S]*justify-center/,
    "Toast should be fixed at the bottom center and should not affect layout height",
  );
  assert.match(
    toastSource,
    /max-w-\[min\(22rem,calc\(100vw-2rem\)\)\]/,
    "Toast width should be safe on mobile and desktop",
  );
  assert.match(
    toastSource,
    /motion-reduce:transition-none/,
    "Toast animation should respect reduced motion preferences",
  );
  assert.match(
    toastSource,
    /clearTimeout\(hideTimer\.current\)[\s\S]*clearTimeout\(removeTimer\.current\)/,
    "A new toast should clear old timers instead of stacking notifications",
  );
  assert.match(
    toastSource,
    /setToast\(nextToast\)/,
    "A new action should replace the current toast",
  );
  assert.match(
    toastSource,
    /setTimeout\(\(\) => \{[\s\S]*?setExiting\(true\)[\s\S]*?\}, toastVisibleMs\)/,
    "Toast should begin fading after the shared visible lifetime",
  );
});

test("save status pages use the same toast viewport instead of inline saved banners", () => {
  const appPageSource = readRepoFile("src/app/app/page.tsx");
  const savedPageSource = readRepoFile("src/app/saved/page.tsx");
  const profilePageSource = readRepoFile("src/app/profiles/[userId]/page.tsx");
  const discoveryCardSource = readRepoFile(
    "src/components/matching/discovery-card.tsx",
  );
  const allStudentsSource = readRepoFile(
    "src/components/matching/all-students-list.tsx",
  );

  assert.match(appPageSource, /<ActionToastViewport/);
  assert.match(savedPageSource, /toast=\{saveStatusToast\(status\)\}/);
  assert.match(profilePageSource, /toast=\{saveStatusToast\(status\)\}/);

  [
    discoveryCardSource,
    allStudentsSource,
    savedPageSource,
    profilePageSource,
  ].forEach((source) => {
    assert.doesNotMatch(
      source,
      /Saved for later\. You can find this profile in Saved\.|Saved for later\./,
      "Old inline saved confirmation copy should be removed",
    );
  });
});
