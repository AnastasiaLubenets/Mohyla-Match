import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen px-5 py-8 sm:px-8">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl flex-col justify-between gap-12">
        <nav className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="text-sm font-semibold uppercase tracking-[0.08em] text-primary"
          >
            Mohyla Match
          </Link>
          <div className="flex items-center gap-3 text-sm font-medium">
            <Link href="/login" className="text-muted hover:text-foreground">
              Login
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-primary px-4 py-2 text-white transition hover:bg-primary-strong"
            >
              Join
            </Link>
          </div>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div className="max-w-3xl">
            <p className="mb-5 inline-flex rounded-full border border-border bg-surface px-3 py-1 text-sm font-medium text-muted">
              Closed student collaboration network
            </p>
            <h1 className="max-w-4xl text-5xl font-semibold leading-[1.05] sm:text-6xl">
              Find your people. Build something together.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">
              Discover students across Mohyla based on skills, interests and
              what you want to build.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-6 text-base font-semibold text-white transition hover:bg-primary-strong"
              >
                Join Mohyla Match
              </Link>
              <Link
                href="/login"
                className="inline-flex h-12 items-center justify-center rounded-full border border-border bg-surface px-6 text-base font-semibold text-foreground transition hover:border-primary"
              >
                Login
              </Link>
            </div>
          </div>

          <aside className="rounded-lg border border-border bg-surface p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-muted">
                Discover preview
              </span>
              <span className="rounded-full bg-surface-strong px-3 py-1 text-sm font-semibold text-primary">
                82% match
              </span>
            </div>
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-semibold">Maria Koval</h2>
                <p className="text-sm text-muted">Computer Science, year 3</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {["React", "Figma", "Startups", "Education"].map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-border px-3 py-1 text-sm"
                  >
                    {item}
                  </span>
                ))}
              </div>
              <p className="text-sm leading-6 text-muted">
                Maria offers React and Figma experience for teams building
                student products.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
