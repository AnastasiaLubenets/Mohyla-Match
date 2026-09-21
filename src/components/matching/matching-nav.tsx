import Link from "next/link";

export function MatchingNav() {
  return (
    <nav className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <Link href="/app" className="text-sm font-semibold text-primary">
        Mohyla Match
      </Link>
      <div className="flex flex-wrap items-center gap-2">
        <Link
          className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold text-foreground transition hover:border-primary"
          href="/app"
        >
          Discover
        </Link>
        <Link
          className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold text-foreground transition hover:border-primary"
          href="/matches"
        >
          Matches
        </Link>
        <Link
          className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold text-foreground transition hover:border-primary"
          href="/profile"
        >
          My profile
        </Link>
        <form action="/auth/logout" method="post">
          <button
            className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold text-foreground transition hover:border-primary"
            type="submit"
          >
            Logout
          </button>
        </form>
      </div>
    </nav>
  );
}
