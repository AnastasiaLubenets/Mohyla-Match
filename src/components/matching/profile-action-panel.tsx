"use client";

import { AuthSubmitButton } from "@/components/auth-submit-button";
import { ContactReveal } from "@/components/matching/contact-reveal";
import { SaveProfileButton } from "@/components/matching/save-profile-button";
import type { ProfileConnectionStatus } from "@/lib/matching/data";
import { reportReasons } from "@/lib/matching/view-model";

export function ProfileActionPanel({
  status,
  targetUserId,
}: Readonly<{
  status: ProfileConnectionStatus | null;
  targetUserId: string;
}>) {
  const alreadyConnected = status?.outgoingAction === "connect";
  const saved = status?.outgoingAction === "save";
  const canToggleSave = !status?.isMatched && !alreadyConnected;

  return (
    <aside className="mt-6 rounded-lg border border-border bg-surface p-5 shadow-sm">
      <h2 className="text-lg font-semibold">Profile actions</h2>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {canToggleSave ? (
          <SaveProfileButton
            returnTo={`/profiles/${targetUserId}`}
            saved={Boolean(saved)}
            targetUserId={targetUserId}
          />
        ) : null}

        {status?.canDirectContact ? (
          <div className="sm:col-span-2">
            <ContactReveal targetUserId={targetUserId} />
          </div>
        ) : null}

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
    </aside>
  );
}
