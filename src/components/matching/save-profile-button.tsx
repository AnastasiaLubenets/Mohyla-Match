"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";

const savedActionError = "We could not update Saved. Try again.";

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
  pending,
  pendingLabel,
  saved,
  showLabel,
}: Readonly<{
  className?: string;
  label: string;
  pending: boolean;
  pendingLabel: string;
  saved: boolean;
  showLabel: boolean;
}>) {
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
  const router = useRouter();
  const [optimisticSaved, setOptimisticSaved] = useState<{
    saved: boolean;
    targetUserId: string;
  } | null>(null);
  const [error, setError] = useState<{
    message: string;
    targetUserId: string;
  } | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isRefreshing, startRefreshTransition] = useTransition();
  const pending = isPending || isRefreshing;
  const isSaved =
    optimisticSaved?.targetUserId === targetUserId
      ? optimisticSaved.saved
      : saved;
  const currentError = error?.targetUserId === targetUserId ? error.message : null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (pending) {
      return;
    }

    const nextSaved = !isSaved;
    const formData = new FormData(event.currentTarget);
    formData.set("intent", nextSaved ? "save" : "remove");

    setError(null);
    setOptimisticSaved({ saved: nextSaved, targetUserId });
    setIsPending(true);

    try {
      const response = await fetch("/saved/action", {
        body: formData,
        headers: {
          accept: "application/json",
        },
        method: "POST",
      });
      const payload = (await response.json().catch(() => null)) as
        | { saved?: unknown }
        | null;

      if (!response.ok || payload?.saved !== nextSaved) {
        throw new Error(savedActionError);
      }

      startRefreshTransition(() => {
        router.refresh();
      });
    } catch {
      setOptimisticSaved({ saved: !nextSaved, targetUserId });
      setError({ message: savedActionError, targetUserId });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form action="/saved/action" method="post" onSubmit={handleSubmit}>
      <input name="targetUserId" type="hidden" value={targetUserId} />
      <input name="intent" type="hidden" value={isSaved ? "remove" : "save"} />
      <input name="returnTo" type="hidden" value={returnTo} />
      <SaveSubmitButton
        className={
          className ??
          (variant === "icon"
            ? isSaved
              ? "inline-flex h-11 w-11 items-center justify-center rounded-full border border-blue-700 bg-blue-700 text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-70"
              : "inline-flex h-11 w-11 items-center justify-center rounded-full border border-blue-200 bg-white text-blue-800 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-70"
            : undefined)
        }
        label={label ?? (isSaved ? "Remove from saved" : "Save profile")}
        pending={pending}
        pendingLabel={pendingLabel ?? (isSaved ? "Removing..." : "Saving...")}
        saved={isSaved}
        showLabel={showLabel}
      />
      {currentError ? (
        <p
          className={
            variant === "icon"
              ? "sr-only"
              : "mt-2 text-sm font-medium text-red-700"
          }
          role="status"
        >
          {currentError}
        </p>
      ) : null}
    </form>
  );
}
