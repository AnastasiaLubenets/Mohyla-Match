"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";

function DeleteProfileSubmitButton({
  canDelete,
}: Readonly<{
  canDelete: boolean;
}>) {
  const { pending } = useFormStatus();

  return (
    <button
      className="h-11 rounded-full bg-red-700 px-5 text-sm font-semibold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={!canDelete || pending}
      type="submit"
    >
      {pending ? "Deleting..." : "Delete profile permanently"}
    </button>
  );
}

export function DeleteProfileDangerZone() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [confirmation, setConfirmation] = useState("");
  const canDelete = confirmation === "DELETE";

  return (
    <section className="mt-6 rounded-lg border border-red-200 bg-red-50 p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-red-950">Danger zone</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-red-900">
            Permanently delete your Mohyla Match profile and related profile data.
          </p>
        </div>
        <button
          className="inline-flex h-11 items-center justify-center rounded-full border border-red-700 px-5 text-sm font-semibold text-red-800 transition hover:bg-red-100"
          onClick={() => {
            setConfirmation("");
            dialogRef.current?.showModal();
          }}
          type="button"
        >
          Delete profile
        </button>
      </div>

      <dialog
        className="w-[min(92vw,32rem)] rounded-lg border border-border bg-surface p-0 text-foreground shadow-xl backdrop:bg-black/40"
        ref={dialogRef}
      >
        <form action="/profile/delete" className="space-y-5 p-5 sm:p-6" method="post">
          <div>
            <h3 className="text-xl font-semibold">Delete your profile?</h3>
            <p className="mt-3 leading-7 text-muted">
              This permanently deletes your Mohyla Match profile and its related
              data. Your login account and student email will remain, so you can
              create a new profile again.
            </p>
          </div>

          <label className="block">
            <span className="text-sm font-semibold">Type DELETE to confirm</span>
            <input
              autoComplete="off"
              className="mt-2 h-12 w-full rounded-lg border border-border bg-background px-4 text-base outline-none transition focus:border-red-700 focus:ring-2 focus:ring-red-100"
              name="confirmation"
              onChange={(event) => setConfirmation(event.target.value)}
              value={confirmation}
            />
          </label>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              className="h-11 rounded-full border border-border px-5 text-sm font-semibold transition hover:border-primary"
              onClick={() => dialogRef.current?.close()}
              type="button"
            >
              Cancel
            </button>
            <DeleteProfileSubmitButton canDelete={canDelete} />
          </div>
        </form>
      </dialog>
    </section>
  );
}
