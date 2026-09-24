export const systemAvatarSizeClasses = {
  sm: "h-14 w-14 text-lg",
  md: "h-24 w-24 text-3xl",
  lg: "h-32 w-32 text-4xl",
  xl: "h-52 w-full text-5xl sm:w-52",
  discover: "h-48 w-full text-5xl sm:h-56",
} as const;

export type SystemAvatarSize = keyof typeof systemAvatarSizeClasses;

export const programAvatarContainerClasses =
  "relative isolate shrink-0 overflow-hidden rounded-[1.25rem] p-0";

export const programAvatarImageClasses = "h-full w-full object-cover";

export const mappedProgramAvatarKeys = [
  "program-economics",
  "program-marketing",
  "program-management",
  "program-finance-banking-insurance",
  "program-public-relations",
  "program-political-science",
  "program-sociology",
  "program-law",
  "program-history",
  "program-archaeology",
  "program-english-and-ukrainian-language",
  "program-cultural-studies",
  "program-language-literature-comparative-studies",
  "program-philosophy",
  "program-international-relations-public-communications-regional-studies",
  "program-public-private-governance",
  "program-biology-biotechnology",
  "program-ecology",
  "program-rocket-aerospace-systems-physics",
  "program-chemistry",
  "program-software-engineering",
  "program-automation-computer-integrated-technologies-robotics",
  "program-information-systems-vulnerability-analysis",
  "program-big-data-analytics",
  "program-computer-science",
  "program-applied-mathematics",
  "program-psychology",
  "program-social-work",
] as const;

const mappedProgramAvatarKeySet = new Set<string>(mappedProgramAvatarKeys);

function normalizeAvatarVariantKey(value: string | null | undefined) {
  const key = value?.trim();

  if (!key) {
    return null;
  }

  const delimiterIndex = key.lastIndexOf("--");
  return delimiterIndex >= 0 ? key.slice(delimiterIndex + 2) : key;
}

export function getMappedProgramAvatarKey(
  systemAvatarKey: string,
  avatarVariantKey?: string | null,
): string | null {
  const key =
    normalizeAvatarVariantKey(avatarVariantKey) ??
    normalizeAvatarVariantKey(systemAvatarKey);

  if (!key || !mappedProgramAvatarKeySet.has(key)) {
    return null;
  }

  return key;
}

export function getProgramAvatarSrc(
  systemAvatarKey: string,
  avatarVariantKey?: string | null,
): string | null {
  const key = getMappedProgramAvatarKey(systemAvatarKey, avatarVariantKey);

  return key ? `/avatars/programs/${key}.png` : null;
}
