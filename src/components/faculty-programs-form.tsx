"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { AuthSubmitButton } from "@/components/auth-submit-button";
import {
  onboardingFieldClass,
  onboardingLabelClass,
  onboardingPrimaryButtonClass,
  onboardingSecondaryButtonClass,
  onboardingTextareaClass,
} from "@/components/onboarding-styles";

type FacultyOption = Readonly<{
  id: number;
  display_name: string;
}>;

type ProgramOption = Readonly<{
  id: number;
  faculty_id: number;
  display_name: string;
}>;

type ProfileValue = Readonly<{
  full_name: string;
  faculty_id: number;
  academic_program_id: number;
  bio: string | null;
  availability: string | null;
}>;

type FacultyProgramsFormProps = Readonly<{
  defaultProgramIds: Set<number>;
  faculties: FacultyOption[];
  profile: ProfileValue | null;
  programs: ProgramOption[];
  suggestedFullName?: string | null;
}>;

function programBelongsToFaculty(
  programs: readonly ProgramOption[],
  programId: number | null,
  facultyId: number | null,
) {
  return programs.some(
    (program) => program.id === programId && program.faculty_id === facultyId,
  );
}

export function FacultyProgramsForm({
  defaultProgramIds,
  faculties,
  profile,
  programs,
  suggestedFullName,
}: FacultyProgramsFormProps) {
  const initialFacultyId =
    profile?.faculty_id ?? programs[0]?.faculty_id ?? faculties[0]?.id ?? null;
  const [selectedFacultyId, setSelectedFacultyId] = useState<number | null>(
    initialFacultyId,
  );
  const availablePrograms = useMemo(
    () =>
      programs.filter((program) => program.faculty_id === selectedFacultyId),
    [programs, selectedFacultyId],
  );
  const [selectedProgramId, setSelectedProgramId] = useState<number | null>(() =>
    programBelongsToFaculty(
      programs,
      profile?.academic_program_id ?? null,
      initialFacultyId,
    )
      ? profile?.academic_program_id ?? null
      : availablePrograms[0]?.id ?? null,
  );
  const [additionalProgramIds, setAdditionalProgramIds] = useState<number[]>(
    () =>
      [...defaultProgramIds].filter(
        (programId) =>
          programId !== selectedProgramId &&
          programBelongsToFaculty(programs, programId, initialFacultyId),
      ),
  );

  function handleFacultyChange(value: string) {
    const nextFacultyId = Number(value);
    const nextPrograms = programs.filter(
      (program) => program.faculty_id === nextFacultyId,
    );
    const nextPrimaryId = nextPrograms[0]?.id ?? null;

    setSelectedFacultyId(nextFacultyId);
    setSelectedProgramId(nextPrimaryId);
    setAdditionalProgramIds((current) =>
      current.filter(
        (programId) =>
          programId !== nextPrimaryId &&
          programBelongsToFaculty(programs, programId, nextFacultyId),
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

  function handleAdditionalProgramChange(programId: number, checked: boolean) {
    setAdditionalProgramIds((current) =>
      checked
        ? [...new Set([...current, programId])]
        : current.filter((currentId) => currentId !== programId),
    );
  }

  const additionalProgramOptions = availablePrograms.filter(
    (program) => program.id !== selectedProgramId,
  );

  return (
    <form action="/account/setup/faculty-programs" className="mt-6 space-y-4" method="post">
      <label className="block">
        <span className={onboardingLabelClass}>
          Full name · Required
        </span>
        <input
          className={onboardingFieldClass}
          defaultValue={profile?.full_name ?? suggestedFullName ?? ""}
          maxLength={120}
          minLength={2}
          name="fullName"
          required
          type="text"
        />
      </label>

      <label className="block">
        <span className={onboardingLabelClass}>
          Faculty · Required
        </span>
        <select
          className={onboardingFieldClass}
          name="facultyId"
          onChange={(event) => handleFacultyChange(event.target.value)}
          required
          value={selectedFacultyId ?? ""}
        >
          {faculties.map((faculty) => (
            <option key={faculty.id} value={faculty.id}>
              {faculty.display_name}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className={onboardingLabelClass}>
          Primary academic program · Required
        </span>
        <select
          className={onboardingFieldClass}
          disabled={!selectedFacultyId || availablePrograms.length === 0}
          name="primaryAcademicProgramId"
          onChange={(event) => handlePrimaryProgramChange(event.target.value)}
          required
          value={selectedProgramId ?? ""}
        >
          <option disabled value="">
            Select primary program
          </option>
          {availablePrograms.map((program) => (
            <option key={program.id} value={program.id}>
              {program.display_name}
            </option>
          ))}
        </select>
      </label>

      <fieldset className="space-y-3">
        <legend className={onboardingLabelClass}>
          Additional academic programs · Optional
        </legend>
        <div className="max-h-60 space-y-1.5 overflow-y-auto rounded-[0.75rem] border border-[#cddaf0] bg-white/55 p-2.5">
          {additionalProgramOptions.length > 0 ? (
            additionalProgramOptions.map((program) => (
              <label
                className="flex items-start gap-2.5 rounded-lg px-2.5 py-2 text-[0.8125rem] font-semibold text-[#102653] transition hover:bg-white/80"
                key={program.id}
              >
                <input
                  className="mt-1 size-4 accent-[#3567a8]"
                  checked={additionalProgramIds.includes(program.id)}
                  name="additionalAcademicProgramId"
                  onChange={(event) =>
                    handleAdditionalProgramChange(
                      program.id,
                      event.target.checked,
                    )
                  }
                  type="checkbox"
                  value={program.id}
                />
                <span>{program.display_name}</span>
              </label>
            ))
          ) : (
            <p className="px-3 py-2 text-sm font-semibold text-[#66769e]">
              No additional programs for this faculty.
            </p>
          )}
        </div>
      </fieldset>

      <label className="block">
        <span className={onboardingLabelClass}>Bio · Optional</span>
        <textarea
          className={onboardingTextareaClass}
          defaultValue={profile?.bio ?? ""}
          maxLength={500}
          name="bio"
        />
      </label>

      <label className="block">
        <span className={onboardingLabelClass}>
          Availability · Optional
        </span>
        <input
          className={onboardingFieldClass}
          defaultValue={profile?.availability ?? ""}
          maxLength={160}
          name="availability"
          type="text"
        />
      </label>

      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
        <Link className={onboardingSecondaryButtonClass} href="/account/setup">
          Back
        </Link>
        <div className="sm:w-52">
          <AuthSubmitButton
            className={onboardingPrimaryButtonClass}
            pendingLabel="Saving..."
          >
            Continue <span aria-hidden="true">→</span>
          </AuthSubmitButton>
        </div>
      </div>
    </form>
  );
}
