"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";

import { SystemAvatar } from "@/components/profile/system-avatar";
import {
  TaxonomyMultiSelect,
  type TaxonomyPickerOption,
} from "@/components/profile/taxonomy-multi-select";
import type { EditProfileData, SafeProfile } from "@/lib/profile/data";

type CompletionItem = Readonly<{
  complete: boolean;
  label: string;
}>;

type EditableSection =
  | "availability"
  | "bio"
  | "collaborationGoals"
  | "interests"
  | "lookingForSkills"
  | "offeredSkills";

type EditableState = Readonly<{
  availability: string | null;
  bio: string | null;
  collaborationGoalIds: number[];
  interestIds: number[];
  offeredSkillIds: number[];
  wantedSkillIds: number[];
}>;

export type LoginEmailParts = Readonly<{
  domain: string | null;
  localPart: string;
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

function LoginEmailText({ email }: Readonly<{ email: LoginEmailParts | null }>) {
  if (!email) {
    return <>Unavailable for this session</>;
  }

  if (!email.domain) {
    return <>{email.localPart}</>;
  }

  return (
    <>
      <span>{email.localPart}</span>
      <span>@</span>
      <span>{email.domain}</span>
    </>
  );
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

function normalizeText(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function namedOptions(options: readonly { id: number; name: string }[]) {
  return options.map((option) => ({ id: option.id, name: option.name }));
}

function namesFromIds(
  options: readonly TaxonomyPickerOption[],
  ids: readonly number[],
): string[] {
  const selected = new Set(ids);
  return options
    .filter((option) => selected.has(option.id))
    .map((option) => option.name);
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
  activeSection,
  children,
  icon,
  onEdit,
  section,
  title,
}: Readonly<{
  activeSection: EditableSection | null;
  children: ReactNode;
  icon: ReactNode;
  onEdit: (section: EditableSection) => void;
  section: EditableSection;
  title: string;
}>) {
  const isEditing = activeSection === section;
  const otherSectionActive = Boolean(activeSection && activeSection !== section);

  return (
    <section className="rounded-[1.375rem] border border-blue-100 bg-white p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <h2 className="inline-flex items-center gap-3 font-serif text-2xl font-semibold text-blue-950">
          <span className="inline-flex h-7 w-7 items-center justify-center text-blue-800">
            {icon}
          </span>
          {title}
        </h2>
        <button
          className="text-sm font-bold text-blue-700 transition hover:text-blue-950 disabled:cursor-not-allowed disabled:text-blue-300"
          disabled={otherSectionActive}
          onClick={() => onEdit(section)}
          type="button"
        >
          {isEditing ? "Editing" : "Edit"}
        </button>
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

function InlineActionButtons({
  isSaving,
  onCancel,
  onSave,
}: Readonly<{
  isSaving: boolean;
  onCancel: () => void;
  onSave: () => void;
}>) {
  return (
    <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
      <button
        className="inline-flex h-10 items-center justify-center rounded-md border border-blue-200 px-5 text-sm font-bold text-blue-800 transition hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSaving}
        onClick={onCancel}
        type="button"
      >
        Cancel
      </button>
      <button
        className="inline-flex h-10 items-center justify-center rounded-md bg-blue-800 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSaving}
        onClick={onSave}
        type="button"
      >
        {isSaving ? "Saving..." : "Save"}
      </button>
    </div>
  );
}

export function ProfileCompletenessCard({
  profile,
}: Readonly<{ profile: SafeProfile }>) {
  const items = buildCompletionItems(profile);
  const completion = computeCompletion(items);

  return (
    <section className="rounded-[1.375rem] border border-blue-100 bg-white p-4 2xl:p-5">
      <h2 className="font-serif text-2xl font-semibold text-blue-950">
        Profile completeness
      </h2>
      <div className="mt-4 flex items-center gap-3 2xl:mt-5 2xl:gap-4">
        <div
          aria-label={`Profile completeness ${completion}%`}
          className="grid h-20 w-20 shrink-0 place-items-center rounded-full 2xl:h-24 2xl:w-24"
          style={{
            background: `conic-gradient(#1d66d2 ${completion}%, #dbeafe ${completion}% 100%)`,
          }}
        >
          <div className="grid h-14 w-14 place-items-center rounded-full bg-white text-lg font-bold text-blue-800 2xl:h-16 2xl:w-16 2xl:text-xl">
            {completion}%
          </div>
        </div>
        <div>
          <p className="text-base font-bold text-blue-950 2xl:text-lg">
            {completion === 100 ? "Ready to shine" : "Almost there"}
          </p>
          <p className="mt-1 text-sm leading-5 text-blue-700/80">
            Add a few more details to make your profile stand out.
          </p>
        </div>
      </div>
      <ul className="mt-4 space-y-2 2xl:mt-5 2xl:space-y-3">
        {items.map((item) => (
          <li
            className="flex items-center gap-3 text-sm font-semibold text-blue-800"
            key={item.label}
          >
            <span
              className={
                item.complete
                  ? "inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white 2xl:h-6 2xl:w-6"
                  : "inline-flex h-5 w-5 items-center justify-center rounded-full text-blue-300 ring-1 ring-blue-200 2xl:h-6 2xl:w-6"
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
  loginEmail,
  profile,
}: Readonly<{
  loginEmail: LoginEmailParts | null;
  profile: SafeProfile;
}>) {
  return (
    <section className="rounded-[1.375rem] border border-blue-100 bg-white p-4 2xl:p-5">
      <h2 className="font-serif text-2xl font-semibold text-blue-950">
        My account
      </h2>
      <ul className="mt-4 space-y-3 2xl:mt-5 2xl:space-y-4">
        <AccountFact icon={<GraduationIcon />}>
          <strong className="block text-blue-950">Student at NaUKMA</strong>
          {profile.academicProgramName}
        </AccountFact>
        <AccountFact icon={<EnvelopeIcon />}>
          <strong className="block text-blue-950">Login email</strong>
          <span className="break-all">
            <LoginEmailText email={loginEmail} />
          </span>
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
  editData,
  profile,
}: Readonly<{
  editData: EditProfileData;
  profile: SafeProfile;
}>) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const skillOptions = editData.skills;
  const interestOptions = namedOptions(editData.interests);
  const collaborationGoalOptions = namedOptions(editData.collaborationGoals);
  const [state, setState] = useState<EditableState>(() => ({
    availability: profile.availability,
    bio: profile.bio,
    collaborationGoalIds: editData.collaborationGoalIds,
    interestIds: editData.interestIds,
    offeredSkillIds: editData.offeredSkillIds,
    wantedSkillIds: editData.wantedSkillIds,
  }));
  const [editingSection, setEditingSection] = useState<EditableSection | null>(
    null,
  );
  const [draftText, setDraftText] = useState("");
  const [draftIds, setDraftIds] = useState<number[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const offeredSkillNames = namesFromIds(skillOptions, state.offeredSkillIds);
  const wantedSkillNames = namesFromIds(skillOptions, state.wantedSkillIds);
  const interestNames = namesFromIds(interestOptions, state.interestIds);
  const collaborationGoalNames = namesFromIds(
    collaborationGoalOptions,
    state.collaborationGoalIds,
  );
  const heroChips = [
    ...interestNames.slice(0, 3),
    ...collaborationGoalNames.slice(0, 2),
  ].slice(0, 4);

  function startEdit(section: EditableSection) {
    if (editingSection && editingSection !== section) {
      setError("Save or cancel the current edit before opening another section.");
      return;
    }

    setError(null);
    setEditingSection(section);

    if (section === "bio") {
      setDraftText(state.bio ?? "");
    } else if (section === "availability") {
      setDraftText(state.availability ?? "");
    } else if (section === "offeredSkills") {
      setDraftIds(state.offeredSkillIds);
    } else if (section === "interests") {
      setDraftIds(state.interestIds);
    } else if (section === "collaborationGoals") {
      setDraftIds(state.collaborationGoalIds);
    } else {
      setDraftIds(state.wantedSkillIds);
    }
  }

  function cancelEdit() {
    setEditingSection(null);
    setDraftText("");
    setDraftIds([]);
    setError(null);
  }

  async function saveSection() {
    if (!editingSection || isSaving) {
      return;
    }

    if (
      (editingSection === "offeredSkills" ||
        editingSection === "interests" ||
        editingSection === "collaborationGoals") &&
      draftIds.length < 1
    ) {
      setError("Choose at least one item before saving this section.");
      return;
    }

    setIsSaving(true);
    setError(null);

    const requestBody =
      editingSection === "bio"
        ? { bio: draftText, section: editingSection }
        : editingSection === "availability"
          ? { availability: draftText, section: editingSection }
          : { ids: draftIds, section: editingSection };

    const response = await fetch("/profile/section-update", {
      body: JSON.stringify(requestBody),
      headers: { "content-type": "application/json" },
      method: "POST",
    });
    const payload = (await response.json().catch(() => null)) as
      | { error?: string; ok?: boolean }
      | null;

    if (!response.ok || !payload?.ok) {
      setError(payload?.error ?? "We could not save this section. Try again.");
      setIsSaving(false);
      return;
    }

    setState((current) => {
      if (editingSection === "bio") {
        return { ...current, bio: normalizeText(draftText) };
      }

      if (editingSection === "availability") {
        return { ...current, availability: normalizeText(draftText) };
      }

      if (editingSection === "offeredSkills") {
        return { ...current, offeredSkillIds: draftIds };
      }

      if (editingSection === "interests") {
        return { ...current, interestIds: draftIds };
      }

      if (editingSection === "collaborationGoals") {
        return { ...current, collaborationGoalIds: draftIds };
      }

      return { ...current, wantedSkillIds: draftIds };
    });

    setEditingSection(null);
    setDraftText("");
    setDraftIds([]);
    setIsSaving(false);
    startTransition(() => router.refresh());
  }

  return (
    <div className="space-y-4">
      <section className="rounded-[1.375rem] border border-blue-100 bg-white p-5 sm:p-6">
        <div className="grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)_14rem] lg:items-start">
          <SystemAvatar
            availability={state.availability}
            facultyName={profile.facultyName}
            fullName={profile.fullName}
            programName={profile.academicProgramName}
            size="xl"
            systemAvatarKey={profile.systemAvatarKey}
          />

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
            {state.availability ? (
              <p className="mt-3 text-sm font-semibold text-blue-700">
                {state.availability}
              </p>
            ) : null}
            <p className="mt-5 max-w-2xl text-base leading-7 text-blue-900/80">
              {state.bio || "No bio yet."}
            </p>
            {heroChips.length > 0 ? (
              <div className="mt-5">
                <ChipList emptyLabel="" items={heroChips} />
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <Link
              className="inline-flex h-12 items-center justify-center gap-3 rounded-md border border-blue-200 bg-white px-5 text-sm font-bold text-blue-900 transition hover:border-blue-300 hover:bg-blue-50"
              href="/profile/edit"
            >
              <EditIcon />
              Edit full profile
              <span className="sr-only">Edit profile</span>
            </Link>
            <p className="text-center text-xs font-semibold text-blue-600/80">
              Open full edit page
            </p>
          </div>
        </div>
      </section>

      {error ? (
        <div
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-900"
          role="alert"
        >
          {error}
        </div>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-2">
        <DashboardCard
          activeSection={editingSection}
          icon={<UserIcon />}
          onEdit={startEdit}
          section="bio"
          title="About me"
        >
          {editingSection === "bio" ? (
            <div>
              <label className="sr-only" htmlFor="inline-bio">
                About me
              </label>
              <textarea
                className="min-h-28 w-full resize-y rounded-md border border-blue-200 bg-white px-4 py-3 text-sm font-medium leading-6 text-blue-950 outline-none transition focus:border-blue-400 disabled:cursor-not-allowed disabled:bg-blue-50"
                disabled={isSaving}
                id="inline-bio"
                maxLength={500}
                onChange={(event) => setDraftText(event.target.value)}
                value={draftText}
              />
              <p className="mt-1 text-right text-xs font-semibold text-blue-500">
                {draftText.length}/500
              </p>
              <InlineActionButtons
                isSaving={isSaving}
                onCancel={cancelEdit}
                onSave={saveSection}
              />
            </div>
          ) : (
            <p className="leading-7 text-blue-900/80">
              {state.bio ||
                "Add a bio so other students understand what you want to build."}
            </p>
          )}
        </DashboardCard>

        <DashboardCard
          activeSection={editingSection}
          icon={<BarsIcon />}
          onEdit={startEdit}
          section="offeredSkills"
          title="Skills"
        >
          {editingSection === "offeredSkills" ? (
            <div>
              <TaxonomyMultiSelect
                disabled={isSaving}
                emptyLabel="Choose at least one offered skill."
                label="Skills"
                onChange={setDraftIds}
                options={skillOptions}
                placeholder="Search skills..."
                required
                selectedIds={draftIds}
              />
              <InlineActionButtons
                isSaving={isSaving}
                onCancel={cancelEdit}
                onSave={saveSection}
              />
            </div>
          ) : (
            <ChipList
              emptyLabel="No offered skills are visible."
              items={offeredSkillNames}
            />
          )}
        </DashboardCard>

        <DashboardCard
          activeSection={editingSection}
          icon={<SparkIcon />}
          onEdit={startEdit}
          section="interests"
          title="Academic interests"
        >
          {editingSection === "interests" ? (
            <div>
              <TaxonomyMultiSelect
                disabled={isSaving}
                emptyLabel="No academic interests selected."
                label="Academic interests"
                onChange={setDraftIds}
                options={interestOptions}
                placeholder="Search academic interests..."
                selectedIds={draftIds}
              />
              <InlineActionButtons
                isSaving={isSaving}
                onCancel={cancelEdit}
                onSave={saveSection}
              />
            </div>
          ) : (
            <ChipList
              emptyLabel="No academic interests are visible."
              items={interestNames}
            />
          )}
        </DashboardCard>

        <DashboardCard
          activeSection={editingSection}
          icon={<TargetIcon />}
          onEdit={startEdit}
          section="collaborationGoals"
          title="Looking for"
        >
          {editingSection === "collaborationGoals" ? (
            <div>
              <TaxonomyMultiSelect
                disabled={isSaving}
                emptyLabel="No collaboration goals selected."
                label="Collaboration goals"
                onChange={setDraftIds}
                options={collaborationGoalOptions}
                placeholder="Search collaboration goals..."
                selectedIds={draftIds}
              />
              <InlineActionButtons
                isSaving={isSaving}
                onCancel={cancelEdit}
                onSave={saveSection}
              />
            </div>
          ) : (
            <ChipList
              emptyLabel="No collaboration goals are visible."
              items={collaborationGoalNames}
            />
          )}
        </DashboardCard>

        <DashboardCard
          activeSection={editingSection}
          icon={<CalendarIcon />}
          onEdit={startEdit}
          section="availability"
          title="Availability"
        >
          {editingSection === "availability" ? (
            <div>
              <label className="sr-only" htmlFor="inline-availability">
                Availability
              </label>
              <input
                className="h-11 w-full rounded-md border border-blue-200 bg-white px-4 text-sm font-medium text-blue-950 outline-none transition placeholder:text-blue-400 focus:border-blue-400 disabled:cursor-not-allowed disabled:bg-blue-50"
                disabled={isSaving}
                id="inline-availability"
                maxLength={160}
                onChange={(event) => setDraftText(event.target.value)}
                placeholder='e.g. hours per week, "evenings", or a short note'
                type="text"
                value={draftText}
              />
              <p className="mt-1 text-xs font-semibold text-blue-500">
                e.g. hours per week, &quot;evenings&quot;, or a short note
              </p>
              <InlineActionButtons
                isSaving={isSaving}
                onCancel={cancelEdit}
                onSave={saveSection}
              />
            </div>
          ) : (
            <ChipList
              emptyLabel="No availability is listed."
              items={state.availability ? [state.availability] : []}
            />
          )}
        </DashboardCard>

        <DashboardCard
          activeSection={editingSection}
          icon={<LinkIcon />}
          onEdit={startEdit}
          section="lookingForSkills"
          title="Looking-for skills"
        >
          {editingSection === "lookingForSkills" ? (
            <div>
              <TaxonomyMultiSelect
                disabled={isSaving}
                emptyLabel="No looking-for skills selected."
                label="Looking-for skills"
                onChange={setDraftIds}
                options={skillOptions}
                placeholder="Search skills you're looking for..."
                selectedIds={draftIds}
              />
              <InlineActionButtons
                isSaving={isSaving}
                onCancel={cancelEdit}
                onSave={saveSection}
              />
            </div>
          ) : (
            <ChipList
              emptyLabel="No looking-for skills are visible."
              items={wantedSkillNames}
            />
          )}
        </DashboardCard>
      </div>
    </div>
  );
}
