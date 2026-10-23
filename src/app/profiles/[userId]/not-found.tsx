import Link from "next/link";

export default function ProfileNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10">
      <section className="w-full max-w-lg rounded-lg border border-border bg-surface p-6 shadow-sm">
        <Link href="/app" className="text-sm font-semibold text-primary">
          Mohyla Match
        </Link>
        <h1 className="mm-empty-title mt-8 font-semibold">Profile not found</h1>
        <p className="mm-body-text mt-3 text-muted">
          This profile is unavailable or cannot be viewed.
        </p>
      </section>
    </main>
  );
}
