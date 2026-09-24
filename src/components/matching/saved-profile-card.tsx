import Link from "next/link";
import type { ReactNode } from "react";

import { ContactReveal } from "@/components/matching/contact-reveal";
import { SaveProfileButton } from "@/components/matching/save-profile-button";
import { TaxonomyChipList } from "@/components/matching/taxonomy-chip-list";
import { SystemAvatar } from "@/components/profile/system-avatar";
import type { SavedProfileSummary } from "@/lib/matching/data";

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

function ExternalIcon() {
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
      <path d="M15 3h6v6" />
      <path d="M10 14 21 3" />
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
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

function yearLabel(year: number) {
  return `${year}${year === 1 ? "st" : year === 2 ? "nd" : year === 3 ? "rd" : "th"} year`;
}

function SavedTaxonomyRow({
  children,
  icon,
  title,
}: Readonly<{
  children: ReactNode;
  icon: ReactNode;
  title: string;
}>) {
  return (
    <section className="grid gap-3 sm:grid-cols-[8.25rem_minmax(0,1fr)] sm:items-start">
      <h3 className="inline-flex items-center gap-3 text-sm font-bold text-blue-950">
        <span className="inline-flex h-7 w-7 items-center justify-center text-blue-800">
          {icon}
        </span>
        {title}
      </h3>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

export function SavedProfileCard({
  profile,
}: Readonly<{ profile: SavedProfileSummary }>) {
  const lookingForItems =
    profile.collaborationGoals.length > 0
      ? profile.collaborationGoals
      : profile.lookingForSkills;
  const showLookingForCategory = profile.collaborationGoals.length === 0;

  return (
    <article className="relative overflow-hidden rounded-lg border border-blue-100 bg-white p-5 text-blue-950 sm:p-6">
      <div className="absolute right-5 top-5 z-10 sm:right-6 sm:top-6">
        <SaveProfileButton
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-blue-800 transition hover:bg-blue-50 hover:text-blue-950 disabled:cursor-not-allowed disabled:opacity-70"
          label="Remove from saved"
          pendingLabel="Removing..."
          returnTo="/saved"
          saved
          targetUserId={profile.userId}
          variant="icon"
        />
      </div>

      <header className="grid gap-5 pr-11 md:grid-cols-[12rem_minmax(0,1fr)] xl:grid-cols-[13rem_minmax(0,1fr)]">
        <Link
          aria-label={`Open ${profile.fullName}'s profile`}
          className="block overflow-hidden rounded-lg border border-blue-100 bg-blue-50 transition hover:border-blue-300"
          href={`/profiles/${profile.userId}?from=saved`}
        >
          <SystemAvatar
            availability={profile.availability}
            facultyName={profile.facultyName}
            fullName={profile.fullName}
            programName={profile.academicProgramName}
            size="discover"
            systemAvatarKey={profile.systemAvatarKey}
          />
        </Link>

        <div className="min-w-0">
          <h2 className="font-serif text-4xl font-semibold leading-none text-blue-950">
            <Link
              className="transition hover:text-blue-800"
              href={`/profiles/${profile.userId}?from=saved`}
            >
              {profile.fullName}
            </Link>
          </h2>
          <p className="mt-3 text-base font-medium text-blue-800">
            {profile.academicProgramName} <span aria-hidden="true">•</span>{" "}
            {yearLabel(profile.yearOfStudy)}
          </p>
          <p className="mt-1 text-sm font-medium text-blue-700/80">
            {profile.facultyName}
          </p>
          {profile.availability ? (
            <p className="mt-2 text-sm font-medium text-slate-600">
              {profile.availability}
            </p>
          ) : null}
          <p className="mt-3 max-w-3xl text-base leading-6 text-blue-900/80">
            {profile.bio || "No bio yet."}
          </p>

          <div className="mt-4 space-y-3">
            <SavedTaxonomyRow icon={<BarsIcon />} title="Skills">
              <TaxonomyChipList items={profile.offeredSkills} limit={4} />
            </SavedTaxonomyRow>
            <SavedTaxonomyRow icon={<SparkIcon />} title="Academic interests">
              <TaxonomyChipList
                emptyLabel="No interests listed yet."
                items={profile.interests}
                limit={4}
              />
            </SavedTaxonomyRow>
            <SavedTaxonomyRow icon={<TargetIcon />} title="Looking for">
              <TaxonomyChipList
                emptyLabel="No collaboration goals listed yet."
                items={lookingForItems}
                limit={4}
                showCategory={showLookingForCategory}
              />
            </SavedTaxonomyRow>
          </div>
        </div>
      </header>

      <footer className="mt-5 grid gap-3 border-t border-blue-100 pt-5 sm:grid-cols-2">
        <Link
          className="inline-flex h-12 items-center justify-center gap-3 rounded-md border border-blue-200 bg-white px-5 text-sm font-bold text-blue-900 transition hover:border-blue-300 hover:bg-blue-50"
          href={`/profiles/${profile.userId}?from=saved`}
        >
          <ExternalIcon />
          View profile
        </Link>
        {profile.canDirectContact ? (
          <ContactReveal
            buttonClassName="inline-flex h-12 w-full items-center justify-center gap-3 rounded-md bg-blue-800 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-70"
            showIcon
            targetUserId={profile.userId}
          />
        ) : (
          <p className="inline-flex min-h-12 items-center justify-center rounded-md border border-blue-100 bg-blue-50 px-5 text-center text-sm font-semibold text-blue-700">
            Email contact is off for this profile.
          </p>
        )}
      </footer>
    </article>
  );
}
