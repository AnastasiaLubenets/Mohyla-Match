function UsersRoundIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-[1.0625rem] w-[1.0625rem]"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M18 21a8 8 0 0 0-16 0" />
      <circle cx="10" cy="8" r="5" />
      <path d="M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3" />
    </svg>
  );
}

export function MatchPercentageIndicator({
  percentage,
}: Readonly<{
  percentage: string | null;
}>) {
  if (!percentage) {
    return null;
  }

  return (
    <span
      aria-label={`Match score ${percentage}`}
      className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-800"
    >
      <UsersRoundIcon />
      <span>{percentage}</span>
    </span>
  );
}
