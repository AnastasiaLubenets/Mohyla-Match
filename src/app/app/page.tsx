import Link from "next/link";

import { requireAccountState } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "App",
};

export default async function AppPage() {
  await requireAccountState("/app", ["active"]);

  return (
    <main className="min-h-screen px-5 py-8 sm:px-8">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl flex-col justify-between gap-12">
        <nav className="flex items-center justify-between gap-4">
          <span className="text-sm font-semibold uppercase tracking-[0.08em] text-primary">
            Mohyla Match
          </span>
          <form action="/auth/logout" method="post">
            <button
              className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold text-foreground transition hover:border-primary"
              type="submit"
            >
              Logout
            </button>
          </form>
        </nav>

        <div className="max-w-3xl">
          <p className="mb-5 inline-flex rounded-full border border-border bg-surface px-3 py-1 text-sm font-medium text-muted">
            Onboarding complete
          </p>
          <h1 className="text-5xl font-semibold leading-[1.05] sm:text-6xl">
            You are ready for Mohyla Match.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">
            Your profile is ready. Discover begins in a later phase.
          </p>
          <Link
            className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary-strong"
            href="/profile"
          >
            View my profile
          </Link>
        </div>
      </section>
    </main>
  );
}
