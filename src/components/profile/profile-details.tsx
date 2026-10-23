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
          className="mm-chip rounded-full border border-border bg-surface font-semibold"
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
    <section className="border-t border-border pt-4">
      <h2 className="text-base font-semibold">{title}</h2>
      <div className="mt-3">{children}</div>
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
    <article className="mm-panel rounded-lg border border-border bg-surface shadow-sm">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <SystemAvatar
            availability={profile.availability}
            avatarMode={profile.avatarMode}
            avatarVariantKey={profile.academicProgramAvatarVariantKey}
            customAvatarKey={profile.customAvatarKey}
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
            <h1 className="mt-1.5 text-[1.75rem] font-semibold leading-tight">
              {profile.fullName}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              {profile.bio || "No bio yet."}
            </p>
          </div>
        </div>

        {canEdit ? (
          <Link
            className="mm-button inline-flex items-center justify-center rounded-full bg-primary px-5 font-semibold text-white transition hover:bg-primary-strong"
            href="/profile/edit"
          >
            Edit profile
          </Link>
        ) : null}
      </header>

      <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ValueRow label="Faculty" value={profile.facultyName} />
        <ValueRow label="Program" value={profile.academicProgramName} />
        <ValueRow label="Year" value={profile.yearOfStudy} />
        <ValueRow label="Availability" value={profile.availability} />
      </dl>

      <div className="mt-5 space-y-5">
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
