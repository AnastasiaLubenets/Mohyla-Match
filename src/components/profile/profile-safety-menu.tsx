"use client";

import { AuthSubmitButton } from "@/components/auth-submit-button";
import { reportReasons } from "@/lib/matching/view-model";

function MoreIcon() {
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
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
      <circle cx="5" cy="12" r="1" />
    </svg>
  );
}

export function ProfileSafetyMenu({
  returnTo,
  targetUserId,
}: Readonly<{
  returnTo: string;
  targetUserId: string;
}>) {
  return (
    <div className="relative">
      <details className="group">
        <summary className="inline-flex h-10 cursor-pointer list-none items-center gap-2 rounded-md border border-blue-100 bg-white px-3 text-sm font-bold text-blue-800 transition hover:border-blue-300 hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700">
          <MoreIcon />
          More
        </summary>
        <div className="absolute right-0 z-20 mt-2 w-[min(22rem,86vw)] rounded-lg border border-blue-100 bg-white p-4 shadow-xl">
          <details>
            <summary className="inline-flex h-10 w-full cursor-pointer list-none items-center justify-center rounded-md border border-blue-100 px-4 text-sm font-bold text-blue-800 transition hover:bg-blue-50">
              Report user
            </summary>
            <form
              action="/profiles/report"
              className="mt-3 space-y-3 rounded-md border border-blue-100 bg-blue-50/60 p-3"
              method="post"
            >
              <input name="targetUserId" type="hidden" value={targetUserId} />
              <input name="returnTo" type="hidden" value={returnTo} />
              <label className="block">
                <span className="text-sm font-bold text-blue-900">Reason</span>
                <select
                  className="mt-2 h-10 w-full rounded-md border border-blue-200 bg-white px-3 text-sm outline-none transition focus:border-blue-400"
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
                <span className="text-sm font-bold text-blue-900">Details</span>
                <textarea
                  className="mt-2 min-h-20 w-full resize-y rounded-md border border-blue-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-400"
                  maxLength={2000}
                  name="details"
                />
              </label>
              <AuthSubmitButton
                className="inline-flex h-10 w-full items-center justify-center rounded-md bg-blue-800 px-4 text-sm font-bold text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-70"
                pendingLabel="Submitting..."
              >
                Submit report
              </AuthSubmitButton>
            </form>
          </details>
        </div>
      </details>
    </div>
  );
}
