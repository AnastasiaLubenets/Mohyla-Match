import type { SupabaseClient } from "@supabase/supabase-js";

import type { ProfileSocialLink, SocialPlatform } from "./social-links.ts";
import type { Database } from "@/types/database";

type SupabaseServerClient = SupabaseClient<Database>;

export type AccountRole = Database["public"]["Enums"]["account_role"];
export type FacultyVerificationStatus =
  Database["public"]["Enums"]["faculty_verification_status"];

export type FacultyOption = Readonly<{
  id: number;
  display_name: string;
}>;

export type ProgramOption = Readonly<{
  avatar_variant_key: string;
  id: number;
  faculty_id: number;
  display_name: string;
  slug: string;
  specialty_code: string | null;
  study_level: Database["public"]["Enums"]["academic_program_level"];
}>;

export type SkillOption = Readonly<{
  id: number;
  category: string;
  is_featured: boolean;
  name: string;
  search_aliases: string[];
}>;

export type ExpertiseOption = Readonly<{
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

export type SafeFacultyProgram = Readonly<{
  facultyName: string;
  id: number;
  isPrimary: boolean;
  name: string;
  specialtyCode: string | null;
  studyLevel: Database["public"]["Enums"]["academic_program_level"];
}>;

export type SafeFacultyExpertise = Readonly<{
  category: string;
  id: number;
  name: string;
}>;

export type SafeProfile = Readonly<{
  accountRole: AccountRole;
  academicProgramName: string;
  academicPrograms: SafeFacultyProgram[];
  allowDirectContact: boolean;
  availability: string | null;
  bio: string | null;
  collaborationGoals: string[];
  createdAt: string;
  expertise: SafeFacultyExpertise[];
  facultyName: string;
  facultyVerificationStatus: FacultyVerificationStatus;
  fullName: string;
  interests: string[];
  offeredSkills: string[];
  socialLinks: ProfileSocialLink[];
  systemAvatarKey: string;
  userId: string;
  wantedSkills: string[];
  yearOfStudy: number | null;
}>;

export type EditProfileData = Readonly<{
  additionalAcademicProgramIds: number[];
  collaborationGoals: NamedOption[];
  expertise: ExpertiseOption[];
  faculties: FacultyOption[];
  facultyExpertiseIds: number[];
  interests: NamedOption[];
  offeredSkillIds: number[];
  profile: {
    account_role: AccountRole;
    academic_program_id: number;
    allow_direct_contact: boolean;
    availability: string | null;
    bio: string | null;
    faculty_id: number;
    faculty_verification_status: FacultyVerificationStatus;
    full_name: string;
    system_avatar_key: string;
    year_of_study: number | null;
  };
  programs: ProgramOption[];
  skills: SkillOption[];
  wantedSkillIds: number[];
  interestIds: number[];
  collaborationGoalIds: number[];
  socialLinks: ProfileSocialLink[];
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

async function loadSafeFacultyPrograms(
  supabase: SupabaseServerClient,
  userId: string,
  primaryProgramId: number,
): Promise<{
  error: boolean;
  programs: SafeFacultyProgram[];
}> {
  const linksResult = await supabase
    .from("profile_academic_programs")
    .select("academic_program_id,is_primary")
    .eq("user_id", userId);

  if (linksResult.error) {
    return { error: true, programs: [] };
  }

  const links = linksResult.data ?? [];
  const linkedProgramIds = links.map((link) => link.academic_program_id);
  const programIds = [...new Set([primaryProgramId, ...linkedProgramIds])];

  if (programIds.length === 0) {
    return { error: false, programs: [] };
  }

  const programsResult = await supabase
    .from("academic_programs")
    .select("id,display_name,faculty_id,specialty_code,study_level")
    .in("id", programIds)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("display_name", { ascending: true });

  if (programsResult.error) {
    return { error: true, programs: [] };
  }

  const programs = programsResult.data ?? [];
  const facultyIds = [...new Set(programs.map((program) => program.faculty_id))];
  const facultiesResult = await supabase
    .from("faculties")
    .select("id,display_name")
    .in("id", facultyIds)
    .eq("is_active", true);

  if (facultiesResult.error) {
    return { error: true, programs: [] };
  }

  const facultyNamesById = new Map(
    (facultiesResult.data ?? []).map((faculty) => [
      faculty.id,
      faculty.display_name,
    ]),
  );
  const primaryProgramIds = new Set(
    links
      .filter((link) => link.is_primary)
      .map((link) => link.academic_program_id),
  );

  return {
    error: false,
    programs: programs.map((program) => ({
      facultyName: facultyNamesById.get(program.faculty_id) ?? "NaUKMA",
      id: program.id,
      isPrimary:
        primaryProgramIds.size > 0
          ? primaryProgramIds.has(program.id)
          : program.id === primaryProgramId,
      name: program.display_name,
      specialtyCode: program.specialty_code,
      studyLevel: program.study_level,
    })),
  };
}

async function loadSafeFacultyExpertise(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<{
  error: boolean;
  expertise: SafeFacultyExpertise[];
}> {
  const linksResult = await supabase
    .from("faculty_expertise")
    .select("expertise_id")
    .eq("user_id", userId);

  if (linksResult.error) {
    return { error: true, expertise: [] };
  }

  const expertiseIds = [
    ...new Set((linksResult.data ?? []).map((link) => link.expertise_id)),
  ];

  if (expertiseIds.length === 0) {
    return { error: false, expertise: [] };
  }

  const expertiseResult = await supabase
    .from("expertise")
    .select("id,name,category_id,sort_order")
    .in("id", expertiseIds)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (expertiseResult.error) {
    return { error: true, expertise: [] };
  }

  const expertise = expertiseResult.data ?? [];
  const categoryIds = [
    ...new Set(expertise.map((expertiseItem) => expertiseItem.category_id)),
  ];
  const categoriesResult = await supabase
    .from("expertise_categories")
    .select("id,name")
    .in("id", categoryIds)
    .eq("is_active", true);

  if (categoriesResult.error) {
    return { error: true, expertise: [] };
  }

  const categoryNamesById = new Map(
    (categoriesResult.data ?? []).map((category) => [
      category.id,
      category.name,
    ]),
  );

  return {
    error: false,
    expertise: expertise.map((expertiseItem) => ({
      category: categoryNamesById.get(expertiseItem.category_id) ?? "Expertise",
      id: expertiseItem.id,
      name: expertiseItem.name,
    })),
  };
}

async function loadProfileSocialLinks(
  supabase: SupabaseServerClient,
  userId: string,
) {
  const result = await supabase
    .from("profile_social_links")
    .select("platform,url,sort_order")
    .eq("user_id", userId)
    .order("sort_order", { ascending: true })
    .order("platform", { ascending: true });

  return {
    error: result.error,
    socialLinks: (result.data ?? []).map((link) => ({
      platform: link.platform as SocialPlatform,
      sortOrder: link.sort_order,
      url: link.url,
    })),
  };
}

export async function loadSafeProfile(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<LoadResult<SafeProfile>> {
  const profileResult = await supabase
    .from("profiles")
    .select(
      "user_id,account_role,faculty_verification_status,full_name,faculty_id,academic_program_id,year_of_study,bio,availability,system_avatar_key,allow_direct_contact,created_at",
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
    socialLinksResult,
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
    loadProfileSocialLinks(supabase, userId),
  ]);

  if (
    facultyResult.error ||
    programResult.error ||
    skillsResult.error ||
    interestsResult.error ||
    goalsResult.error ||
    socialLinksResult.error
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
  const [
    facultyPrograms,
    facultyExpertise,
    skillNames,
    interestNames,
    goalNames,
  ] = await Promise.all([
    loadSafeFacultyPrograms(supabase, userId, profile.academic_program_id),
    loadSafeFacultyExpertise(supabase, userId),
    loadSkillNamesById(supabase, skillIds),
    loadNamesById(supabase, "interests", interestIds),
    loadNamesById(supabase, "collaboration_goals", goalIds),
  ]);

  if (
    facultyPrograms.error ||
    facultyExpertise.error ||
    skillNames.error ||
    interestNames.error ||
    goalNames.error
  ) {
    return { data: null, error: true };
  }

  return {
    data: {
      accountRole: profile.account_role,
      academicProgramName: programResult.data.display_name,
      academicPrograms: facultyPrograms.programs,
      allowDirectContact: profile.allow_direct_contact,
      availability: profile.availability,
      bio: profile.bio,
      collaborationGoals: namesFromMap(goalIds, goalNames.namesById),
      createdAt: profile.created_at,
      expertise: facultyExpertise.expertise,
      facultyName: facultyResult.data.display_name,
      facultyVerificationStatus: profile.faculty_verification_status,
      fullName: profile.full_name,
      interests: namesFromMap(interestIds, interestNames.namesById),
      offeredSkills: namesFromMap(
        profileSkills
          .filter((skill) => skill.direction === "offer")
          .map((skill) => skill.skill_id),
        skillNames.namesById,
      ),
      socialLinks: socialLinksResult.socialLinks,
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

export async function loadProfileEditData(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<LoadResult<EditProfileData>> {
  const [
    facultiesResult,
    programsResult,
    skillsResult,
    expertiseResult,
    expertiseCategoriesResult,
    interestsResult,
    goalsResult,
    profileResult,
    profileSkillsResult,
    profileExpertiseResult,
    profileAcademicProgramsResult,
    profileInterestsResult,
    profileGoalsResult,
    profileSocialLinksResult,
  ] = await Promise.all([
    supabase
      .from("faculties")
      .select("id,display_name")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("display_name", { ascending: true }),
    supabase
      .from("academic_programs")
      .select(
        "id,faculty_id,display_name,avatar_variant_key,slug,specialty_code,study_level",
      )
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
      .from("expertise")
      .select("id,category_id,name,search_aliases")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("expertise_categories")
      .select("id,name")
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
        "account_role,faculty_verification_status,full_name,faculty_id,academic_program_id,year_of_study,bio,availability,system_avatar_key,allow_direct_contact",
      )
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("profile_skills")
      .select("skill_id,direction")
      .eq("user_id", userId),
    supabase
      .from("faculty_expertise")
      .select("expertise_id")
      .eq("user_id", userId),
    supabase
      .from("profile_academic_programs")
      .select("academic_program_id,is_primary")
      .eq("user_id", userId),
    supabase
      .from("profile_interests")
      .select("interest_id")
      .eq("user_id", userId),
    supabase
      .from("profile_collaboration_goals")
      .select("collaboration_goal_id")
      .eq("user_id", userId),
    loadProfileSocialLinks(supabase, userId),
  ]);

  const loadError = [
    facultiesResult.error,
    programsResult.error,
    skillsResult.error,
    expertiseResult.error,
    expertiseCategoriesResult.error,
    interestsResult.error,
    goalsResult.error,
    profileResult.error,
    profileSkillsResult.error,
    profileExpertiseResult.error,
    profileAcademicProgramsResult.error,
    profileInterestsResult.error,
    profileGoalsResult.error,
    profileSocialLinksResult.error,
  ].some(Boolean);

  if (loadError) {
    return { data: null, error: true };
  }

  if (!profileResult.data) {
    return { data: null, error: false };
  }

  const profileSkills = profileSkillsResult.data ?? [];
  const categoryNamesById = new Map(
    (expertiseCategoriesResult.data ?? []).map((category) => [
      category.id,
      category.name,
    ]),
  );
  const profileAcademicProgramRows = profileAcademicProgramsResult.data ?? [];
  const primaryProgramId = profileResult.data.academic_program_id;

  return {
    data: {
      additionalAcademicProgramIds: profileAcademicProgramRows
        .filter((program) => !program.is_primary)
        .map((program) => program.academic_program_id),
      collaborationGoalIds: (profileGoalsResult.data ?? []).map(
        (goal) => goal.collaboration_goal_id,
      ),
      collaborationGoals: (goalsResult.data ?? []) as NamedOption[],
      expertise: (expertiseResult.data ?? []).map((expertise) => ({
        category: categoryNamesById.get(expertise.category_id) ?? "Expertise",
        id: expertise.id,
        is_featured: false,
        name: expertise.name,
        search_aliases: expertise.search_aliases,
      })),
      faculties: (facultiesResult.data ?? []) as FacultyOption[],
      facultyExpertiseIds: (profileExpertiseResult.data ?? []).map(
        (expertise) => expertise.expertise_id,
      ),
      interestIds: (profileInterestsResult.data ?? []).map(
        (interest) => interest.interest_id,
      ),
      interests: (interestsResult.data ?? []) as NamedOption[],
      offeredSkillIds: profileSkills
        .filter((skill) => skill.direction === "offer")
        .map((skill) => skill.skill_id),
      profile: {
        ...profileResult.data,
        academic_program_id:
          profileAcademicProgramRows.find((program) => program.is_primary)
            ?.academic_program_id ?? primaryProgramId,
      },
      programs: (programsResult.data ?? []) as ProgramOption[],
      skills: (skillsResult.data ?? []) as SkillOption[],
      socialLinks: profileSocialLinksResult.socialLinks,
      wantedSkillIds: profileSkills
        .filter((skill) => skill.direction === "looking_for")
        .map((skill) => skill.skill_id),
    },
    error: false,
  };
}
