"use client";

import { useMemo, useState } from "react";

import { AuthSubmitButton } from "@/components/auth-submit-button";
import {
  onboardingPrimaryButtonClass,
  onboardingSecondaryButtonClass,
} from "@/components/onboarding-styles";
import Link from "next/link";

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
    <form action="/account/setup/faculty-programs" className="mt-8 space-y-6" method="post">
      <label className="block">
        <span className="text-sm font-bold text-[#132a56]">
          Full name · Required
        </span>
        <input
          className="mt-2 h-12 w-full rounded-[0.875rem] border border-[#cddaf0] bg-white/80 px-4 text-sm font-semibold text-[#102653] outline-none transition placeholder:text-[#93a0bc] focus:border-[#3567a8] focus:bg-white"
          defaultValue={profile?.full_name ?? suggestedFullName ?? ""}
          maxLength={120}
          minLength={2}
          name="fullName"
          required
          type="text"
        />
      </label>

      <label className="block">
        <span className="text-sm font-bold text-[#132a56]">
          Faculty · Required
        </span>
        <select
          className="mt-2 h-12 w-full rounded-[0.875rem] border border-[#cddaf0] bg-white/80 px-4 text-sm font-semibold text-[#102653] outline-none transition focus:border-[#3567a8] focus:bg-white"
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
        <span className="text-sm font-bold text-[#132a56]">
          Primary academic program · Required
        </span>
        <select
          className="mt-2 h-12 w-full rounded-[0.875rem] border border-[#cddaf0] bg-white/80 px-4 text-sm font-semibold text-[#102653] outline-none transition focus:border-[#3567a8] focus:bg-white"
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
        <legend className="text-sm font-bold text-[#132a56]">
          Additional academic programs · Optional
        </legend>
        <div className="max-h-72 space-y-2 overflow-y-auto rounded-[0.875rem] border border-[#cddaf0] bg-white/55 p-3">
          {additionalProgramOptions.length > 0 ? (
            additionalProgramOptions.map((program) => (
              <label
                className="flex items-start gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-[#102653] transition hover:bg-white/80"
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
        <span className="text-sm font-bold text-[#132a56]">Bio · Optional</span>
        <textarea
          className="mt-2 min-h-24 w-full rounded-[0.875rem] border border-[#cddaf0] bg-white/80 px-4 py-3 text-sm font-semibold text-[#102653] outline-none transition placeholder:text-[#93a0bc] focus:border-[#3567a8] focus:bg-white"
          defaultValue={profile?.bio ?? ""}
          maxLength={500}
          name="bio"
        />
      </label>

      <label className="block">
        <span className="text-sm font-bold text-[#132a56]">
          Availability · Optional
        </span>
        <input
          className="mt-2 h-12 w-full rounded-[0.875rem] border border-[#cddaf0] bg-white/80 px-4 text-sm font-semibold text-[#102653] outline-none transition placeholder:text-[#93a0bc] focus:border-[#3567a8] focus:bg-white"
          defaultValue={profile?.availability ?? ""}
          maxLength={160}
          name="availability"
          type="text"
        />
      </label>

      <div className="flex flex-col-reverse gap-3 pt-3 sm:flex-row sm:items-center sm:justify-between">
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
