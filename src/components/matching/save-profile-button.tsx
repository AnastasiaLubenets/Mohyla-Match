"use client";

import { useFormStatus } from "react-dom";

function HeartIcon({ filled }: Readonly<{ filled: boolean }>) {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M19.5 12.6 12 20l-7.5-7.4a5 5 0 0 1 7.1-7.1l.4.4.4-.4a5 5 0 0 1 7.1 7.1Z" />
    </svg>
  );
}

function SaveSubmitButton({
  className,
  label,
  pendingLabel,
  saved,
}: Readonly<{
  className?: string;
  label: string;
  pendingLabel: string;
  saved: boolean;
}>) {
  const { pending } = useFormStatus();

  return (
    <button
      aria-label={saved ? "Remove from saved" : "Save for later"}
      className={
        className ??
        (saved
          ? "inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-70"
          : "inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-border bg-surface px-4 text-sm font-semibold text-foreground transition hover:border-red-300 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-70")
      }
      disabled={pending}
      type="submit"
    >
      <HeartIcon filled={saved} />
      <span>{pending ? pendingLabel : label}</span>
    </button>
  );
}

export function SaveProfileButton({
  className,
  label,
  pendingLabel,
  returnTo,
  saved,
  targetUserId,
}: Readonly<{
  className?: string;
  label?: string;
  pendingLabel?: string;
  returnTo: string;
  saved: boolean;
  targetUserId: string;
}>) {
  return (
    <form action="/saved/action" method="post">
      <input name="targetUserId" type="hidden" value={targetUserId} />
      <input name="intent" type="hidden" value={saved ? "remove" : "save"} />
      <input name="returnTo" type="hidden" value={returnTo} />
      <SaveSubmitButton
        className={className}
        label={label ?? (saved ? "Saved" : "Save")}
        pendingLabel={pendingLabel ?? (saved ? "Removing..." : "Saving...")}
        saved={saved}
      />
    </form>
  );
}
