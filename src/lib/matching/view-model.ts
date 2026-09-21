export const discoveryActions = ["connect", "save", "skip"] as const;

export type DiscoveryAction = (typeof discoveryActions)[number];

export const reportReasons = [
  { label: "Spam", value: "spam" },
  { label: "Harassment", value: "harassment" },
  { label: "Inappropriate content", value: "inappropriate-content" },
  { label: "Fake profile", value: "fake-profile" },
  { label: "Safety concern", value: "safety" },
  { label: "Other", value: "other" },
] as const;

export type ReportReason = (typeof reportReasons)[number]["value"];

type HighlightInput = Readonly<{
  matchedIOfferCount: number;
  matchedTheyOfferCount: number;
  sharedCollaborationGoalCount: number;
  sharedInterestCount: number;
}>;

export function isDiscoveryAction(value: unknown): value is DiscoveryAction {
  return (
    typeof value === "string" &&
    discoveryActions.includes(value as DiscoveryAction)
  );
}

export function isReportReason(value: unknown): value is ReportReason {
  return (
    typeof value === "string" &&
    reportReasons.some((reason) => reason.value === value)
  );
}

export function clampCompatibilityScore(score: number): number {
  if (!Number.isFinite(score)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function compatibilityTone(score: number): "strong" | "good" | "starter" {
  const normalizedScore = clampCompatibilityScore(score);

  if (normalizedScore >= 75) {
    return "strong";
  }

  if (normalizedScore >= 40) {
    return "good";
  }

  return "starter";
}

export function buildHighlightLabels({
  matchedIOfferCount,
  matchedTheyOfferCount,
  sharedCollaborationGoalCount,
  sharedInterestCount,
}: HighlightInput): string[] {
  return [
    matchedTheyOfferCount > 0
      ? `${matchedTheyOfferCount} skill${
          matchedTheyOfferCount === 1 ? "" : "s"
        } they offer ${matchedTheyOfferCount === 1 ? "matches" : "match"} what you want`
      : null,
    matchedIOfferCount > 0
      ? `${matchedIOfferCount} skill${
          matchedIOfferCount === 1 ? "" : "s"
        } you offer ${matchedIOfferCount === 1 ? "matches" : "match"} what they want`
      : null,
    sharedInterestCount > 0
      ? `${sharedInterestCount} shared interest${
          sharedInterestCount === 1 ? "" : "s"
        }`
      : null,
    sharedCollaborationGoalCount > 0
      ? `${sharedCollaborationGoalCount} shared goal${
          sharedCollaborationGoalCount === 1 ? "" : "s"
        }`
      : null,
  ].filter((label): label is string => Boolean(label));
}

export function formatMatchedDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently matched";
  }

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}
