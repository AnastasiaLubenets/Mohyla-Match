import Link from "next/link";

import { MatchingNav } from "@/components/matching/matching-nav";
import { SavedProfileCard } from "@/components/matching/saved-profile-card";
import { requireAccountState } from "@/lib/auth/guards";
import { loadSavedProfiles } from "@/lib/matching/data";
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

function SavedStatusMessage({
  error,
  status,
}: Readonly<{ error?: string; status?: string }>) {
  const statusMessages: Record<string, string> = {
    connected: "Connect sent. We will create a match if they connect too.",
    matched: "It is a mutual match.",
    saved: "Saved for later.",
    unsaved: "Removed from Saved.",
  };
  const errorMessages: Record<string, string> = {
    "action-failed": "We could not save that action. Try again.",
    "save-failed": "We could not update Saved. Try again.",
  };

  if (error && errorMessages[error]) {
    return (
      <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-900">
        {errorMessages[error]}
      </div>
    );
  }

  if (status && statusMessages[status]) {
    return (
      <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-950">
        {statusMessages[status]}
      </div>
    );
  }

  return null;
}

export default async function SavedPage({ searchParams }: PageProps) {
  await requireAccountState("/saved", ["active"]);
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  const savedResult = await loadSavedProfiles(supabase, 50);

  if (savedResult.error) {
    return (
      <main className="min-h-screen px-5 py-6 sm:px-8 sm:py-8">
        <section className="mx-auto w-full max-w-5xl">
          <MatchingNav />
          <div className="rounded-lg border border-border bg-surface p-6 shadow-sm">
            <h1 className="text-3xl font-semibold">Saved profiles unavailable</h1>
            <p className="mt-3 leading-7 text-muted">
              We could not load your saved profiles. Try again in a moment.
            </p>
          </div>
        </section>
      </main>
    );
  }

  const savedProfiles = savedResult.data ?? [];

  return (
    <main className="min-h-screen px-5 py-6 sm:px-8 sm:py-8">
      <section className="mx-auto w-full max-w-5xl">
        <MatchingNav />
        <SavedStatusMessage
          error={firstParam(params.error)}
          status={firstParam(params.status)}
        />
        <header className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.08em] text-primary">
            Private list
          </p>
          <h1 className="mt-3 text-4xl font-semibold">Saved</h1>
        </header>

        {savedProfiles.length > 0 ? (
          <div className="space-y-5">
            {savedProfiles.map((profile) => (
              <SavedProfileCard key={profile.userId} profile={profile} />
            ))}
          </div>
        ) : (
          <section className="rounded-lg border border-border bg-surface p-6 shadow-sm">
            <h2 className="text-2xl font-semibold">No saved profiles yet</h2>
            <p className="mt-3 max-w-2xl leading-7 text-muted">
              Save people you&apos;d like to come back to or collaborate with
              later.
            </p>
            <Link
              className="mt-6 inline-flex h-12 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary-strong"
              href="/app"
            >
              Discover students
            </Link>
          </section>
        )}
      </section>
    </main>
  );
}
