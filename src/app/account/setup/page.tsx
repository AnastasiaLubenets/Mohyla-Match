import Link from "next/link";

import { requireAccountState } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Account setup",
};

export default async function AccountSetupPage() {
  await requireAccountState("/account/setup", ["onboarding_incomplete"]);

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10">
      <section className="w-full max-w-lg rounded-lg border border-border bg-surface p-6 shadow-sm">
        <Link href="/" className="text-sm font-semibold text-primary">
          Mohyla Match
        </Link>
        <h1 className="mt-8 text-3xl font-semibold">Account verified</h1>
        <p className="mt-3 leading-7 text-muted">
          Your email is confirmed. Profile onboarding starts in Phase 4.
        </p>
        <form action="/auth/logout" className="mt-8" method="post">
          <button
            className="h-12 w-full rounded-full border border-border bg-surface px-5 font-semibold text-foreground transition hover:border-primary"
            type="submit"
          >
            Logout
          </button>
        </form>
      </section>
    </main>
  );
}
