import { notFound } from "next/navigation";

import { AppChrome, BrandQuoteCard } from "@/components/matching/app-chrome";
import { DeleteProfileDangerZone } from "@/components/profile/delete-profile-danger-zone";
import {
  MyAccountCard,
  MyProfileDashboard,
  ProfileCompletenessCard,
} from "@/components/profile/my-profile-dashboard";
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

function ProfileStatusMessage({
  error,
  status,
}: Readonly<{ error?: string; status?: string }>) {
  if (status === "updated") {
    return (
      <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-900 shadow-sm">
        Profile saved.
      </div>
    );
  }

  if (error === "delete-failed") {
    return (
      <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-900 shadow-sm">
        We could not delete your profile. Try again in a moment.
      </div>
    );
  }

  return null;
}

export default async function MyProfilePage({ searchParams }: PageProps) {
  const accountState = await requireAccountState("/profile", ["active"]);
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  const profileResult = await loadSafeProfile(supabase, accountState.userId ?? "");

  if (profileResult.error) {
    return (
      <AppChrome active="profile" currentProfile={null}>
        <section className="px-4 py-8 sm:px-6 xl:px-8">
          <div className="mx-auto max-w-4xl rounded-lg border border-blue-100 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-blue-700">
              My profile
            </p>
            <h1 className="mt-4 font-serif text-4xl font-semibold text-blue-950">
              Profile unavailable
            </h1>
            <p className="mt-3 leading-7 text-slate-600">
              We could not load your profile. Try again in a moment.
            </p>
          </div>
        </section>
      </AppChrome>
    );
  }

  if (!profileResult.data) {
    notFound();
  }

  const profile = profileResult.data;

  return (
    <AppChrome active="profile" currentProfile={profile}>
      <div className="grid gap-6 px-4 py-6 sm:px-6 xl:grid-cols-[minmax(0,1fr)_20rem] xl:px-8 2xl:gap-8">
        <section className="min-w-0">
          <header className="mb-5">
            <h1 className="font-serif text-6xl font-bold leading-none text-blue-950 sm:text-7xl">
              My profile
            </h1>
            <p className="mt-3 text-xl leading-8 text-blue-900/80 sm:text-2xl">
              Manage your information and show who you are to the Mohyla Match
              community.
            </p>
          </header>

          <ProfileStatusMessage
            error={firstParam(params.error)}
            status={firstParam(params.status)}
          />
          <MyProfileDashboard profile={profile} />
          <DeleteProfileDangerZone />
        </section>

        <aside className="space-y-4 xl:sticky xl:top-20 xl:self-start">
          <section className="hidden px-6 py-2 xl:block">
            <p className="font-serif text-2xl font-semibold italic leading-tight text-blue-950">
              &quot;Knowledge unites people who create a brighter tomorrow.&quot;
            </p>
            <div className="mt-5 h-px w-16 bg-blue-300" />
            <p className="mt-3 text-xs font-bold uppercase tracking-[0.22em] text-blue-500">
              NaUKMA
            </p>
          </section>
          <ProfileCompletenessCard profile={profile} />
          <MyAccountCard profile={profile} />
          <BrandQuoteCard
            lines={["People", "Ideas", "Community", "Change"]}
            text="Great connections lead to greater impact."
          />
        </aside>
      </div>
    </AppChrome>
  );
}
