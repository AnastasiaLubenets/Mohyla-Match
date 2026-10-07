export const systemAvatarSizeClasses = {
  sm: "w-14 text-lg",
  md: "w-24 text-3xl",
  lg: "w-32 text-4xl",
  xl: "w-full text-5xl sm:w-52",
  discover: "w-full text-5xl",
} as const;

export type SystemAvatarSize = keyof typeof systemAvatarSizeClasses;

export const systemAvatarRadiusClass = "rounded-[0.65rem]" as const;

export const profileAvatarModes = ["default", "program", "custom"] as const;

export type ProfileAvatarMode = (typeof profileAvatarModes)[number];

export type CustomAvatarOption = Readonly<{
  key: string;
  src: string;
}>;

const programAvatarBaseContainerClasses =
  "relative isolate aspect-square shrink-0 overflow-hidden p-0";

export const programAvatarContainerClasses =
  `${programAvatarBaseContainerClasses} ${systemAvatarRadiusClass}`;

export function getProgramAvatarContainerClasses() {
  return programAvatarContainerClasses;
}

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
  "program-computer-science",
  "program-applied-mathematics",
  "program-psychology",
  "program-social-work",
  "program-medicine",
  "program-public-health",
  "program-healthcare-management",
  "program-international-law",
] as const;

type MappedProgramAvatarKey = (typeof mappedProgramAvatarKeys)[number];

export const programAvatarSrcByKey = {
  "program-economics": "/avatars/programs/program-economics-v2.png",
  "program-marketing": "/avatars/programs/program-marketing-v2.png",
  "program-management": "/avatars/programs/program-management-v2.png",
  "program-finance-banking-insurance":
    "/avatars/programs/program-finance-banking-insurance-v2.png",
  "program-public-relations":
    "/avatars/programs/program-public-relations-v2.png",
  "program-political-science":
    "/avatars/programs/program-political-science-v2.png",
  "program-sociology": "/avatars/programs/program-sociology-v2.png",
  "program-law": "/avatars/programs/program-law-v2.png",
  "program-history": "/avatars/programs/program-history-v2.png",
  "program-cultural-studies":
    "/avatars/programs/program-cultural-studies-v2.png",
  "program-language-literature-comparative-studies":
    "/avatars/programs/program-language-literature-comparative-studies-v2.png",
  "program-philosophy": "/avatars/programs/program-philosophy-v2.png",
  "program-international-relations-public-communications-regional-studies":
    "/avatars/programs/program-international-relations-public-communications-regional-studies-v2.png",
  "program-public-private-governance":
    "/avatars/programs/program-public-private-governance-v2.png",
  "program-biology-biotechnology":
    "/avatars/programs/program-biology-biotechnology-v2.png",
  "program-ecology": "/avatars/programs/program-ecology-v2.png",
  "program-rocket-aerospace-systems-physics":
    "/avatars/programs/program-rocket-aerospace-systems-physics-v2.png",
  "program-chemistry": "/avatars/programs/program-chemistry-v2.png",
  "program-software-engineering":
    "/avatars/programs/program-software-engineering-v2.png",
  "program-automation-computer-integrated-technologies-robotics":
    "/avatars/programs/program-automation-computer-integrated-technologies-robotics-v2.png",
  "program-information-systems-vulnerability-analysis":
    "/avatars/programs/program-information-systems-vulnerability-analysis-v2.png",
  "program-computer-science":
    "/avatars/programs/program-computer-science-v2.png",
  "program-applied-mathematics":
    "/avatars/programs/program-applied-mathematics-v2.png",
  "program-psychology": "/avatars/programs/program-psychology-v2.png",
  "program-social-work": "/avatars/programs/program-social-work-v2.png",
  "program-medicine": "/avatars/programs/program-medicine-v2.png",
  "program-public-health": "/avatars/programs/program-public-health-v2.png",
  "program-healthcare-management":
    "/avatars/programs/program-healthcare-management-v2.png",
  "program-international-law":
    "/avatars/programs/program-international-law-v2.png",
} as const satisfies Record<MappedProgramAvatarKey, string>;

