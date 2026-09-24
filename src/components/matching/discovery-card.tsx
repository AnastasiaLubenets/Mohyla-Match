import Link from "next/link";
import type { ReactNode } from "react";

import { AuthSubmitButton } from "@/components/auth-submit-button";
import { ContactReveal } from "@/components/matching/contact-reveal";
import { SaveProfileButton } from "@/components/matching/save-profile-button";
import { SystemAvatar } from "@/components/profile/system-avatar";
import { TaxonomyChipList } from "@/components/matching/taxonomy-chip-list";
import type { DiscoveryCandidate } from "@/lib/matching/data";

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
  returnTo,
  targetUserId,
}: Readonly<{
  action: "skip";
  children: ReactNode;
  className?: string;
  pendingLabel: string;
  returnTo: string;
  targetUserId: string;
}>) {
  return (
    <form action="/app/action" method="post">
      <input name="targetUserId" type="hidden" value={targetUserId} />
      <input name="action" type="hidden" value={action} />
      <input name="returnTo" type="hidden" value={returnTo} />
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
    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center text-blue-800">
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

function ArrowRightIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

export function DiscoveryCard({
  candidate,
  emptyAction,
  error,
  emptyDescription = "Your previous actions and blocks are already filtered out. Come back after more students complete onboarding.",
  emptyTitle = "No new profiles right now.",
  returnTo = "/app?view=recommended",
  saved = false,
  showProfileAction = true,
  showSkip = true,
  status,
}: Readonly<{
  candidate: DiscoveryCandidate | null;
  emptyAction?: ReactNode;
  emptyDescription?: string;
  emptyTitle?: string;
  error?: string;
  returnTo?: string;
  saved?: boolean;
  showProfileAction?: boolean;
  showSkip?: boolean;
  status?: string;
}>) {
  if (!candidate) {
    return (
      <>
        <StatusMessage error={error} status={status} />
        <section className="rounded-lg border border-blue-100 bg-white p-6 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-blue-700">
            Discover
          </p>
          <h1 className="mt-4 font-serif text-4xl font-semibold leading-tight text-blue-950">
            {emptyTitle}
          </h1>
          <p className="mt-4 max-w-2xl leading-7 text-slate-600">{emptyDescription}</p>
          {emptyAction || showProfileAction ? (
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              {emptyAction}
              {showProfileAction ? (
                <Link
                  className="inline-flex h-12 items-center justify-center rounded-full border border-blue-200 px-5 text-sm font-semibold text-blue-900 transition hover:border-blue-400 hover:bg-blue-50"
                  href="/profile"
                >
                  Update my profile
                </Link>
              ) : null}
            </div>
          ) : null}
        </section>
      </>
    );
  }

  const lookingForItems =
    candidate.collaborationGoals.length > 0
      ? candidate.collaborationGoals
      : candidate.lookingForSkills;
  const showLookingForCategory = candidate.collaborationGoals.length === 0;

  return (
    <>
      <StatusMessage error={error} status={status} />
      <article className="relative rounded-lg border border-blue-100 bg-white p-5 text-blue-950 sm:p-6">
        <div className="absolute right-5 top-5 z-10 sm:right-6 sm:top-6">
          <SaveProfileButton
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-blue-800 transition hover:bg-blue-50 hover:text-blue-950 disabled:cursor-not-allowed disabled:opacity-70"
            returnTo={returnTo}
            saved={saved}
            targetUserId={candidate.userId}
            variant="icon"
          />
        </div>

        <header className="grid gap-5 pr-11 md:grid-cols-[14rem_minmax(0,1fr)] xl:grid-cols-[16rem_minmax(0,1fr)]">
          <Link
            aria-label={`Open ${candidate.fullName}'s profile`}
            className="block rounded-[1.25rem] outline-none transition focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            href={`/profiles/${candidate.userId}?from=discover`}
          >
            <SystemAvatar
              availability={candidate.availability}
              facultyName={candidate.facultyName}
              fullName={candidate.fullName}
              programName={candidate.academicProgramName}
              size="discover"
              systemAvatarKey={candidate.systemAvatarKey}
            />
          </Link>

          <div className="min-w-0">
            <h2 className="font-serif text-4xl font-semibold leading-none text-blue-950">
              <Link
                className="transition hover:text-blue-800"
                href={`/profiles/${candidate.userId}?from=discover`}
              >
                {candidate.fullName}
              </Link>
            </h2>
            <p className="mt-3 text-base font-medium text-blue-800">
              {candidate.academicProgramName} <span aria-hidden="true">•</span>{" "}
              {candidate.yearOfStudy}
              {candidate.yearOfStudy === 1 ? "st" : candidate.yearOfStudy === 2 ? "nd" : candidate.yearOfStudy === 3 ? "rd" : "th"}{" "}
              year
            </p>
            <p className="mt-1 text-sm font-medium text-blue-700/80">
              {candidate.facultyName}
            </p>
            {candidate.availability ? (
              <p className="mt-2 text-sm font-medium text-slate-600">
                {candidate.availability}
              </p>
            ) : null}
            <p className="mt-4 max-w-3xl text-base leading-6 text-blue-900/80">
              {candidate.bio || "No bio yet."}
            </p>
            <Link
              className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-blue-800 transition hover:text-blue-950"
              href={`/profiles/${candidate.userId}?from=discover`}
            >
              View full profile
              <ArrowRightIcon />
            </Link>
          </div>
        </header>

        <div className="mt-5 grid gap-5 border-y border-blue-100 py-4 md:grid-cols-3 md:gap-0">
          <section className="flex gap-3 md:pr-5">
            <SectionIcon>
              <BarsIcon />
            </SectionIcon>
            <div>
              <h3 className="text-sm font-bold text-blue-950">
                Skills
              </h3>
              <div className="mt-3">
                <TaxonomyChipList items={candidate.offeredSkills} limit={4} />
              </div>
            </div>
          </section>
          <section className="flex gap-3 md:border-l md:border-blue-100 md:px-5">
            <SectionIcon>
              <SparkIcon />
            </SectionIcon>
            <div>
              <h3 className="text-sm font-bold text-blue-950">
                Academic interests
              </h3>
              <div className="mt-3">
                <TaxonomyChipList
                  emptyLabel="No interests listed yet."
                  items={candidate.interests}
                  limit={4}
                />
              </div>
            </div>
          </section>
          <section className="flex gap-3 md:border-l md:border-blue-100 md:pl-5">
            <SectionIcon>
              <TargetIcon />
            </SectionIcon>
            <div>
              <h3 className="text-sm font-bold text-blue-950">
                Looking for
              </h3>
              <div className="mt-3">
                <TaxonomyChipList
                  emptyLabel="No collaboration goals listed yet."
                  items={lookingForItems}
                  limit={5}
                  showCategory={showLookingForCategory}
                />
              </div>
            </div>
          </section>
        </div>

        <footer className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-start">
          <ContactReveal
            buttonClassName="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-blue-800 px-8 text-sm font-bold text-white shadow-sm transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-70 sm:w-64"
            className="space-y-2 sm:col-start-2"
            showIcon
            targetUserId={candidate.userId}
          />
          {showSkip ? (
            <div className="flex justify-center sm:col-start-3 sm:justify-end">
              <DiscoveryActionForm
                action="skip"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 hover:text-blue-950 disabled:cursor-not-allowed disabled:opacity-70"
                pendingLabel="Skipping..."
                returnTo={returnTo}
                targetUserId={candidate.userId}
              >
                <span>Skip</span>
                <ArrowRightIcon />
              </DiscoveryActionForm>
            </div>
          ) : null}
        </footer>
      </article>
    </>
  );
}
