type SystemAvatarProps = Readonly<{
  availability?: string | null;
  facultyName?: string | null;
  fullName: string;
  programName?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
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

const sizeClasses = {
  sm: "h-14 w-14 text-lg",
  md: "h-24 w-24 text-3xl",
  lg: "h-32 w-32 text-4xl",
  xl: "h-52 w-full text-5xl sm:w-52",
};

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
  facultyName,
  fullName,
  programName,
  size = "md",
  systemAvatarKey,
}: SystemAvatarProps) {
  const hash = hashIdentity(
    [systemAvatarKey, fullName, facultyName, programName, availability]
      .filter(Boolean)
      .join("|"),
  );
  const palette = palettes[hash % palettes.length];
  const rotation = (hash % 32) - 16;

  return (
    <div
      aria-label={`${fullName} system avatar`}
      className={`relative isolate flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border font-semibold shadow-sm ${sizeClasses[size]}`}
      style={{
        background: palette.background,
        color: palette.foreground,
      }}
    >
      <span
        aria-hidden="true"
        className="absolute -right-5 -top-6 h-16 w-16 rounded-lg opacity-30"
        style={{
          background: palette.accent,
          transform: `rotate(${rotation}deg)`,
        }}
      />
      <span
        aria-hidden="true"
        className="absolute -bottom-7 -left-5 h-20 w-20 rounded-lg opacity-20"
        style={{
          background: palette.foreground,
          transform: `rotate(${-rotation}deg)`,
        }}
      />
      <span className="relative">{initialsFromName(fullName)}</span>
    </div>
  );
}
