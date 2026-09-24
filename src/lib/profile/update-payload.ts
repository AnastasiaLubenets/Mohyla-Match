export type ProfileUpdatePayload = Readonly<{
  academicProgramId: number;
  allowDirectContact: boolean;
  availability: string | null;
  bio: string | null;
  collaborationGoalIds: number[];
  facultyId: number;
  fullName: string;
  interestIds: number[];
  lookingForSkillIds: number[];
  offerSkillIds: number[];
  yearOfStudy: number;
}>;

export type ProfileUpdateValidationResult =
  | Readonly<{ ok: true }>
  | Readonly<{ error: string; ok: false }>;

export function normalizeOptionalProfileText(
  value: string | null | undefined,
): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function normalizeIdList(ids: readonly unknown[]): number[] {
  const normalizedIds = ids
    .map((value) => (typeof value === "number" ? value : Number(value)))
    .filter((value) => Number.isSafeInteger(value) && value > 0);

  return [...new Set(normalizedIds)];
}

export function validateProfileUpdatePayload(
  payload: ProfileUpdatePayload,
): ProfileUpdateValidationResult {
  if (
    !payload.fullName ||
    payload.fullName.length < 2 ||
    payload.fullName.length > 120
  ) {
    return { error: "Full name must be 2-120 characters.", ok: false };
  }

  if (
    !payload.facultyId ||
    !payload.academicProgramId ||
    !payload.yearOfStudy ||
    payload.yearOfStudy < 1 ||
    payload.yearOfStudy > 6
  ) {
    return {
      error: "Choose a faculty, program, and year of study.",
      ok: false,
    };
  }

  if (payload.bio && payload.bio.length > 500) {
    return { error: "Bio is limited to 500 characters.", ok: false };
  }

  if (payload.availability && payload.availability.length > 160) {
    return { error: "Availability is limited to 160 characters.", ok: false };
  }

  if (payload.offerSkillIds.length < 1) {
    return {
      error: "Choose at least one offered skill.",
      ok: false,
    };
  }

  return { ok: true };
}
