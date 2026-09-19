import { createBrowserClient } from "@supabase/ssr";

import { getSupabasePublicConfig } from "@/lib/config/env";
import type { Database } from "@/types/database";

export function createSupabaseBrowserClient() {
  const { url, publishableKey } = getSupabasePublicConfig();

  return createBrowserClient<Database>(url, publishableKey);
}
