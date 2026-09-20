import Link from "next/link";
import { notFound } from "next/navigation";

import { ProfileEditForm } from "@/components/profile/profile-edit-form";
import { requireAccountState } from "@/lib/auth/guards";
import { loadProfileEditData } from "@/lib/profile/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Edit Profile",
};

type PageProps = Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function EditProfilePage({ searchParams }: PageProps) {
  const accountState = await requireAccountState("/profile/edit", ["active"]);
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  const profileData = await loadProfileEditData(
    supabase,
    accountState.userId ?? "",
  );

  if (profileData.error) {
    return (
      <main className="min-h-screen px-5 py-6 sm:px-8 sm:py-8">
        <section className="mx-auto w-full max-w-3xl rounded-lg border border-border bg-surface p-6 shadow-sm">
          <Link href="/profile" className="text-sm font-semibold text-primary">
            Mohyla Match
          </Link>
          <h1 className="mt-8 text-3xl font-semibold">Editor unavailable</h1>
          <p className="mt-3 leading-7 text-muted">
            We could not load profile editing data. Try again in a moment.
          </p>
        </section>
      </main>
    );
  }

  if (!profileData.data) {
    notFound();
  }

  const error = firstParam(params.error);

  return (
    <main className="min-h-screen px-5 py-6 sm:px-8 sm:py-8">
      <section className="mx-auto w-full max-w-5xl">
        <nav className="mb-6 flex items-center justify-between gap-4">
          <Link href="/profile" className="text-sm font-semibold text-primary">
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

        <div className="rounded-lg border border-border bg-surface p-5 shadow-sm sm:p-8">
          {error ? (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-900">
              {error}
            </div>
          ) : null}
          <ProfileEditForm data={profileData.data} />
        </div>
      </section>
    </main>
  );
}
