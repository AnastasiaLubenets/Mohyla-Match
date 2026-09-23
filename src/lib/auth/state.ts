import type { SupabaseClient } from "@supabase/supabase-js";
import { cache } from "react";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AccountState } from "@/lib/auth/routing";
import type { Database } from "@/types/database";

type AuthStateResult = {
  state: AccountState;
  userId: string | null;
};

type SupabaseServerClient = SupabaseClient<Database>;
const routableAccountStates: readonly AccountState[] = [
  "onboarding_incomplete",
  "active",
  "suspended",
  "deleted",
];

function isRoutableAccountState(value: unknown): value is AccountState {
  return (
    typeof value === "string" &&
    routableAccountStates.includes(value as AccountState)
  );
}

async function resolveCurrentAccountState(
  supabaseClient?: SupabaseServerClient,
): Promise<AuthStateResult> {
  const supabase = supabaseClient ?? (await createSupabaseServerClient());
  const { data: claimsResult, error: claimsError } =
    await supabase.auth.getClaims();
  const userId = claimsResult?.claims?.sub;

  if (claimsError || typeof userId !== "string") {
    return { state: "anonymous", userId: null };
  }

  const { data: dbAccountState, error: dbAccountStateError } =
    await supabase.rpc("get_current_account_state");

  if (!dbAccountStateError && isRoutableAccountState(dbAccountState)) {
    return { state: dbAccountState, userId };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("profile_status,deleted_at")
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

  return { state: "onboarding_incomplete", userId };
}

const getCurrentRequestAccountState = cache(async () =>
  resolveCurrentAccountState(),
);

export async function getCurrentAccountState(
  supabaseClient?: SupabaseServerClient,
): Promise<AuthStateResult> {
  if (supabaseClient) {
    return resolveCurrentAccountState(supabaseClient);
  }

  return getCurrentRequestAccountState();
}
