import Link from "next/link";

import { AppSidebar } from "@/components/matching/app-chrome";
import { DiscoveryCard } from "@/components/matching/discovery-card";
import { SystemAvatar } from "@/components/profile/system-avatar";
import { requireAccountState } from "@/lib/auth/guards";
import {
  loadDiscoveryCandidates,
  loadSavedProfiles,
  type DiscoveryCandidate,
} from "@/lib/matching/data";
import {
  buildDiscoveryFilterOptions,
  createDiscoveryFilters,
  filterDiscoveryCandidates,
  hasActiveDiscoveryFilters,
  type DiscoveryFilterOptions,
  type DiscoveryFilters,
} from "@/lib/matching/discovery-filters";
import { loadSafeProfile, type SafeProfile } from "@/lib/profile/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Discover",
};

type PageProps = Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function SearchIcon() {
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
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function HiddenFilterInputs({
  filters,
  omit,
}: Readonly<{
  filters: DiscoveryFilters;
  omit: keyof DiscoveryFilters;
}>) {
  return (
    <>
      {omit !== "programName" && filters.programName ? (
        <input name="program" type="hidden" value={filters.programName} />
      ) : null}
      {omit !== "yearOfStudy" && filters.yearOfStudy ? (
        <input name="year" type="hidden" value={filters.yearOfStudy} />
      ) : null}
      {omit !== "skillSlug" && filters.skillSlug ? (
        <input name="skill" type="hidden" value={filters.skillSlug} />
      ) : null}
      {omit !== "interestSlug" && filters.interestSlug ? (
        <input name="interest" type="hidden" value={filters.interestSlug} />
      ) : null}
      {omit !== "collaborationGoalSlug" && filters.collaborationGoalSlug ? (
        <input name="goal" type="hidden" value={filters.collaborationGoalSlug} />
      ) : null}
    </>
  );
}

function TopBar({
  currentProfile,
  filters,
}: Readonly<{
  currentProfile: SafeProfile | null;
  filters: DiscoveryFilters;
}>) {
  return (
    <header className="z-30 shrink-0 border-b border-blue-100 bg-white/80 px-4 py-3 backdrop-blur sm:px-6 xl:px-8">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <form action="/app" className="relative w-full lg:max-w-md">
          <label className="sr-only" htmlFor="discover-search">
            Search students, skills or interests
          </label>
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-blue-500">
            <SearchIcon />
          </span>
          <input
            className="h-11 w-full rounded-lg border border-blue-100 bg-blue-50/80 pl-12 pr-5 text-sm font-medium text-blue-950 outline-none transition placeholder:text-blue-400 focus:border-blue-300 focus:bg-white"
            defaultValue={filters.searchQuery}
            id="discover-search"
            name="q"
            placeholder="Search students, skills or interests..."
            type="search"
          />
          <HiddenFilterInputs filters={filters} omit="searchQuery" />
          <button className="sr-only" type="submit">
            Search
          </button>
        </form>

        <div className="flex items-center justify-between gap-4 lg:justify-end">
          <Link
            className="inline-flex items-center gap-3 rounded-lg px-2 py-1.5 text-blue-950 transition hover:bg-blue-50"
            href="/profile"
          >
            {currentProfile ? (
              <SystemAvatar
                availability={currentProfile.availability}
                facultyName={currentProfile.facultyName}
                fullName={currentProfile.fullName}
                programName={currentProfile.academicProgramName}
                size="sm"
                systemAvatarKey={currentProfile.systemAvatarKey}
              />
            ) : null}
            <span className="text-left">
              <span className="block text-sm font-semibold">
                {currentProfile?.fullName ?? "My profile"}
              </span>
              <span className="block text-xs text-slate-500">My profile</span>
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}

function SelectField({
  label,
  name,
  options,
  placeholder = "Any",
  value,
}: Readonly<{
  label: string;
  name: string;
  options: readonly { label: string; value: string }[];
  placeholder?: string;
  value: string;
}>) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-blue-900">{label}</span>
      <select
        className="mt-1.5 h-10 w-full rounded-md border border-blue-100 bg-white px-3 text-sm font-medium text-blue-900 outline-none transition focus:border-blue-300"
        defaultValue={value}
        name={name}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function DiscoveryFilterRail({
  filters,
  hasActiveFilters,
  options,
  resultCount,
  totalCount,
}: Readonly<{
  filters: DiscoveryFilters;
  hasActiveFilters: boolean;
  options: DiscoveryFilterOptions;
  resultCount: number;
  totalCount: number;
}>) {
  return (
    <aside className="space-y-4 xl:h-full xl:min-h-0 xl:overflow-hidden">
      <section className="rounded-lg border border-blue-100 bg-white p-5 shadow-[0_18px_50px_rgba(15,94,156,0.09)]">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-serif text-3xl font-bold leading-none text-blue-950">
            Filters
          </h2>
          <Link
            className={
              hasActiveFilters
                ? "text-sm font-bold text-blue-700 transition hover:text-blue-950"
                : "text-sm font-bold text-blue-300"
            }
            href="/app"
          >
            Reset
          </Link>
        </div>

        <p className="sr-only">
          Showing {resultCount} of {totalCount} available profiles.
        </p>

        <form action="/app" className="mt-4 space-y-3">
          {filters.searchQuery ? (
            <input name="q" type="hidden" value={filters.searchQuery} />
          ) : null}
          <SelectField
            label="Collaboration goal"
            name="goal"
            options={options.collaborationGoals}
            value={filters.collaborationGoalSlug}
          />
          <SelectField
            label="Academic program"
            name="program"
            options={options.programs}
            value={filters.programName}
          />
          <SelectField
            label="Year of study"
            name="year"
            options={options.years}
            value={filters.yearOfStudy}
          />
          <SelectField
            label="Skills"
            name="skill"
            options={options.skills}
            placeholder="Select skills"
            value={filters.skillSlug}
          />
          <SelectField
            label="Interests"
            name="interest"
            options={options.interests}
            placeholder="Select interests"
            value={filters.interestSlug}
          />
          <button
            className="mt-2 inline-flex h-12 w-full items-center justify-center rounded-md bg-blue-800 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-900"
            type="submit"
          >
            Apply filters
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-blue-50 bg-[#fffaf0] p-7 shadow-[0_18px_50px_rgba(15,94,156,0.06)]">
        <p className="font-serif text-6xl font-bold leading-none text-blue-800">“</p>
        <p className="mt-1 font-serif text-3xl font-semibold italic leading-[1.02] text-blue-950">
          Great things happen when Mohylians find each other.
        </p>
        <div className="mt-6 h-px w-16 bg-blue-300" />
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.22em] text-blue-500">
          Community
          <br />
          Ideas
          <br />
          People
          <br />
          Impact
        </p>
      </section>
    </aside>
  );
}

function Hero() {
  return (
    <header className="mb-6 text-center">
      <h1 className="font-serif text-6xl font-bold leading-[0.92] text-blue-950 sm:text-7xl 2xl:text-8xl">
        Find your people.
        <br />
        <span className="font-semibold italic">Build something together.</span>
      </h1>
      <p className="mx-auto mt-5 max-w-3xl text-lg leading-7 text-blue-900/75">
        <span>Con</span>nect with fellow Mohylians for projects, studies,
        research and more.
      </p>
    </header>
  );
}

function DiscoveryFeed({
  candidates,
  emptyDescription,
  emptyTitle,
  error,
  savedProfileIds,
  status,
}: Readonly<{
  candidates: readonly DiscoveryCandidate[];
  emptyDescription?: string;
  emptyTitle?: string;
  error?: string;
  savedProfileIds: ReadonlySet<string>;
  status?: string;
}>) {
  if (candidates.length === 0) {
    return (
      <DiscoveryCard
        candidate={null}
        emptyDescription={emptyDescription}
        emptyTitle={emptyTitle}
        error={error}
        status={status}
      />
    );
  }

  return (
    <div className="space-y-5">
      {candidates.map((candidate, index) => (
        <DiscoveryCard
          candidate={candidate}
          error={index === 0 ? error : undefined}
          key={candidate.userId}
          saved={savedProfileIds.has(candidate.userId)}
          status={index === 0 ? status : undefined}
        />
      ))}
    </div>
  );
}

export default async function AppPage({ searchParams }: PageProps) {
  const accountState = await requireAccountState("/app", ["active"]);
  const params = await searchParams;
  const filters = createDiscoveryFilters({
    collaborationGoalSlug: firstParam(params.goal),
    interestSlug: firstParam(params.interest),
    programName: firstParam(params.program),
    searchQuery: firstParam(params.q),
    skillSlug: firstParam(params.skill),
    yearOfStudy: firstParam(params.year),
  });
  const supabase = await createSupabaseServerClient();
  const [candidatesResult, currentProfileResult, savedProfilesResult] =
    await Promise.all([
      loadDiscoveryCandidates(supabase, 50),
      accountState.userId
        ? loadSafeProfile(supabase, accountState.userId)
        : Promise.resolve({ data: null, error: false }),
      loadSavedProfiles(supabase, 50),
    ]);
  const currentProfile = currentProfileResult.error
    ? null
    : currentProfileResult.data;
  const savedProfileIds = new Set(
    savedProfilesResult.error
      ? []
      : (savedProfilesResult.data ?? []).map((profile) => profile.userId),
  );

  if (candidatesResult.error) {
    return (
      <main className="min-h-screen bg-[#eef6fb] text-blue-950 xl:h-screen xl:overflow-hidden">
        <div className="grid min-h-screen xl:h-screen xl:min-h-0 xl:grid-cols-[18rem_minmax(0,1fr)]">
          <AppSidebar active="discover" />
          <div className="flex min-w-0 flex-col xl:h-screen xl:min-h-0 xl:overflow-hidden">
            <TopBar currentProfile={currentProfile} filters={filters} />
            <section className="scrollbar-hidden px-4 py-8 sm:px-6 xl:min-h-0 xl:flex-1 xl:overflow-y-auto xl:px-8">
              <div className="mx-auto max-w-4xl rounded-lg border border-blue-100 bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.12em] text-blue-700">
                  Discover
                </p>
                <h1 className="mt-4 font-serif text-4xl font-semibold text-blue-950">
                  Discovery unavailable
                </h1>
                <p className="mt-3 leading-7 text-slate-600">
                  We could not load matching candidates. Try again in a moment.
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
    );
  }

  const allCandidates = candidatesResult.data ?? [];
  const filteredCandidates = filterDiscoveryCandidates(allCandidates, filters);
  const activeFilters = hasActiveDiscoveryFilters(filters);
  const options = buildDiscoveryFilterOptions(allCandidates);

  return (
    <main className="min-h-screen bg-[#eef6fb] text-blue-950 xl:h-screen xl:overflow-hidden">
      <div className="grid min-h-screen xl:h-screen xl:min-h-0 xl:grid-cols-[18rem_minmax(0,1fr)]">
        <AppSidebar active="discover" />
        <div className="flex min-w-0 flex-col xl:h-screen xl:min-h-0 xl:overflow-hidden">
          <TopBar currentProfile={currentProfile} filters={filters} />
          <div className="grid gap-6 px-4 py-6 sm:px-6 xl:min-h-0 xl:flex-1 xl:grid-cols-[minmax(0,1fr)_22rem] xl:overflow-hidden xl:px-8 2xl:gap-8">
            <section className="scrollbar-hidden min-w-0 xl:-mx-14 xl:min-h-0 xl:overflow-y-auto xl:px-14 xl:pb-28">
              <Hero />
              <DiscoveryFeed
                candidates={filteredCandidates}
                emptyDescription={
                  activeFilters
                    ? "Try clearing filters or broadening your search to see more Mohyla students."
                    : undefined
                }
                emptyTitle={
                  activeFilters ? "No profiles match these filters." : undefined
                }
                error={firstParam(params.error)}
                savedProfileIds={savedProfileIds}
                status={firstParam(params.status)}
              />
            </section>

            <DiscoveryFilterRail
              filters={filters}
              hasActiveFilters={activeFilters}
              options={options}
              resultCount={filteredCandidates.length}
              totalCount={allCandidates.length}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
