import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getSupabaseAdminConfig } from "@/lib/config/env";
import type { Database } from "@/types/database";

export function createSupabaseAdminClient() {
  const { url, adminKey } = getSupabaseAdminConfig();

  return createClient<Database>(url, adminKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}
