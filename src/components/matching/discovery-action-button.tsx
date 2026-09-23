"use client";

import { useState, useTransition, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";

const discoveryActionError = "We could not save that discovery action. Try again.";

export function DiscoveryActionButton({
  action,
  children,
  className,
  pendingLabel,
  targetUserId,
}: Readonly<{
  action: "skip";
  children: ReactNode;
  className?: string;
  pendingLabel: string;
  targetUserId: string;
}>) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isRefreshing, startRefreshTransition] = useTransition();
  const pending = isPending || isRefreshing;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (pending) {
      return;
    }

    setError(null);
    setIsPending(true);

    try {
      const response = await fetch("/app/action", {
        body: new FormData(event.currentTarget),
        headers: {
          accept: "application/json",
        },
        method: "POST",
      });
      const payload = (await response.json().catch(() => null)) as
        | { action?: unknown; ok?: unknown }
        | null;

      if (!response.ok || payload?.ok !== true || payload.action !== action) {
        throw new Error(discoveryActionError);
      }

      startRefreshTransition(() => {
        router.refresh();
      });
    } catch {
      setError(discoveryActionError);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form action="/app/action" method="post" onSubmit={handleSubmit}>
      <input name="targetUserId" type="hidden" value={targetUserId} />
      <input name="action" type="hidden" value={action} />
      <input name="returnTo" type="hidden" value="/app" />
      <button
        className={
          className ??
          "inline-flex h-12 w-full items-center justify-center rounded-full border border-border px-5 text-sm font-semibold text-foreground transition hover:border-primary disabled:cursor-not-allowed disabled:opacity-70"
        }
        disabled={pending}
        type="submit"
      >
        {pending ? pendingLabel : children}
      </button>
      {error ? (
        <p className="mt-2 text-sm font-medium text-red-700" role="status">
          {error}
        </p>
      ) : null}
    </form>
  );
}
