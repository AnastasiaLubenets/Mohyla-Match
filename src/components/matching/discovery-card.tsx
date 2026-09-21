import Link from "next/link";

import { AuthSubmitButton } from "@/components/auth-submit-button";
import { SaveProfileButton } from "@/components/matching/save-profile-button";
import { SystemAvatar } from "@/components/profile/system-avatar";
import { TaxonomyChipList } from "@/components/matching/taxonomy-chip-list";
import type { DiscoveryCandidate } from "@/lib/matching/data";
import {
  buildHighlightLabels,
  compatibilityTone,
} from "@/lib/matching/view-model";

function StatusMessage({
  error,
  status,
}: Readonly<{ error?: string; status?: string }>) {
  const statusMessages: Record<string, string> = {
    blocked: "Profile blocked. They will not appear in discovery.",
    connected: "Connect sent. We will create a match if they connect too.",
    matched: "It is a mutual match. You can reveal contact details in Matches.",
    passed: "Passed. Showing the next available profile.",
    reported: "Report submitted. Thank you for helping keep Mohyla Match safe.",
    saved: "Saved for later. You can find this profile in Saved.",
    unsaved: "Removed from Saved.",
  };
  const errorMessages: Record<string, string> = {
    "action-failed": "We could not save that discovery action. Try again.",
    "block-failed": "We could not block that profile. Try again.",
    "report-failed": "We could not submit that report. Try again.",
    "save-failed": "We could not update Saved. Try again.",
  };

  if (error && errorMessages[error]) {
    return (
      <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-900">
        {errorMessages[error]}
      </div>
    );
  }

  if (status && statusMessages[status]) {
    return (
      <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-950">
        {statusMessages[status]}
      </div>
    );
  }

  return null;
}

function DiscoveryActionForm({
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
  const isConnect = action === "connect";

  return (
    <form action="/app/action" method="post">
      <input name="targetUserId" type="hidden" value={targetUserId} />
      <input name="action" type="hidden" value={action} />
      <input name="returnTo" type="hidden" value="/app" />
      <AuthSubmitButton
        className={
          isConnect
            ? "inline-flex h-12 w-full items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-70"
            : "inline-flex h-12 w-full items-center justify-center rounded-full border border-border px-5 text-sm font-semibold text-foreground transition hover:border-primary disabled:cursor-not-allowed disabled:opacity-70"
        }
        pendingLabel={pendingLabel}
      >
        {children}
      </AuthSubmitButton>
    </form>
  );
}

export function DiscoveryCard({
  candidate,
  error,
  status,
}: Readonly<{
  candidate: DiscoveryCandidate | null;
  error?: string;
  status?: string;
}>) {
  if (!candidate) {
    return (
      <>
        <StatusMessage error={error} status={status} />
        <section className="rounded-lg border border-border bg-surface p-6 shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.08em] text-primary">
            Discover
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight">
            No new profiles right now.
          </h1>
          <p className="mt-4 max-w-2xl leading-7 text-muted">
            Your previous actions, blocks, and existing matches are already
            filtered out. Check your matches or come back after more students
            complete onboarding.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary-strong"
              href="/matches"
            >
              View matches
            </Link>
            <Link
              className="inline-flex h-12 items-center justify-center rounded-full border border-border px-5 text-sm font-semibold transition hover:border-primary"
              href="/profile"
            >
              Update my profile
            </Link>
          </div>
        </section>
      </>
    );
  }

  const highlights = buildHighlightLabels({
    matchedIOfferCount: candidate.matchedIOffer.length,
    matchedTheyOfferCount: candidate.matchedTheyOffer.length,
    sharedCollaborationGoalCount: candidate.sharedCollaborationGoals.length,
    sharedInterestCount: candidate.sharedInterests.length,
  });
  const tone = compatibilityTone(candidate.compatibilityScore);

  return (
    <>
      <StatusMessage error={error} status={status} />
      <article className="rounded-lg border border-border bg-surface p-5 shadow-sm sm:p-8">
        <header className="grid gap-6 lg:grid-cols-[1fr_13rem]">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <SystemAvatar
              availability={candidate.availability}
              facultyName={candidate.facultyName}
              fullName={candidate.fullName}
              programName={candidate.academicProgramName}
              size="lg"
              systemAvatarKey={candidate.systemAvatarKey}
            />
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.08em] text-primary">
                Discover
              </p>
              <h1 className="mt-2 text-4xl font-semibold leading-tight">
                {candidate.fullName}
              </h1>
              <p className="mt-3 text-sm font-medium text-muted">
                {candidate.facultyName} · {candidate.academicProgramName} · Year{" "}
                {candidate.yearOfStudy}
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-background p-4">
            <p className="text-sm font-semibold text-muted">Compatibility</p>
            <p className="mt-2 text-5xl font-semibold">
              {candidate.compatibilityScore}
              <span className="text-xl text-muted">%</span>
            </p>
            <p className="mt-2 text-sm font-medium capitalize text-muted">
              {tone} match
            </p>
          </div>
        </header>

        <p className="mt-6 max-w-3xl leading-7 text-muted">
          {candidate.bio || "No bio yet."}
        </p>

        {highlights.length > 0 ? (
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {highlights.map((highlight) => (
              <li
                className="rounded-lg border border-border bg-background px-4 py-3 text-sm font-semibold"
                key={highlight}
              >
                {highlight}
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-8 grid gap-7 lg:grid-cols-2">
          <section>
            <h2 className="text-sm font-semibold">They can offer</h2>
            <div className="mt-3">
              <TaxonomyChipList items={candidate.offeredSkills} showCategory />
            </div>
          </section>
          <section>
            <h2 className="text-sm font-semibold">They are looking for</h2>
            <div className="mt-3">
              <TaxonomyChipList
                emptyLabel="No looking-for skills listed."
                items={candidate.lookingForSkills}
                showCategory
              />
            </div>
          </section>
          <section>
            <h2 className="text-sm font-semibold">Shared interests</h2>
            <div className="mt-3">
              <TaxonomyChipList
                emptyLabel="No shared interests surfaced."
                items={candidate.sharedInterests}
              />
            </div>
          </section>
          <section>
            <h2 className="text-sm font-semibold">Shared goals</h2>
            <div className="mt-3">
              <TaxonomyChipList
                emptyLabel="No shared goals surfaced."
                items={candidate.sharedCollaborationGoals}
              />
            </div>
          </section>
        </div>

        <footer className="mt-8 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <Link
            className="inline-flex h-12 items-center justify-center rounded-full border border-border px-5 text-sm font-semibold transition hover:border-primary"
            href={`/profiles/${candidate.userId}`}
          >
            View profile
          </Link>
          <div className="grid gap-3 sm:w-[32rem] sm:grid-cols-3">
            <SaveProfileButton
              returnTo="/app"
              saved={false}
              targetUserId={candidate.userId}
            />
            <DiscoveryActionForm
              action="skip"
              pendingLabel="Passing..."
              targetUserId={candidate.userId}
            >
              Pass
            </DiscoveryActionForm>
            <DiscoveryActionForm
              action="connect"
              pendingLabel="Connecting..."
              targetUserId={candidate.userId}
            >
              Connect
            </DiscoveryActionForm>
          </div>
        </footer>
      </article>
    </>
  );
}
