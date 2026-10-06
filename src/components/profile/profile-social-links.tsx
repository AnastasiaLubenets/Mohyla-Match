import type { SVGProps } from "react";

import {
  formatSocialUrl,
  getSocialPlatformLabel,
  type ProfileSocialLink,
  type SocialPlatform,
} from "@/lib/profile/social-links";

type SocialIconProps = SVGProps<SVGSVGElement>;

function BaseIcon({ children, ...props }: SocialIconProps) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      {...props}
    >
      {children}
    </svg>
  );
}

export function SocialPlatformIcon({
  platform,
  ...props
}: SocialIconProps & Readonly<{ platform: SocialPlatform }>) {
  if (platform === "github") {
    return (
      <BaseIcon {...props}>
        <path d="M9 19c-4 1.3-4-2-5.5-2.5" />
        <path d="M15 22v-3.9a3.4 3.4 0 0 0-.9-2.6c3 0 6.1-1.5 6.1-6.7a5.2 5.2 0 0 0-1.4-3.6 4.8 4.8 0 0 0-.1-3.6s-1.1-.4-3.7 1.4a12.8 12.8 0 0 0-6.7 0C5.7.2 4.6.6 4.6.6a4.8 4.8 0 0 0-.1 3.6 5.2 5.2 0 0 0-1.4 3.6c0 5.2 3.1 6.7 6.1 6.7a3.4 3.4 0 0 0-1 2.6V22" />
      </BaseIcon>
    );
  }

  if (platform === "instagram") {
    return (
      <BaseIcon {...props}>
        <rect height="18" rx="5" width="18" x="3" y="3" />
        <circle cx="12" cy="12" r="4" />
        <path d="M17.5 6.5h.01" />
      </BaseIcon>
    );
  }

  if (platform === "linkedin") {
    return (
      <BaseIcon {...props}>
        <path d="M8 11v6" />
        <path d="M8 7.5v.01" />
        <path d="M12 17v-3.5a2.5 2.5 0 0 1 5 0V17" />
        <rect height="18" rx="2" width="18" x="3" y="3" />
      </BaseIcon>
    );
  }

  if (platform === "telegram") {
    return (
      <BaseIcon {...props}>
        <path d="m21 4-4 16-6-5-4 4 1-6-5-2 18-7Z" />
      </BaseIcon>
    );
  }

  if (platform === "youtube") {
    return (
      <BaseIcon {...props}>
        <rect height="14" rx="4" width="20" x="2" y="5" />
        <path d="m10 9 5 3-5 3V9Z" />
      </BaseIcon>
    );
  }

  if (platform === "personal-website") {
    return (
      <BaseIcon {...props}>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18" />
        <path d="M12 3a14 14 0 0 1 0 18" />
        <path d="M12 3a14 14 0 0 0 0 18" />
      </BaseIcon>
    );
  }

  if (
    platform === "orcid" ||
    platform === "google-scholar" ||
    platform === "researchgate"
  ) {
    return (
      <BaseIcon {...props}>
        <path d="M4 10.5 12 5l8 5.5-8 5.5-8-5.5Z" />
        <path d="M6.5 13v3.5c3 2 8 2 11 0V13" />
      </BaseIcon>
    );
  }

  if (platform === "behance" || platform === "dribbble") {
    return (
      <BaseIcon {...props}>
        <circle cx="12" cy="12" r="9" />
        <path d="M5 13c4-2 9-2 14 1" />
        <path d="M9 4c3 4 5 9 5 17" />
      </BaseIcon>
    );
  }

  if (platform === "twitter" || platform === "threads") {
    return (
      <BaseIcon {...props}>
        <path d="M5 5l14 14" />
        <path d="M19 5 5 19" />
      </BaseIcon>
    );
  }

  if (platform === "discord") {
    return (
      <BaseIcon {...props}>
        <path d="M8 9a7 7 0 0 1 8 0" />
        <path d="M8.5 15.5c2.5 1.5 4.5 1.5 7 0" />
        <path d="M7.5 12h.01" />
        <path d="M16.5 12h.01" />
        <path d="M5 17c-1-4-.5-8 2-11 3-1 7-1 10 0 2.5 3 3 7 2 11-2 2-4 2.5-6 2l-.8-1.2" />
      </BaseIcon>
    );
  }

  return (
    <BaseIcon {...props}>
      <rect height="18" rx="4" width="18" x="3" y="3" />
      <path d="M8 12h8" />
      <path d="M12 8v8" />
    </BaseIcon>
  );
}

export function SocialLinksList({
  appearance = "boxed",
  compact = false,
  links,
}: Readonly<{
  appearance?: "bare" | "boxed";
  compact?: boolean;
  links: readonly ProfileSocialLink[];
}>) {
  if (links.length === 0) {
    return null;
  }

  const listClassName =
    compact && appearance === "bare"
      ? "flex flex-wrap gap-3"
      : compact
        ? "flex flex-wrap gap-2"
        : "flex flex-wrap gap-3";

  return (
    <ul className={listClassName}>
      {links.map((link) => {
        const label = getSocialPlatformLabel(link.platform);
        const linkClassName =
          compact && appearance === "bare"
            ? "inline-flex h-9 w-9 items-center justify-center bg-transparent text-blue-800 transition-colors duration-200 hover:bg-transparent hover:text-blue-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
            : compact
              ? "inline-flex h-10 w-10 items-center justify-center rounded-md border border-blue-100 bg-white text-blue-800 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              : "inline-flex min-h-10 items-center gap-2 rounded-md border border-blue-100 bg-white px-3 text-sm font-bold text-blue-900 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500";

        return (
          <li key={link.platform}>
            <a
              aria-label={`${label}: ${formatSocialUrl(link.url)}`}
              className={linkClassName}
              href={link.url}
              rel="noopener noreferrer"
              target="_blank"
              title={label}
            >
              <SocialPlatformIcon className="h-5 w-5" platform={link.platform} />
              {compact ? <span className="sr-only">{label}</span> : <span>{label}</span>}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
