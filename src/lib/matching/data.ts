import type { SupabaseClient } from "@supabase/supabase-js";

import {
  buildSupportedYearOptions,
  type DiscoveryFilterOptions,
} from "@/lib/matching/discovery-filters";
import {
  normalizeProfileAvatarMode,
  resolveProgramAvatarVariantKey,
  type ProfileAvatarMode,
} from "@/lib/profile/program-avatar";
import {
  isSocialPlatform,
  type ProfileSocialLink,
} from "@/lib/profile/social-links";
import type { Database, Json } from "@/types/database";

type SupabaseServerClient = SupabaseClient<Database>;

export type MatchingSkill = Readonly<{
  category: string;
  id: number;
  name: string;
  slug: string;
}>;

export type MatchingItem = Readonly<{
  id: number;
  name: string;
  slug: string;
}>;

export type FacultyProgramItem = Readonly<{
  avatarVariantKey: string | null;
  facultyName: string;
  id: number;
  isPrimary: boolean;
  name: string;
  slug: string;
  specialtyCode: string | null;
  studyLevel: "bachelor" | "master";
}>;

export type FacultyExpertiseItem = Readonly<{
  category: string;
  id: number;
  name: string;
  slug: string;
}>;

export type FacultyDiscoveryProfile = Readonly<{
  academicPrograms: FacultyProgramItem[];
  avatarMode: ProfileAvatarMode;
  avatarVariantKey: string | null;
  availability: string | null;
  bio: string | null;
  customAvatarKey: string | null;
  expertise: FacultyExpertiseItem[];
  facultyName: string;
  fullName: string;
  primaryAcademicProgramName: string;
  researchInterests: MatchingItem[];
  systemAvatarKey: string;
  userId: string;
  verificationStatus: "unverified" | "verified";
}>;

export type DiscoveryCandidate = Readonly<{
  academicProgramName: string;
  avatarMode: ProfileAvatarMode;
  availability: string | null;
  bio: string | null;
  collaborationGoals: MatchingItem[];
  compatibilityScore: number | null;
  customAvatarKey: string | null;
  facultyName: string;
  fullName: string;
  interests: MatchingItem[];
  lookingForSkills: MatchingSkill[];
  matchedIOffer: MatchingSkill[];
  matchedTheyOffer: MatchingSkill[];
  offeredSkills: MatchingSkill[];
  scoreBreakdown: Json;
  sharedCollaborationGoals: MatchingItem[];
  sharedInterests: MatchingItem[];
  socialLinks: ProfileSocialLink[];
  systemAvatarKey: string;
  userId: string;
  yearOfStudy: number;
}>;

export type MatchSummary = Readonly<{
  academicProgramName: string;
  avatarMode: ProfileAvatarMode;
  availability: string | null;
  bio: string | null;
  canDirectContact: boolean;
  collaborationGoals: MatchingItem[];
  customAvatarKey: string | null;
  facultyName: string;
  fullName: string;
  interests: MatchingItem[];
  lookingForSkills: MatchingSkill[];
  matchId: string;
  matchedAt: string;
  offeredSkills: MatchingSkill[];
  systemAvatarKey: string;
  userId: string;
  yearOfStudy: number;
}>;

export type SavedProfileSummary = Readonly<{
  academicProgramName: string;
  avatarMode: ProfileAvatarMode;
  availability: string | null;
  bio: string | null;
  canDirectContact: boolean;
  collaborationGoals: MatchingItem[];
  customAvatarKey: string | null;
  facultyName: string;
  fullName: string;
  interests: MatchingItem[];
  lookingForSkills: MatchingSkill[];
  offeredSkills: MatchingSkill[];
  savedAt: string;
  systemAvatarKey: string;
  userId: string;
  yearOfStudy: number;
}>;

export type ProfileConnectionStatus = Readonly<{
  blockedByMe: boolean;
  canDirectContact: boolean;
  isMatched: boolean;
  matchId: string | null;
  outgoingAction: "connect" | "save" | "skip" | null;
}>;

type LoadResult<T> = Readonly<{
  data: T | null;
  error: boolean;
}>;

type AvatarPreference = Readonly<{
  avatarMode: ProfileAvatarMode;
  customAvatarKey: string | null;
}>;

