import Link from "next/link";

import { TaxonomyChipList } from "@/components/matching/taxonomy-chip-list";
import { SystemAvatar } from "@/components/profile/system-avatar";
import type { FacultyDiscoveryProfile } from "@/lib/matching/data";
import { systemAvatarRadiusClass } from "@/lib/profile/program-avatar";

function bioPreview(bio: string | null) {
  const cleanBio = bio?.trim();

  if (!cleanBio) {
    return null;
  }

  return cleanBio.length > 170
    ? `${cleanBio.slice(0, 167).trim()}...`
    : cleanBio;
}

function FacultyEmptyState({
  hasActiveFilters,
  totalCount,
}: Readonly<{
  hasActiveFilters: boolean;
  totalCount: number;
}>) {
  return (
    <section className="rounded-lg border border-blue-100 bg-white p-6 sm:p-8">
      <p className="text-sm font-semibold uppercase tracking-[0.12em] text-blue-700">
        Faculty
      </p>
      <h2 className="mt-4 font-serif text-4xl font-semibold leading-tight text-blue-950">
        {hasActiveFilters || totalCount > 0
          ? "No faculty match these filters."
          : "No faculty profiles are available yet."}
      </h2>
      {hasActiveFilters || totalCount > 0 ? (
        <p className="mt-4 max-w-2xl leading-7 text-slate-600">
          Try clearing filters or changing your search.
        </p>
      ) : null}
    </section>
  );
}

function FacultyLoadError() {
  return (
    <section className="rounded-lg border border-red-200 bg-red-50 p-6 sm:p-8">
      <p className="text-sm font-semibold uppercase tracking-[0.12em] text-red-700">
        Faculty
      </p>
      <h2 className="mt-4 font-serif text-4xl font-semibold leading-tight text-red-950">
        Could not load faculty profiles. Try again.
      </h2>
    </section>
  );
}

function FacultyRow({
  profile,
}: Readonly<{
  profile: FacultyDiscoveryProfile;
}>) {
  const profileHref = `/profiles/${profile.userId}?from=faculty`;
  const preview = bioPreview(profile.bio);
  const primaryProgram =
    profile.academicPrograms.find((program) => program.isPrimary) ??
    profile.academicPrograms[0];

  return (
    <article className="grid gap-4 rounded-lg border border-blue-100 bg-white p-4 text-blue-950 sm:grid-cols-[6rem_minmax(0,1fr)] sm:p-5 lg:grid-cols-[6rem_minmax(0,1fr)_auto] lg:items-center">
      <Link
        aria-label={`Open ${profile.fullName}'s profile`}
        className={`block w-24 ${systemAvatarRadiusClass} outline-none transition focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white`}
        href={profileHref}
      >
        <SystemAvatar
          availability={profile.availability}
          avatarMode={profile.avatarMode}
          customAvatarKey={profile.customAvatarKey}
          facultyName={profile.facultyName}
          fullName={profile.fullName}
          programName={profile.primaryAcademicProgramName}
          size="md"
          systemAvatarKey={profile.systemAvatarKey}
        />
      </Link>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-serif text-2xl font-semibold leading-tight text-blue-950 sm:text-3xl">
            <Link className="transition hover:text-blue-800" href={profileHref}>
              {profile.fullName}
            </Link>
          </h3>
          <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-bold uppercase tracking-[0.12em] text-blue-700">
            {profile.verificationStatus === "verified" ? "Verified" : "Unverified"}
          </span>
        </div>
        <p className="mt-1 text-sm font-semibold text-blue-800">
          {primaryProgram?.name ?? profile.primaryAcademicProgramName}
        </p>
        <p className="mt-0.5 text-sm font-medium text-blue-700/80">
          {profile.facultyName}
        </p>
        {preview ? (
          <p className="mt-2 text-sm leading-5 text-blue-900/75">{preview}</p>
        ) : null}
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <TaxonomyChipList
            emptyLabel="No expertise listed yet."
            items={profile.expertise}
            limit={4}
            showCategory
          />
          <TaxonomyChipList
            emptyLabel="No research interests listed yet."
            items={profile.researchInterests}
            limit={4}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 sm:col-start-2 lg:col-start-3 lg:justify-end">
        <Link
          className="inline-flex h-10 items-center justify-center rounded-md border border-blue-200 bg-white px-4 text-sm font-bold text-blue-900 transition hover:border-blue-300 hover:bg-blue-50"
          href={profileHref}
        >
          View profile
        </Link>
      </div>
    </article>
  );
}

export function FacultyDirectoryList({
  hasActiveFilters,
  loadError,
  profiles,
  totalCount,
}: Readonly<{
  hasActiveFilters: boolean;
  loadError?: boolean;
  profiles: readonly FacultyDiscoveryProfile[];
  totalCount: number;
}>) {
  return (
    <section aria-labelledby="faculty-directory-heading">
      <h2 className="sr-only" id="faculty-directory-heading">
        Faculty directory
      </h2>
      {loadError ? (
        <FacultyLoadError />
      ) : profiles.length === 0 ? (
        <FacultyEmptyState
          hasActiveFilters={hasActiveFilters}
          totalCount={totalCount}
        />
      ) : (
        <div className="space-y-3">
          {profiles.map((profile) => (
            <FacultyRow key={profile.userId} profile={profile} />
          ))}
        </div>
      )}
    </section>
  );
}
