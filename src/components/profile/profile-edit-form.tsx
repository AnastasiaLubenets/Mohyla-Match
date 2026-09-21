"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { AuthSubmitButton } from "@/components/auth-submit-button";
import { SystemAvatar } from "@/components/profile/system-avatar";
import type {
  EditProfileData,
  NamedOption,
  SkillOption,
} from "@/lib/profile/data";

function groupSkillsByCategory(skills: SkillOption[]) {
  return skills.reduce<Record<string, SkillOption[]>>((groups, skill) => {
    groups[skill.category] ??= [];
    groups[skill.category].push(skill);
    return groups;
  }, {});
}

function ChoiceCard({
  defaultChecked,
  fieldName,
  id,
  name,
}: Readonly<{
  defaultChecked: boolean;
  fieldName: string;
  id: number;
  name: string;
}>) {
  const inputId = `${fieldName}-${id}`;

  return (
    <div>
      <input
        className="peer sr-only"
        defaultChecked={defaultChecked}
        id={inputId}
        name={fieldName}
        type="checkbox"
        value={id}
      />
      <label
        className="flex min-h-12 cursor-pointer items-center rounded-lg border border-border bg-surface px-4 py-3 text-sm font-semibold transition peer-checked:border-primary peer-checked:bg-surface-strong peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary"
        htmlFor={inputId}
      >
        {name}
      </label>
    </div>
  );
}

function NamedChoiceSection({
  defaultIds,
  fieldName,
  items,
  title,
}: Readonly<{
  defaultIds: Set<number>;
  fieldName: string;
  items: NamedOption[];
  title: string;
}>) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-semibold">{title}</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <ChoiceCard
            defaultChecked={defaultIds.has(item.id)}
            fieldName={fieldName}
            id={item.id}
            key={item.id}
            name={item.name}
          />
        ))}
      </div>
    </fieldset>
  );
}

function SkillChoiceSection({
  defaultIds,
  fieldName,
  skills,
  title,
}: Readonly<{
  defaultIds: Set<number>;
  fieldName: string;
  skills: SkillOption[];
  title: string;
}>) {
  const groupedSkills = groupSkillsByCategory(skills);

  return (
    <fieldset className="space-y-4">
      <legend className="text-sm font-semibold">{title}</legend>
      {Object.entries(groupedSkills).map(([category, categorySkills]) => (
        <div className="space-y-3" key={category}>
          <p className="text-sm font-medium text-muted">{category}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {categorySkills.map((skill) => (
              <ChoiceCard
                defaultChecked={defaultIds.has(skill.id)}
                fieldName={fieldName}
                id={skill.id}
                key={skill.id}
                name={skill.name}
              />
            ))}
          </div>
        </div>
      ))}
    </fieldset>
  );
}

