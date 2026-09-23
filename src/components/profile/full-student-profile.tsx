import Link from "next/link";
import type { ReactNode } from "react";

import { ContactReveal } from "@/components/matching/contact-reveal";
import { SaveProfileButton } from "@/components/matching/save-profile-button";
import { ProfileSafetyMenu } from "@/components/profile/profile-safety-menu";
import { SystemAvatar } from "@/components/profile/system-avatar";
import type { ProfileConnectionStatus } from "@/lib/matching/data";
import type { SafeProfile } from "@/lib/profile/data";

type FullStudentProfileProps = Readonly<{
  backHref: string;
  backLabel: string;
  profile: SafeProfile;
  returnTo: string;
  status: ProfileConnectionStatus | null;
}>;

function BarsIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M5 19V9" />
      <path d="M12 19V5" />
      <path d="M19 19v-7" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect height="18" rx="2" width="18" x="3" y="4" />
      <path d="M3 10h18" />
    </svg>
  );
}

function GraduationIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M22 10 12 5 2 10l10 5 10-5Z" />
      <path d="M6 12v5c3 2 9 2 12 0v-5" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="m12 3 2.3 5.7L20 11l-5.7 2.3L12 19l-2.3-5.7L4 11l5.7-2.3L12 3Z" />
    </svg>
  );
}

function TargetIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v4" />
      <path d="M12 18v4" />
      <path d="M2 12h4" />
      <path d="M18 12h4" />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M19 12H5" />
      <path d="m11 18-6-6 6-6" />
    </svg>
  );
}

function yearLabel(year: number) {
  return `${year}${year === 1 ? "st" : year === 2 ? "nd" : year === 3 ? "rd" : "th"} year`;
}

function firstName(fullName: string) {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}

