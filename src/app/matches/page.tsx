import Link from "next/link";

import { MatchCard } from "@/components/matching/match-card";
import { MatchingNav } from "@/components/matching/matching-nav";
import { requireAccountState } from "@/lib/auth/guards";
import { loadMyMatches } from "@/lib/matching/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Matches",
};

export default async function MatchesPage() {
  await requireAccountState("/matches", ["active"]);
  const supabase = await createSupabaseServerClient();
  const matchesResult = await loadMyMatches(supabase, 50);

  if (matchesResult.error) {
    return (
      <main className="min-h-screen px-4 py-5 sm:px-6 sm:py-6">
        <section className="mx-auto w-full max-w-5xl">
          <MatchingNav />
          <div className="mm-panel rounded-lg border border-border bg-surface shadow-sm">
            <h1 className="text-2xl font-semibold">Matches unavailable</h1>
            <p className="mt-3 leading-7 text-muted">
              We could not load your matches. Try again in a moment.
            </p>
          </div>
        </section>
      </main>
    );
  }

  const matches = matchesResult.data ?? [];

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 sm:py-6">
      <section className="mx-auto w-full max-w-5xl">
        <MatchingNav />
        <header className="mb-5">
          <p className="text-sm font-semibold uppercase tracking-[0.08em] text-primary">
            Mutual connections
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Matches</h1>
        </header>

        {matches.length > 0 ? (
          <div className="space-y-4">
            {matches.map((match) => (
              <MatchCard key={match.matchId} match={match} />
            ))}
          </div>
        ) : (
          <section className="mm-panel rounded-lg border border-border bg-surface shadow-sm">
            <h2 className="text-xl font-semibold">No mutual matches yet.</h2>
            <p className="mt-3 max-w-2xl leading-7 text-muted">
              Matches appear here after both students choose Connect.
            </p>
            <Link
              className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary-strong"
              href="/app"
            >
              Discover profiles
            </Link>
          </section>
        )}
      </section>
    </main>
  );
}
