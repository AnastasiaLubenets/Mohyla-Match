"use client";

import { useFormStatus } from "react-dom";

function BookmarkIcon({ filled }: Readonly<{ filled: boolean }>) {
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
      <path d="M19 21 12 16 5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16Z" />
    </svg>
  );
}

function SaveSubmitButton({
  className,
  label,
  pendingLabel,
  saved,
  showLabel,
}: Readonly<{
  className?: string;
  label: string;
  pendingLabel: string;
  saved: boolean;
  showLabel: boolean;
}>) {
  const { pending } = useFormStatus();
  const actionLabel = saved ? "Remove from saved" : "Save profile";

  return (
    <button
      aria-label={actionLabel}
      className={
        className ??
        (saved
          ? "inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-70"
          : "inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-blue-200 bg-surface px-4 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-70")
      }
      disabled={pending}
      title={actionLabel}
      type="submit"
    >
      <BookmarkIcon filled={saved} />
      {showLabel ? (
        <span>{pending ? pendingLabel : label}</span>
      ) : (
        <span className="sr-only">{pending ? pendingLabel : label}</span>
      )}
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
  variant = "button",
}: Readonly<{
  className?: string;
  label?: string;
  pendingLabel?: string;
  returnTo: string;
  saved: boolean;
  targetUserId: string;
  variant?: "button" | "icon";
}>) {
  const showLabel = variant === "button";

  return (
    <form action="/saved/action" method="post">
      <input name="targetUserId" type="hidden" value={targetUserId} />
      <input name="intent" type="hidden" value={saved ? "remove" : "save"} />
      <input name="returnTo" type="hidden" value={returnTo} />
      <SaveSubmitButton
        className={
          className ??
          (variant === "icon"
            ? saved
              ? "inline-flex h-11 w-11 items-center justify-center rounded-full border border-blue-700 bg-blue-700 text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-70"
              : "inline-flex h-11 w-11 items-center justify-center rounded-full border border-blue-200 bg-white text-blue-800 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-70"
            : undefined)
        }
        label={label ?? (saved ? "Remove from saved" : "Save profile")}
        pendingLabel={pendingLabel ?? (saved ? "Removing..." : "Saving...")}
        saved={saved}
        showLabel={showLabel}
      />
    </form>
  );
}
