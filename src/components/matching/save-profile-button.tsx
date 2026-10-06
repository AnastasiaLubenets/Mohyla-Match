"use client";

import { useFormStatus } from "react-dom";

function BookmarkIcon({
  className = "h-5 w-5",
  filled,
  previewFillOnHover = false,
}: Readonly<{
  className?: string;
  filled: boolean;
  previewFillOnHover?: boolean;
}>) {
  const fillClassName = filled
    ? "fill-current"
    : previewFillOnHover
      ? "fill-none group-hover:fill-current"
      : "fill-none";

  return (
    <svg
      aria-hidden="true"
      className={`${className} ${fillClassName}`}
      fill="none"
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
  iconClassName,
  label,
  pendingLabel,
  previewFillOnHover,
  saved,
  showLabel,
}: Readonly<{
  className?: string;
  iconClassName?: string;
  label: string;
  pendingLabel: string;
  previewFillOnHover?: boolean;
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
      <BookmarkIcon
        className={iconClassName}
        filled={saved}
        previewFillOnHover={previewFillOnHover}
      />
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
  iconClassName,
  label,
  pendingLabel,
  previewFillOnHover,
  returnTo,
  saved,
  targetUserId,
  variant = "button",
}: Readonly<{
  className?: string;
  iconClassName?: string;
  label?: string;
  pendingLabel?: string;
  previewFillOnHover?: boolean;
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
        iconClassName={iconClassName}
        label={label ?? (saved ? "Remove from saved" : "Save profile")}
        pendingLabel={pendingLabel ?? (saved ? "Removing..." : "Saving...")}
        previewFillOnHover={previewFillOnHover}
        saved={saved}
        showLabel={showLabel}
      />
    </form>
  );
}
