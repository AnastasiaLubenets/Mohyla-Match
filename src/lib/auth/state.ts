import type { SupabaseClient } from "@supabase/supabase-js";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AccountState } from "@/lib/auth/routing";
import type { Database } from "@/types/database";

type AuthStateResult = {
  state: AccountState;
  userId: string | null;
};

type SupabaseServerClient = SupabaseClient<Database>;

export async function getCurrentAccountState(
  supabaseClient?: SupabaseServerClient,
): Promise<AuthStateResult> {
  const supabase = supabaseClient ?? (await createSupabaseServerClient());
  const { data: claimsResult, error: claimsError } =
    await supabase.auth.getClaims();
  const userId = claimsResult?.claims?.sub;

  if (claimsError || typeof userId !== "string") {
    return { state: "anonymous", userId: null };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("profile_status,onboarding_completed_at,deleted_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (profileError || !profile) {
    return { state: "onboarding_incomplete", userId };
  }

  if (profile.profile_status === "suspended") {
    return { state: "suspended", userId };
  }

  if (profile.profile_status === "deleted" || profile.deleted_at) {
    return { state: "deleted", userId };
  }

  if (!profile.onboarding_completed_at) {
    return { state: "onboarding_incomplete", userId };
  }

  return { state: "active", userId };
}
