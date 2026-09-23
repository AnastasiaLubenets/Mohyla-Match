import Link from "next/link";
import type { ReactNode } from "react";

import { SystemAvatar } from "@/components/profile/system-avatar";
import type { SafeProfile } from "@/lib/profile/data";

type CompletionItem = Readonly<{
  complete: boolean;
  label: string;
}>;

function UserIcon() {
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
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="8" r="4" />
    </svg>
  );
}

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

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2.5"
      viewBox="0 0 24 24"
    >
      <path d="m20 6-11 11-5-5" />
    </svg>
  );
}

function CircleIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="8" />
    </svg>
  );
}

function EditIcon() {
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
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
    </svg>
  );
}

function EnvelopeIcon() {
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
      <rect height="16" rx="2" width="20" x="2" y="4" />
      <path d="m22 7-10 6L2 7" />
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

function LinkIcon() {
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
      <path d="M10 13a5 5 0 0 0 7.1 0l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1" />
      <path d="M14 11a5 5 0 0 0-7.1 0l-2 2A5 5 0 0 0 12 20.1l1.1-1.1" />
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

function yearLabel(year: number) {
  return `${year}${year === 1 ? "st" : year === 2 ? "nd" : year === 3 ? "rd" : "th"} year`;
}

function formatMonthYear(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    year: "numeric",
  }).format(date);
}

function buildCompletionItems(profile: SafeProfile): CompletionItem[] {
  return [
    { complete: Boolean(profile.bio?.trim()), label: "Add bio" },
    { complete: profile.offeredSkills.length > 0, label: "Add skills" },
    { complete: profile.interests.length > 0, label: "Add academic interests" },
    {
      complete: profile.collaborationGoals.length > 0,
      label: "Add collaboration goals",
    },
    { complete: Boolean(profile.availability?.trim()), label: "Add availability" },
  ];
}

