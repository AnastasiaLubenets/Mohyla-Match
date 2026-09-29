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

type BasicProfileValue = Readonly<{
  full_name: string;
  faculty_id: number | null;
  academic_program_id: number | null;
  year_of_study: number | null;
  bio: string | null;
  availability: string | null;
}>;

type OnboardingBasicFormProps = Readonly<{
  faculties: FacultyOption[];
  programs: ProgramOption[];
  profile: BasicProfileValue | null;
  suggestedFullName?: string | null;
}>;

export function OnboardingBasicForm({
  faculties,
  programs,
  profile,
  suggestedFullName = null,
}: OnboardingBasicFormProps) {
  const initialFacultyId = profile?.faculty_id ?? faculties[0]?.id ?? null;
  const [selectedFacultyId, setSelectedFacultyId] = useState<number | null>(
    initialFacultyId,
  );
  const availablePrograms = useMemo(
    () =>
      programs.filter((program) => program.faculty_id === selectedFacultyId),
    [programs, selectedFacultyId],
  );
  const [selectedProgramId, setSelectedProgramId] = useState<number | null>(
    profile?.academic_program_id ?? availablePrograms[0]?.id ?? null,
  );

  function handleFacultyChange(value: string) {
    const nextFacultyId = Number(value);
    const nextPrograms = programs.filter(
      (program) => program.faculty_id === nextFacultyId,
    );

    setSelectedFacultyId(nextFacultyId);
    setSelectedProgramId(nextPrograms[0]?.id ?? null);
  }

  return (
    <form action="/account/setup/basic" className="mt-8 space-y-5" method="post">
      <label className="block">
        <span className={onboardingLabelClass}>Full name · Required</span>
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

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className={onboardingLabelClass}>Faculty · Required</span>
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
            Academic program · Required
          </span>
          <select
            className={onboardingFieldClass}
            disabled={!selectedFacultyId || availablePrograms.length === 0}
            name="academicProgramId"
            onChange={(event) => setSelectedProgramId(Number(event.target.value))}
            required
            value={selectedProgramId ?? ""}
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
        <span className={onboardingLabelClass}>Year of study · Required</span>
        <select
          className={onboardingFieldClass}
          defaultValue={profile?.year_of_study ?? ""}
          name="yearOfStudy"
          required
        >
          <option disabled value="">
            Select year
          </option>
          {[1, 2, 3, 4, 5, 6].map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </label>

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
        <span className={onboardingLabelClass}>Availability · Optional</span>
        <input
          className={onboardingFieldClass}
          defaultValue={profile?.availability ?? ""}
          maxLength={160}
          name="availability"
          type="text"
        />
      </label>

      <div className="flex flex-col-reverse gap-3 pt-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          className={onboardingSecondaryButtonClass}
          href="/"
        >
          Back
        </Link>
        <div className="sm:w-48">
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
