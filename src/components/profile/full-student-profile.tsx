import Link from "next/link";
import type { ReactNode } from "react";

import { ContactReveal } from "@/components/matching/contact-reveal";
import { SaveProfileButton } from "@/components/matching/save-profile-button";
import { SocialLinksList } from "@/components/profile/profile-social-links";
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

type ProfileSection = Readonly<{
  children: ReactNode;
  description: string;
  icon: ReactNode;
  key: string;
  title: string;
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

function yearLabel(year: number | null) {
  if (!year) {
    return "Faculty";
  }

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
    <section className="rounded-lg border border-blue-100 bg-white p-5 sm:p-6">
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
  const isFaculty = profile.accountRole === "faculty";
  const saved = !isFaculty && status?.outgoingAction === "save";
  const profileKind = isFaculty ? "Faculty profile" : "Student profile";
  const primaryProgram =
    profile.academicPrograms.find((program) => program.isPrimary) ??
    profile.academicPrograms[0];
  const programLine = isFaculty
    ? (primaryProgram?.name ?? profile.academicProgramName)
    : `${profile.academicProgramName} • ${yearLabel(profile.yearOfStudy)}`;
  const facultyProgramLabels = profile.academicPrograms.map((program) => {
    const level = program.studyLevel === "master" ? "Master" : "Bachelor";
    const specialty = program.specialtyCode ? `${program.specialtyCode} · ` : "";

    return `${specialty}${program.name} (${level})`;
  });
  const facultyExpertiseLabels = profile.expertise.map(
    (expertise) => `${expertise.name} · ${expertise.category}`,
  );
  const profileSections: ProfileSection[] = [];

  if (isFaculty) {
    if (facultyProgramLabels.length > 0) {
      profileSections.push({
        children: (
          <ChipList
            emptyLabel="No academic programs are visible."
            items={facultyProgramLabels}
          />
        ),
        description: "Official NaUKMA programs connected to this faculty profile.",
        icon: <GraduationIcon />,
        key: "faculty-programs",
        title: "Academic programs",
      });
    }

    if (facultyExpertiseLabels.length > 0) {
      profileSections.push({
        children: (
          <ChipList
            emptyLabel="No expertise is visible."
            items={facultyExpertiseLabels}
          />
        ),
        description: "Areas where this faculty profile can advise or collaborate.",
        icon: <BarsIcon />,
        key: "faculty-expertise",
        title: "Expertise",
      });
    }

    if (profile.interests.length > 0) {
      profileSections.push({
        children: <ChipList emptyLabel="" items={profile.interests} />,
        description: "Research topics listed for this profile.",
        icon: <SparkIcon />,
        key: "faculty-interests",
        title: "Research interests",
      });
    }
  } else {
    if (profile.offeredSkills.length > 0) {
      profileSections.push({
        children: <ChipList emptyLabel="" items={profile.offeredSkills} />,
        description: "Tools and expertise they can offer.",
        icon: <BarsIcon />,
        key: "skills",
        title: "Skills",
      });
    }

    if (profile.interests.length > 0) {
      profileSections.push({
        children: <ChipList emptyLabel="" items={profile.interests} />,
        description: "Topics they're passionate about.",
        icon: <GraduationIcon />,
        key: "interests",
        title: "Academic interests",
      });
    }

    if (profile.wantedSkills.length > 0) {
      profileSections.push({
        children: <ChipList emptyLabel="" items={profile.wantedSkills} />,
        description: "Skills they hope to find on Mohyla Match.",
        icon: <TargetIcon />,
        key: "wanted-skills",
        title: "Looking-for skills",
      });
    }

    if (profile.collaborationGoals.length > 0) {
      profileSections.push({
        children: <ChipList emptyLabel="" items={profile.collaborationGoals} />,
        description: "What they want to achieve.",
        icon: <SparkIcon />,
        key: "goals",
        title: "Collaboration goals",
      });
    }
  }

  if (profile.availability) {
    profileSections.push({
      children: <ChipList emptyLabel="" items={[profile.availability]} />,
      description: "When they're usually available.",
      icon: <CalendarIcon />,
      key: "availability",
      title: "Availability",
    });
  }

  if (profile.socialLinks.length > 0) {
    profileSections.push({
      children: <SocialLinksList links={profile.socialLinks} />,
      description: "Find this profile elsewhere online.",
      icon: <LinkIcon />,
      key: "social-links",
      title: "Find me online",
    });
  }

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
          {profileKind}
        </p>
        <h1 className="mt-3 font-serif text-6xl font-bold leading-none text-blue-950 sm:text-7xl">
          Full profile
        </h1>
        <p className="mt-3 text-xl leading-8 text-blue-900/80 sm:text-2xl">
          {isFaculty
            ? `Explore ${firstName(profile.fullName)}'s academic programs and expertise.`
            : `Learn more about ${firstName(profile.fullName)} and see if you might work well together.`}
        </p>
      </header>

      <article className="relative rounded-lg border border-blue-100 bg-white p-5 sm:p-6">
        {!isFaculty ? (
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
        ) : null}

        <div className="grid gap-6 pr-0 md:grid-cols-[14rem_minmax(0,1fr)] md:pr-24 xl:grid-cols-[15rem_minmax(0,1fr)]">
          <SystemAvatar
            availability={profile.availability}
            facultyName={profile.facultyName}
            fullName={profile.fullName}
            programName={profile.academicProgramName}
            size="discover"
            systemAvatarKey={profile.systemAvatarKey}
          />

          <div className="min-w-0">
            <h2 className="font-serif text-5xl font-semibold leading-none text-blue-950">
              {profile.fullName}
            </h2>
            <p className="mt-3 text-base font-semibold text-blue-800">
              {programLine}
              {isFaculty ? (
                <>
                  {" "}
                  <span aria-hidden="true">•</span>{" "}
                  {profile.facultyVerificationStatus === "verified"
                    ? "Verified faculty"
                    : "Unverified faculty"}
                </>
              ) : null}
            </p>
            <p className="mt-1 text-sm font-semibold text-blue-700/75">
              {profile.facultyName}
            </p>
            {profile.bio ? (
              <p className="mt-5 max-w-3xl text-base leading-7 text-blue-900/80">
                {profile.bio}
              </p>
            ) : null}
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
          {!isFaculty && status?.canDirectContact ? (
            <ContactReveal
              buttonClassName="inline-flex h-12 w-full items-center justify-center gap-3 rounded-md bg-blue-800 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-70"
              showIcon
              targetUserId={profile.userId}
            />
          ) : !isFaculty ? (
            <p className="inline-flex min-h-12 items-center justify-center rounded-md border border-blue-100 bg-blue-50 px-5 text-center text-sm font-semibold text-blue-700">
              Email contact is off for this profile.
            </p>
          ) : null}
          <div className="sm:justify-self-end">
            <ProfileSafetyMenu returnTo={returnTo} targetUserId={profile.userId} />
          </div>
        </div>
      </article>

      {profileSections.length > 0 ? (
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          {profileSections.map((section) => (
            <ProfileInfoCard
              description={section.description}
              icon={section.icon}
              key={section.key}
              title={section.title}
            >
              {section.children}
            </ProfileInfoCard>
          ))}
        </div>
      ) : null}
    </section>
  );
}
