import { DiscoveryCard } from "@/components/matching/discovery-card";
import { MatchingNav } from "@/components/matching/matching-nav";
import { requireAccountState } from "@/lib/auth/guards";
import { loadDiscoveryCandidates } from "@/lib/matching/data";
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

export default async function AppPage({ searchParams }: PageProps) {
  await requireAccountState("/app", ["active"]);
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  const candidatesResult = await loadDiscoveryCandidates(supabase, 12);

  if (candidatesResult.error) {
    return (
      <main className="min-h-screen px-5 py-6 sm:px-8 sm:py-8">
        <section className="mx-auto w-full max-w-5xl">
          <MatchingNav />
          <div className="rounded-lg border border-border bg-surface p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.08em] text-primary">
              Discover
            </p>
            <h1 className="mt-4 text-3xl font-semibold">Discovery unavailable</h1>
            <p className="mt-3 leading-7 text-muted">
              We could not load matching candidates. Try again in a moment.
            </p>
          </div>
        </section>
      </main>
    );
  }

  const candidates = candidatesResult.data ?? [];
  const candidate = candidates[0] ?? null;

  return (
    <main className="min-h-screen px-5 py-6 sm:px-8 sm:py-8">
      <section className="mx-auto w-full max-w-5xl">
        <MatchingNav />
        <DiscoveryCard
          candidate={candidate}
          error={firstParam(params.error)}
          status={firstParam(params.status)}
        />

        {candidates.length > 1 ? (
          <section className="mt-6 rounded-lg border border-border bg-surface p-5 shadow-sm">
            <h2 className="text-sm font-semibold">Next in discovery</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {candidates.slice(1, 7).map((nextCandidate) => (
                <li
                  className="rounded-lg border border-border bg-background p-4"
                  key={nextCandidate.userId}
                >
                  <p className="text-base font-semibold">
                    {nextCandidate.fullName}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    {nextCandidate.compatibilityScore}% compatibility
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </section>
    </main>
  );
}
