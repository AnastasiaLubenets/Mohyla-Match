import type { SupabaseClient } from "@supabase/supabase-js";
import type { NextRequest, NextResponse } from "next/server";

import { destinationForAccountState } from "@/lib/auth/routing";
import { getCurrentAccountState } from "@/lib/auth/state";
import { pathWithParams, redirectTo } from "@/lib/auth/http";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type OnboardingContext =
  | {
      response: NextResponse;
      supabase?: never;
      userId?: never;
    }
  | {
      response?: never;
      supabase: SupabaseClient<Database>;
      userId: string;
    };

export function onboardingStepPath(step: number, error?: string): string {
  return pathWithParams("/account/setup", {
    step: String(step),
    error,
  });
}

export function onboardingRolePath(error?: string): string {
  return pathWithParams("/account/setup", { error });
}

export async function requireOnboardingRequest(
  request: NextRequest,
): Promise<OnboardingContext> {
  const supabase = await createSupabaseServerClient();
  const accountState = await getCurrentAccountState(supabase);

  if (accountState.state !== "onboarding_incomplete" || !accountState.userId) {
    return {
      response: redirectTo(
        request,
        destinationForAccountState(accountState.state, "/account/setup"),
      ),
    };
  }

  return {
    supabase,
    userId: accountState.userId,
  };
}

