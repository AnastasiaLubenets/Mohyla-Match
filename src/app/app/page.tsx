import Link from "next/link";

import { AllStudentsList } from "@/components/matching/all-students-list";
import { AppSidebar } from "@/components/matching/app-chrome";
import { DiscoveryMultiSelect } from "@/components/matching/discovery-multi-select";
import { RecommendedFeed } from "@/components/matching/recommended-feed";
import { SystemAvatar } from "@/components/profile/system-avatar";
import { requireAccountState } from "@/lib/auth/guards";
import {
  loadAllDiscoveryProfiles,
  loadDiscoveryCandidates,
  loadDiscoveryFilterOptions,
  loadSavedProfiles,
} from "@/lib/matching/data";
import {
  buildDiscoveryFilterOptions,
  createDiscoveryFilters,
  filterDiscoveryCandidates,
  hasActiveDiscoveryFilters,
  type DiscoveryFilterOptions,
  type DiscoveryFilters,
} from "@/lib/matching/discovery-filters";
import {
  createDiscoveryView,
  discoveryViewHref,
  type DiscoveryView,
} from "@/lib/matching/discovery-view";
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

function paramValues(value: string | string[] | undefined): string[] {
  const rawValues = Array.isArray(value) ? value : value ? [value] : [];

  return [
    ...new Set(
      rawValues.map((item) => item.trim()).filter((item) => item.length > 0),
    ),
  ];
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
  view,
}: Readonly<{
  filters: DiscoveryFilters;
  omit: keyof DiscoveryFilters;
  view: DiscoveryView;
}>) {
  return (
    <>
      <input name="view" type="hidden" value={view} />
      {omit !== "programNames"
        ? filters.programNames.map((value) => (
            <input
              key={`program-${value}`}
              name="program"
              type="hidden"
              value={value}
            />
          ))
        : null}
      {omit !== "yearsOfStudy"
        ? filters.yearsOfStudy.map((value) => (
            <input key={`year-${value}`} name="year" type="hidden" value={value} />
          ))
        : null}
      {omit !== "skillSlugs"
        ? filters.skillSlugs.map((value) => (
            <input key={`skill-${value}`} name="skill" type="hidden" value={value} />
          ))
        : null}
      {omit !== "interestSlugs"
        ? filters.interestSlugs.map((value) => (
            <input
              key={`interest-${value}`}
              name="interest"
              type="hidden"
              value={value}
            />
          ))
        : null}
      {omit !== "collaborationGoalSlugs"
        ? filters.collaborationGoalSlugs.map((value) => (
            <input key={`goal-${value}`} name="goal" type="hidden" value={value} />
          ))
        : null}
    </>
  );
}