function computeCompletion(items: readonly CompletionItem[]) {
  const completeCount = items.filter((item) => item.complete).length;

  return Math.round((completeCount / items.length) * 100);
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
          className="rounded-full bg-blue-50 px-3.5 py-1.5 text-sm font-semibold text-blue-800 ring-1 ring-blue-100/80"
          key={item}
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

function DashboardCard({
  children,
  icon,
  title,
}: Readonly<{
  children: ReactNode;
  icon: ReactNode;
  title: string;
}>) {
  return (
    <section className="rounded-lg border border-blue-100 bg-white p-5 shadow-[0_18px_55px_rgba(15,94,156,0.08)] sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <h2 className="inline-flex items-center gap-3 font-serif text-2xl font-semibold text-blue-950">
          <span className="inline-flex h-7 w-7 items-center justify-center text-blue-800">
            {icon}
          </span>
          {title}
        </h2>
        <Link
          className="text-sm font-bold text-blue-700 transition hover:text-blue-950"
          href="/profile/edit"
        >
          Edit
        </Link>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function AccountFact({
  children,
  icon,
}: Readonly<{
  children: ReactNode;
  icon: ReactNode;
}>) {
  return (
    <li className="flex gap-3 text-sm leading-5 text-blue-800">
      <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center text-blue-800">
        {icon}
      </span>
      <span>{children}</span>
    </li>
  );
}

export function ProfileCompletenessCard({
  profile,
}: Readonly<{ profile: SafeProfile }>) {
  const items = buildCompletionItems(profile);
  const completion = computeCompletion(items);

  return (
    <section className="rounded-lg border border-blue-100 bg-white p-5 shadow-[0_18px_55px_rgba(15,94,156,0.08)]">
      <h2 className="font-serif text-2xl font-semibold text-blue-950">
        Profile completeness
      </h2>
      <div className="mt-5 flex items-center gap-4">
        <div
          aria-label={`Profile completeness ${completion}%`}
          className="grid h-24 w-24 shrink-0 place-items-center rounded-full"
          style={{
            background: `conic-gradient(#1d66d2 ${completion}%, #dbeafe ${completion}% 100%)`,
          }}
        >
          <div className="grid h-16 w-16 place-items-center rounded-full bg-white text-xl font-bold text-blue-800">
            {completion}%
          </div>
        </div>
        <div>
          <p className="text-lg font-bold text-blue-950">
            {completion === 100 ? "Ready to shine" : "Almost there"}
          </p>
          <p className="mt-1 text-sm leading-5 text-blue-700/80">
            Add a few more details to make your profile stand out.
          </p>
        </div>
      </div>
      <ul className="mt-5 space-y-3">
        {items.map((item) => (
          <li
            className="flex items-center gap-3 text-sm font-semibold text-blue-800"
            key={item.label}
          >
            <span
              className={
                item.complete
                  ? "inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white"
                  : "inline-flex h-6 w-6 items-center justify-center rounded-full text-blue-300 ring-1 ring-blue-200"
              }
            >
              {item.complete ? <CheckIcon /> : <CircleIcon />}
            </span>
            {item.label}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function MyAccountCard({
  profile,
}: Readonly<{
  profile: SafeProfile;
}>) {
  return (
    <section className="rounded-lg border border-blue-100 bg-white p-5 shadow-[0_18px_55px_rgba(15,94,156,0.08)]">
      <h2 className="font-serif text-2xl font-semibold text-blue-950">
        My account
      </h2>
      <ul className="mt-5 space-y-4">
        <AccountFact icon={<GraduationIcon />}>
          <strong className="block text-blue-950">Student at NaUKMA</strong>
          {profile.academicProgramName}
        </AccountFact>
        <AccountFact icon={<EnvelopeIcon />}>
          <strong className="block text-blue-950">Login email</strong>
          Kept private in Supabase Auth
        </AccountFact>
        <AccountFact icon={<LinkIcon />}>
          <strong className="block text-blue-950">Direct email contact</strong>
          {profile.allowDirectContact ? "Allowed" : "Turned off"}
        </AccountFact>
        <AccountFact icon={<CalendarIcon />}>
          <strong className="block text-blue-950">Member since</strong>
          {formatMonthYear(profile.createdAt)}
        </AccountFact>
      </ul>
    </section>
  );
}

export function MyProfileDashboard({
  profile,
}: Readonly<{
  profile: SafeProfile;
}>) {
  const heroChips = [
    ...profile.interests.slice(0, 3),
    ...profile.collaborationGoals.slice(0, 2),
  ].slice(0, 4);

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-blue-100 bg-white p-5 shadow-[0_18px_55px_rgba(15,94,156,0.09)] sm:p-6">
        <div className="grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)_12rem] lg:items-start">
          <div className="overflow-hidden rounded-lg border border-blue-100 bg-blue-50">
            <SystemAvatar
              availability={profile.availability}
              facultyName={profile.facultyName}
              fullName={profile.fullName}
              programName={profile.academicProgramName}
              size="xl"
              systemAvatarKey={profile.systemAvatarKey}
            />
          </div>

          <div className="min-w-0">
            <h2 className="font-serif text-5xl font-semibold leading-none text-blue-950">
              {profile.fullName}
            </h2>
            <p className="mt-3 text-base font-medium text-blue-800">
              {profile.academicProgramName} <span aria-hidden="true">•</span>{" "}
              {yearLabel(profile.yearOfStudy)}
            </p>
            <p className="mt-1 text-sm font-medium text-blue-700/80">
              {profile.facultyName}
            </p>
            {profile.availability ? (
              <p className="mt-3 text-sm font-semibold text-blue-700">
                {profile.availability}
              </p>
            ) : null}
            <p className="mt-5 max-w-2xl text-base leading-7 text-blue-900/80">
              {profile.bio || "No bio yet."}
            </p>
            {heroChips.length > 0 ? (
              <div className="mt-5">
                <ChipList emptyLabel="" items={heroChips} />
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-3">
            <Link
              className="inline-flex h-12 items-center justify-center gap-3 rounded-md border border-blue-200 bg-white px-5 text-sm font-bold text-blue-900 transition hover:border-blue-300 hover:bg-blue-50"
              href="/profile/edit"
            >
              <EditIcon />
              Edit profile
            </Link>
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <DashboardCard icon={<UserIcon />} title="About me">
          <p className="leading-7 text-blue-900/80">
            {profile.bio || "Add a bio so other students understand what you want to build."}
          </p>
        </DashboardCard>

        <DashboardCard icon={<BarsIcon />} title="Skills">
          <ChipList
            emptyLabel="No offered skills are visible."
            items={profile.offeredSkills}
          />
        </DashboardCard>

        <DashboardCard icon={<SparkIcon />} title="Academic interests">
          <ChipList
            emptyLabel="No academic interests are visible."
            items={profile.interests}
          />
        </DashboardCard>

        <DashboardCard icon={<TargetIcon />} title="Looking for">
          <ChipList
            emptyLabel="No collaboration goals are visible."
            items={profile.collaborationGoals}
          />
        </DashboardCard>

        <DashboardCard icon={<CalendarIcon />} title="Availability">
          <ChipList
            emptyLabel="No availability is listed."
            items={profile.availability ? [profile.availability] : []}
          />
        </DashboardCard>

        <DashboardCard icon={<LinkIcon />} title="Looking-for skills">
          <ChipList
            emptyLabel="No looking-for skills are visible."
            items={profile.wantedSkills}
          />
        </DashboardCard>
      </div>
    </div>
  );
}
