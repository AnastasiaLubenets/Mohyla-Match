"use client";

import { useState } from "react";

import { AuthSubmitButton } from "@/components/auth-submit-button";
import { ContactReveal } from "@/components/matching/contact-reveal";
import { SaveProfileButton } from "@/components/matching/save-profile-button";
import type { ProfileConnectionStatus } from "@/lib/matching/data";
import { reportReasons } from "@/lib/matching/view-model";

function ConnectForm({
  action,
  children,
  pendingLabel,
  targetUserId,
}: Readonly<{
  action: "connect" | "skip";
  children: string;
  pendingLabel: string;
  targetUserId: string;
}>) {
  return (
    <form action="/profiles/action" method="post">
      <input name="targetUserId" type="hidden" value={targetUserId} />
      <input name="action" type="hidden" value={action} />
      <input name="returnTo" type="hidden" value={`/profiles/${targetUserId}`} />
      <AuthSubmitButton
        className={
          action === "connect"
            ? "inline-flex h-11 w-full items-center justify-center rounded-full bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-70"
            : "inline-flex h-11 w-full items-center justify-center rounded-full border border-border px-4 text-sm font-semibold text-foreground transition hover:border-primary disabled:cursor-not-allowed disabled:opacity-70"
        }
        pendingLabel={pendingLabel}
      >
        {children}
      </AuthSubmitButton>
    </form>
  );
}

export function ProfileActionPanel({
  fullName,
  status,
  targetUserId,
}: Readonly<{
  fullName: string;
  status: ProfileConnectionStatus | null;
  targetUserId: string;
}>) {
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const alreadyConnected = status?.outgoingAction === "connect";
  const passed = status?.outgoingAction === "skip";
  const saved = status?.outgoingAction === "save";
  const canToggleSave = !status?.isMatched && !alreadyConnected && !passed;

  return (
    <aside className="mt-6 rounded-lg border border-border bg-surface p-5 shadow-sm">
      <h2 className="text-lg font-semibold">Profile actions</h2>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {canToggleSave ? (
          <SaveProfileButton
            returnTo={`/profiles/${targetUserId}`}
            saved={Boolean(saved)}
            targetUserId={targetUserId}
          />
        ) : null}

        {!status?.isMatched ? (
          <>
            <ConnectForm
              action="connect"
              pendingLabel="Connecting..."
              targetUserId={targetUserId}
            >
              {alreadyConnected ? "Connect sent" : "Connect"}
            </ConnectForm>
            <ConnectForm
              action="skip"
              pendingLabel="Passing..."
              targetUserId={targetUserId}
            >
              {passed ? "Passed" : "Pass"}
            </ConnectForm>
          </>
        ) : null}

        {status?.canDirectContact ? (
          <div className="sm:col-span-2">
            <ContactReveal fullName={fullName} targetUserId={targetUserId} />
          </div>
        ) : null}

        <button
          className="inline-flex h-11 items-center justify-center rounded-full border border-red-300 px-4 text-sm font-semibold text-red-700 transition hover:bg-red-50"
          onClick={() => setShowBlockConfirm(true)}
          type="button"
        >
          Block
        </button>

        <details className="group">
          <summary className="inline-flex h-11 w-full cursor-pointer list-none items-center justify-center rounded-full border border-border px-4 text-sm font-semibold transition hover:border-primary">
            Report
          </summary>
          <form
            action="/profiles/report"
            className="mt-3 space-y-3 rounded-lg border border-border bg-background p-4"
            method="post"
          >
            <input name="targetUserId" type="hidden" value={targetUserId} />
            <input
              name="returnTo"
              type="hidden"
              value={`/profiles/${targetUserId}`}
            />
            <label className="block">
              <span className="text-sm font-semibold">Reason</span>
              <select
                className="mt-2 h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm outline-none transition focus:border-primary"
                name="reasonCode"
                required
              >
                {reportReasons.map((reason) => (
                  <option key={reason.value} value={reason.value}>
                    {reason.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-semibold">Details</span>
              <textarea
                className="mt-2 min-h-24 w-full resize-y rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none transition focus:border-primary"
                maxLength={2000}
                name="details"
              />
            </label>
            <AuthSubmitButton pendingLabel="Submitting...">
              Submit report
            </AuthSubmitButton>
          </form>
        </details>
      </div>

      {showBlockConfirm ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-20 flex items-center justify-center bg-black/30 px-5"
          role="dialog"
        >
          <div className="w-full max-w-md rounded-lg border border-border bg-surface p-5 shadow-xl">
            <h3 className="text-xl font-semibold">Block this profile?</h3>
            <p className="mt-3 leading-7 text-muted">
              They will disappear from discovery and any active match between
              you will be closed.
            </p>
            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                className="inline-flex h-11 items-center justify-center rounded-full border border-border px-4 text-sm font-semibold transition hover:border-primary"
                onClick={() => setShowBlockConfirm(false)}
                type="button"
              >
                Cancel
              </button>
              <form action="/profiles/block" method="post">
                <input name="targetUserId" type="hidden" value={targetUserId} />
                <AuthSubmitButton
                  className="inline-flex h-11 items-center justify-center rounded-full bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
                  pendingLabel="Blocking..."
                >
                  Block profile
                </AuthSubmitButton>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </aside>
  );
}
