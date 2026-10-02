import type { SupabaseClient } from "@supabase/supabase-js";
import type { NextRequest, NextResponse } from "next/server";

import { destinationForAccountState } from "@/lib/auth/routing";
import { getCurrentAccountState } from "@/lib/auth/state";
import { pathWithParams, redirectTo } from "@/lib/auth/http";
import {
  validateProfileUpdatePayload,
  type ProfileUpdatePayload,
} from "@/lib/profile/update-payload";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type ProfileUpdateSaveResult =
  | Readonly<{ ok: true }>
  | Readonly<{ error: string; ok: false }>;

type ProfileUpdateContext =
  | {
      response: NextResponse;
      supabase?: never;
    }
  | {
      response?: never;
      supabase: SupabaseClient<Database>;
    };

function profileEditPath(error?: string): string {
  return pathWithParams("/profile/edit", { error });
}

async function requireActiveProfileUpdate(
  request: NextRequest,
): Promise<ProfileUpdateContext> {
  const supabase = await createSupabaseServerClient();
  const accountState = await getCurrentAccountState(supabase);

  if (accountState.state !== "active") {
    return {
      response: redirectTo(
        request,
        destinationForAccountState(accountState.state, "/profile/edit"),
      ),
    };
  }

  return { supabase };
}

function readRequiredString(
  formData: FormData,
  fieldName: string,
): string | null {
  const value = formData.get(fieldName);

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function readOptionalString(formData: FormData, fieldName: string): string | null {
  const value = formData.get(fieldName);

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function readRequiredInteger(
  formData: FormData,
  fieldName: string,
): number | null {
  const value = readRequiredString(formData, fieldName);
  const parsed = value ? Number(value) : Number.NaN;

  if (!Number.isSafeInteger(parsed)) {
    return null;
  }

  return parsed;
}

function readIdList(formData: FormData, fieldName: string): number[] {
  const ids = formData
    .getAll(fieldName)
    .map((value) => (typeof value === "string" ? Number(value) : Number.NaN))
    .filter((value) => Number.isSafeInteger(value) && value > 0);

  return [...new Set(ids)];
}

type FacultyProfileUpdatePayload = Readonly<{
  additionalAcademicProgramIds: number[];
  allowDirectContact: boolean;
  availability: string | null;
  bio: string | null;
  expertiseIds: number[];
  fullName: string;
  primaryAcademicProgramId: number;
  researchInterestIds: number[];
}>;

function validateFacultyProfileUpdatePayload(
  payload: FacultyProfileUpdatePayload,
): ProfileUpdateSaveResult {
  if (
    !payload.fullName ||
    payload.fullName.length < 2 ||
    payload.fullName.length > 120
  ) {
    return { error: "Full name must be 2-120 characters.", ok: false };
  }

  if (!payload.primaryAcademicProgramId) {
    return { error: "Choose a primary academic program.", ok: false };
  }

  if (payload.expertiseIds.length < 1) {
    return { error: "Choose at least one expertise area.", ok: false };
  }

  if (payload.bio && payload.bio.length > 500) {
    return { error: "Bio is limited to 500 characters.", ok: false };
  }

  if (payload.availability && payload.availability.length > 160) {
    return { error: "Availability is limited to 160 characters.", ok: false };
  }

  return { ok: true };
}

export async function saveProfileUpdate(
  supabase: SupabaseClient<Database>,
  payload: ProfileUpdatePayload,
): Promise<ProfileUpdateSaveResult> {
  const validation = validateProfileUpdatePayload(payload);

  if (!validation.ok) {
    return validation;
  }

  const result = await supabase.rpc("update_my_profile", {
    collaboration_goal_ids: payload.collaborationGoalIds,
    interest_ids: payload.interestIds,
    looking_for_skill_ids: payload.lookingForSkillIds,
    offer_skill_ids: payload.offerSkillIds,
    profile_academic_program_id: payload.academicProgramId,
    profile_allow_direct_contact: payload.allowDirectContact,
    profile_availability: payload.availability,
    profile_bio: payload.bio,
    profile_faculty_id: payload.facultyId,
    profile_full_name: payload.fullName,
    profile_year_of_study: payload.yearOfStudy,
  });

  if (result.error) {
    return {
      error: "We could not save your profile. Check your selections.",
      ok: false,
    };
  }

  return { ok: true };
}

async function saveFacultyProfileUpdate(
  supabase: SupabaseClient<Database>,
  payload: FacultyProfileUpdatePayload,
): Promise<ProfileUpdateSaveResult> {
  const validation = validateFacultyProfileUpdatePayload(payload);

  if (!validation.ok) {
    return validation;
  }

  const result = await supabase.rpc("update_faculty_profile", {
    additional_academic_program_ids: payload.additionalAcademicProgramIds,
    expertise_ids: payload.expertiseIds,
    primary_academic_program_id: payload.primaryAcademicProgramId,
    profile_allow_direct_contact: payload.allowDirectContact,
    profile_availability: payload.availability,
    profile_bio: payload.bio,
    profile_full_name: payload.fullName,
    research_interest_ids: payload.researchInterestIds,
  });

  if (result.error) {
    return {
      error: "We could not save your faculty profile. Check your selections.",
      ok: false,
    };
  }

  return { ok: true };
}

export async function updateMyProfile(request: NextRequest) {
  const formData = await request.formData();
  const context = await requireActiveProfileUpdate(request);

  if (context.response) {
    return context.response;
  }

  if (formData.get("profileRole") === "faculty") {
    const facultyPayload: FacultyProfileUpdatePayload = {
      additionalAcademicProgramIds: readIdList(
        formData,
        "additionalAcademicProgramId",
      ),
      allowDirectContact: formData.get("allowDirectContact") === "on",
      availability: readOptionalString(formData, "availability"),
      bio: readOptionalString(formData, "bio"),
      expertiseIds: readIdList(formData, "expertiseId"),
      fullName: readRequiredString(formData, "fullName") ?? "",
      primaryAcademicProgramId:
        readRequiredInteger(formData, "academicProgramId") ?? 0,
      researchInterestIds: readIdList(formData, "interestId"),
    };
    const facultyResult = await saveFacultyProfileUpdate(
      context.supabase,
      facultyPayload,
    );

    if (!facultyResult.ok) {
      return redirectTo(request, profileEditPath(facultyResult.error));
    }

    return redirectTo(request, "/profile?status=updated");
  }

  const payload: ProfileUpdatePayload = {
    academicProgramId: readRequiredInteger(formData, "academicProgramId") ?? 0,
    allowDirectContact: formData.get("allowDirectContact") === "on",
    availability: readOptionalString(formData, "availability"),
    bio: readOptionalString(formData, "bio"),
    collaborationGoalIds: readIdList(formData, "collaborationGoalId"),
    facultyId: readRequiredInteger(formData, "facultyId") ?? 0,
    fullName: readRequiredString(formData, "fullName") ?? "",
    interestIds: readIdList(formData, "interestId"),
    lookingForSkillIds: readIdList(formData, "lookingForSkillId"),
    offerSkillIds: readIdList(formData, "offerSkillId"),
    yearOfStudy: readRequiredInteger(formData, "yearOfStudy") ?? 0,
  };

  const result = await saveProfileUpdate(context.supabase, payload);

  if (!result.ok) {
    return redirectTo(request, profileEditPath(result.error));
  }

  return redirectTo(request, "/profile?status=updated");
}
