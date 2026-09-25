import type { SupabaseClient } from "@supabase/supabase-js";

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

export type DiscoveryCandidate = Readonly<{
  academicProgramName: string;
  availability: string | null;
  bio: string | null;
  collaborationGoals: MatchingItem[];
  compatibilityScore: number;
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
  systemAvatarKey: string;
  userId: string;
  yearOfStudy: number;
}>;

export type MatchSummary = Readonly<{
  academicProgramName: string;
  availability: string | null;
  bio: string | null;
  canDirectContact: boolean;
  collaborationGoals: MatchingItem[];
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
  availability: string | null;
  bio: string | null;
  canDirectContact: boolean;
  collaborationGoals: MatchingItem[];
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

  return {
    data: (result.data ?? []).map(mapDiscoveryCandidate),
    error: false,
  };
}

type DiscoveryCandidateRow =
  Database["public"]["Functions"]["get_discovery_candidates"]["Returns"][number];

function mapDiscoveryCandidate(
  candidate: DiscoveryCandidateRow,
): DiscoveryCandidate {
  return {
    academicProgramName: candidate.academic_program_name,
    availability: candidate.availability,
    bio: candidate.bio,
    collaborationGoals: parseNamedItems(candidate.collaboration_goals),
    compatibilityScore: candidate.compatibility_score,
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

  return {
    data: (result.data ?? []).map(mapDiscoveryCandidate),
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

  return {
    data: (result.data ?? []).map((match) => ({
      academicProgramName: match.academic_program_name,
      availability: match.availability,
      bio: match.bio,
      canDirectContact: match.can_direct_contact,
      collaborationGoals: parseNamedItems(match.collaboration_goals),
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
    })),
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

  return {
    data: (result.data ?? []).map((profile) => ({
      academicProgramName: profile.academic_program_name,
      availability: profile.availability,
      bio: profile.bio,
      canDirectContact: profile.can_direct_contact,
      collaborationGoals: parseNamedItems(profile.collaboration_goals),
      facultyName: profile.faculty_name,
      fullName: profile.full_name,
      interests: parseNamedItems(profile.interests),
      lookingForSkills: parseSkillItems(profile.looking_for_skills),
      offeredSkills: parseSkillItems(profile.offered_skills),
      savedAt: profile.saved_at,
      systemAvatarKey: profile.system_avatar_key,
      userId: profile.user_id,
      yearOfStudy: profile.year_of_study,
    })),
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
