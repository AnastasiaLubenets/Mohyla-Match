export const onboardingStepCount = 4;

export type OnboardingStep = 1 | 2 | 3 | 4;

export type OnboardingProgressInput = Readonly<{
  hasBasicProfile: boolean;
  offerSkillCount: number;
  lookingForSkillCount: number;
  interestCount: number;
  collaborationGoalCount: number;
}>;

export function getFirstIncompleteOnboardingStep(
  progress: OnboardingProgressInput,
): OnboardingStep | null {
  if (!progress.hasBasicProfile) {
    return 1;
  }

  if (progress.offerSkillCount < 1) {
    return 2;
  }

  return null;
}

export function getCompletedOnboardingStepCount(
  progress: OnboardingProgressInput,
): number {
  const firstIncompleteStep = getFirstIncompleteOnboardingStep(progress);

  return firstIncompleteStep ? firstIncompleteStep - 1 : onboardingStepCount;
}

export function parseOnboardingStep(
  value: string | string[] | null | undefined,
): OnboardingStep | null {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const step = Number(rawValue);

  if (step === 1 || step === 2 || step === 3 || step === 4) {
    return step;
  }

  return null;
}

export function canVisitOnboardingStep(
  requestedStep: OnboardingStep,
  firstIncompleteStep: OnboardingStep | null,
): boolean {
  return firstIncompleteStep === null || requestedStep <= firstIncompleteStep;
}
