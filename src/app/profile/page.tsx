import Link from "next/link";
import { notFound } from "next/navigation";

import { DeleteProfileDangerZone } from "@/components/profile/delete-profile-danger-zone";
import { ProfileDetails } from "@/components/profile/profile-details";
import { requireAccountState } from "@/lib/auth/guards";
import { loadSafeProfile } from "@/lib/profile/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "My Profile",
};

type PageProps = Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function MyProfilePage({ searchParams }: PageProps) {
  const accountState = await requireAccountState("/profile", ["active"]);
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  const profileResult = await loadSafeProfile(supabase, accountState.userId ?? "");

  if (profileResult.error) {
    return (
      <main className="min-h-screen px-5 py-6 sm:px-8 sm:py-8">
        <section className="mx-auto w-full max-w-3xl rounded-lg border border-border bg-surface p-6 shadow-sm">
          <Link href="/app" className="text-sm font-semibold text-primary">
            Mohyla Match
          </Link>
          <h1 className="mt-8 text-3xl font-semibold">Profile unavailable</h1>
          <p className="mt-3 leading-7 text-muted">
            We could not load your profile. Try again in a moment.
          </p>
        </section>
      </main>
    );
  }

  if (!profileResult.data) {
    notFound();
  }

  const status = firstParam(params.status);
  const error = firstParam(params.error);

  return (
    <main className="min-h-screen px-5 py-6 sm:px-8 sm:py-8">
      <section className="mx-auto w-full max-w-5xl">
        <nav className="mb-6 flex items-center justify-between gap-4">
          <Link href="/app" className="text-sm font-semibold text-primary">
            Mohyla Match
          </Link>
          <form action="/auth/logout" method="post">
            <button
              className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold text-foreground transition hover:border-primary"
              type="submit"
            >
              Logout
            </button>
          </form>
        </nav>

        {status === "updated" ? (
          <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-900">
            Profile saved.
          </div>
        ) : null}
        {error === "delete-failed" ? (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-900">
            We could not delete your profile. Try again in a moment.
          </div>
        ) : null}

        <ProfileDetails canEdit profile={profileResult.data} />
        <DeleteProfileDangerZone />
      </section>
    </main>
  );
}
