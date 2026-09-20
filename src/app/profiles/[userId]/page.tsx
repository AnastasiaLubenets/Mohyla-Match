import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ProfileDetails } from "@/components/profile/profile-details";
import { requireAccountState } from "@/lib/auth/guards";
import { isUuid, loadSafeProfile } from "@/lib/profile/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Student Profile",
};

type PageProps = Readonly<{
  params: Promise<{ userId: string }>;
}>;

export default async function StudentProfilePage({ params }: PageProps) {
  const accountState = await requireAccountState("/app", ["active"]);
  const { userId } = await params;

  if (!isUuid(userId)) {
    notFound();
  }

  if (userId === accountState.userId) {
    redirect("/profile");
  }

  const supabase = await createSupabaseServerClient();
  const profileResult = await loadSafeProfile(supabase, userId);

  if (profileResult.error || !profileResult.data) {
    notFound();
  }

  return (
    <main className="min-h-screen px-5 py-6 sm:px-8 sm:py-8">
      <section className="mx-auto w-full max-w-5xl">
        <nav className="mb-6 flex items-center justify-between gap-4">
          <Link href="/app" className="text-sm font-semibold text-primary">
            Mohyla Match
          </Link>
          <Link
            className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold text-foreground transition hover:border-primary"
            href="/profile"
          >
            My profile
          </Link>
        </nav>

        <ProfileDetails profile={profileResult.data} />
      </section>
    </main>
  );
}
