"use client";

import { useState } from "react";

import {
  contactEmailCopiedLabel,
  requestAndCopyProfileEmail,
} from "@/lib/matching/contact-copy";

function EnvelopeIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <rect height="16" rx="2" width="20" x="2" y="4" />
      <path d="m22 7-10 6L2 7" />
    </svg>
  );
}

export function ContactReveal({
  buttonClassName,
  className,
  showIcon = false,
  targetUserId,
}: Readonly<{
  buttonClassName?: string;
  className?: string;
  showIcon?: boolean;
  targetUserId: string;
}>) {
  const [copiedName, setCopiedName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleGetEmail() {
    if (isPending) {
      return;
    }

    setCopiedName(null);
    setError(null);
    setIsPending(true);

    const result = await requestAndCopyProfileEmail({
      requestContact: async (requestedTargetUserId) => {
        const response = await fetch("/profiles/contact", {
          body: JSON.stringify({ targetUserId: requestedTargetUserId }),
          headers: { "content-type": "application/json" },
          method: "POST",
        });

        return {
          ok: response.ok,
          payload: await response.json().catch(() => null),
        };
      },
      targetUserId,
      writeClipboard: async (email) => {
        if (!navigator.clipboard?.writeText) {
          throw new Error("Clipboard API unavailable.");
        }

        await navigator.clipboard.writeText(email);
      },
    });

    if (result.status === "copied") {
      setCopiedName(result.fullName ?? "");
    } else {
      setError(result.error);
    }

    setIsPending(false);
  }

  return (
    <div className={className ?? "space-y-2"}>
      <button
        className={
          buttonClassName ??
          "inline-flex h-11 w-full items-center justify-center rounded-full bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-70"
        }
        disabled={isPending}
        onClick={handleGetEmail}
        type="button"
      >
        {showIcon ? <EnvelopeIcon /> : null}
        {isPending ? "Getting email..." : "Get email"}
      </button>

      {copiedName !== null ? (
        <div
          aria-live="polite"
          className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-950"
        >
          {contactEmailCopiedLabel}
        </div>
      ) : null}

      {error ? <p className="text-sm font-medium text-red-700">{error}</p> : null}
    </div>
  );
}