const defaultAvatarPreference: AvatarPreference = {
  avatarMode: "program",
  customAvatarKey: null,
};

function uniqueFilterOptions(options: { label: string; value: string }[]) {
  return [...new Map(options.map((option) => [option.value, option])).values()];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function readNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function parseSkillItems(value: Json): MatchingSkill[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!isRecord(item)) {
        return null;
      }

      const id = readNumber(item.id);
      const slug = readString(item.slug);
      const name = readString(item.name);
      const category = readString(item.category);

      if (id === null || !slug || !name || !category) {
        return null;
      }

      return { category, id, name, slug };
    })
    .filter((item): item is MatchingSkill => Boolean(item));
}

function parseNamedItems(value: Json): MatchingItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!isRecord(item)) {
        return null;
      }

      const id = readNumber(item.id);
      const slug = readString(item.slug);
      const name = readString(item.name);

      if (id === null || !slug || !name) {
        return null;
      }

      return { id, name, slug };
    })
    .filter((item): item is MatchingItem => Boolean(item));
}

function parseFacultyProgramItems(value: Json): FacultyProgramItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!isRecord(item)) {
        return null;
      }

      const id = readNumber(item.id);
      const slug = readString(item.slug);
      const name = readString(item.name);
      const facultyName = readString(item.facultyName);
      const studyLevel = readString(item.studyLevel);
      const specialtyCode = readString(item.specialtyCode);
      const avatarVariantKey =
        readString(item.avatarVariantKey) ?? readString(item.avatar_variant_key);

      if (
        id === null ||
        !slug ||
        !name ||
        !facultyName ||
        (studyLevel !== "bachelor" && studyLevel !== "master")
      ) {
        return null;
      }

      return {
        avatarVariantKey,
        facultyName,
        id,
        isPrimary: item.isPrimary === true,
        name,
        slug,
        specialtyCode,
        studyLevel,
      };
    })
    .filter((item): item is FacultyProgramItem => Boolean(item));
}

function parseFacultyExpertiseItems(value: Json): FacultyExpertiseItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!isRecord(item)) {
        return null;
      }

      const id = readNumber(item.id);
      const slug = readString(item.slug);
      const name = readString(item.name);
      const category = readString(item.category);

      if (id === null || !slug || !name || !category) {
        return null;
      }

      return { category, id, name, slug };
    })
    .filter((item): item is FacultyExpertiseItem => Boolean(item));
}

async function loadAvatarPreferences(
  supabase: SupabaseServerClient,
  userIds: readonly string[],
): Promise<{
  error: boolean;
  preferencesByUserId: Map<string, AvatarPreference>;
}> {
  const uniqueUserIds = [...new Set(userIds)];

  if (uniqueUserIds.length === 0) {
    return { error: false, preferencesByUserId: new Map() };
  }

  const result = await supabase
    .from("profiles")
    .select("user_id,avatar_mode,custom_avatar_key")
    .in("user_id", uniqueUserIds);

  if (result.error) {
    return { error: true, preferencesByUserId: new Map() };
  }

  return {
    error: false,
    preferencesByUserId: new Map(
      (result.data ?? []).map((profile) => [
        profile.user_id,
        {
          avatarMode: normalizeProfileAvatarMode(profile.avatar_mode),
          customAvatarKey: profile.custom_avatar_key,
        },
      ]),
    ),
  };
}

async function loadCandidateSocialLinks(
  supabase: SupabaseServerClient,
  userIds: readonly string[],
): Promise<{
  error: boolean;
  socialLinksByUserId: Map<string, ProfileSocialLink[]>;
}> {
  const uniqueUserIds = [...new Set(userIds)];

  if (uniqueUserIds.length === 0) {
    return { error: false, socialLinksByUserId: new Map() };
  }

  const result = await supabase
    .from("profile_social_links")
    .select("user_id,platform,url,sort_order")
    .in("user_id", uniqueUserIds)
    .order("sort_order", { ascending: true })
    .order("platform", { ascending: true });

  if (result.error) {
    return { error: true, socialLinksByUserId: new Map() };
  }

  const socialLinksByUserId = new Map<string, ProfileSocialLink[]>();

  for (const link of result.data ?? []) {
    if (!isSocialPlatform(link.platform)) {
      continue;
    }

    const userSocialLinks = socialLinksByUserId.get(link.user_id) ?? [];
    userSocialLinks.push({
      platform: link.platform,
      sortOrder: link.sort_order,
      url: link.url,
    });
    socialLinksByUserId.set(link.user_id, userSocialLinks);
  }

  return { error: false, socialLinksByUserId };
}