const mappedProgramAvatarKeySet = new Set<string>(mappedProgramAvatarKeys);

const legacyProgramAvatarAliases = new Map<string, string>([
  ["program-archaeology", "program-history"],
  [
    "program-english-and-ukrainian-language",
    "program-language-literature-comparative-studies",
  ],
  ["program-big-data-analytics", "program-applied-mathematics"],
]);

export const customAvatarOptions = [
  "avatar-01",
  "avatar-02",
  "avatar-03",
  "avatar-04",
  "avatar-05",
  "avatar-06",
  "avatar-07",
  "avatar-08",
  "avatar-09",
  "avatar-10",
  "avatar-11",
  "avatar-12",
  "avatar-13",
  "avatar-14",
  "avatar-15",
  "avatar-16",
  "avatar-17",
  "avatar-18",
  "avatar-19",
  "avatar-20",
  "avatar-girl-glasses",
  "avatar-buzz-cut",
  "avatar-light-stubble",
  "avatar-pixie-cut",
  "avatar-dark-skin-short-curls",
  "avatar-dark-skin-long-curls",
  "avatar-long-black-hair",
  "avatar-longer-hair-guy",
  "avatar-freckles",
  "avatar-beanie",
].map((key) => ({
  key,
  src: `/avatars/custom/${key}.png`,
})) satisfies CustomAvatarOption[];

const customAvatarKeySet = new Set<string>(
  customAvatarOptions.map((avatar) => avatar.key),
);

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
  const rawKey =
    normalizeAvatarVariantKey(avatarVariantKey) ??
    normalizeAvatarVariantKey(systemAvatarKey);
  const key = rawKey ? (legacyProgramAvatarAliases.get(rawKey) ?? rawKey) : null;

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

  return key ? programAvatarSrcByKey[key as MappedProgramAvatarKey] : null;
}

export function getCustomAvatarSrc(
  customAvatarKey: string | null | undefined,
): string | null {
  const key = customAvatarKey?.trim();

  return key && customAvatarKeySet.has(key)
    ? `/avatars/custom/${key}.png`
    : null;
}

export function normalizeProfileAvatarMode(
  value: string | null | undefined,
): ProfileAvatarMode {
  return profileAvatarModes.includes(value as ProfileAvatarMode)
    ? (value as ProfileAvatarMode)
    : "program";
}

export type ProfileAvatarInput = Readonly<{
  avatarMode?: ProfileAvatarMode | string | null;
  avatarVariantKey?: string | null;
  customAvatarKey?: string | null;
  systemAvatarKey: string;
}>;

export type ResolvedProfileAvatar =
  | Readonly<{
      key: string;
      kind: "image";
      mode: "custom" | "program";
      src: string;
    }>
  | Readonly<{
      key: "default";
      kind: "default";
      mode: "default";
      src: null;
    }>;

export function resolveProfileAvatar({
  avatarMode,
  avatarVariantKey,
  customAvatarKey,
  systemAvatarKey,
}: ProfileAvatarInput): ResolvedProfileAvatar {
  const mode = normalizeProfileAvatarMode(avatarMode);

  if (mode === "custom") {
    const customAvatarSrc = getCustomAvatarSrc(customAvatarKey);

    return customAvatarSrc
      ? {
          key: customAvatarKey?.trim() ?? "default",
          kind: "image",
          mode,
          src: customAvatarSrc,
        }
      : { key: "default", kind: "default", mode: "default", src: null };
  }

  if (mode === "program") {
    const programAvatarKey = getMappedProgramAvatarKey(
      systemAvatarKey,
      avatarVariantKey,
    );

    return programAvatarKey
      ? {
          key: programAvatarKey,
          kind: "image",
          mode,
          src: programAvatarSrcByKey[programAvatarKey as MappedProgramAvatarKey],
        }
      : { key: "default", kind: "default", mode: "default", src: null };
  }

  return { key: "default", kind: "default", mode: "default", src: null };
}
