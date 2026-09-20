import { onboardingPath } from "./routing.ts";

type SignUpResultWithSession = {
  data: {
    session: unknown | null;
  };
};

export function destinationForSignupResult(
  signUpResult: SignUpResultWithSession,
): string {
  if (signUpResult.data.session) {
    return onboardingPath;
  }

  return "/signup?status=check-email";
}
