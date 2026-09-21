import { notFound, redirect } from "next/navigation";

import { MatchingNav } from "@/components/matching/matching-nav";
import { ProfileActionPanel } from "@/components/matching/profile-action-panel";
import { ProfileDetails } from "@/components/profile/profile-details";
import { requireAccountState } from "@/lib/auth/guards";
import { loadProfileConnectionStatus } from "@/lib/matching/data";
import { isUuid, loadSafeProfile } from "@/lib/profile/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Student Profile",
};

type PageProps = Readonly<{
  params: Promise<{ userId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function ProfileStatusMessage({
  error,
  status,
}: Readonly<{ error?: string; status?: string }>) {
  const statusMessages: Record<string, string> = {
    connected: "Connect sent. We will create a match if they connect too.",
    matched: "It is a mutual match. You can reveal contact details now.",
    passed: "Passed.",
    reported: "Report submitted. Thank you for helping keep Mohyla Match safe.",
  };
  const errorMessages: Record<string, string> = {
    "action-failed": "We could not save that action. Try again.",
    "report-failed": "We could not submit that report. Try again.",
  };

  if (error && errorMessages[error]) {
    return (
      <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-900">
        {errorMessages[error]}
      </div>
    );
  }

  if (status && statusMessages[status]) {
    return (
      <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-950">
        {statusMessages[status]}
      </div>
    );
  }

  return null;
}

export default async function StudentProfilePage({
  params,
  searchParams,
}: PageProps) {
  const accountState = await requireAccountState("/app", ["active"]);
  const { userId } = await params;
  const pageParams = await searchParams;

  if (!isUuid(userId)) {
    notFound();
  }

  if (userId === accountState.userId) {
    redirect("/profile");
  }

  const supabase = await createSupabaseServerClient();
  const [profileResult, statusResult] = await Promise.all([
    loadSafeProfile(supabase, userId),
    loadProfileConnectionStatus(supabase, userId),
  ]);

  if (profileResult.error || !profileResult.data) {
    notFound();
  }

  return (
    <main className="min-h-screen px-5 py-6 sm:px-8 sm:py-8">
      <section className="mx-auto w-full max-w-5xl">
        <MatchingNav />

        <ProfileStatusMessage
          error={firstParam(pageParams.error)}
          status={firstParam(pageParams.status)}
        />
        <ProfileDetails profile={profileResult.data} />
        <ProfileActionPanel
          fullName={profileResult.data.fullName}
          status={statusResult.data}
          targetUserId={profileResult.data.userId}
        />
      </section>
    </main>
  );
}
