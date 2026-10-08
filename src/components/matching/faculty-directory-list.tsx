import Link from "next/link";

import { SystemAvatar } from "@/components/profile/system-avatar";
import type {
  FacultyDiscoveryProfile,
  FacultyExpertiseItem,
  FacultyProgramItem,
  MatchingItem,
} from "@/lib/matching/data";
import { systemAvatarRadiusClass } from "@/lib/profile/program-avatar";

type CompactChip = Readonly<{
  key: string;
  label: string;
  meta?: string | null;
}>;

function uniqueProgramChips(
  programs: readonly FacultyProgramItem[],
  fallbackProgramName: string,
): CompactChip[] {
  const chips = [
    ...new Map(
      programs.map((program) => [
        program.slug,
        {
          key: `program-${program.id}`,
          label: program.name,
          meta: program.specialtyCode,
        },
      ]),
    ).values(),
  ];

  return chips.length > 0
    ? chips
    : [{ key: "primary-program", label: fallbackProgramName }];
}

function expertiseChips(items: readonly FacultyExpertiseItem[]): CompactChip[] {
  return items.map((item) => ({
    key: `expertise-${item.id}`,
    label: item.name,
    meta: item.category,
  }));
}

function namedChips(items: readonly MatchingItem[]): CompactChip[] {
  return items.map((item) => ({
    key: `item-${item.id}`,
    label: item.name,
  }));
}

function CompactChipRow({
  emptyLabel,
  items,
  label,
  limit,
}: Readonly<{
  emptyLabel: string;
  items: readonly CompactChip[];
  label: string;
  limit: number;
}>) {
  const visibleItems = items.slice(0, limit);
  const hiddenCount = items.length > limit ? items.length - limit : 0;

  return (
    <div className="flex flex-wrap items-start gap-1.5">
      <span className="mr-1 mt-1 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-blue-600">
        {label}
      </span>
      {items.length === 0 ? (
        <span className="mt-0.5 text-sm text-muted">{emptyLabel}</span>
      ) : (
        <ul className="flex flex-wrap items-start gap-1.5">
          {visibleItems.map((item) => (
            <li
              className="inline-flex w-fit max-w-full self-start rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold leading-snug text-blue-800 ring-1 ring-blue-100/70"
              key={item.key}
            >
              <span className="min-w-0 break-words">{item.label}</span>
              {item.meta ? (
                <span className="ml-1.5 shrink-0 text-blue-500">
                  {item.meta}
                </span>
              ) : null}
            </li>
          ))}
          {hiddenCount ? (
            <li className="inline-flex w-fit self-start rounded-full bg-slate-50 px-2.5 py-1 text-xs font-semibold leading-snug text-slate-500 ring-1 ring-slate-100">
              +{hiddenCount} more
            </li>
          ) : null}
        </ul>
      )}
    </div>
  );
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
  const primaryProgram =
    profile.academicPrograms.find((program) => program.isPrimary) ??
    profile.academicPrograms[0];
  const academicProgramChips = uniqueProgramChips(
    profile.academicPrograms,
    profile.primaryAcademicProgramName,
  );
  const expertiseAndInterestChips = [
    ...expertiseChips(profile.expertise),
    ...namedChips(profile.researchInterests),
  ];

  return (
    <article className="rounded-lg border border-blue-100 bg-white p-4 text-blue-950 sm:p-5">
      <div className="grid gap-4 sm:grid-cols-[6rem_minmax(0,1fr)]">
        <Link
          aria-label={`Open ${profile.fullName}'s profile`}
          className={`block w-24 ${systemAvatarRadiusClass} outline-none transition focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white`}
          href={profileHref}
        >
          <SystemAvatar
            availability={profile.availability}
            avatarMode={profile.avatarMode}
            avatarVariantKey={profile.avatarVariantKey}
            customAvatarKey={profile.customAvatarKey}
            facultyName={profile.facultyName}
            fullName={profile.fullName}
            programName={profile.primaryAcademicProgramName}
            size="md"
            systemAvatarKey={profile.systemAvatarKey}
          />
        </Link>

        <div className="flex min-w-0 flex-col">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-serif text-2xl font-semibold leading-tight text-blue-950 sm:text-3xl">
                <Link
                  className="transition hover:text-blue-800"
                  href={profileHref}
                >
                  {profile.fullName}
                </Link>
              </h3>
              <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-bold uppercase tracking-[0.12em] text-blue-700">
                {profile.verificationStatus === "verified"
                  ? "Verified"
                  : "Unverified"}
              </span>
            </div>
            <p className="mt-1 text-sm font-semibold text-blue-800">
              {primaryProgram?.name ?? profile.primaryAcademicProgramName}
            </p>
            <p className="mt-0.5 text-sm font-medium text-blue-700/80">
              {profile.facultyName}
            </p>
          </div>

          <div className="mt-3 space-y-2.5">
            <CompactChipRow
              emptyLabel="No academic programs listed yet."
              items={academicProgramChips}
              label="Programs"
              limit={4}
            />
            <CompactChipRow
              emptyLabel="No expertise or research interests listed yet."
              items={expertiseAndInterestChips}
              label="Expertise"
              limit={6}
            />
          </div>

          <div className="mt-3 flex justify-end">
            <Link
              className="inline-flex h-10 items-center justify-center rounded-md border border-blue-200 bg-white px-4 text-sm font-bold text-blue-900 transition hover:border-blue-300 hover:bg-blue-50"
              href={profileHref}
            >
              View profile
            </Link>
          </div>
        </div>
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
