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

export async function updateMyProfile(request: NextRequest) {
  const formData = await request.formData();
  const context = await requireActiveProfileUpdate(request);

  if (context.response) {
    return context.response;
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
