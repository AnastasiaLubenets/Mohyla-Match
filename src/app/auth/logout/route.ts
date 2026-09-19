import type { NextRequest } from "next/server";

import { logoutDestination } from "@/lib/auth/routing";
import { redirectTo } from "@/lib/auth/http";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();

  return redirectTo(request, logoutDestination());
}

export async function GET(request: NextRequest) {
  return redirectTo(request, logoutDestination());
}
