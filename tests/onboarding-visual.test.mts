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

test("onboarding header uses the dedicated Mohyla emblem asset", () => {
  assert.equal(
    existsSync("public/branding/mohyla-onboarding-emblem.png"),
    true,
  );
  assert.match(
    onboardingShell,
    /src="\/branding\/mohyla-onboarding-emblem\.png"/,
  );
  assert.doesNotMatch(
    onboardingShell,
    /src="\/branding\/mohyla-match-logo\.png"/,
  );
  assert.match(onboardingShell, /className="h-11 w-auto object-contain"/);
  assert.match(
    onboardingShell,
    /src="\/branding\/mohyla-onboarding-emblem\.png"[\s\S]*unoptimized/,
  );
  assert.match(onboardingShell, /width=\{563\}/);
  assert.match(onboardingShell, /height=\{443\}/);
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

test("skill picker keeps categories out of persistent card text", () => {
  assert.match(skillPicker, /function SkillCategoryTooltip/);
  assert.match(skillPicker, /role="tooltip"/);
  assert.match(skillPicker, /group-hover:opacity-100/);
  assert.match(skillPicker, /group-focus-visible:opacity-100/);
  assert.match(skillPicker, /aria-describedby=\{tooltipId\}/);
  assert.match(skillPicker, /flex min-w-0 flex-1 items-center gap-3/);
  assert.match(skillPicker, /inline-flex size-6 shrink-0/);
  assert.match(skillPicker, /min-w-0 break-words leading-snug/);
  assert.doesNotMatch(skillPicker, /max-w-\[45%\] break-words text-right/);
});

test("skill search highlight uses Mohyla blue states instead of beige surface", () => {
  assert.match(skillPicker, /bg-white hover:bg-\[#F5F8FF\]/);
  assert.match(skillPicker, /bg-\[#EAF2FF\] hover:bg-\[#EAF2FF\]/);
  assert.match(skillPicker, /text-\[#102653\]/);
  assert.doesNotMatch(skillPicker, /bg-surface-strong/);
  assert.doesNotMatch(skillPicker, /hover:bg-surface-strong/);
});
