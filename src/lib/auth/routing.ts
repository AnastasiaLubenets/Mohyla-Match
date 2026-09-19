export type AccountState =
  | "anonymous"
  | "onboarding_incomplete"
  | "active"
  | "suspended"
  | "deleted";

export const defaultAuthenticatedPath = "/app";
export const onboardingPath = "/account/setup";
export const suspendedPath = "/account/suspended";
export const loginPath = "/login";

export function sanitizeNextPath(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return defaultAuthenticatedPath;
  }

  return value;
}

export function destinationForAccountState(
  state: AccountState,
  requestedPath = defaultAuthenticatedPath,
): string {
  if (state === "active") {
    return sanitizeNextPath(requestedPath);
  }

  if (state === "onboarding_incomplete") {
    return onboardingPath;
  }

  if (state === "suspended") {
    return suspendedPath;
  }

  return `${loginPath}?next=${encodeURIComponent(sanitizeNextPath(requestedPath))}`;
}

export function logoutDestination(): string {
  return `${loginPath}?status=signed-out`;
}

export function isAllowedAccountState(
  state: AccountState,
  allowedStates: readonly AccountState[],
): boolean {
  return allowedStates.includes(state);
}
