import Link from "next/link";

import { ContactReveal } from "@/components/matching/contact-reveal";
import { SaveProfileButton } from "@/components/matching/save-profile-button";
import { TaxonomyChipList } from "@/components/matching/taxonomy-chip-list";
import { SystemAvatar } from "@/components/profile/system-avatar";
import type { DiscoveryCandidate } from "@/lib/matching/data";

function AllStudentsStatusMessage({
  error,
  status,
}: Readonly<{ error?: string; status?: string }>) {
  const statusMessages: Record<string, string> = {
    reported: "Report submitted. Thank you for helping keep Mohyla Match safe.",
    saved: "Saved for later. You can find this profile in Saved.",
    unsaved: "Removed from Saved.",
  };
  const errorMessages: Record<string, string> = {
    "action-failed": "We could not save that discovery action. Try again.",
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

function yearLabel(year: number) {
  const suffix =
    year === 1 ? "st" : year === 2 ? "nd" : year === 3 ? "rd" : "th";

  return `${year}${suffix} year`;
}

function bioPreview(bio: string | null) {
  const cleanBio = bio?.trim();

  if (!cleanBio) {
    return null;
  }

  return cleanBio.length > 150
    ? `${cleanBio.slice(0, 147).trim()}...`
    : cleanBio;
}

function AllStudentsEmptyState({
  hasActiveFilters,
  totalCount,
}: Readonly<{
  hasActiveFilters: boolean;
  totalCount: number;
}>) {
  return (
    <section className="rounded-lg border border-blue-100 bg-white p-6 sm:p-8">
      <p className="text-sm font-semibold uppercase tracking-[0.12em] text-blue-700">
        All students
      </p>
      <h2 className="mt-4 font-serif text-4xl font-semibold leading-tight text-blue-950">
        {hasActiveFilters || totalCount > 0
          ? "No students match these filters."
          : "No other students are available yet."}
      </h2>
      {hasActiveFilters || totalCount > 0 ? (
        <p className="mt-4 max-w-2xl leading-7 text-slate-600">
          Try clearing filters or changing your search.
        </p>
      ) : null}
    </section>
  );
}

function AllStudentsLoadError() {
  return (
    <section className="rounded-lg border border-red-200 bg-red-50 p-6 sm:p-8">
      <p className="text-sm font-semibold uppercase tracking-[0.12em] text-red-700">
        All students
      </p>
      <h2 className="mt-4 font-serif text-4xl font-semibold leading-tight text-red-950">
        Could not load students. Try again.
      </h2>
    </section>
  );
}

function AllStudentRow({
  candidate,
  returnTo,
  saved,
}: Readonly<{
  candidate: DiscoveryCandidate;
  returnTo: string;
  saved: boolean;
}>) {
  const profileHref = `/profiles/${candidate.userId}?from=discover`;
  const preview = bioPreview(candidate.bio);

  return (
    <article className="grid gap-4 rounded-lg border border-blue-100 bg-white p-4 text-blue-950 sm:grid-cols-[6rem_minmax(0,1fr)] sm:p-5 lg:grid-cols-[6rem_minmax(0,1fr)_auto] lg:items-center">
      <Link
        aria-label={`Open ${candidate.fullName}'s profile`}
        className="block w-24 rounded-[1.25rem] outline-none transition focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        href={profileHref}
      >
        <SystemAvatar
          availability={candidate.availability}
          facultyName={candidate.facultyName}
          fullName={candidate.fullName}
          programName={candidate.academicProgramName}
          size="md"
          systemAvatarKey={candidate.systemAvatarKey}
        />
      </Link>

      <div className="min-w-0">
        <h3 className="font-serif text-2xl font-semibold leading-tight text-blue-950 sm:text-3xl">
          <Link
            className="transition hover:text-blue-800"
            href={profileHref}
          >
            {candidate.fullName}
          </Link>
        </h3>
        <p className="mt-1 text-sm font-semibold text-blue-800">
          {candidate.academicProgramName} <span aria-hidden="true">•</span>{" "}
          {yearLabel(candidate.yearOfStudy)}
        </p>
        <p className="mt-0.5 text-sm font-medium text-blue-700/80">
          {candidate.facultyName}
        </p>
        {preview ? (
          <p className="mt-2 text-sm leading-5 text-blue-900/75">{preview}</p>
        ) : null}
        <div className="mt-3">
          <TaxonomyChipList
            emptyLabel="No skills listed yet."
            items={candidate.offeredSkills}
            limit={3}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 sm:col-start-2 lg:col-start-3 lg:flex-nowrap lg:justify-end">
        <SaveProfileButton
          className="inline-flex h-10 w-10 items-center justify-center rounded-md text-blue-800 transition hover:bg-blue-50 hover:text-blue-950 disabled:cursor-not-allowed disabled:opacity-70"
          returnTo={returnTo}
          saved={saved}
          targetUserId={candidate.userId}
          variant="icon"
        />
        <ContactReveal
          buttonClassName="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-blue-800 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
          className="w-full sm:w-auto"
          showIcon
          targetUserId={candidate.userId}
        />
        <Link
          className="inline-flex h-10 items-center justify-center rounded-md border border-blue-200 bg-white px-4 text-sm font-bold text-blue-900 transition hover:border-blue-300 hover:bg-blue-50"
          href={profileHref}
        >
          <span aria-hidden="true">View profile</span>
          <span className="sr-only">View full profile</span>
        </Link>
      </div>
    </article>
  );
}

export function AllStudentsList({
  candidates,
  error,
  hasActiveFilters,
  loadError,
  returnTo,
  savedProfileIds,
  status,
  totalCount,
}: Readonly<{
  candidates: readonly DiscoveryCandidate[];
  error?: string;
  hasActiveFilters: boolean;
  loadError?: boolean;
  returnTo: string;
  savedProfileIds: ReadonlySet<string>;
  status?: string;
  totalCount: number;
}>) {
  return (
    <section aria-labelledby="all-students-directory-heading">
      <h2 className="sr-only" id="all-students-directory-heading">
        All students directory
      </h2>
      <AllStudentsStatusMessage error={error} status={status} />
      {loadError ? (
        <AllStudentsLoadError />
      ) : candidates.length === 0 ? (
        <AllStudentsEmptyState
          hasActiveFilters={hasActiveFilters}
          totalCount={totalCount}
        />
      ) : (
        <div className="space-y-3">
          {candidates.map((candidate) => (
            <AllStudentRow
              candidate={candidate}
              key={candidate.userId}
              returnTo={returnTo}
              saved={savedProfileIds.has(candidate.userId)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
