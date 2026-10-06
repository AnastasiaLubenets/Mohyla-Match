import Link from "next/link";

import { ActionToastViewport } from "@/components/matching/action-toast";
import { AllStudentsList } from "@/components/matching/all-students-list";
import { AppSidebar } from "@/components/matching/app-chrome";
import { DiscoveryFilterPanel } from "@/components/matching/discovery-filter-panel";
import { DiscoveryTopBar } from "@/components/matching/discovery-top-bar";
import { RecommendedFeed } from "@/components/matching/recommended-feed";
import { requireAccountState } from "@/lib/auth/guards";
import { saveStatusToast } from "@/lib/matching/action-toast";
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
  type DiscoveryFilters,
} from "@/lib/matching/discovery-filters";
import {
  createDiscoveryView,
  discoveryViewHref,
  type DiscoveryView,
} from "@/lib/matching/discovery-view";
import { loadSafeProfile } from "@/lib/profile/data";
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

function StudentHiddenFilterInputs({
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
      <div
        className="relative grid w-full max-w-sm grid-cols-2 rounded-lg border border-blue-100 bg-white p-1"
        role="tablist"
      >
        <span
          aria-hidden="true"
          className={
            currentView === "all"
              ? "absolute bottom-1 left-1 top-1 w-[calc(50%-0.25rem)] translate-x-full rounded-md bg-blue-800 transition-transform duration-200 ease-out motion-reduce:transition-none"
              : "absolute bottom-1 left-1 top-1 w-[calc(50%-0.25rem)] translate-x-0 rounded-md bg-blue-800 transition-transform duration-200 ease-out motion-reduce:transition-none"
          }
        />
        {tabs.map((tab) => {
          const active = currentView === tab.view;

          return (
            <Link
              aria-current={active ? "page" : undefined}
              aria-selected={active}
              className={
                active
                  ? "relative z-10 inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-bold text-white"
                  : "relative z-10 inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-bold text-blue-700 transition hover:text-blue-950"
              }
              href={discoveryViewHref(params, tab.view)}
              key={tab.view}
              role="tab"
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
  const supabase = await createSupabaseServerClient();
  const currentProfileResult = await (accountState.userId
    ? loadSafeProfile(supabase, accountState.userId)
    : Promise.resolve({ data: null, error: false }));
  const currentProfile = currentProfileResult.error
    ? null
    : currentProfileResult.data;

  const filters = createDiscoveryFilters({
    collaborationGoalSlugs: paramValues(params.goal),
    interestSlugs: paramValues(params.interest),
    programNames: paramValues(params.program),
    searchQuery: firstParam(params.q),
    skillSlugs: paramValues(params.skill),
    yearsOfStudy: paramValues(params.year),
  });
  const [
    candidatesResult,
    savedProfilesResult,
    filterOptionsResult,
  ] =
    await Promise.all([
      view === "all"
        ? loadAllDiscoveryProfiles(supabase)
        : loadDiscoveryCandidates(supabase, 50),
      loadSavedProfiles(supabase, 100),
      loadDiscoveryFilterOptions(supabase),
    ]);
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
  const status = firstParam(params.status);
  const toast = saveStatusToast(status);

  return (
    <main className="min-h-screen bg-[#eef6fb] text-blue-950 xl:h-screen xl:overflow-hidden">
      <ActionToastViewport
        clearSearchParams={toast ? ["status"] : []}
        initialToast={toast}
      />
      <div className="grid min-h-screen xl:h-screen xl:min-h-0 xl:grid-cols-[18rem_minmax(0,1fr)]">
        <AppSidebar active="discover" />
        <div className="flex min-w-0 flex-col xl:h-screen xl:min-h-0 xl:overflow-hidden">
          <DiscoveryTopBar
            action="/app"
            currentProfile={currentProfile}
            hiddenInputs={
              <StudentHiddenFilterInputs
                filters={filters}
                omit="searchQuery"
                view={view}
              />
            }
            searchLabel="Search students, skills or interests"
            searchPlaceholder="Search students, skills or interests..."
            searchQuery={filters.searchQuery}
          />
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
                  status={status}
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
                  status={status}
                />
              )}
            </section>

            <aside className="scrollbar-hidden space-y-4 xl:h-full xl:min-h-0 xl:overflow-y-auto xl:pb-6">
              <DiscoveryFilterPanel
                filters={filters}
                options={options}
                resultCount={filteredCandidates.length}
                totalCount={allCandidates.length}
                view={view}
              />
              <section
                className="rounded-lg border border-blue-50 bg-[#fffaf0] bg-cover bg-center bg-no-repeat p-7"
                style={{
                  backgroundImage:
                    "url('/branding/mohyla-quote-architecture-v2.png')",
                  backgroundPosition: "center bottom",
                }}
              >
                <p className="font-serif text-6xl font-bold leading-none text-blue-800">
                  &quot;
                </p>
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
          </div>
        </div>
      </div>
    </main>
  );
}
