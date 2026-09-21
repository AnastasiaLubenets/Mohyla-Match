"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  initialContactRevealState,
  revealMatchedContact,
} from "@/lib/matching/server-actions";

function RevealButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-70"
      disabled={pending}
      type="submit"
    >
      {pending ? "Revealing..." : "Reveal student email"}
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
    revealMatchedContact,
    initialContactRevealState,
  );

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