export function readRequiredString(
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

export function readOptionalString(
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

export function readRequiredInteger(
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

export function readIdList(formData: FormData, fieldName: string): number[] {
  const ids = formData
    .getAll(fieldName)
    .map((value) => (typeof value === "string" ? Number(value) : Number.NaN))
    .filter((value) => Number.isSafeInteger(value) && value > 0);

  return [...new Set(ids)];
}

export async function saveBasicProfile(request: NextRequest) {
  const formData = await request.formData();
  const context = await requireOnboardingRequest(request);

  if (context.response) {
    return context.response;
  }

  const fullName = readRequiredString(formData, "fullName");
  const facultyId = readRequiredInteger(formData, "facultyId");
  const academicProgramId = readRequiredInteger(formData, "academicProgramId");
  const yearOfStudy = readRequiredInteger(formData, "yearOfStudy");
  const bio = readOptionalString(formData, "bio");
  const availability = readOptionalString(formData, "availability");

  if (!fullName || fullName.length < 2 || fullName.length > 120) {
    return redirectTo(
      request,
      onboardingStepPath(1, "Full name must be 2-120 characters."),
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
      onboardingStepPath(1, "Choose a faculty, program, and year of study."),
    );
  }

  if (bio && bio.length > 500) {
    return redirectTo(request, onboardingStepPath(1, "Bio is limited to 500 characters."));
  }

  if (availability && availability.length > 160) {
    return redirectTo(
      request,
      onboardingStepPath(1, "Availability is limited to 160 characters."),
    );
  }

  const roleResult = await context.supabase.rpc("save_account_role", {
    selected_role: "student",
  });

  if (roleResult.error) {
    return redirectTo(
      request,
      onboardingStepPath(1, "We could not save your account type. Try again."),
    );
  }

  const [{ data: faculty }, { data: program }] = await Promise.all([
    context.supabase
      .from("faculties")
      .select("id")
      .eq("id", facultyId)
      .eq("is_active", true)
      .maybeSingle(),
    context.supabase
      .from("academic_programs")
      .select("id,faculty_id")
      .eq("id", academicProgramId)
      .eq("faculty_id", facultyId)
      .eq("is_active", true)
      .maybeSingle(),
  ]);

  if (!faculty || !program) {
    return redirectTo(
      request,
      onboardingStepPath(1, "Choose an active program from the selected faculty."),
    );
  }

  const { data: existingProfile, error: profileLookupError } =
    await context.supabase
      .from("profiles")
      .select("user_id")
      .eq("user_id", context.userId)
      .maybeSingle();

  if (profileLookupError) {
    return redirectTo(
      request,
      onboardingStepPath(1, "We could not load your profile. Try again."),
    );
  }

  const profilePayload = {
    full_name: fullName,
    faculty_id: facultyId,
    academic_program_id: academicProgramId,
    year_of_study: yearOfStudy,
    bio,
    availability,
  };
  const result = existingProfile
    ? await context.supabase
        .from("profiles")
        .update(profilePayload)
        .eq("user_id", context.userId)
    : await context.supabase.from("profiles").insert({
        user_id: context.userId,
        ...profilePayload,
      });

  if (result.error) {
    return redirectTo(
      request,
      onboardingStepPath(1, "We could not save your basic profile. Try again."),
    );
  }

  return redirectTo(request, onboardingStepPath(2));
}

export async function saveAccountRole(request: NextRequest) {
  const formData = await request.formData();
  const context = await requireOnboardingRequest(request);

  if (context.response) {
    return context.response;
  }

  const role = readRequiredString(formData, "accountRole");

  if (role !== "student" && role !== "faculty") {
    return redirectTo(request, onboardingRolePath("Choose student or faculty."));
  }

  const result = await context.supabase.rpc("save_account_role", {
    selected_role: role,
  });

  if (result.error) {
    return redirectTo(
      request,
      onboardingRolePath("We could not save your account type. Try again."),
    );
  }

  return redirectTo(request, role === "faculty" ? onboardingStepPath(1) : onboardingStepPath(1));
}

async function requireFacultyOnboarding(
  request: NextRequest,
): Promise<OnboardingContext> {
  const context = await requireOnboardingRequest(request);

  if (context.response) {
    return context;
  }

  const { data: selectedRole } = await context.supabase
    .from("account_roles")
    .select("account_role")
    .eq("user_id", context.userId)
    .maybeSingle();

  if (selectedRole?.account_role !== "faculty") {
    return {
      response: redirectTo(
        request,
        onboardingRolePath("Choose Faculty before continuing faculty setup."),
      ),
    };
  }

  return context;
}

export async function saveFacultyProgramsStep(request: NextRequest) {
  const formData = await request.formData();
  const context = await requireFacultyOnboarding(request);

  if (context.response) {
    return context.response;
  }

  const fullName = readRequiredString(formData, "fullName");
  const primaryAcademicProgramId = readRequiredInteger(
    formData,
    "primaryAcademicProgramId",
  );
  const additionalAcademicProgramIds = readIdList(
    formData,
    "additionalAcademicProgramId",
  ).filter((programId) => programId !== primaryAcademicProgramId);
  const bio = readOptionalString(formData, "bio");
  const availability = readOptionalString(formData, "availability");

  if (!fullName || fullName.length < 2 || fullName.length > 120) {
    return redirectTo(
      request,
      onboardingStepPath(1, "Full name must be 2-120 characters."),
    );
  }

  if (!primaryAcademicProgramId) {
    return redirectTo(
      request,
      onboardingStepPath(1, "Choose a primary academic program."),
    );
  }

  if (bio && bio.length > 500) {
    return redirectTo(request, onboardingStepPath(1, "Bio is limited to 500 characters."));
  }

  if (availability && availability.length > 160) {
    return redirectTo(
      request,
      onboardingStepPath(1, "Availability is limited to 160 characters."),
    );
  }

  const { data: primaryProgram } = await context.supabase
    .from("academic_programs")
    .select("id,faculty_id")
    .eq("id", primaryAcademicProgramId)
    .eq("is_active", true)
    .maybeSingle();

  if (!primaryProgram) {
    return redirectTo(
      request,
      onboardingStepPath(1, "Choose an active primary academic program."),
    );
  }

  if (additionalAcademicProgramIds.length > 0) {
    const { data: activeAdditionalPrograms, error: additionalError } =
      await context.supabase
        .from("academic_programs")
        .select("id")
        .in("id", additionalAcademicProgramIds)
        .eq("is_active", true);

    if (
      additionalError ||
      (activeAdditionalPrograms ?? []).length !== additionalAcademicProgramIds.length
    ) {
      return redirectTo(
        request,
        onboardingStepPath(1, "Choose only active additional academic programs."),
      );
    }
  }

  const profilePayload = {
    academic_program_id: primaryProgram.id,
    availability,
    bio,
    faculty_id: primaryProgram.faculty_id,
    full_name: fullName,
    year_of_study: null,
  };

  const { data: existingProfile, error: profileLookupError } =
    await context.supabase
      .from("profiles")
      .select("user_id")
      .eq("user_id", context.userId)
      .maybeSingle();

  if (profileLookupError) {
    return redirectTo(
      request,
      onboardingStepPath(1, "We could not load your profile. Try again."),
    );
  }

  const profileResult = existingProfile
    ? await context.supabase
        .from("profiles")
        .update(profilePayload)
        .eq("user_id", context.userId)
    : await context.supabase.from("profiles").insert({
        user_id: context.userId,
        ...profilePayload,
      });

  if (profileResult.error) {
    return redirectTo(
      request,
      onboardingStepPath(1, "We could not save your faculty profile. Try again."),
    );
  }

  const deletePrograms = await context.supabase
    .from("profile_academic_programs")
    .delete()
    .eq("user_id", context.userId);

  if (deletePrograms.error) {
    return redirectTo(
      request,
      onboardingStepPath(1, "We could not update your academic programs. Try again."),
    );
  }

  const programRows = [
    {
      academic_program_id: primaryProgram.id,
      is_primary: true,
      user_id: context.userId,
    },
    ...additionalAcademicProgramIds.map((programId) => ({
      academic_program_id: programId,
      is_primary: false,
      user_id: context.userId,
    })),
  ];
  const insertPrograms = await context.supabase
    .from("profile_academic_programs")
    .insert(programRows);

  if (insertPrograms.error) {
    return redirectTo(
      request,
      onboardingStepPath(1, "We could not save your academic programs. Try again."),
    );
  }

  return redirectTo(request, onboardingStepPath(2));
}

export async function saveFacultyExpertiseStep(request: NextRequest) {
  const formData = await request.formData();
  const context = await requireFacultyOnboarding(request);

  if (context.response) {
    return context.response;
  }

  const expertiseIds = readIdList(formData, "expertiseId");

  if (expertiseIds.length < 1) {
    return redirectTo(
      request,
      onboardingStepPath(2, "Choose at least one expertise area."),
    );
  }

  const { data: profile } = await context.supabase
    .from("profiles")
    .select("user_id,account_role")
    .eq("user_id", context.userId)
    .eq("account_role", "faculty")
    .eq("profile_status", "active")
    .maybeSingle();

  if (!profile) {
    return redirectTo(
      request,
      onboardingStepPath(1, "Save your academic programs before choosing expertise."),
    );
  }

  const { data: activeExpertise, error: expertiseError } =
    await context.supabase
      .from("expertise")
      .select("id")
      .in("id", expertiseIds)
      .eq("is_active", true);

  if (
    expertiseError ||
    (activeExpertise ?? []).length !== expertiseIds.length
  ) {
    return redirectTo(
      request,
      onboardingStepPath(2, "Choose active expertise areas from the list."),
    );
  }

  const deleteResult = await context.supabase
    .from("faculty_expertise")
    .delete()
    .eq("user_id", context.userId);

  if (deleteResult.error) {
    return redirectTo(
      request,
      onboardingStepPath(2, "We could not update your expertise. Try again."),
    );
  }

  const insertResult = await context.supabase.from("faculty_expertise").insert(
    expertiseIds.map((expertiseId) => ({
      expertise_id: expertiseId,
      user_id: context.userId,
    })),
  );

  if (insertResult.error) {
    return redirectTo(
      request,
      onboardingStepPath(2, "We could not save your expertise. Try again."),
    );
  }

  return redirectTo(request, onboardingStepPath(3));
}

export async function saveFacultyResearchStep(request: NextRequest) {
  const formData = await request.formData();
  const context = await requireFacultyOnboarding(request);

  if (context.response) {
    return context.response;
  }

  const isSkipped = typeof formData.get("skip") === "string";
  const interestIds = isSkipped ? [] : readIdList(formData, "interestId");

  const { data: activeInterests, error: interestsError } =
    interestIds.length > 0
      ? await context.supabase
          .from("interests")
          .select("id")
          .in("id", interestIds)
          .eq("is_active", true)
      : { data: [], error: null };

  if (interestsError || (activeInterests ?? []).length !== interestIds.length) {
    return redirectTo(
      request,
      onboardingStepPath(3, "Choose active research interests from the list."),
    );
  }

  const deleteInterests = await context.supabase
    .from("profile_interests")
    .delete()
    .eq("user_id", context.userId);

  if (deleteInterests.error) {
    return redirectTo(
      request,
      onboardingStepPath(3, "We could not update your research interests. Try again."),
    );
  }

  if (interestIds.length > 0) {
    const insertInterests = await context.supabase.from("profile_interests").insert(
      interestIds.map((interestId) => ({
        interest_id: interestId,
        user_id: context.userId,
      })),
    );

    if (insertInterests.error) {
      return redirectTo(
        request,
        onboardingStepPath(3, "We could not save your research interests. Try again."),
      );
    }
  }

  return redirectTo(request, onboardingStepPath(4));
}

export async function completeFacultyOnboarding(request: NextRequest) {
  const context = await requireFacultyOnboarding(request);

  if (context.response) {
    return context.response;
  }

  const completion = await context.supabase.rpc("complete_onboarding");

  if (completion.error) {
    return redirectTo(
      request,
      onboardingStepPath(4, "Complete all required faculty onboarding steps first."),
    );
  }

  return redirectTo(request, "/app?audience=faculty");
}

export async function saveSkillStep(
  request: NextRequest,
  direction: Database["public"]["Enums"]["skill_direction"],
  currentStep: number,
  nextStep: number,
  emptyMessage: string,
  options: Readonly<{
    allowEmpty?: boolean;
    skipFieldName?: string;
  }> = {},
) {
  const formData = await request.formData();
  const context = await requireOnboardingRequest(request);

  if (context.response) {
    return context.response;
  }

  const isSkipped =
    options.skipFieldName &&
    typeof formData.get(options.skipFieldName) === "string";
  const skillIds = isSkipped ? [] : readIdList(formData, "skillId");

  if (!options.allowEmpty && skillIds.length < 1) {
    return redirectTo(request, onboardingStepPath(currentStep, emptyMessage));
  }

  const { data: profile } = await context.supabase
    .from("profiles")
    .select("user_id")
    .eq("user_id", context.userId)
    .eq("profile_status", "active")
    .maybeSingle();

  if (!profile) {
    return redirectTo(
      request,
      onboardingStepPath(1, "Save your basic profile before choosing skills."),
    );
  }

  const { data: activeSkills, error: skillsError } =
    skillIds.length > 0
      ? await context.supabase
          .from("skills")
          .select("id")
          .in("id", skillIds)
          .eq("is_active", true)
      : { data: [], error: null };

  if (skillsError || (activeSkills ?? []).length !== skillIds.length) {
    return redirectTo(
      request,
      onboardingStepPath(currentStep, "Choose active skills from the list."),
    );
  }

  const deleteResult = await context.supabase
    .from("profile_skills")
    .delete()
    .eq("user_id", context.userId)
    .eq("direction", direction);

  if (deleteResult.error) {
    return redirectTo(
      request,
      onboardingStepPath(currentStep, "We could not update your skills. Try again."),
    );
  }

  if (skillIds.length > 0) {
    const insertResult = await context.supabase.from("profile_skills").insert(
      skillIds.map((skillId) => ({
        user_id: context.userId,
        skill_id: skillId,
        direction,
      })),
    );

    if (insertResult.error) {
      return redirectTo(
        request,
        onboardingStepPath(currentStep, "We could not save your skills. Try again."),
      );
    }
  }

  return redirectTo(request, onboardingStepPath(nextStep));
}

export async function saveBuildStep(request: NextRequest) {
  const formData = await request.formData();
  const context = await requireOnboardingRequest(request);

  if (context.response) {
    return context.response;
  }

  const isSkipped = typeof formData.get("skip") === "string";
  const interestIds = isSkipped ? [] : readIdList(formData, "interestId");
  const collaborationGoalIds = isSkipped
    ? []
    : readIdList(formData, "collaborationGoalId");

  const [
    { data: activeInterests, error: interestsError },
    { data: activeGoals, error: goalsError },
  ] = await Promise.all([
    interestIds.length > 0
      ? context.supabase
          .from("interests")
          .select("id")
          .in("id", interestIds)
          .eq("is_active", true)
      : Promise.resolve({ data: [], error: null }),
    collaborationGoalIds.length > 0
      ? context.supabase
          .from("collaboration_goals")
          .select("id")
          .in("id", collaborationGoalIds)
          .eq("is_active", true)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (
    interestsError ||
    goalsError ||
    (activeInterests ?? []).length !== interestIds.length ||
    (activeGoals ?? []).length !== collaborationGoalIds.length
  ) {
    return redirectTo(
      request,
      onboardingStepPath(4, "Choose active interests and goals from the lists."),
    );
  }

  const [deleteInterests, deleteGoals] = await Promise.all([
    context.supabase
      .from("profile_interests")
      .delete()
      .eq("user_id", context.userId),
    context.supabase
      .from("profile_collaboration_goals")
      .delete()
      .eq("user_id", context.userId),
  ]);

  if (deleteInterests.error || deleteGoals.error) {
    return redirectTo(
      request,
      onboardingStepPath(4, "We could not update your build preferences. Try again."),
    );
  }

  const [insertInterests, insertGoals] = await Promise.all([
    interestIds.length > 0
      ? context.supabase.from("profile_interests").insert(
          interestIds.map((interestId) => ({
            user_id: context.userId,
            interest_id: interestId,
          })),
        )
      : Promise.resolve({ error: null }),
    collaborationGoalIds.length > 0
      ? context.supabase.from("profile_collaboration_goals").insert(
          collaborationGoalIds.map((collaborationGoalId) => ({
            user_id: context.userId,
            collaboration_goal_id: collaborationGoalId,
          })),
        )
      : Promise.resolve({ error: null }),
  ]);

  if (insertInterests.error || insertGoals.error) {
    return redirectTo(
      request,
      onboardingStepPath(4, "We could not save your build preferences. Try again."),
    );
  }

  const completion = await context.supabase.rpc("complete_onboarding");

  if (completion.error) {
    return redirectTo(
      request,
      onboardingStepPath(4, "Complete all required onboarding steps first."),
    );
  }

  return redirectTo(request, "/app");
}
