import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

type SupabaseServerClient = SupabaseClient<Database>;

export type FacultyOption = Readonly<{
  id: number;
  display_name: string;
}>;

export type ProgramOption = Readonly<{
  id: number;
  faculty_id: number;
  display_name: string;
}>;

export type SkillOption = Readonly<{
  id: number;
  category: string;
  is_featured: boolean;
  name: string;
  search_aliases: string[];
}>;

export type NamedOption = Readonly<{
  id: number;
  name: string;
}>;

export type SafeProfile = Readonly<{
  academicProgramName: string;
  allowDirectContact: boolean;
  availability: string | null;
  bio: string | null;
  collaborationGoals: string[];
  createdAt: string;
  facultyName: string;
  fullName: string;
  interests: string[];
  offeredSkills: string[];
  systemAvatarKey: string;
  userId: string;
  wantedSkills: string[];
  yearOfStudy: number;
}>;

export type ProfileChromeSummary = Readonly<
  Pick<
    SafeProfile,
    | "academicProgramName"
    | "availability"
    | "facultyName"
    | "fullName"
    | "systemAvatarKey"
  >
>;

export type EditProfileData = Readonly<{
  collaborationGoals: NamedOption[];
  faculties: FacultyOption[];
  interests: NamedOption[];
  offeredSkillIds: number[];
  profile: {
    academic_program_id: number;
    allow_direct_contact: boolean;
    availability: string | null;
    bio: string | null;
    faculty_id: number;
    full_name: string;
    system_avatar_key: string;
    year_of_study: number;
  };
  programs: ProgramOption[];
  skills: SkillOption[];
  wantedSkillIds: number[];
  interestIds: number[];
  collaborationGoalIds: number[];
}>;

type LoadResult<T> = Readonly<{
  data: T | null;
  error: boolean;
}>;

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return uuidPattern.test(value);
}

function namesFromMap(ids: number[], namesById: Map<number, string>) {
  return ids
    .map((id) => namesById.get(id))
    .filter((name): name is string => Boolean(name));
}

async function loadNamesById(
  supabase: SupabaseServerClient,
  tableName: "interests" | "collaboration_goals",
  ids: number[],
) {
  if (ids.length === 0) {
    return { error: null, namesById: new Map<number, string>() };
  }

  const result = await supabase
    .from(tableName)
    .select("id,name")
    .in("id", ids)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  return {
    error: result.error,
    namesById: new Map((result.data ?? []).map((item) => [item.id, item.name])),
  };
}

async function loadSkillNamesById(
  supabase: SupabaseServerClient,
  ids: number[],
) {
  if (ids.length === 0) {
    return { error: null, namesById: new Map<number, string>() };
  }

  const result = await supabase
    .from("skills")
    .select("id,name")
    .in("id", ids)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  return {
    error: result.error,
    namesById: new Map((result.data ?? []).map((item) => [item.id, item.name])),
  };
}

