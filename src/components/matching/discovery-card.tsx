import Link from "next/link";
import type { ReactNode } from "react";

import { AuthSubmitButton } from "@/components/auth-submit-button";
import { ContactReveal } from "@/components/matching/contact-reveal";
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
    passed: "Skipped. Showing the next available profile.",
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
      <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-900 shadow-sm">
        {errorMessages[error]}
      </div>
    );
  }

  if (status && statusMessages[status]) {
    return (
      <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-950 shadow-sm">
        {statusMessages[status]}
      </div>
    );
  }

  return null;
}

function DiscoveryActionForm({
  action,
  children,
  className,
  pendingLabel,
  targetUserId,
}: Readonly<{
  action: "skip";
  children: string;
  className?: string;
  pendingLabel: string;
  targetUserId: string;
}>) {
  return (
    <form action="/app/action" method="post">
      <input name="targetUserId" type="hidden" value={targetUserId} />
      <input name="action" type="hidden" value={action} />
      <input name="returnTo" type="hidden" value="/app" />
      <AuthSubmitButton
        className={
          className ??
          "inline-flex h-12 w-full items-center justify-center rounded-full border border-border px-5 text-sm font-semibold text-foreground transition hover:border-primary disabled:cursor-not-allowed disabled:opacity-70"
        }
        pendingLabel={pendingLabel}
      >
        {children}
      </AuthSubmitButton>
    </form>
  );
}

function SectionIcon({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-800">
      {children}
    </span>
  );
}

function BarsIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M5 19V9" />
      <path d="M12 19V5" />
      <path d="M19 19v-7" />
    </svg>
  );
}

function SparkIcon() {
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
      <path d="m12 3 2.3 5.7L20 11l-5.7 2.3L12 19l-2.3-5.7L4 11l5.7-2.3L12 3Z" />
    </svg>
  );
}

function TargetIcon() {
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
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v4" />
      <path d="M12 18v4" />
      <path d="M2 12h4" />
      <path d="M18 12h4" />
    </svg>
  );
}

