import { onboardingPath } from "./routing.ts";

export const signupFullNameMaxLength = 120;

type SignUpResultWithSession = {
  data: {
    session: unknown | null;
  };
};

export function normalizeSignupFullName(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().replace(/\s+/g, " ");

  if (!normalized || normalized.length > signupFullNameMaxLength) {
    return null;
  }

  return normalized;
}

export function signupMetadataForFullName(fullName: string) {
  return {
    full_name: fullName,
  };
}

export function destinationForSignupResult(
  signUpResult: SignUpResultWithSession,
): string {
  if (signUpResult.data.session) {
    return onboardingPath;
  }

  return "/signup?status=check-email";
}

export function destinationForSignupError(message: string): string {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("already registered") ||
    normalized.includes("user_repeated_signup")
  ) {
    return "/login?status=already-registered";
  }

  if (normalized.includes("corporate") || normalized.includes("domain")) {
    return "/signup?error=domain";
  }

  if (normalized.includes("password")) {
    return "/signup?error=password";
  }

  return "/signup?error=signup";
}
