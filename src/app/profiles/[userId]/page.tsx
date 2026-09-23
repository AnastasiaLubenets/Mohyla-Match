import { notFound, redirect } from "next/navigation";

import { AppChrome, BrandQuoteCard } from "@/components/matching/app-chrome";
import { FullStudentProfile } from "@/components/profile/full-student-profile";
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
    passed: "Skipped.",
    reported: "Report submitted. Thank you for helping keep Mohyla Match safe.",
    saved: "Saved for later.",
    unsaved: "Removed from Saved.",
  };
  const errorMessages: Record<string, string> = {
    "action-failed": "We could not save that action. Try again.",
    "report-failed": "We could not submit that report. Try again.",
    "save-failed": "We could not update Saved. Try again.",
  };

  if (error && errorMessages[error]) {
    return (
      <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-900 shadow-sm">
        {errorMessages[error]}
      </div>
    );
  }

  if (status && statusMessages[status]) {
    return (
      <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-950 shadow-sm">
        {statusMessages[status]}
      </div>
    );
  }

  return null;
}

function profileSource(value?: string) {
  return value === "saved" ? "saved" : "discover";
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

  const source = profileSource(firstParam(pageParams.from));
  const backHref = source === "saved" ? "/saved" : "/app";
  const backLabel = source === "saved" ? "Back to saved" : "Back to discover";
  const returnTo = `/profiles/${userId}?from=${source}`;
  const supabase = await createSupabaseServerClient();
  const [profileResult, statusResult, currentProfileResult] = await Promise.all([
    loadSafeProfile(supabase, userId),
    loadProfileConnectionStatus(supabase, userId),
    accountState.userId
      ? loadSafeProfile(supabase, accountState.userId)
      : Promise.resolve({ data: null, error: false }),
  ]);

  if (profileResult.error || !profileResult.data) {
    notFound();
  }

  const currentProfile = currentProfileResult.error
    ? null
    : currentProfileResult.data;

  return (
    <AppChrome
      active={source === "saved" ? "saved" : "discover"}
      currentProfile={currentProfile}
    >
      <div className="grid gap-6 px-4 py-6 sm:px-6 xl:h-full xl:min-h-0 xl:grid-cols-[minmax(0,1fr)_20rem] xl:overflow-hidden xl:px-8 2xl:gap-8">
        <div className="scrollbar-hidden min-w-0 xl:min-h-0 xl:overflow-y-auto xl:pr-2">
          <ProfileStatusMessage
            error={firstParam(pageParams.error)}
            status={firstParam(pageParams.status)}
          />
          <FullStudentProfile
            backHref={backHref}
            backLabel={backLabel}
            profile={profileResult.data}
            returnTo={returnTo}
            status={statusResult.error ? null : statusResult.data}
          />
        </div>

        <aside className="space-y-4 xl:h-full xl:min-h-0 xl:overflow-hidden">
          <BrandQuoteCard
            lines={["People", "Ideas", "Collaboration", "Impact"]}
            text="Great ideas start with real conversations."
          />
        </aside>
      </div>
    </AppChrome>
  );
}