export function DiscoveryCard({
  candidate,
  error,
  emptyDescription = "Your previous actions and blocks are already filtered out. Come back after more students complete onboarding.",
  emptyTitle = "No new profiles right now.",
  status,
}: Readonly<{
  candidate: DiscoveryCandidate | null;
  emptyDescription?: string;
  emptyTitle?: string;
  error?: string;
  status?: string;
}>) {
  if (!candidate) {
    return (
      <>
        <StatusMessage error={error} status={status} />
        <section className="rounded-lg border border-blue-100 bg-white p-6 shadow-[0_18px_50px_rgba(15,94,156,0.10)] sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-blue-700">
            Discover
          </p>
          <h1 className="mt-4 font-serif text-4xl font-semibold leading-tight text-blue-950">
            {emptyTitle}
          </h1>
          <p className="mt-4 max-w-2xl leading-7 text-slate-600">{emptyDescription}</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex h-12 items-center justify-center rounded-full border border-blue-200 px-5 text-sm font-semibold text-blue-900 transition hover:border-blue-400 hover:bg-blue-50"
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
  const lookingForItems =
    candidate.collaborationGoals.length > 0
      ? candidate.collaborationGoals
      : candidate.lookingForSkills;
  const showLookingForCategory = candidate.collaborationGoals.length === 0;

  return (
    <>
      <StatusMessage error={error} status={status} />
      <article className="relative overflow-hidden rounded-lg border border-blue-100 bg-white p-5 text-blue-950 shadow-[0_20px_70px_rgba(15,94,156,0.12)] sm:p-6 lg:p-7">
        <div className="absolute right-5 top-5 z-10 sm:right-6 sm:top-6">
          <SaveProfileButton
            returnTo="/app"
            saved={false}
            targetUserId={candidate.userId}
            variant="icon"
          />
        </div>

        <header className="grid gap-6 pr-12 lg:grid-cols-[13rem_minmax(0,1fr)] lg:pr-14">
          <div className="overflow-hidden rounded-lg border border-blue-100 bg-blue-50">
            <SystemAvatar
              availability={candidate.availability}
              facultyName={candidate.facultyName}
              fullName={candidate.fullName}
              programName={candidate.academicProgramName}
              size="xl"
              systemAvatarKey={candidate.systemAvatarKey}
            />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-blue-700">
                {tone} match
              </span>
              <span className="rounded-full border border-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                {candidate.compatibilityScore}% compatibility
              </span>
            </div>
            <h2 className="mt-4 font-serif text-4xl font-semibold leading-tight text-blue-950 sm:text-5xl">
              {candidate.fullName}
            </h2>
            <p className="mt-3 text-sm font-semibold text-blue-700">
              {candidate.academicProgramName} · Year {candidate.yearOfStudy}
            </p>
            <p className="mt-1 text-sm text-slate-600">{candidate.facultyName}</p>
            {candidate.availability ? (
              <p className="mt-2 text-sm font-medium text-slate-600">
                {candidate.availability}
              </p>
            ) : null}
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
              {candidate.bio || "No bio yet."}
            </p>
          </div>
        </header>

        {highlights.length > 0 ? (
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {highlights.map((highlight) => (
              <li
                className="rounded-lg border border-blue-100 bg-blue-50/70 px-4 py-3 text-sm font-semibold text-blue-800"
                key={highlight}
              >
                {highlight}
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-7 divide-y divide-blue-100 border-y border-blue-100">
          <section className="grid gap-4 py-5 sm:grid-cols-[2.25rem_minmax(0,1fr)]">
            <SectionIcon>
              <BarsIcon />
            </SectionIcon>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-blue-900">
                Skills
              </h3>
              <div className="mt-3">
                <TaxonomyChipList items={candidate.offeredSkills} showCategory />
              </div>
            </div>
          </section>
          <section className="grid gap-4 py-5 sm:grid-cols-[2.25rem_minmax(0,1fr)]">
            <SectionIcon>
              <SparkIcon />
            </SectionIcon>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-blue-900">
                Academic interests
              </h3>
              <div className="mt-3">
                <TaxonomyChipList
                  emptyLabel="No interests listed yet."
                  items={candidate.interests}
                />
              </div>
            </div>
          </section>
          <section className="grid gap-4 py-5 sm:grid-cols-[2.25rem_minmax(0,1fr)]">
            <SectionIcon>
              <TargetIcon />
            </SectionIcon>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-blue-900">
                Looking for
              </h3>
              <div className="mt-3">
                <TaxonomyChipList
                  emptyLabel="No collaboration goals listed yet."
                  items={lookingForItems}
                  showCategory={showLookingForCategory}
                />
              </div>
            </div>
          </section>
        </div>

        <footer className="mt-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              className="inline-flex h-12 items-center justify-center rounded-full border border-blue-200 bg-white px-5 text-sm font-semibold text-blue-900 transition hover:border-blue-400 hover:bg-blue-50"
              href={`/profiles/${candidate.userId}`}
            >
              View profile
            </Link>
            <ContactReveal
              buttonClassName="inline-flex h-12 w-full items-center justify-center rounded-full bg-blue-800 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-70"
              className="space-y-2"
              targetUserId={candidate.userId}
            />
          </div>
          <div className="mt-4 flex justify-center sm:justify-end">
            <DiscoveryActionForm
              action="skip"
              className="inline-flex h-10 items-center justify-center rounded-full px-4 text-sm font-semibold text-slate-500 transition hover:bg-blue-50 hover:text-blue-800 disabled:cursor-not-allowed disabled:opacity-70"
              pendingLabel="Skipping..."
              targetUserId={candidate.userId}
            >
              Skip this profile
            </DiscoveryActionForm>
          </div>
        </footer>
      </article>
    </>
  );
}