function TopBar({
  currentProfile,
  filters,
  view,
}: Readonly<{
  currentProfile: SafeProfile | null;
  filters: DiscoveryFilters;
  view: DiscoveryView;
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
          <HiddenFilterInputs
            filters={filters}
            omit="searchQuery"
            view={view}
          />
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

function DiscoveryFilterRail({
  filters,
  hasActiveFilters,
  options,
  resultCount,
  totalCount,
  view,
}: Readonly<{
  filters: DiscoveryFilters;
  hasActiveFilters: boolean;
  options: DiscoveryFilterOptions;
  resultCount: number;
  totalCount: number;
  view: DiscoveryView;
}>) {
  return (
    <aside className="scrollbar-hidden space-y-4 xl:h-full xl:min-h-0 xl:overflow-y-auto xl:pb-6">
      <section className="rounded-lg border border-blue-100 bg-white p-5">
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
            href={discoveryViewHref({}, view)}
          >
            Reset
          </Link>
        </div>

        <p className="sr-only">
          Showing {resultCount} of {totalCount} available profiles.
        </p>

        <form action="/app" className="mt-4 space-y-3">
          <input name="view" type="hidden" value={view} />
          {filters.searchQuery ? (
            <input name="q" type="hidden" value={filters.searchQuery} />
          ) : null}
          <DiscoveryMultiSelect
            key={`goal-${filters.collaborationGoalSlugs.join("\u001f")}`}
            label="Collaboration goal"
            name="goal"
            options={options.collaborationGoals}
            placeholder="Select goals"
            searchPlaceholder="Search collaboration goals..."
            selectedValues={filters.collaborationGoalSlugs}
          />
          <DiscoveryMultiSelect
            key={`program-${filters.programNames.join("\u001f")}`}
            label="Academic program"
            name="program"
            options={options.programs}
            placeholder="Select programs"
            searchPlaceholder="Search academic programs..."
            selectedValues={filters.programNames}
          />
          <DiscoveryMultiSelect
            key={`year-${filters.yearsOfStudy.join("\u001f")}`}
            label="Year of study"
            name="year"
            options={options.years}
            placeholder="Select years"
            searchPlaceholder="Search years..."
            selectedValues={filters.yearsOfStudy}
          />
          <DiscoveryMultiSelect
            key={`skill-${filters.skillSlugs.join("\u001f")}`}
            label="Skills"
            name="skill"
            options={options.skills}
            placeholder="Select skills"
            searchPlaceholder="Search skills..."
            selectedValues={filters.skillSlugs}
          />
          <DiscoveryMultiSelect
            key={`interest-${filters.interestSlugs.join("\u001f")}`}
            label="Interests"
            name="interest"
            options={options.interests}
            placeholder="Select interests"
            searchPlaceholder="Search interests..."
            selectedValues={filters.interestSlugs}
          />
          <button
            className="mt-2 inline-flex h-12 w-full items-center justify-center rounded-md bg-blue-800 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-900"
            type="submit"
          >
            Apply filters
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-blue-50 bg-[#fffaf0] p-7">
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

function DiscoveryViewTabs({
  currentView,
  params,
}: Readonly<{
  currentView: DiscoveryView;
  params: Record<string, string | string[] | undefined>;
}>) {
  const tabs: { label: string; view: DiscoveryView }[] = [
    { label: "Recommended", view: "recommended" },
    { label: "All students", view: "all" },
  ];

  return (
    <nav
      aria-label="Discovery views"
      className="mb-5 flex justify-center"
    >
      <div className="inline-flex rounded-lg border border-blue-100 bg-white p-1">
        {tabs.map((tab) => {
          const active = currentView === tab.view;

          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={
                active
                  ? "inline-flex h-9 items-center justify-center rounded-md bg-blue-800 px-4 text-sm font-bold text-white"
                  : "inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-bold text-blue-700 transition hover:bg-blue-50 hover:text-blue-950"
              }
              href={discoveryViewHref(params, tab.view)}
              key={tab.view}
              scroll={false}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default async function AppPage({ searchParams }: PageProps) {
  const accountState = await requireAccountState("/app", ["active"]);
  const params = await searchParams;
  const view = createDiscoveryView(params.view);
  const filters = createDiscoveryFilters({
    collaborationGoalSlugs: paramValues(params.goal),
    interestSlugs: paramValues(params.interest),
    programNames: paramValues(params.program),
    searchQuery: firstParam(params.q),
    skillSlugs: paramValues(params.skill),
    yearsOfStudy: paramValues(params.year),
  });
  const supabase = await createSupabaseServerClient();
  const [
    candidatesResult,
    currentProfileResult,
    savedProfilesResult,
    filterOptionsResult,
  ] =
    await Promise.all([
      view === "all"
        ? loadAllDiscoveryProfiles(supabase)
        : loadDiscoveryCandidates(supabase, 50),
      accountState.userId
        ? loadSafeProfile(supabase, accountState.userId)
        : Promise.resolve({ data: null, error: false }),
      loadSavedProfiles(supabase, 100),
      loadDiscoveryFilterOptions(supabase),
    ]);
  const currentProfile = currentProfileResult.error
    ? null
    : currentProfileResult.data;
  const savedProfileIds = new Set(
    savedProfilesResult.error
      ? []
      : (savedProfilesResult.data ?? []).map((profile) => profile.userId),
  );

  const allCandidates = candidatesResult.error
    ? []
    : (candidatesResult.data ?? []);
  const filteredCandidates = filterDiscoveryCandidates(allCandidates, filters);
  const activeFilters = hasActiveDiscoveryFilters(filters);
  const options = filterOptionsResult.error
    ? buildDiscoveryFilterOptions(allCandidates)
    : (filterOptionsResult.data ?? buildDiscoveryFilterOptions(allCandidates));
  const returnTo = discoveryViewHref(params, view);
  const savedProfileIdList = Array.from(savedProfileIds);
  const allStudentsHref = discoveryViewHref(params, "all");

  return (
    <main className="min-h-screen bg-[#eef6fb] text-blue-950 xl:h-screen xl:overflow-hidden">
      <div className="grid min-h-screen xl:h-screen xl:min-h-0 xl:grid-cols-[18rem_minmax(0,1fr)]">
        <AppSidebar active="discover" />
        <div className="flex min-w-0 flex-col xl:h-screen xl:min-h-0 xl:overflow-hidden">
          <TopBar currentProfile={currentProfile} filters={filters} view={view} />
          <div className="grid gap-6 px-4 py-6 sm:px-6 xl:min-h-0 xl:flex-1 xl:grid-cols-[minmax(0,1fr)_22rem] xl:overflow-hidden xl:px-8 2xl:gap-8">
            <section className="scrollbar-hidden min-w-0 xl:min-h-0 xl:overflow-y-auto">
              <Hero />
              <DiscoveryViewTabs currentView={view} params={params} />
              {view === "all" ? (
                <AllStudentsList
                  candidates={filteredCandidates}
                  error={firstParam(params.error)}
                  hasActiveFilters={activeFilters}
                  loadError={candidatesResult.error}
                  returnTo={returnTo}
                  savedProfileIds={savedProfileIds}
                  status={firstParam(params.status)}
                  totalCount={allCandidates.length}
                />
              ) : (
                <RecommendedFeed
                  allStudentsHref={allStudentsHref}
                  candidates={filteredCandidates}
                  emptyDescription="No more recommendations right now. You can still browse all students."
                  emptyTitle="No more recommendations right now."
                  error={firstParam(params.error)}
                  loadError={candidatesResult.error}
                  returnTo={returnTo}
                  savedProfileIds={savedProfileIdList}
                  status={firstParam(params.status)}
                />
              )}
            </section>

            <DiscoveryFilterRail
              filters={filters}
              hasActiveFilters={activeFilters}
              options={options}
              resultCount={filteredCandidates.length}
              totalCount={allCandidates.length}
              view={view}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
