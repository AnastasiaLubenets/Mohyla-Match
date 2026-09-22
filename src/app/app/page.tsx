import Link from "next/link";
import type { ReactNode } from "react";

import { DiscoveryCard } from "@/components/matching/discovery-card";
import { SystemAvatar } from "@/components/profile/system-avatar";
import { requireAccountState } from "@/lib/auth/guards";
import { loadDiscoveryCandidates, type DiscoveryCandidate } from "@/lib/matching/data";
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

type SidebarLinkProps = Readonly<{
  active?: boolean;
  children: ReactNode;
  href: string;
  label: string;
}>;

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function CompassIcon() {
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
      <circle cx="12" cy="12" r="9" />
      <path d="m15 9-2 5-5 2 2-5 5-2Z" />
    </svg>
  );
}

function BookmarkIcon() {
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
      <path d="M19 21 12 16 5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16Z" />
    </svg>
  );
}

function UserIcon() {
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
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="8" r="4" />
    </svg>
  );
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

function ArrowIcon() {
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
      <path d="M7 17 17 7" />
      <path d="M7 7h10v10" />
    </svg>
  );
}

function SidebarLink({ active = false, children, href, label }: SidebarLinkProps) {
  return (
    <Link
      aria-current={active ? "page" : undefined}
      className={
        active
          ? "inline-flex items-center gap-3 rounded-lg bg-blue-100 px-4 py-3 text-sm font-semibold text-blue-950 shadow-sm"
          : "inline-flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold text-blue-900 transition hover:bg-blue-50"
      }
      href={href}
    >
      {children}
      <span>{label}</span>
    </Link>
  );
}

function DiscoverSidebar() {
  return (
    <aside className="border-b border-blue-100 bg-white/85 px-4 py-4 backdrop-blur lg:sticky lg:top-0 lg:flex lg:min-h-screen lg:flex-col lg:border-b-0 lg:border-r lg:px-5 lg:py-6">
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 font-serif text-xl font-semibold text-blue-900">
          MM
        </div>
        <div>
          <Link
            className="font-serif text-2xl font-semibold leading-none text-blue-950"
            href="/app"
          >
            Mohyla
            <br />
            Match
          </Link>
          <p className="mt-2 text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-blue-700">
            Find people
          </p>
        </div>
      </div>

      <nav className="mt-5 grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
        <SidebarLink active href="/app" label="Discover">
          <CompassIcon />
        </SidebarLink>
        <SidebarLink href="/saved" label="Saved">
          <BookmarkIcon />
        </SidebarLink>
        <SidebarLink href="/profile" label="My profile">
          <UserIcon />
        </SidebarLink>
      </nav>

      <div className="mt-6 hidden flex-1 flex-col justify-end lg:flex">
        <div className="border-t border-blue-100 pt-6">
          <p className="font-serif text-2xl leading-tight text-blue-950">
            Більше людей.
            <br />
            Більше можливостей.
          </p>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-blue-500">
            Спільнота
            <br />
            що створює майбутнє
          </p>
        </div>
        <form action="/auth/logout" className="mt-8" method="post">
          <button
            className="text-sm font-semibold text-slate-500 transition hover:text-blue-900"
            type="submit"
          >
            Log out
          </button>
        </form>
      </div>
    </aside>
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
    <header className="border-b border-blue-100 bg-white/85 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <form action="/app" className="relative w-full xl:max-w-md">
          <label className="sr-only" htmlFor="discover-search">
            Search students, skills or interests
          </label>
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-blue-500">
            <SearchIcon />
          </span>
          <input
            className="h-12 w-full rounded-full border border-blue-100 bg-blue-50/70 pl-12 pr-5 text-sm font-medium text-blue-950 outline-none transition placeholder:text-blue-400 focus:border-blue-300 focus:bg-white"
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

        <div className="flex items-center justify-between gap-4 xl:justify-end">
          <Link
            className="inline-flex items-center gap-3 rounded-full border border-blue-100 bg-white px-3 py-2 text-blue-950 shadow-sm transition hover:border-blue-300"
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
  value,
}: Readonly<{
  label: string;
  name: string;
  options: readonly { label: string; value: string }[];
  value: string;
}>) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-blue-900">{label}</span>
      <select
        className="mt-2 h-11 w-full rounded-lg border border-blue-100 bg-white px-3 text-sm font-medium text-blue-900 outline-none transition focus:border-blue-300"
        defaultValue={value}
        name={name}
      >
        <option value="">Any</option>
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
    <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
      <section className="rounded-lg border border-blue-100 bg-white p-5 shadow-[0_18px_50px_rgba(15,94,156,0.10)]">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-serif text-3xl font-semibold text-blue-950">
            Filters
          </h2>
          {hasActiveFilters ? (
            <Link
              className="text-sm font-semibold text-blue-700 transition hover:text-blue-950"
              href="/app"
            >
              Reset
            </Link>
          ) : null}
        </div>

        <p className="mt-3 text-sm text-slate-500">
          Showing {resultCount} of {totalCount} available profiles.
        </p>

        <form action="/app" className="mt-5 space-y-4">
          {filters.searchQuery ? (
            <input name="q" type="hidden" value={filters.searchQuery} />
          ) : null}
          <SelectField
            label="Looking for"
            name="skill"
            options={options.skills}
            value={filters.skillSlug}
          />
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
            label="Interests"
            name="interest"
            options={options.interests}
            value={filters.interestSlug}
          />
          <button
            className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-blue-800 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-900"
            type="submit"
          >
            Apply filters
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-blue-100 bg-white p-6 shadow-[0_18px_50px_rgba(15,94,156,0.08)]">
        <p className="font-serif text-5xl leading-none text-blue-800">“</p>
        <p className="mt-2 font-serif text-3xl italic leading-tight text-blue-950">
          Great things happen when Mohylians find each other.
        </p>
        <div className="mt-6 h-px w-16 bg-blue-300" />
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.22em] text-blue-400">
          Community
          <br />
          Ideas
          <br />
          People
          <br />
          Impact
        </p>
      </section>

      <Link
        className="flex items-center justify-between gap-4 rounded-lg border border-blue-100 bg-white px-5 py-4 text-blue-950 shadow-sm transition hover:border-blue-300"
        href="/profile"
      >
        <span>
          <span className="block text-sm font-semibold">Tune discovery</span>
          <span className="block text-xs text-slate-500">
            Update skills and goals
          </span>
        </span>
        <ArrowIcon />
      </Link>
    </aside>
  );
}

