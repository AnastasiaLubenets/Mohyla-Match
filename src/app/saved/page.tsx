import Link from "next/link";

import { AppChrome, BrandQuoteCard } from "@/components/matching/app-chrome";
import { SavedProfileCard } from "@/components/matching/saved-profile-card";
import { requireAccountState } from "@/lib/auth/guards";
import { loadSavedProfiles } from "@/lib/matching/data";
import { loadSafeProfile } from "@/lib/profile/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Saved Profiles",
};

type PageProps = Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function BookmarkIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-7 w-7"
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

function SavedStatusMessage({
  error,
  status,
}: Readonly<{ error?: string; status?: string }>) {
  const statusMessages: Record<string, string> = {
    saved: "Saved for later.",
    unsaved: "Removed from Saved.",
  };
  const errorMessages: Record<string, string> = {
    "action-failed": "We could not save that action. Try again.",
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

function SavedSummaryCard({ count }: Readonly<{ count: number }>) {
  return (
    <section className="rounded-lg border border-blue-100 bg-white p-5 shadow-[0_18px_55px_rgba(15,94,156,0.08)]">
      <div className="inline-flex h-14 w-14 items-center justify-center rounded-lg bg-blue-100 text-blue-800">
        <BookmarkIcon />
      </div>
      <h2 className="mt-5 font-serif text-2xl font-semibold text-blue-950">
        Your saved profiles
      </h2>
      <p className="mt-4 font-serif text-5xl font-semibold leading-none text-blue-950">
        {count}
      </p>
      <p className="mt-3 max-w-64 text-base leading-6 text-blue-800/75">
        People you may want to contact later.
      </p>
      <div className="mt-6 h-px bg-blue-100" />
    </section>
  );
}

function EmptySavedState() {
  return (
    <section className="rounded-lg border border-blue-100 bg-white p-8 shadow-[0_18px_55px_rgba(15,94,156,0.08)]">
      <h2 className="font-serif text-4xl font-semibold text-blue-950">
        No saved profiles yet
      </h2>
      <p className="mt-4 max-w-2xl leading-7 text-blue-900/75">
        Save people you would like to come back to or collaborate with later.
      </p>
      <Link
        className="mt-6 inline-flex h-12 items-center justify-center rounded-md bg-blue-800 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-900"
        href="/app"
      >
        Discover students
      </Link>
    </section>
  );
}

export default async function SavedPage({ searchParams }: PageProps) {
  const accountState = await requireAccountState("/saved", ["active"]);
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  const [savedResult, currentProfileResult] = await Promise.all([
    loadSavedProfiles(supabase, 50),
    accountState.userId
      ? loadSafeProfile(supabase, accountState.userId)
      : Promise.resolve({ data: null, error: false }),
  ]);
  const currentProfile = currentProfileResult.error
    ? null
    : currentProfileResult.data;

  if (savedResult.error) {
    return (
      <AppChrome active="saved" currentProfile={currentProfile}>
        <section className="scrollbar-hidden px-4 py-8 sm:px-6 xl:h-full xl:overflow-y-auto xl:px-8">
          <div className="mx-auto max-w-4xl rounded-lg border border-blue-100 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-blue-700">
              Saved
            </p>
            <h1 className="mt-4 font-serif text-4xl font-semibold text-blue-950">
              Saved profiles unavailable
            </h1>
            <p className="mt-3 leading-7 text-slate-600">
              We could not load your saved profiles. Try again in a moment.
            </p>
          </div>
        </section>
      </AppChrome>
    );
  }

  const savedProfiles = savedResult.data ?? [];

  return (
    <AppChrome active="saved" currentProfile={currentProfile}>
      <div className="grid gap-6 px-4 py-6 sm:px-6 xl:h-full xl:min-h-0 xl:grid-cols-[minmax(0,1fr)_20rem] xl:overflow-hidden xl:px-8 2xl:gap-8">
        <section className="scrollbar-hidden min-w-0 xl:min-h-0 xl:overflow-y-auto xl:pr-2">
          <SavedStatusMessage
            error={firstParam(params.error)}
            status={firstParam(params.status)}
          />
          <header className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="font-serif text-6xl font-bold leading-none text-blue-950 sm:text-7xl">
                Saved profiles
              </h1>
              <p className="mt-3 text-2xl leading-8 text-blue-900">
                People you may want to contact later.
              </p>
            </div>
            <p className="text-sm font-semibold text-blue-600">
              {savedProfiles.length} saved{" "}
              {savedProfiles.length === 1 ? "profile" : "profiles"}
            </p>
          </header>

          {savedProfiles.length > 0 ? (
            <div className="space-y-5">
              {savedProfiles.map((profile) => (
                <SavedProfileCard key={profile.userId} profile={profile} />
              ))}
            </div>
          ) : (
            <EmptySavedState />
          )}
        </section>

        <aside className="space-y-4 xl:h-full xl:min-h-0 xl:overflow-hidden">
          <SavedSummaryCard count={savedProfiles.length} />
          <BrandQuoteCard
            lines={["People", "Ideas", "Community", "Impact"]}
            text="Great ideas often start with a conversation."
          />
        </aside>
      </div>
    </AppChrome>
  );
}