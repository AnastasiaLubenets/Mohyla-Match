import type { EditProfileData } from "./data.ts";
import {
  normalizeIdList,
  normalizeOptionalProfileText,
  validateProfileUpdatePayload,
  type ProfileUpdatePayload,
} from "./update-payload.ts";

export type ProfileSectionUpdateName =
  | "availability"
  | "bio"
  | "collaborationGoals"
  | "interests"
  | "lookingForSkills"
  | "offeredSkills";

export type ProfileSectionUpdateResult =
  | Readonly<{
      ok: true;
      payload: ProfileUpdatePayload;
      section: ProfileSectionUpdateName;
    }>
  | Readonly<{
      error: string;
      ok: false;
    }>;

type MutableProfileUpdatePayload = {
  -readonly [Key in keyof ProfileUpdatePayload]: ProfileUpdatePayload[Key];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function readSection(value: unknown): ProfileSectionUpdateName | null {
  if (
    value === "availability" ||
    value === "bio" ||
    value === "collaborationGoals" ||
    value === "interests" ||
    value === "lookingForSkills" ||
    value === "offeredSkills"
  ) {
    return value;
  }

  return null;
}

function availableIdSet(options: readonly { id: number }[]) {
  return new Set(options.map((option) => option.id));
}

function requireKnownIds(
  ids: readonly number[],
  availableIds: ReadonlySet<number>,
  error: string,
) {
  return ids.every((id) => availableIds.has(id)) ? null : error;
}

function readIds(input: Record<string, unknown>) {
  const rawIds = input.ids;
  return Array.isArray(rawIds) ? normalizeIdList(rawIds) : [];
}

export function profileEditDataToPayload(
  data: EditProfileData,
): ProfileUpdatePayload {
  return {
    academicProgramId: data.profile.academic_program_id,
    allowDirectContact: data.profile.allow_direct_contact,
    availability: data.profile.availability,
    bio: data.profile.bio,
    collaborationGoalIds: normalizeIdList(data.collaborationGoalIds),
    facultyId: data.profile.faculty_id,
    fullName: data.profile.full_name,
    interestIds: normalizeIdList(data.interestIds),
    lookingForSkillIds: normalizeIdList(data.wantedSkillIds),
    offerSkillIds: normalizeIdList(data.offeredSkillIds),
    yearOfStudy: data.profile.year_of_study,
  };
}

export function mergeProfileSectionUpdate(
  data: EditProfileData,
  input: unknown,
): ProfileSectionUpdateResult {
  if (!isRecord(input)) {
    return { error: "Choose a profile section to update.", ok: false };
  }

  const section = readSection(input.section);

  if (!section) {
    return { error: "Choose a profile section to update.", ok: false };
  }

  const payload: MutableProfileUpdatePayload = profileEditDataToPayload(data);

  if (section === "bio") {
    payload.bio = normalizeOptionalProfileText(readString(input.bio));
  } else if (section === "availability") {
    payload.availability = normalizeOptionalProfileText(
      readString(input.availability),
    );
  } else {
    const ids = readIds(input);

    if (section === "offeredSkills") {
      const error = requireKnownIds(
        ids,
        availableIdSet(data.skills),
        "Choose valid offered skills.",
      );

      if (error) {
        return { error, ok: false };
      }

      payload.offerSkillIds = ids;
    } else if (section === "lookingForSkills") {
      const error = requireKnownIds(
        ids,
        availableIdSet(data.skills),
        "Choose valid looking-for skills.",
      );

      if (error) {
        return { error, ok: false };
      }

      payload.lookingForSkillIds = ids;
    } else if (section === "interests") {
      const error = requireKnownIds(
        ids,
        availableIdSet(data.interests),
        "Choose valid academic interests.",
      );

      if (error) {
        return { error, ok: false };
      }

      payload.interestIds = ids;
    } else {
      const error = requireKnownIds(
        ids,
        availableIdSet(data.collaborationGoals),
        "Choose valid collaboration goals.",
      );

      if (error) {
        return { error, ok: false };
      }

      payload.collaborationGoalIds = ids;
    }
  }

  const validation = validateProfileUpdatePayload(payload);

  if (!validation.ok) {
    return { error: validation.error, ok: false };
  }

  return { ok: true, payload, section };
}
