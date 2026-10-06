import Image from "next/image";

import {
  getProgramAvatarContainerClasses,
  programAvatarImageClasses,
  resolveProfileAvatar,
  systemAvatarRadiusClass,
  systemAvatarSizeClasses,
  type ProfileAvatarMode,
  type SystemAvatarSize,
} from "@/lib/profile/program-avatar";

type SystemAvatarProps = Readonly<{
  availability?: string | null;
  avatarMode?: ProfileAvatarMode | string | null;
  avatarVariantKey?: string | null;
  customAvatarKey?: string | null;
  facultyName?: string | null;
  fullName: string;
  programName?: string | null;
  size?: SystemAvatarSize;
  systemAvatarKey: string;
}>;

const palettes = [
  { background: "#e7f0f8", foreground: "#0a426e", accent: "#d7a928" },
  { background: "#f4ead2", foreground: "#694c00", accent: "#0f5e9c" },
  { background: "#e4efe8", foreground: "#19543a", accent: "#b7672d" },
  { background: "#f2e7e1", foreground: "#663421", accent: "#0f5e9c" },
  { background: "#e9e6f2", foreground: "#42366e", accent: "#d7a928" },
  { background: "#e8edf0", foreground: "#283f4d", accent: "#7f5a12" },
];

function hashIdentity(value: string): number {
  return [...value].reduce(
    (hash, character) => (hash * 31 + character.charCodeAt(0)) >>> 0,
    17,
  );
}

function initialsFromName(fullName: string): string {
  const initials = fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return initials || "MM";
}

export function SystemAvatar({
  availability,
  avatarMode,
  avatarVariantKey,
  customAvatarKey,
  facultyName,
  fullName,
  programName,
  size = "md",
  systemAvatarKey,
}: SystemAvatarProps) {
  const resolvedAvatar = resolveProfileAvatar({
    avatarMode,
    avatarVariantKey,
    customAvatarKey,
    systemAvatarKey,
  });

  if (resolvedAvatar.kind === "image") {
    return (
      <div
        aria-label={`${fullName} system avatar`}
        className={`${getProgramAvatarContainerClasses()} ${systemAvatarSizeClasses[size]}`}
      >
        <Image
          alt=""
          aria-hidden="true"
          className={programAvatarImageClasses}
          fill
          sizes={
            size === "sm"
              ? "3.5rem"
              : size === "md"
                ? "6rem"
                : size === "lg"
                  ? "8rem"
                  : size === "xl"
                    ? "(min-width: 640px) 13rem, 100vw"
                    : "(min-width: 640px) 14rem, 100vw"
          }
          src={resolvedAvatar.src}
        />
      </div>
    );
  }

  const hash = hashIdentity(
    [
      systemAvatarKey,
      fullName,
      facultyName,
      programName,
      availability,
      avatarMode,
      customAvatarKey,
    ]
      .filter(Boolean)
      .join("|"),
  );
  const palette = palettes[hash % palettes.length];
  const rotation = (hash % 32) - 16;

  return (
    <div
      aria-label={`${fullName} system avatar`}
      className={`relative isolate flex aspect-square shrink-0 items-center justify-center overflow-hidden ${systemAvatarRadiusClass} border border-border font-semibold shadow-sm ${systemAvatarSizeClasses[size]}`}
      style={{
        background: palette.background,
        color: palette.foreground,
      }}
    >
      <span
        aria-hidden="true"
        className={`absolute -right-5 -top-6 h-16 w-16 ${systemAvatarRadiusClass} opacity-30`}
        style={{
          background: palette.accent,
          transform: `rotate(${rotation}deg)`,
        }}
      />
      <span
        aria-hidden="true"
        className={`absolute -bottom-7 -left-5 h-20 w-20 ${systemAvatarRadiusClass} opacity-20`}
        style={{
          background: palette.foreground,
          transform: `rotate(${-rotation}deg)`,
        }}
      />
      <span className="relative">{initialsFromName(fullName)}</span>
    </div>
  );
}
