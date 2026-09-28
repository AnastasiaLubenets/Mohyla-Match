import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const onboardingShell = readFileSync(
  "src/components/onboarding-shell.tsx",
  "utf8",
);
const setupPage = readFileSync("src/app/account/setup/page.tsx", "utf8");
const basicForm = readFileSync(
  "src/components/onboarding-basic-form.tsx",
  "utf8",
);
const skillPicker = readFileSync(
  "src/components/onboarding-skill-picker.tsx",
  "utf8",
);
const onboardingStyles = readFileSync(
  "src/components/onboarding-styles.ts",
  "utf8",
);

test("onboarding uses the supplied full-viewport watercolor shell", () => {
  assert.equal(
    existsSync("public/branding/mohyla-onboarding-watercolor.png"),
    true,
  );
  assert.match(
    onboardingShell,
    /src="\/branding\/mohyla-onboarding-watercolor\.png"/,
  );
  assert.match(onboardingShell, /className="fixed inset-0 -z-20"/);
  assert.match(onboardingShell, /className="object-cover object-center"/);
  assert.match(onboardingShell, /sizes="100vw"/);
  assert.match(onboardingShell, /quality=\{100\}/);
  assert.match(onboardingShell, /unoptimized/);
});

test("setup page renders one shared onboarding shell instead of the old plain card", () => {
  assert.match(setupPage, /<OnboardingShell/);
  assert.doesNotMatch(setupPage, /function ProgressHeader/);
  assert.doesNotMatch(setupPage, /function ErrorMessage/);
  assert.doesNotMatch(
    setupPage,
    /rounded-lg border border-border bg-surface p-5 shadow-sm/,
  );
});

test("onboarding forms share the redesigned field and action system", () => {
  assert.match(onboardingStyles, /onboardingFieldClass/);
  assert.match(onboardingStyles, /h-\[3\.125rem\]/);
  assert.match(onboardingStyles, /focus:ring-\[#3567a8\]\/15/);
  assert.match(onboardingStyles, /onboardingPrimaryButtonClass/);
  assert.match(basicForm, /onboardingFieldClass/);
  assert.match(basicForm, /onboardingTextareaClass/);
  assert.match(skillPicker, /onboardingFieldClass/);
  assert.match(skillPicker, /onboardingChipClass/);
});

test("optional onboarding steps keep their skippable behavior visible", () => {
  assert.match(skillPicker, /Skip for now/);
  assert.match(setupPage, /name="skip"/);
  assert.match(setupPage, /Interests · Optional/);
  assert.match(setupPage, /Collaboration goals · Optional/);
});