function ChipList({
  emptyLabel,
  items,
}: Readonly<{
  emptyLabel: string;
  items: readonly string[];
}>) {
  if (items.length === 0) {
    return <p className="text-sm font-medium text-blue-700/70">{emptyLabel}</p>;
  }

  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((item) => (
        <li
          className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-800 ring-1 ring-blue-100"
          key={item}
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

function ProfileInfoCard({
  children,
  description,
  icon,
  title,
}: Readonly<{
  children: ReactNode;
  description: string;
  icon: ReactNode;
  title: string;
}>) {
  return (
    <section className="rounded-lg border border-blue-100 bg-white p-5 shadow-[0_18px_55px_rgba(15,94,156,0.08)] sm:p-6">
      <div className="flex gap-3">
        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center text-blue-800">
          {icon}
        </span>
        <div className="min-w-0">
          <h2 className="font-serif text-2xl font-semibold leading-none text-blue-950">
            {title}
          </h2>
          <p className="mt-2 text-sm font-medium text-blue-700/75">
            {description}
          </p>
          <div className="mt-4">{children}</div>
        </div>
      </div>
    </section>
  );
}

export function FullStudentProfile({
  backHref,
  backLabel,
  profile,
  returnTo,
  status,
}: FullStudentProfileProps) {
  const saved = status?.outgoingAction === "save";

  return (
    <section className="min-w-0">
      <Link
        className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-blue-800 transition hover:text-blue-950"
        href={backHref}
      >
        <ArrowLeftIcon />
        {backLabel}
      </Link>

      <header className="mb-5">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
          Student profile
        </p>
        <h1 className="mt-3 font-serif text-6xl font-bold leading-none text-blue-950 sm:text-7xl">
          Full profile
        </h1>
        <p className="mt-3 text-xl leading-8 text-blue-900/80 sm:text-2xl">
          Learn more about {firstName(profile.fullName)} and see if you might
          work well together.
        </p>
      </header>

      <article className="relative rounded-lg border border-blue-100 bg-white p-5 shadow-[0_18px_55px_rgba(15,94,156,0.10)] sm:p-6">
        <div className="absolute right-5 top-5 z-10 sm:right-6 sm:top-6">
          <SaveProfileButton
            className={
              saved
                ? "inline-flex h-10 items-center justify-center gap-2 rounded-md bg-blue-800 px-3 text-sm font-bold text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-70"
                : "inline-flex h-10 items-center justify-center gap-2 rounded-md border border-blue-200 bg-white px-3 text-sm font-bold text-blue-800 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-70"
            }
            label={saved ? "Saved" : "Save"}
            pendingLabel={saved ? "Removing..." : "Saving..."}
            returnTo={returnTo}
            saved={saved}
            targetUserId={profile.userId}
          />
        </div>

        <div className="grid gap-6 pr-0 md:grid-cols-[14rem_minmax(0,1fr)] md:pr-24 xl:grid-cols-[15rem_minmax(0,1fr)]">
          <div className="overflow-hidden rounded-lg border border-blue-100 bg-blue-50">
            <SystemAvatar
              availability={profile.availability}
              facultyName={profile.facultyName}
              fullName={profile.fullName}
              programName={profile.academicProgramName}
              size="discover"
              systemAvatarKey={profile.systemAvatarKey}
            />
          </div>

          <div className="min-w-0">
            <h2 className="font-serif text-5xl font-semibold leading-none text-blue-950">
              {profile.fullName}
            </h2>
            <p className="mt-3 text-base font-semibold text-blue-800">
              {profile.academicProgramName} <span aria-hidden="true">•</span>{" "}
              {yearLabel(profile.yearOfStudy)}
            </p>
            <p className="mt-1 text-sm font-semibold text-blue-700/75">
              {profile.facultyName}
            </p>
            <p className="mt-5 max-w-3xl text-base leading-7 text-blue-900/80">
              {profile.bio || "No bio yet."}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 border-t border-blue-100 pt-5 sm:grid-cols-[1fr_1fr_auto] sm:items-start">
          <Link
            className="inline-flex h-12 items-center justify-center gap-3 rounded-md border border-blue-200 bg-white px-5 text-sm font-bold text-blue-900 transition hover:border-blue-300 hover:bg-blue-50"
            href={backHref}
          >
            <ArrowLeftIcon />
            {backLabel}
          </Link>
          {status?.canDirectContact ? (
            <ContactReveal
              buttonClassName="inline-flex h-12 w-full items-center justify-center gap-3 rounded-md bg-blue-800 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-70"
              showIcon
              targetUserId={profile.userId}
            />
          ) : (
            <p className="inline-flex min-h-12 items-center justify-center rounded-md border border-blue-100 bg-blue-50 px-5 text-center text-sm font-semibold text-blue-700">
              Email contact is off for this profile.
            </p>
          )}
          <div className="sm:justify-self-end">
            <ProfileSafetyMenu returnTo={returnTo} targetUserId={profile.userId} />
          </div>
        </div>
      </article>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <ProfileInfoCard
          description="Tools and expertise they can offer."
          icon={<BarsIcon />}
          title="Skills"
        >
          <ChipList
            emptyLabel="No offered skills are visible."
            items={profile.offeredSkills}
          />
        </ProfileInfoCard>

        <ProfileInfoCard
          description="Topics they're passionate about."
          icon={<GraduationIcon />}
          title="Academic interests"
        >
          <ChipList
            emptyLabel="No academic interests are visible."
            items={profile.interests}
          />
        </ProfileInfoCard>

        <ProfileInfoCard
          description="Skills they hope to find on Mohyla Match."
          icon={<TargetIcon />}
          title="Looking-for skills"
        >
          <ChipList
            emptyLabel="No looking-for skills are visible."
            items={profile.wantedSkills}
          />
        </ProfileInfoCard>

        <ProfileInfoCard
          description="What they want to achieve."
          icon={<SparkIcon />}
          title="Collaboration goals"
        >
          <ChipList
            emptyLabel="No collaboration goals are visible."
            items={profile.collaborationGoals}
          />
        </ProfileInfoCard>

        <ProfileInfoCard
          description="When they're usually available."
          icon={<CalendarIcon />}
          title="Availability"
        >
          <ChipList
            emptyLabel="No availability is listed."
            items={profile.availability ? [profile.availability] : []}
          />
        </ProfileInfoCard>
      </div>
    </section>
  );
}
