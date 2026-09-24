"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent, type ReactNode } from "react";

import { AuthSubmitButton } from "@/components/auth-submit-button";
import { SystemAvatar } from "@/components/profile/system-avatar";
import {
  TaxonomyMultiSelect,
  type TaxonomyPickerOption,
} from "@/components/profile/taxonomy-multi-select";
import type { EditProfileData } from "@/lib/profile/data";

type PickerCardProps = Readonly<{
  children: ReactNode;
  icon: ReactNode;
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

export function ProfileEditForm({
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
          <div className="overflow-hidden rounded-lg border border-blue-100 bg-blue-50">
            <SystemAvatar
              availability={data.profile.availability}
              avatarVariantKey={selectedProgram?.avatar_variant_key}
              fullName={data.profile.full_name}
              size="xl"
              systemAvatarKey={data.profile.system_avatar_key}
            />
          </div>

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
                defaultValue={data.profile.year_of_study}
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
