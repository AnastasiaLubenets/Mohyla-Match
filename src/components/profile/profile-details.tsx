import Link from "next/link";
import type { ReactNode } from "react";

import { SystemAvatar } from "@/components/profile/system-avatar";
import type { SafeProfile } from "@/lib/profile/data";

function ValueRow({
  label,
  value,
}: Readonly<{
  label: string;
  value: string | number | null;
}>) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
        {label}
      </dt>
      <dd className="mt-1 text-base font-medium">{value || "Not specified"}</dd>
    </div>
  );
}

function ChipList({
  emptyLabel,
  items,
}: Readonly<{
  emptyLabel: string;
  items: string[];
}>) {
  if (items.length === 0) {
    return <p className="text-sm text-muted">{emptyLabel}</p>;
  }

  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((item) => (
        <li
          className="rounded-full border border-border bg-surface px-3 py-1 text-sm font-semibold"
          key={item}
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

function ProfileSection({
  children,
  title,
}: Readonly<{
  children: ReactNode;
  title: string;
}>) {
  return (
    <section className="border-t border-border pt-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function ProfileDetails({
  canEdit = false,
  profile,
}: Readonly<{
  canEdit?: boolean;
  profile: SafeProfile;
}>) {
  return (
    <article className="rounded-lg border border-border bg-surface p-5 shadow-sm sm:p-8">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <SystemAvatar
            availability={profile.availability}
            facultyName={profile.facultyName}
            fullName={profile.fullName}
            programName={profile.academicProgramName}
            size="lg"
            systemAvatarKey={profile.systemAvatarKey}
          />
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.08em] text-primary">
              Student profile
            </p>
            <h1 className="mt-2 text-4xl font-semibold leading-tight">
              {profile.fullName}
            </h1>
            <p className="mt-3 max-w-2xl leading-7 text-muted">
              {profile.bio || "No bio yet."}
            </p>
          </div>
        </div>

        {canEdit ? (
          <Link
            className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary-strong"
            href="/profile/edit"
          >
            Edit profile
          </Link>
        ) : null}
      </header>

      <dl className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <ValueRow label="Faculty" value={profile.facultyName} />
        <ValueRow label="Program" value={profile.academicProgramName} />
        <ValueRow label="Year" value={profile.yearOfStudy} />
        <ValueRow label="Availability" value={profile.availability} />
      </dl>

      <div className="mt-8 space-y-7">
        <ProfileSection title="Can offer">
          <ChipList
            emptyLabel="No offered skills are visible."
            items={profile.offeredSkills}
          />
        </ProfileSection>

        <ProfileSection title="Looking for">
          <ChipList
            emptyLabel="No wanted skills are visible."
            items={profile.wantedSkills}
          />
        </ProfileSection>

        <ProfileSection title="Interests">
          <ChipList
            emptyLabel="No interests are visible."
            items={profile.interests}
          />
        </ProfileSection>

        <ProfileSection title="Collaboration goals">
          <ChipList
            emptyLabel="No collaboration goals are visible."
            items={profile.collaborationGoals}
          />
        </ProfileSection>
      </div>
    </article>
  );
}
