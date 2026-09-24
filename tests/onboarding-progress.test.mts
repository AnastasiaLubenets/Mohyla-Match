import assert from "node:assert/strict";
import test from "node:test";

import {
  canVisitOnboardingStep,
  getCompletedOnboardingStepCount,
  getFirstIncompleteOnboardingStep,
  parseOnboardingStep,
} from "../src/lib/onboarding/progress.ts";

test("onboarding resumes at basic profile when no data exists", () => {
  assert.equal(
    getFirstIncompleteOnboardingStep({
      hasBasicProfile: false,
      offerSkillCount: 0,
      lookingForSkillCount: 0,
      interestCount: 0,
      collaborationGoalCount: 0,
    }),
    1,
  );
});

test("onboarding resumes at offer skills after Step 1 persists", () => {
  const progress = {
    hasBasicProfile: true,
    offerSkillCount: 0,
    lookingForSkillCount: 0,
    interestCount: 0,
    collaborationGoalCount: 0,
  };

  assert.equal(getFirstIncompleteOnboardingStep(progress), 2);
  assert.equal(getCompletedOnboardingStepCount(progress), 1);
});

test("onboarding blocks skipping past the first incomplete step", () => {
  assert.equal(canVisitOnboardingStep(3, 2), false);
  assert.equal(canVisitOnboardingStep(2, 2), true);
  assert.equal(canVisitOnboardingStep(1, 2), true);
});

test("onboarding treats looking-for skills as optional", () => {
  const progress = {
    hasBasicProfile: true,
    offerSkillCount: 1,
    lookingForSkillCount: 0,
    interestCount: 0,
    collaborationGoalCount: 0,
  };

  assert.equal(getFirstIncompleteOnboardingStep(progress), null);
  assert.equal(getCompletedOnboardingStepCount(progress), 4);
});

test("onboarding treats interests and collaboration goals as optional", () => {
  const progress = {
    hasBasicProfile: true,
    offerSkillCount: 1,
    lookingForSkillCount: 2,
    interestCount: 0,
    collaborationGoalCount: 0,
  };

  assert.equal(getFirstIncompleteOnboardingStep(progress), null);
  assert.equal(getCompletedOnboardingStepCount(progress), 4);
});

test("onboarding accepts revisiting completed steps", () => {
  assert.equal(canVisitOnboardingStep(2, 4), true);
});

test("onboarding parser accepts only canonical steps", () => {
  assert.equal(parseOnboardingStep("1"), 1);
  assert.equal(parseOnboardingStep("4"), 4);
  assert.equal(parseOnboardingStep("5"), null);
  assert.equal(parseOnboardingStep("x"), null);
});