async function loadFacultyProgramAvatarVariants(
  supabase: SupabaseServerClient,
  rows: readonly FacultyDiscoveryRow[],
): Promise<{
  avatarVariantKeysByProgramId: Map<number, string>;
  error: boolean;
}> {
  const programIds = [
    ...new Set(
      rows.flatMap((profile) =>
        parseFacultyProgramItems(profile.academic_programs).map(
          (program) => program.id,
        ),
      ),
    ),
  ];

  if (programIds.length === 0) {
    return { avatarVariantKeysByProgramId: new Map(), error: false };
  }

  const result = await supabase
    .from("academic_programs")
    .select("id,avatar_variant_key")
    .in("id", programIds);

  if (result.error) {
    return { avatarVariantKeysByProgramId: new Map(), error: true };
  }

  return {
    avatarVariantKeysByProgramId: new Map(
      (result.data ?? []).map((program) => [
        program.id,
        program.avatar_variant_key,
      ]),
    ),
    error: false,
  };
}

export async function loadDiscoveryCandidates(
  supabase: SupabaseServerClient,
  limit = 12,
): Promise<LoadResult<DiscoveryCandidate[]>> {
  const result = await supabase.rpc("get_discovery_candidates", {
    candidate_limit: limit,
  });

  if (result.error) {
    return { data: null, error: true };
  }

  const rows = result.data ?? [];
  const userIds = rows.map((candidate) => candidate.user_id);
  const [avatarPreferences, socialLinks] = await Promise.all([
    loadAvatarPreferences(supabase, userIds),
    loadCandidateSocialLinks(supabase, userIds),
  ]);

  if (avatarPreferences.error || socialLinks.error) {
    return { data: null, error: true };
  }

  return {
    data: rows.map((candidate) =>
      mapDiscoveryCandidate(
        candidate,
        avatarPreferences.preferencesByUserId.get(candidate.user_id),
        socialLinks.socialLinksByUserId.get(candidate.user_id),
        candidate.compatibility_score,
      ),
    ),
    error: false,
  };
}

type DiscoveryCandidateRow =
  Database["public"]["Functions"]["get_discovery_candidates"]["Returns"][number];

function mapDiscoveryCandidate(
  candidate: DiscoveryCandidateRow,
  avatarPreference: AvatarPreference = defaultAvatarPreference,
  socialLinks: ProfileSocialLink[] = [],
  compatibilityScore: number | null = candidate.compatibility_score,
): DiscoveryCandidate {
  return {
    academicProgramName: candidate.academic_program_name,
    avatarMode: avatarPreference.avatarMode,
    availability: candidate.availability,
    bio: candidate.bio,
    collaborationGoals: parseNamedItems(candidate.collaboration_goals),
    compatibilityScore,
    customAvatarKey: avatarPreference.customAvatarKey,
    facultyName: candidate.faculty_name,
    fullName: candidate.full_name,
    interests: parseNamedItems(candidate.interests),
    lookingForSkills: parseSkillItems(candidate.looking_for_skills),
    matchedIOffer: parseSkillItems(candidate.matched_i_offer),
    matchedTheyOffer: parseSkillItems(candidate.matched_they_offer),
    offeredSkills: parseSkillItems(candidate.offered_skills),
    scoreBreakdown: candidate.score_breakdown,
    sharedCollaborationGoals: parseNamedItems(
      candidate.shared_collaboration_goals,
    ),
    sharedInterests: parseNamedItems(candidate.shared_interests),
    socialLinks,
    systemAvatarKey: candidate.system_avatar_key,
    userId: candidate.user_id,
    yearOfStudy: candidate.year_of_study,
  };
}