function Hero() {
  return (
    <header className="mb-8 text-center lg:text-left">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-500">
        Discover Mohyla students
      </p>
      <h1 className="mt-4 font-serif text-5xl font-semibold leading-[1.02] text-blue-950 sm:text-6xl xl:text-7xl">
        Find your people.
        <br />
        <span className="italic">Build something together.</span>
      </h1>
      <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 lg:mx-0">
        Discover Mohyla students for projects, research, study groups and
        collaborations that start with a useful conversation.
      </p>
    </header>
  );
}

function NextCandidateList({
  candidates,
}: Readonly<{
  candidates: readonly DiscoveryCandidate[];
}>) {
  if (candidates.length === 0) {
    return null;
  }

  return (
    <section className="mt-6 rounded-lg border border-blue-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-blue-900">
          Next in discovery
        </h2>
        <span className="text-sm font-medium text-slate-500">
          {candidates.length} queued
        </span>
      </div>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {candidates.map((nextCandidate) => (
          <li
            className="rounded-lg border border-blue-100 bg-blue-50/50 p-4"
            key={nextCandidate.userId}
          >
            <p className="font-serif text-xl font-semibold text-blue-950">
              {nextCandidate.fullName}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {nextCandidate.academicProgramName} · Year{" "}
              {nextCandidate.yearOfStudy}
            </p>
            <p className="mt-3 text-sm font-semibold text-blue-700">
              {nextCandidate.compatibilityScore}% compatibility
            </p>
          </li>
        ))}
      </ul>
    </section>
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
  const [candidatesResult, currentProfileResult] = await Promise.all([
    loadDiscoveryCandidates(supabase, 50),
    accountState.userId
      ? loadSafeProfile(supabase, accountState.userId)
      : Promise.resolve({ data: null, error: false }),
  ]);
  const currentProfile = currentProfileResult.error
    ? null
    : currentProfileResult.data;

  if (candidatesResult.error) {
    return (
      <main className="min-h-screen bg-[#f5f9fd] text-blue-950">
        <div className="mx-auto grid max-w-[96rem] lg:grid-cols-[17rem_minmax(0,1fr)]">
          <DiscoverSidebar />
          <div className="min-w-0">
            <TopBar currentProfile={currentProfile} filters={filters} />
            <section className="px-4 py-8 sm:px-6 lg:px-8">
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
  const candidate = filteredCandidates[0] ?? null;
  const activeFilters = hasActiveDiscoveryFilters(filters);
  const options = buildDiscoveryFilterOptions(allCandidates);

  return (
    <main className="min-h-screen bg-[#f5f9fd] text-blue-950">
      <div className="mx-auto grid max-w-[96rem] lg:grid-cols-[17rem_minmax(0,1fr)]">
        <DiscoverSidebar />
        <div className="min-w-0">
          <TopBar currentProfile={currentProfile} filters={filters} />
          <div className="grid gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,47rem)_18rem] lg:px-8 xl:grid-cols-[minmax(0,52rem)_20rem]">
            <section className="min-w-0">
              <Hero />
              <DiscoveryCard
                candidate={candidate}
                emptyDescription={
                  activeFilters
                    ? "Try clearing filters or broadening your search to see more Mohyla students."
                    : undefined
                }
                emptyTitle={
                  activeFilters ? "No profiles match these filters." : undefined
                }
                error={firstParam(params.error)}
                status={firstParam(params.status)}
              />
              <NextCandidateList candidates={filteredCandidates.slice(1, 7)} />
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
