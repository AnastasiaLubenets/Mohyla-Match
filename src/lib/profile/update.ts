import type { SupabaseClient } from "@supabase/supabase-js";
import type { NextRequest, NextResponse } from "next/server";

import { destinationForAccountState } from "@/lib/auth/routing";
import { getCurrentAccountState } from "@/lib/auth/state";
import { pathWithParams, redirectTo } from "@/lib/auth/http";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

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

export async function updateMyProfile(request: NextRequest) {
  const formData = await request.formData();
  const context = await requireActiveProfileUpdate(request);

  if (context.response) {
    return context.response;
  }

  const fullName = readRequiredString(formData, "fullName");
  const facultyId = readRequiredInteger(formData, "facultyId");
  const academicProgramId = readRequiredInteger(formData, "academicProgramId");
  const yearOfStudy = readRequiredInteger(formData, "yearOfStudy");
  const bio = readOptionalString(formData, "bio");
  const availability = readOptionalString(formData, "availability");
  const offerSkillIds = readIdList(formData, "offerSkillId");
  const lookingForSkillIds = readIdList(formData, "lookingForSkillId");
  const interestIds = readIdList(formData, "interestId");
  const collaborationGoalIds = readIdList(formData, "collaborationGoalId");

  if (!fullName || fullName.length < 2 || fullName.length > 120) {
    return redirectTo(
      request,
      profileEditPath("Full name must be 2-120 characters."),
    );
  }

  if (
    !facultyId ||
    !academicProgramId ||
    !yearOfStudy ||
    yearOfStudy < 1 ||
    yearOfStudy > 6
  ) {
    return redirectTo(
      request,
      profileEditPath("Choose a faculty, program, and year of study."),
    );
  }

  if (bio && bio.length > 500) {
    return redirectTo(request, profileEditPath("Bio is limited to 500 characters."));
  }

  if (availability && availability.length > 160) {
    return redirectTo(
      request,
      profileEditPath("Availability is limited to 160 characters."),
    );
  }

  if (
    offerSkillIds.length < 1 ||
    interestIds.length < 1 ||
    collaborationGoalIds.length < 1
  ) {
    return redirectTo(
      request,
      profileEditPath("Choose at least one offered skill, interest, and goal."),
    );
  }

  const result = await context.supabase.rpc("update_my_profile", {
    collaboration_goal_ids: collaborationGoalIds,
    interest_ids: interestIds,
    looking_for_skill_ids: lookingForSkillIds,
    offer_skill_ids: offerSkillIds,
    profile_academic_program_id: academicProgramId,
    profile_availability: availability,
    profile_bio: bio,
    profile_faculty_id: facultyId,
    profile_full_name: fullName,
    profile_year_of_study: yearOfStudy,
  });

  if (result.error) {
    return redirectTo(
      request,
      profileEditPath("We could not save your profile. Check your selections."),
    );
  }

  return redirectTo(request, "/profile?status=updated");
}