export async function loadAllDiscoveryProfiles(
  supabase: SupabaseServerClient,
  limit = 500,
): Promise<LoadResult<DiscoveryCandidate[]>> {
  const result = await supabase.rpc("get_all_discovery_profiles", {
    profile_limit: limit,
  });

  if (result.error) {
    return { data: null, error: true };
  }

  const rows = result.data ?? [];
  const userIds = rows.map((profile) => profile.user_id);
  const [avatarPreferences, socialLinks] = await Promise.all([
    loadAvatarPreferences(supabase, userIds),
    loadCandidateSocialLinks(supabase, userIds),
  ]);

  if (avatarPreferences.error || socialLinks.error) {
    return { data: null, error: true };
  }

  return {
    data: rows.map((profile) =>
      mapDiscoveryCandidate(
        profile,
        avatarPreferences.preferencesByUserId.get(profile.user_id),
        socialLinks.socialLinksByUserId.get(profile.user_id),
        null,
      ),
    ),
    error: false,
  };
}

type FacultyDiscoveryRow =
  Database["public"]["Functions"]["get_faculty_discovery_profiles"]["Returns"][number];

function mapFacultyDiscoveryProfile(
  profile: FacultyDiscoveryRow,
  avatarPreference: AvatarPreference = defaultAvatarPreference,
  programAvatarVariantsById: ReadonlyMap<number, string> = new Map(),
): FacultyDiscoveryProfile {
  const academicPrograms = parseFacultyProgramItems(profile.academic_programs).map(
    (program) => ({
      ...program,
      avatarVariantKey:
        program.avatarVariantKey ?? programAvatarVariantsById.get(program.id) ?? null,
    }),
  );

  return {
    academicPrograms,
    avatarMode: avatarPreference.avatarMode,
    avatarVariantKey: resolveProgramAvatarVariantKey(
      academicPrograms,
      profile.system_avatar_key,
    ),
    availability: profile.availability,
    bio: profile.bio,
    customAvatarKey: avatarPreference.customAvatarKey,
    expertise: parseFacultyExpertiseItems(profile.expertise),
    facultyName: profile.faculty_name,
    fullName: profile.full_name,
    primaryAcademicProgramName: profile.primary_academic_program_name,
    researchInterests: parseNamedItems(profile.research_interests),
    systemAvatarKey: profile.system_avatar_key,
    userId: profile.user_id,
    verificationStatus: profile.verification_status,
  };
}

export async function loadFacultyDiscoveryProfiles(
  supabase: SupabaseServerClient,
  limit = 500,
): Promise<LoadResult<FacultyDiscoveryProfile[]>> {
  const result = await supabase.rpc("get_faculty_discovery_profiles", {
    profile_limit: limit,
  });

  if (result.error) {
    return { data: null, error: true };
  }

  const rows = result.data ?? [];
  const [avatarPreferences, programAvatarVariants] = await Promise.all([
    loadAvatarPreferences(
      supabase,
      rows.map((profile) => profile.user_id),
    ),
    loadFacultyProgramAvatarVariants(supabase, rows),
  ]);

  if (avatarPreferences.error || programAvatarVariants.error) {
    return { data: null, error: true };
  }

  return {
    data: rows.map((profile) =>
      mapFacultyDiscoveryProfile(
        profile,
        avatarPreferences.preferencesByUserId.get(profile.user_id),
        programAvatarVariants.avatarVariantKeysByProgramId,
      ),
    ),
    error: false,
  };
}

export async function loadDiscoveryFilterOptions(
  supabase: SupabaseServerClient,
): Promise<LoadResult<DiscoveryFilterOptions>> {
  const [programsResult, skillsResult, interestsResult, goalsResult] =
    await Promise.all([
      supabase
        .from("academic_programs")
        .select("display_name, sort_order")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("display_name", { ascending: true }),
      supabase
        .from("skills")
        .select("name, slug, sort_order")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true }),
      supabase
        .from("interests")
        .select("name, slug, sort_order")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true }),
      supabase
        .from("collaboration_goals")
        .select("name, slug, sort_order")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true }),
    ]);

  if (
    programsResult.error ||
    skillsResult.error ||
    interestsResult.error ||
    goalsResult.error
  ) {
    return { data: null, error: true };
  }

  return {
    data: {
      collaborationGoals: (goalsResult.data ?? []).map((goal) => ({
        label: goal.name,
        value: goal.slug,
      })),
      interests: (interestsResult.data ?? []).map((interest) => ({
        label: interest.name,
        value: interest.slug,
      })),
      programs: uniqueFilterOptions(
        (programsResult.data ?? []).map((program) => ({
          label: program.display_name,
          value: program.display_name,
        })),
      ),
      skills: (skillsResult.data ?? []).map((skill) => ({
        label: skill.name,
        value: skill.slug,
      })),
      years: buildSupportedYearOptions(),
    },
    error: false,
  };
}

