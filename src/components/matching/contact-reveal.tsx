"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";

import {
  initialContactRevealState,
  revealProfileContact,
} from "@/lib/matching/server-actions";

function RevealButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-70"
      disabled={pending}
      type="submit"
    >
      {pending ? "Preparing..." : "Write by email"}
    </button>
  );
}

export function ContactReveal({
  fullName,
  targetUserId,
}: Readonly<{
  fullName: string;
  targetUserId: string;
}>) {
  const [state, formAction] = useActionState(
    revealProfileContact,
    initialContactRevealState,
  );

  useEffect(() => {
    if (state.email) {
      window.location.href = `mailto:${state.email}`;
    }
  }, [state.email]);

  return (
    <div className="space-y-3">
      {state.email ? (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-950">
          <p className="font-semibold">{state.fullName ?? fullName}</p>
          <a className="mt-1 inline-flex font-semibold underline" href={`mailto:${state.email}`}>
            {state.email}
          </a>
        </div>
      ) : (
        <form action={formAction}>
          <input name="targetUserId" type="hidden" value={targetUserId} />
          <RevealButton />
        </form>
      )}

      {state.error ? (
        <p className="text-sm font-medium text-red-700">{state.error}</p>
      ) : null}
    </div>
  );
}
