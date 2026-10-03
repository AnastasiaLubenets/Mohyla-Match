"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent, type ReactNode } from "react";

import { AuthSubmitButton } from "@/components/auth-submit-button";
import { SocialPlatformIcon } from "@/components/profile/profile-social-links";
import { SystemAvatar } from "@/components/profile/system-avatar";
import {
  TaxonomyMultiSelect,
  type TaxonomyPickerOption,
} from "@/components/profile/taxonomy-multi-select";
import type { EditProfileData } from "@/lib/profile/data";
import {
  formatSocialUrl,
  getSocialPlatformLabel,
  normalizeProfileSocialLinks,
  socialPlatformOptions,
  type SocialPlatform,
} from "@/lib/profile/social-links";

type PickerCardProps = Readonly<{
  children: ReactNode;
  icon: ReactNode;
  title: string;
}>;

type DraftSocialLink = Readonly<{
  platform: SocialPlatform;
  url: string;
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

function yearLabel(year: number) {
  return `${year}${year === 1 ? "st" : year === 2 ? "nd" : year === 3 ? "rd" : "th"} year`;
}

function fieldClassName() {
  return "mt-2 h-11 w-full rounded-md border border-blue-200 bg-white px-4 text-sm font-medium text-blue-950 outline-none transition placeholder:text-blue-400 focus:border-blue-400";
}

function PickerCard({ children, icon, title }: PickerCardProps) {
  return (
    <section className="rounded-lg border border-blue-100 bg-white p-5">
      <h2 className="inline-flex items-center gap-3 font-serif text-2xl font-semibold text-blue-950">
        <span className="inline-flex h-7 w-7 items-center justify-center text-blue-800">
          {icon}
        </span>
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function namedOptions(options: EditProfileData["interests"]): TaxonomyPickerOption[] {
  return options.map((option) => ({
    id: option.id,
    name: option.name,
  }));
}

function programOptions(
  data: EditProfileData,
  excludedProgramId?: number,
  facultyId?: number,
): TaxonomyPickerOption[] {
  const facultyById = new Map(
    data.faculties.map((faculty) => [faculty.id, faculty.display_name]),
  );

  return data.programs
    .filter(
      (program) =>
        program.id !== excludedProgramId &&
        (facultyId === undefined || program.faculty_id === facultyId),
    )
    .map((program) => ({
      category: facultyById.get(program.faculty_id) ?? "NaUKMA",
      id: program.id,
      name: program.display_name,
      search_aliases: [
        program.slug,
        program.specialty_code ?? "",
        facultyById.get(program.faculty_id) ?? "",
      ].filter(Boolean),
    }));
}

function FacultyProfileEditForm({
  data,
  error,
}: Readonly<{
  data: EditProfileData;
  error?: string;
}>) {
  const initialProgram = data.programs.find(
    (program) => program.id === data.profile.academic_program_id,
  );
  const initialFacultyId = initialProgram?.faculty_id ?? data.profile.faculty_id;
  const initialAvailablePrograms = data.programs.filter(
    (program) => program.faculty_id === initialFacultyId,
  );
  const initialProgramId =
    initialProgram?.id ?? initialAvailablePrograms[0]?.id ?? 0;
  const [selectedFacultyId, setSelectedFacultyId] = useState(
    initialFacultyId,
  );
  const [selectedProgramId, setSelectedProgramId] = useState(initialProgramId);
  const [additionalProgramIds, setAdditionalProgramIds] = useState(
    data.additionalAcademicProgramIds.filter(
      (programId) =>
        programId !== initialProgramId &&
        data.programs.some(
          (program) =>
            program.id === programId && program.faculty_id === initialFacultyId,
        ),
    ),
  );
  const [expertiseIds, setExpertiseIds] = useState(data.facultyExpertiseIds);
  const [interestIds, setInterestIds] = useState(data.interestIds);
  const [bioValue, setBioValue] = useState(data.profile.bio ?? "");
  const [clientError, setClientError] = useState<string | null>(null);
  const selectedProgram = data.programs.find(
    (program) => program.id === selectedProgramId,
  );
  const selectedFaculty = data.faculties.find(
    (faculty) => faculty.id === selectedFacultyId,
  );
  const availablePrograms = useMemo(
    () =>
      data.programs.filter(
        (program) => program.faculty_id === selectedFacultyId,
      ),
    [data.programs, selectedFacultyId],
  );
  const additionalOptions = useMemo(
    () => programOptions(data, selectedProgramId, selectedFacultyId),
    [data, selectedFacultyId, selectedProgramId],
  );

  function handleFacultyChange(value: string) {
    const nextFacultyId = Number(value);
    const nextPrograms = data.programs.filter(
      (program) => program.faculty_id === nextFacultyId,
    );
    const nextProgramId = nextPrograms[0]?.id ?? 0;

    setSelectedFacultyId(nextFacultyId);
    setSelectedProgramId(nextProgramId);
    setAdditionalProgramIds((current) =>
      current.filter(
        (programId) =>
          programId !== nextProgramId &&
          data.programs.some(
            (program) =>
              program.id === programId && program.faculty_id === nextFacultyId,
          ),
      ),
    );
  }

  function handlePrimaryProgramChange(value: string) {
    const nextProgramId = Number(value);

    setSelectedProgramId(nextProgramId);
    setAdditionalProgramIds((current) =>
      current.filter((programId) => programId !== nextProgramId),
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (expertiseIds.length < 1) {
      event.preventDefault();
      setClientError("Choose at least one expertise area.");
      return;
    }

    setClientError(null);
  }

  return (
    <form
      action="/profile/update"
      className="space-y-5"
      id="profile-edit-form"
      method="post"
      onSubmit={handleSubmit}
    >
      <input name="profileRole" type="hidden" value="faculty" />
      <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-600">
            Faculty profile
          </p>
          <h1 className="mt-3 font-serif text-6xl font-bold leading-none text-blue-950 sm:text-7xl">
            Edit profile
          </h1>
          <p className="mt-3 text-xl leading-8 text-blue-900/80 sm:text-2xl">
            Update your programs, expertise and research interests.
          </p>
        </div>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
          <Link
            className="inline-flex h-12 items-center justify-center rounded-md border border-blue-300 bg-white px-8 text-sm font-bold text-blue-800 transition hover:border-blue-400 hover:bg-blue-50"
            href="/profile"
          >
            Cancel
          </Link>
          <AuthSubmitButton
            className="inline-flex h-12 items-center justify-center rounded-md bg-blue-800 px-8 text-sm font-bold text-white shadow-sm transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-70"
            pendingLabel="Saving..."
          >
            Save changes
          </AuthSubmitButton>
        </div>
      </header>

      {error || clientError ? (
        <div
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-900"
          role="alert"
        >
          {clientError ?? error}
        </div>
      ) : null}

      <section className="rounded-lg border border-blue-100 bg-white p-5 sm:p-6">
        <div className="grid gap-6 lg:grid-cols-[12rem_minmax(0,1fr)]">
          <SystemAvatar
            availability={data.profile.availability}
            avatarVariantKey={selectedProgram?.avatar_variant_key}
            fullName={data.profile.full_name}
            size="xl"
            systemAvatarKey={data.profile.system_avatar_key}
          />

          <div className="grid gap-4 lg:grid-cols-2">
            <label className="block">
              <span className="text-sm font-bold text-blue-900">
                Full name <span className="text-red-600">*</span>
              </span>
              <input
                className={fieldClassName()}
                defaultValue={data.profile.full_name}
                maxLength={120}
                minLength={2}
                name="fullName"
                required
                type="text"
              />
            </label>

            <div className="rounded-md border border-blue-100 bg-blue-50/60 px-4 py-3">
              <p className="text-sm font-bold text-blue-950">
                Verification status
              </p>
              <p className="mt-1 text-sm font-semibold text-blue-700">
                {data.profile.faculty_verification_status === "verified"
                  ? "Verified"
                  : "Unverified"}
              </p>
            </div>

            <label className="block">
              <span className="text-sm font-bold text-blue-900">
                Faculty <span className="text-red-600">*</span>
              </span>
              <select
                className={fieldClassName()}
                name="facultyId"
                onChange={(event) => handleFacultyChange(event.target.value)}
                required
                value={selectedFacultyId}
              >
                {data.faculties.map((faculty) => (
                  <option key={faculty.id} value={faculty.id}>
                    {faculty.display_name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-bold text-blue-900">
                Primary academic program <span className="text-red-600">*</span>
              </span>
              <select
                className={fieldClassName()}
                disabled={availablePrograms.length === 0}
                name="academicProgramId"
                onChange={(event) =>
                  handlePrimaryProgramChange(event.target.value)
                }
                required
                value={selectedProgramId}
              >
                {availablePrograms.map((program) => (
                  <option key={program.id} value={program.id}>
                    {program.display_name}
                  </option>
                ))}
              </select>
              <span className="mt-1 block text-xs font-semibold text-blue-500">
                {selectedFaculty?.display_name ?? "NaUKMA"}
              </span>
            </label>

            <label className="block">
              <span className="text-sm font-bold text-blue-900">
                Availability
              </span>
              <input
                className={fieldClassName()}
                defaultValue={data.profile.availability ?? ""}
                maxLength={160}
                name="availability"
                placeholder='e.g. office hours, "by appointment", online'
                type="text"
              />
            </label>

            <label className="flex items-start gap-3 rounded-md border border-blue-100 bg-blue-50/60 px-4 py-3">
              <input
                className="mt-1 h-4 w-4 accent-blue-800"
                defaultChecked={data.profile.allow_direct_contact}
                name="allowDirectContact"
                type="checkbox"
              />
              <span>
                <span className="block text-sm font-bold text-blue-950">
                  Allow direct email contact
                </span>
                <span className="mt-1 block text-sm leading-6 text-blue-800/75">
                  Email remains hidden unless a user explicitly requests it.
                </span>
              </span>
            </label>

            <label className="block lg:col-span-2">
              <span className="text-sm font-bold text-blue-900">Bio</span>
              <textarea
                className="mt-2 min-h-28 w-full resize-y rounded-md border border-blue-200 bg-white px-4 py-3 text-sm font-medium leading-6 text-blue-950 outline-none transition placeholder:text-blue-400 focus:border-blue-400"
                maxLength={500}
                name="bio"
                onChange={(event) => setBioValue(event.target.value)}
                value={bioValue}
              />
              <span className="mt-1 block text-right text-xs font-semibold text-blue-500">
                {bioValue.length}/500
              </span>
            </label>
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <PickerCard icon={<GraduationIcon />} title="Additional programs">
          <TaxonomyMultiSelect
            emptyLabel="No additional academic programs selected."
            fieldName="additionalAcademicProgramId"
            label="Additional academic programs"
            onChange={setAdditionalProgramIds}
            options={additionalOptions}
            placeholder="Search academic programs..."
            selectedIds={additionalProgramIds}
          />
        </PickerCard>

        <PickerCard icon={<BarsIcon />} title="Expertise">
          <TaxonomyMultiSelect
            emptyLabel="Choose at least one expertise area."
            fieldName="expertiseId"
            label="Expertise"
            onChange={setExpertiseIds}
            options={data.expertise}
            placeholder="Search expertise..."
            required
            selectedIds={expertiseIds}
            suggestedLabel="Suggested expertise"
          />
        </PickerCard>

        <PickerCard icon={<SparkIcon />} title="Research interests">
          <TaxonomyMultiSelect
            emptyLabel="No research interests selected."
            fieldName="interestId"
            label="Research interests"
            onChange={setInterestIds}
            options={namedOptions(data.interests)}
            placeholder="Search research interests..."
            selectedIds={interestIds}
          />
        </PickerCard>
      </div>

      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
        <Link
          className="inline-flex h-12 items-center justify-center rounded-md border border-blue-300 bg-white px-8 text-sm font-bold text-blue-800 transition hover:border-blue-400 hover:bg-blue-50"
          href="/profile"
        >
          Cancel
        </Link>
        <AuthSubmitButton
          className="inline-flex h-12 items-center justify-center rounded-md bg-blue-800 px-8 text-sm font-bold text-white shadow-sm transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-70"
          pendingLabel="Saving..."
        >
          Save changes
        </AuthSubmitButton>
      </div>
    </form>
  );
}

function draftSocialLinks(data: EditProfileData): DraftSocialLink[] {
  return data.socialLinks.map((link) => ({
    platform: link.platform,
    url: link.url,
  }));
}

function StudentProfileEditForm({
  data,
  error,
}: Readonly<{
  data: EditProfileData;
  error?: string;
}>) {
  const initialFacultyId = data.profile.faculty_id;
  const [selectedFacultyId, setSelectedFacultyId] = useState(initialFacultyId);
  const [selectedProgramId, setSelectedProgramId] = useState(
    data.profile.academic_program_id,
  );
  const [offeredSkillIds, setOfferedSkillIds] = useState(data.offeredSkillIds);
  const [wantedSkillIds, setWantedSkillIds] = useState(data.wantedSkillIds);
  const [interestIds, setInterestIds] = useState(data.interestIds);
  const [collaborationGoalIds, setCollaborationGoalIds] = useState(
    data.collaborationGoalIds,
  );
  const [socialLinks, setSocialLinks] = useState<DraftSocialLink[]>(() =>
    draftSocialLinks(data),
  );
  const [bioValue, setBioValue] = useState(data.profile.bio ?? "");
  const [clientError, setClientError] = useState<string | null>(null);
  const availablePrograms = useMemo(
    () =>
      data.programs.filter(
        (program) => program.faculty_id === selectedFacultyId,
      ),
    [data.programs, selectedFacultyId],
  );
  const selectedProgram = data.programs.find(
    (program) => program.id === selectedProgramId,
  );

  function handleFacultyChange(value: string) {
    const nextFacultyId = Number(value);
    const nextPrograms = data.programs.filter(
      (program) => program.faculty_id === nextFacultyId,
    );

    setSelectedFacultyId(nextFacultyId);
    setSelectedProgramId(nextPrograms[0]?.id ?? 0);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (offeredSkillIds.length < 1) {
      event.preventDefault();
      setClientError("Choose at least one offered skill.");
      return;
    }

    const socialValidation = normalizeProfileSocialLinks(socialLinks);

    if (!socialValidation.ok) {
      event.preventDefault();
      setClientError(socialValidation.error);
      return;
    }

    setClientError(null);
  }

  function addSocialLink() {
    const selectedPlatforms = new Set(socialLinks.map((link) => link.platform));
    const nextPlatform = socialPlatformOptions.find(
      (platform) => !selectedPlatforms.has(platform.value),
    );

    if (!nextPlatform) {
      setClientError("All supported social platforms are already added.");
      return;
    }

    setSocialLinks((current) => [
      ...current,
      { platform: nextPlatform.value, url: "" },
    ]);
    setClientError(null);
  }

  function updateSocialLink(
    index: number,
    patch: Partial<DraftSocialLink>,
  ) {
    setSocialLinks((current) =>
      current.map((link, linkIndex) =>
        linkIndex === index ? { ...link, ...patch } : link,
      ),
    );
  }

  function removeSocialLink(index: number) {
    setSocialLinks((current) =>
      current.filter((_, linkIndex) => linkIndex !== index),
    );
  }

  return (
    <form
      action="/profile/update"
      className="space-y-5"
      id="profile-edit-form"
      method="post"
      onSubmit={handleSubmit}
    >
      <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-serif text-6xl font-bold leading-none text-blue-950 sm:text-7xl">
            Edit profile
          </h1>
          <p className="mt-3 text-xl leading-8 text-blue-900/80 sm:text-2xl">
            Update your information and shape how you appear to the Mohyla Match
            community.
          </p>
        </div>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
          <Link
            className="inline-flex h-12 items-center justify-center rounded-md border border-blue-300 bg-white px-8 text-sm font-bold text-blue-800 transition hover:border-blue-400 hover:bg-blue-50"
            href="/profile"
          >
            Cancel
          </Link>
          <AuthSubmitButton
            className="inline-flex h-12 items-center justify-center rounded-md bg-blue-800 px-8 text-sm font-bold text-white shadow-sm transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-70"
            pendingLabel="Saving..."
          >
            Save changes
          </AuthSubmitButton>
        </div>
      </header>

      {error || clientError ? (
        <div
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-900"
          role="alert"
        >
          {clientError ?? error}
        </div>
      ) : null}

      <section className="rounded-lg border border-blue-100 bg-white p-5 sm:p-6">
        <div className="grid gap-6 lg:grid-cols-[12rem_minmax(0,1fr)]">
          <SystemAvatar
            availability={data.profile.availability}
            avatarVariantKey={selectedProgram?.avatar_variant_key}
            fullName={data.profile.full_name}
            size="xl"
            systemAvatarKey={data.profile.system_avatar_key}
          />

          <div className="grid gap-4 lg:grid-cols-3">
            <label className="block">
              <span className="text-sm font-bold text-blue-900">
                Full name <span className="text-red-600">*</span>
              </span>
              <input
                className={fieldClassName()}
                defaultValue={data.profile.full_name}
                maxLength={120}
                minLength={2}
                name="fullName"
                required
                type="text"
              />
            </label>

            <label className="block">
              <span className="text-sm font-bold text-blue-900">
                Faculty <span className="text-red-600">*</span>
              </span>
              <select
                className={fieldClassName()}
                name="facultyId"
                onChange={(event) => handleFacultyChange(event.target.value)}
                required
                value={selectedFacultyId}
              >
                {data.faculties.map((faculty) => (
                  <option key={faculty.id} value={faculty.id}>
                    {faculty.display_name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-bold text-blue-900">
                Academic program <span className="text-red-600">*</span>
              </span>
              <select
                className={fieldClassName()}
                disabled={availablePrograms.length === 0}
                name="academicProgramId"
                onChange={(event) =>
                  setSelectedProgramId(Number(event.target.value))
                }
                required
                value={selectedProgramId}
              >
                {availablePrograms.map((program) => (
                  <option key={program.id} value={program.id}>
                    {program.display_name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-bold text-blue-900">
                Year of study <span className="text-red-600">*</span>
              </span>
              <select
                className={fieldClassName()}
                defaultValue={data.profile.year_of_study ?? ""}
                name="yearOfStudy"
                required
              >
                {[1, 2, 3, 4, 5, 6].map((year) => (
                  <option key={year} value={year}>
                    {yearLabel(year)}
                  </option>
                ))}
              </select>
            </label>

            <label className="block lg:col-span-2">
              <span className="text-sm font-bold text-blue-900">
                Availability
              </span>
              <input
                className={fieldClassName()}
                defaultValue={data.profile.availability ?? ""}
                maxLength={160}
                name="availability"
                placeholder='e.g. hours per week, "evenings", or a short note'
                type="text"
              />
            </label>

            <label className="block lg:col-span-3">
              <span className="text-sm font-bold text-blue-900">Bio</span>
              <textarea
                className="mt-2 min-h-28 w-full resize-y rounded-md border border-blue-200 bg-white px-4 py-3 text-sm font-medium leading-6 text-blue-950 outline-none transition placeholder:text-blue-400 focus:border-blue-400"
                maxLength={500}
                name="bio"
                onChange={(event) => setBioValue(event.target.value)}
                value={bioValue}
              />
              <span className="mt-1 block text-right text-xs font-semibold text-blue-500">
                {bioValue.length}/500
              </span>
            </label>

            <label className="flex items-start gap-3 rounded-md border border-blue-100 bg-blue-50/60 px-4 py-3 lg:col-span-3">
              <input
                className="mt-1 h-4 w-4 accent-blue-800"
                defaultChecked={data.profile.allow_direct_contact}
                name="allowDirectContact"
                type="checkbox"
              />
              <span>
                <span className="block text-sm font-bold text-blue-950">
                  Allow direct email contact
                </span>
                <span className="mt-1 block text-sm leading-6 text-blue-800/75">
                  Other Mohyla Match students can request and copy your student
                  email after an explicit Get email click.
                </span>
              </span>
            </label>
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <PickerCard icon={<BarsIcon />} title="Skills">
          <TaxonomyMultiSelect
            emptyLabel="Choose at least one offered skill."
            fieldName="offerSkillId"
            label="Skills"
            onChange={setOfferedSkillIds}
            options={data.skills}
            placeholder="Search skills..."
            required
            selectedIds={offeredSkillIds}
          />
        </PickerCard>

        <PickerCard icon={<SparkIcon />} title="Academic interests">
          <TaxonomyMultiSelect
            emptyLabel="No academic interests selected."
            fieldName="interestId"
            label="Academic interests"
            onChange={setInterestIds}
            options={namedOptions(data.interests)}
            placeholder="Search academic interests..."
            selectedIds={interestIds}
          />
        </PickerCard>

        <PickerCard icon={<TargetIcon />} title="Collaboration goals">
          <TaxonomyMultiSelect
            emptyLabel="No collaboration goals selected."
            fieldName="collaborationGoalId"
            label="Collaboration goals"
            onChange={setCollaborationGoalIds}
            options={namedOptions(data.collaborationGoals)}
            placeholder="Search collaboration goals..."
            selectedIds={collaborationGoalIds}
          />
        </PickerCard>

        <PickerCard icon={<LinkIcon />} title="Looking-for skills">
          <TaxonomyMultiSelect
            emptyLabel="No looking-for skills selected."
            fieldName="lookingForSkillId"
            label="Looking-for skills"
            onChange={setWantedSkillIds}
            options={data.skills}
            placeholder="Search skills you're looking for..."
            selectedIds={wantedSkillIds}
          />
        </PickerCard>

        <PickerCard icon={<LinkIcon />} title="Social links">
          <div className="space-y-3">
            {socialLinks.length > 0 ? (
              socialLinks.map((link, index) => {
                const selectedPlatforms = new Set(
                  socialLinks
                    .filter((_, linkIndex) => linkIndex !== index)
                    .map((item) => item.platform),
                );

                return (
                  <div
                    className="grid gap-3 rounded-lg border border-blue-100 bg-blue-50/40 p-3 sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)_auto] sm:items-end"
                    key={`${link.platform}-${index}`}
                  >
                    <label className="block">
                      <span className="text-sm font-bold text-blue-900">
                        Platform
                      </span>
                      <select
                        className={fieldClassName()}
                        name="socialPlatform"
                        onChange={(event) =>
                          updateSocialLink(index, {
                            platform: event.target.value as SocialPlatform,
                          })
                        }
                        value={link.platform}
                      >
                        {socialPlatformOptions.map((platform) => (
                          <option
                            disabled={selectedPlatforms.has(platform.value)}
                            key={platform.value}
                            value={platform.value}
                          >
                            {platform.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="text-sm font-bold text-blue-900">
                        URL
                      </span>
                      <input
                        className={fieldClassName()}
                        name="socialUrl"
                        onChange={(event) =>
                          updateSocialLink(index, { url: event.target.value })
                        }
                        placeholder="https://..."
                        type="text"
                        value={link.url}
                      />
                    </label>

                    <button
                      className="inline-flex h-11 items-center justify-center rounded-md border border-blue-200 bg-white px-4 text-sm font-bold text-blue-800 transition hover:border-blue-300 hover:bg-blue-50"
                      onClick={() => removeSocialLink(index)}
                      type="button"
                    >
                      Remove
                    </button>
                  </div>
                );
              })
            ) : (
              <p className="text-sm font-medium text-blue-700/75">
                Add optional public social links when you want classmates to find
                your work elsewhere.
              </p>
            )}

            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-blue-200 bg-white px-4 text-sm font-bold text-blue-900 transition hover:border-blue-300 hover:bg-blue-50"
              onClick={addSocialLink}
              type="button"
            >
              <SocialPlatformIcon
                className="h-5 w-5"
                platform="personal-website"
              />
              Add social link
            </button>

            {socialLinks.length > 0 ? (
              <ul className="flex flex-wrap gap-2">
                {socialLinks
                  .filter((link) => link.url.trim())
                  .map((link) => (
                    <li
                      className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-800 ring-1 ring-blue-100"
                      key={`${link.platform}-preview`}
                    >
                      <SocialPlatformIcon
                        className="h-4 w-4"
                        platform={link.platform}
                      />
                      {getSocialPlatformLabel(link.platform)}
                      <span className="max-w-[12rem] truncate text-blue-600">
                        {formatSocialUrl(link.url)}
                      </span>
                    </li>
                  ))}
              </ul>
            ) : null}
          </div>
        </PickerCard>
      </div>

      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
        <Link
          className="inline-flex h-12 items-center justify-center rounded-md border border-blue-300 bg-white px-8 text-sm font-bold text-blue-800 transition hover:border-blue-400 hover:bg-blue-50"
          href="/profile"
        >
          Cancel
        </Link>
        <AuthSubmitButton
          className="inline-flex h-12 items-center justify-center rounded-md bg-blue-800 px-8 text-sm font-bold text-white shadow-sm transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-70"
          pendingLabel="Saving..."
        >
          Save changes
        </AuthSubmitButton>
      </div>
    </form>
  );
}

export function ProfileEditForm({
  data,
  error,
}: Readonly<{
  data: EditProfileData;
  error?: string;
}>) {
  if (data.profile.account_role === "faculty") {
    return <FacultyProfileEditForm data={data} error={error} />;
  }

  return <StudentProfileEditForm data={data} error={error} />;
}