export async function loadSafeProfile(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<LoadResult<SafeProfile>> {
  const profileResult = await supabase
    .from("profiles")
    .select(
      "user_id,full_name,faculty_id,academic_program_id,year_of_study,bio,availability,system_avatar_key,allow_direct_contact,created_at",
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (profileResult.error) {
    return { data: null, error: true };
  }

  const profile = profileResult.data;
  if (!profile) {
    return { data: null, error: false };
  }

  const [
    facultyResult,
    programResult,
    skillsResult,
    interestsResult,
    goalsResult,
  ] = await Promise.all([
    supabase
      .from("faculties")
      .select("display_name")
      .eq("id", profile.faculty_id)
      .eq("is_active", true)
      .maybeSingle(),
    supabase
      .from("academic_programs")
      .select("display_name")
      .eq("id", profile.academic_program_id)
      .eq("faculty_id", profile.faculty_id)
      .eq("is_active", true)
      .maybeSingle(),
    supabase
      .from("profile_skills")
      .select("skill_id,direction")
      .eq("user_id", userId),
    supabase
      .from("profile_interests")
      .select("interest_id")
      .eq("user_id", userId),
    supabase
      .from("profile_collaboration_goals")
      .select("collaboration_goal_id")
      .eq("user_id", userId),
  ]);

  if (
    facultyResult.error ||
    programResult.error ||
    skillsResult.error ||
    interestsResult.error ||
    goalsResult.error
  ) {
    return { data: null, error: true };
  }

  if (!facultyResult.data || !programResult.data) {
    return { data: null, error: false };
  }

  const profileSkills = skillsResult.data ?? [];
  const skillIds = [...new Set(profileSkills.map((skill) => skill.skill_id))];
  const interestIds = [
    ...new Set((interestsResult.data ?? []).map((interest) => interest.interest_id)),
  ];
  const goalIds = [
    ...new Set((goalsResult.data ?? []).map((goal) => goal.collaboration_goal_id)),
  ];
  const [skillNames, interestNames, goalNames] = await Promise.all([
    loadSkillNamesById(supabase, skillIds),
    loadNamesById(supabase, "interests", interestIds),
    loadNamesById(supabase, "collaboration_goals", goalIds),
  ]);

  if (skillNames.error || interestNames.error || goalNames.error) {
    return { data: null, error: true };
  }

  return {
    data: {
      academicProgramName: programResult.data.display_name,
      allowDirectContact: profile.allow_direct_contact,
      availability: profile.availability,
      bio: profile.bio,
      collaborationGoals: namesFromMap(goalIds, goalNames.namesById),
      createdAt: profile.created_at,
      facultyName: facultyResult.data.display_name,
      fullName: profile.full_name,
      interests: namesFromMap(interestIds, interestNames.namesById),
      offeredSkills: namesFromMap(
        profileSkills
          .filter((skill) => skill.direction === "offer")
          .map((skill) => skill.skill_id),
        skillNames.namesById,
      ),
      systemAvatarKey: profile.system_avatar_key,
      userId: profile.user_id,
      wantedSkills: namesFromMap(
        profileSkills
          .filter((skill) => skill.direction === "looking_for")
          .map((skill) => skill.skill_id),
        skillNames.namesById,
      ),
      yearOfStudy: profile.year_of_study,
    },
    error: false,
  };
}

export async function loadProfileChromeSummary(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<LoadResult<ProfileChromeSummary>> {
  const profileResult = await supabase
    .from("profiles")
    .select(
      "full_name,faculty_id,academic_program_id,availability,system_avatar_key",
    )
    .eq("user_id", userId)
    .eq("profile_status", "active")
    .is("deleted_at", null)
    .maybeSingle();

  if (profileResult.error) {
    return { data: null, error: true };
  }

  const profile = profileResult.data;
  if (!profile) {
    return { data: null, error: false };
  }

  const [facultyResult, programResult] = await Promise.all([
    supabase
      .from("faculties")
      .select("display_name")
      .eq("id", profile.faculty_id)
      .eq("is_active", true)
      .maybeSingle(),
    supabase
      .from("academic_programs")
      .select("display_name")
      .eq("id", profile.academic_program_id)
      .eq("faculty_id", profile.faculty_id)
      .eq("is_active", true)
      .maybeSingle(),
  ]);

  if (facultyResult.error || programResult.error) {
    return { data: null, error: true };
  }

  if (!facultyResult.data || !programResult.data) {
    return { data: null, error: false };
  }

  return {
    data: {
      academicProgramName: programResult.data.display_name,
      availability: profile.availability,
      facultyName: facultyResult.data.display_name,
      fullName: profile.full_name,
      systemAvatarKey: profile.system_avatar_key,
    },
    error: false,
  };
}

export async function loadProfileEditData(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<LoadResult<EditProfileData>> {
  const [
    facultiesResult,
    programsResult,
    skillsResult,
    interestsResult,
    goalsResult,
    profileResult,
    profileSkillsResult,
    profileInterestsResult,
    profileGoalsResult,
  ] = await Promise.all([
    supabase
      .from("faculties")
      .select("id,display_name")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("display_name", { ascending: true }),
    supabase
      .from("academic_programs")
      .select("id,faculty_id,display_name")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("display_name", { ascending: true }),
    supabase
      .from("skills")
      .select("id,category,is_featured,name,search_aliases")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("interests")
      .select("id,name")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("collaboration_goals")
      .select("id,name")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("profiles")
      .select(
        "full_name,faculty_id,academic_program_id,year_of_study,bio,availability,system_avatar_key,allow_direct_contact",
      )
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("profile_skills")
      .select("skill_id,direction")
      .eq("user_id", userId),
    supabase
      .from("profile_interests")
      .select("interest_id")
      .eq("user_id", userId),
    supabase
      .from("profile_collaboration_goals")
      .select("collaboration_goal_id")
      .eq("user_id", userId),
  ]);

  const loadError = [
    facultiesResult.error,
    programsResult.error,
    skillsResult.error,
    interestsResult.error,
    goalsResult.error,
    profileResult.error,
    profileSkillsResult.error,
    profileInterestsResult.error,
    profileGoalsResult.error,
  ].some(Boolean);

  if (loadError) {
    return { data: null, error: true };
  }

  if (!profileResult.data) {
    return { data: null, error: false };
  }

  const profileSkills = profileSkillsResult.data ?? [];

  return {
    data: {
      collaborationGoalIds: (profileGoalsResult.data ?? []).map(
        (goal) => goal.collaboration_goal_id,
      ),
      collaborationGoals: (goalsResult.data ?? []) as NamedOption[],
      faculties: (facultiesResult.data ?? []) as FacultyOption[],
      interestIds: (profileInterestsResult.data ?? []).map(
        (interest) => interest.interest_id,
      ),
      interests: (interestsResult.data ?? []) as NamedOption[],
      offeredSkillIds: profileSkills
        .filter((skill) => skill.direction === "offer")
        .map((skill) => skill.skill_id),
      profile: profileResult.data,
      programs: (programsResult.data ?? []) as ProgramOption[],
      skills: (skillsResult.data ?? []) as SkillOption[],
      wantedSkillIds: profileSkills
        .filter((skill) => skill.direction === "looking_for")
        .map((skill) => skill.skill_id),
    },
    error: false,
  };
}