export function ProfileEditForm({ data }: Readonly<{ data: EditProfileData }>) {
  const initialFacultyId = data.profile.faculty_id;
  const [selectedFacultyId, setSelectedFacultyId] = useState(initialFacultyId);
  const availablePrograms = useMemo(
    () =>
      data.programs.filter(
        (program) => program.faculty_id === selectedFacultyId,
      ),
    [data.programs, selectedFacultyId],
  );
  const [selectedProgramId, setSelectedProgramId] = useState(
    data.profile.academic_program_id,
  );
  const offeredSkillIds = new Set(data.offeredSkillIds);
  const wantedSkillIds = new Set(data.wantedSkillIds);
  const interestIds = new Set(data.interestIds);
  const collaborationGoalIds = new Set(data.collaborationGoalIds);

  function handleFacultyChange(value: string) {
    const nextFacultyId = Number(value);
    const nextPrograms = data.programs.filter(
      (program) => program.faculty_id === nextFacultyId,
    );

    setSelectedFacultyId(nextFacultyId);
    setSelectedProgramId(nextPrograms[0]?.id ?? 0);
  }

  return (
    <form action="/profile/update" className="space-y-8" method="post">
      <section className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <SystemAvatar
          fullName={data.profile.full_name}
          size="md"
          systemAvatarKey={data.profile.system_avatar_key}
        />
        <div>
          <h1 className="text-3xl font-semibold">Edit profile</h1>
          <p className="mt-2 leading-7 text-muted">
            Keep the required profile details complete so your profile stays
            visible to eligible students.
          </p>
        </div>
      </section>

      <section className="space-y-5">
        <label className="block">
          <span className="text-sm font-semibold">Full name · Required</span>
          <input
            className="mt-2 h-12 w-full rounded-lg border border-border bg-surface px-4 text-foreground outline-none transition focus:border-primary"
            defaultValue={data.profile.full_name}
            maxLength={120}
            minLength={2}
            name="fullName"
            required
            type="text"
          />
        </label>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold">Faculty · Required</span>
            <select
              className="mt-2 h-12 w-full rounded-lg border border-border bg-surface px-4 text-foreground outline-none transition focus:border-primary"
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
            <span className="text-sm font-semibold">
              Academic program · Required
            </span>
            <select
              className="mt-2 h-12 w-full rounded-lg border border-border bg-surface px-4 text-foreground outline-none transition focus:border-primary"
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
        </div>

        <label className="block">
          <span className="text-sm font-semibold">Year of study · Required</span>
          <select
            className="mt-2 h-12 w-full rounded-lg border border-border bg-surface px-4 text-foreground outline-none transition focus:border-primary"
            defaultValue={data.profile.year_of_study}
            name="yearOfStudy"
            required
          >
            {[1, 2, 3, 4, 5, 6].map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-semibold">Bio · Optional</span>
          <textarea
            className="mt-2 min-h-28 w-full resize-y rounded-lg border border-border bg-surface px-4 py-3 text-foreground outline-none transition focus:border-primary"
            defaultValue={data.profile.bio ?? ""}
            maxLength={500}
            name="bio"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold">Availability · Optional</span>
          <input
            className="mt-2 h-12 w-full rounded-lg border border-border bg-surface px-4 text-foreground outline-none transition focus:border-primary"
            defaultValue={data.profile.availability ?? ""}
            maxLength={160}
            name="availability"
            type="text"
          />
        </label>

        <label className="flex items-start gap-3 rounded-lg border border-border bg-surface px-4 py-4">
          <input
            className="mt-1 h-4 w-4 accent-primary"
            defaultChecked={data.profile.allow_direct_contact}
            name="allowDirectContact"
            type="checkbox"
          />
          <span>
            <span className="block text-sm font-semibold">
              Allow direct email contact
            </span>
            <span className="mt-1 block text-sm leading-6 text-muted">
              Other Mohyla Match students can use your student email to contact
              you directly.
            </span>
          </span>
        </label>
      </section>

      <SkillChoiceSection
        defaultIds={offeredSkillIds}
        fieldName="offerSkillId"
        skills={data.skills}
        title="Can offer · Required"
      />

      <SkillChoiceSection
        defaultIds={wantedSkillIds}
        fieldName="lookingForSkillId"
        skills={data.skills}
        title="Looking for · Optional"
      />

      <NamedChoiceSection
        defaultIds={interestIds}
        fieldName="interestId"
        items={data.interests}
        title="Interests · Required"
      />

      <NamedChoiceSection
        defaultIds={collaborationGoalIds}
        fieldName="collaborationGoalId"
        items={data.collaborationGoals}
        title="Collaboration goals · Required"
      />

      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
        <Link
          className="inline-flex h-12 items-center justify-center rounded-full border border-border px-5 text-sm font-semibold text-foreground transition hover:border-primary"
          href="/profile"
        >
          Cancel
        </Link>
        <div className="sm:w-52">
          <AuthSubmitButton pendingLabel="Saving...">
            Save profile
          </AuthSubmitButton>
        </div>
      </div>
    </form>
  );
}