export async function loadMyMatches(
  supabase: SupabaseServerClient,
  limit = 50,
): Promise<LoadResult<MatchSummary[]>> {
  const result = await supabase.rpc("get_my_matches", { match_limit: limit });

  if (result.error) {
    return { data: null, error: true };
  }

  const rows = result.data ?? [];
  const avatarPreferences = await loadAvatarPreferences(
    supabase,
    rows.map((match) => match.user_id),
  );

  if (avatarPreferences.error) {
    return { data: null, error: true };
  }

  return {
    data: rows.map((match) => {
      const avatarPreference =
        avatarPreferences.preferencesByUserId.get(match.user_id) ??
        defaultAvatarPreference;

      return {
        academicProgramName: match.academic_program_name,
        avatarMode: avatarPreference.avatarMode,
        availability: match.availability,
        bio: match.bio,
        canDirectContact: match.can_direct_contact,
        collaborationGoals: parseNamedItems(match.collaboration_goals),
        customAvatarKey: avatarPreference.customAvatarKey,
        facultyName: match.faculty_name,
        fullName: match.full_name,
        interests: parseNamedItems(match.interests),
        lookingForSkills: parseSkillItems(match.looking_for_skills),
        matchId: match.match_id,
        matchedAt: match.matched_at,
        offeredSkills: parseSkillItems(match.offered_skills),
        systemAvatarKey: match.system_avatar_key,
        userId: match.user_id,
        yearOfStudy: match.year_of_study,
      };
    }),
    error: false,
  };
}

export async function loadSavedProfiles(
  supabase: SupabaseServerClient,
  limit = 50,
): Promise<LoadResult<SavedProfileSummary[]>> {
  const result = await supabase.rpc("get_saved_profiles", {
    saved_limit: limit,
  });

  if (result.error) {
    return { data: null, error: true };
  }

  const rows = result.data ?? [];
  const avatarPreferences = await loadAvatarPreferences(
    supabase,
    rows.map((profile) => profile.user_id),
  );

  if (avatarPreferences.error) {
    return { data: null, error: true };
  }

  return {
    data: rows.map((profile) => {
      const avatarPreference =
        avatarPreferences.preferencesByUserId.get(profile.user_id) ??
        defaultAvatarPreference;

      return {
        academicProgramName: profile.academic_program_name,
        avatarMode: avatarPreference.avatarMode,
        availability: profile.availability,
        bio: profile.bio,
        canDirectContact: profile.can_direct_contact,
        collaborationGoals: parseNamedItems(profile.collaboration_goals),
        customAvatarKey: avatarPreference.customAvatarKey,
        facultyName: profile.faculty_name,
        fullName: profile.full_name,
        interests: parseNamedItems(profile.interests),
        lookingForSkills: parseSkillItems(profile.looking_for_skills),
        offeredSkills: parseSkillItems(profile.offered_skills),
        savedAt: profile.saved_at,
        systemAvatarKey: profile.system_avatar_key,
        userId: profile.user_id,
        yearOfStudy: profile.year_of_study,
      };
    }),
    error: false,
  };
}

export async function loadProfileConnectionStatus(
  supabase: SupabaseServerClient,
  targetUserId: string,
): Promise<LoadResult<ProfileConnectionStatus>> {
  const result = await supabase.rpc("get_profile_connection_status", {
    target_user_id: targetUserId,
  });

  if (result.error) {
    return { data: null, error: true };
  }

  const status = result.data?.[0] ?? null;

  return {
    data: status
      ? {
          blockedByMe: status.blocked_by_me,
          canDirectContact: status.can_direct_contact,
          isMatched: status.is_matched,
          matchId: status.match_id,
          outgoingAction: status.outgoing_action,
        }
      : null,
    error: false,
  };
}
