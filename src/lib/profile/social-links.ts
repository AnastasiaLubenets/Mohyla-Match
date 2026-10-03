export const socialPlatformOptions = [
  { label: "LinkedIn", value: "linkedin" },
  { label: "GitHub", value: "github" },
  { label: "ORCID", value: "orcid" },
  { label: "Google Scholar", value: "google-scholar" },
  { label: "ResearchGate", value: "researchgate" },
  { label: "Instagram", value: "instagram" },
  { label: "Facebook", value: "facebook" },
  { label: "X / Twitter", value: "twitter" },
  { label: "Threads", value: "threads" },
  { label: "TikTok", value: "tiktok" },
  { label: "Telegram", value: "telegram" },
  { label: "Discord", value: "discord" },
  { label: "Behance", value: "behance" },
  { label: "Dribbble", value: "dribbble" },
  { label: "YouTube", value: "youtube" },
  { label: "Medium", value: "medium" },
  { label: "Personal website", value: "personal-website" },
] as const;

export type SocialPlatform = (typeof socialPlatformOptions)[number]["value"];

export type ProfileSocialLink = Readonly<{
  platform: SocialPlatform;
  sortOrder: number;
  url: string;
}>;

export type ProfileSocialLinkInput = Readonly<{
  platform: string;
  url: string;
}>;

export type SocialLinkValidationResult =
  | Readonly<{ links: ProfileSocialLink[]; ok: true }>
  | Readonly<{ error: string; ok: false }>;

const platformLabels = new Map(
  socialPlatformOptions.map((platform) => [platform.value, platform.label]),
);

const providerHosts: Record<SocialPlatform, readonly string[] | null> = {
  behance: ["behance.net"],
  discord: ["discord.com", "discord.gg"],
  dribbble: ["dribbble.com"],
  facebook: ["facebook.com", "fb.com"],
  github: ["github.com"],
  "google-scholar": ["scholar.google.com"],
  instagram: ["instagram.com"],
  linkedin: ["linkedin.com"],
  medium: ["medium.com"],
  orcid: ["orcid.org"],
  "personal-website": null,
  researchgate: ["researchgate.net"],
  telegram: ["t.me", "telegram.me"],
  threads: ["threads.net"],
  tiktok: ["tiktok.com"],
  twitter: ["x.com", "twitter.com"],
  youtube: ["youtube.com", "youtu.be"],
};

function isSocialPlatform(value: string): value is SocialPlatform {
  return platformLabels.has(value as SocialPlatform);
}

function hostWithoutWww(hostname: string) {
  return hostname.toLocaleLowerCase().replace(/^www\./, "");
}

function hasUrlScheme(value: string) {
  return /^[a-z][a-z\d+.-]*:/i.test(value);
}

function providerHostAllowed(platform: SocialPlatform, hostname: string) {
  const allowedHosts = providerHosts[platform];

  if (!allowedHosts) {
    return true;
  }

  const normalizedHost = hostWithoutWww(hostname);
  return allowedHosts.includes(normalizedHost);
}

export function getSocialPlatformLabel(platform: SocialPlatform) {
  return platformLabels.get(platform) ?? platform;
}

export function formatSocialUrl(url: string) {
  return url.replace(/^https?:\/\//i, "").replace(/\/$/, "");
}

export function normalizeSocialUrl(
  platform: SocialPlatform,
  rawUrl: string,
): string | null {
  const trimmed = rawUrl.trim();

  if (!trimmed || /\s/.test(trimmed)) {
    return null;
  }

  if (hasUrlScheme(trimmed) && !/^https?:\/\//i.test(trimmed)) {
    return null;
  }

  const candidate = hasUrlScheme(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const url = new URL(candidate);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }

    if (!providerHostAllowed(platform, url.hostname)) {
      return null;
    }

    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

export function normalizeProfileSocialLinks(
  links: readonly ProfileSocialLinkInput[],
): SocialLinkValidationResult {
  const normalizedLinks: ProfileSocialLink[] = [];
  const seenPlatforms = new Set<SocialPlatform>();

  for (const [index, link] of links.entries()) {
    const platform = link.platform.trim();

    if (!isSocialPlatform(platform)) {
      return { error: "Choose a supported social platform.", ok: false };
    }

    if (seenPlatforms.has(platform)) {
      return {
        error: `${getSocialPlatformLabel(platform)} is already added.`,
        ok: false,
      };
    }

    const normalizedUrl = normalizeSocialUrl(platform, link.url);

    if (!normalizedUrl) {
      return {
        error: `Enter a valid ${getSocialPlatformLabel(platform)} URL.`,
        ok: false,
      };
    }

    seenPlatforms.add(platform);
    normalizedLinks.push({
      platform,
      sortOrder: index,
      url: normalizedUrl,
    });
  }

  return { links: normalizedLinks, ok: true };
}
