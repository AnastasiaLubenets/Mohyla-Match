import type { NextRequest } from "next/server";

import {
  destinationForAccountState,
  sanitizeNextPath,
} from "@/lib/auth/routing";
import { getCurrentAccountState } from "@/lib/auth/state";
import {
  pathWithParams,
  readRequiredFormString,
  redirectTo,
} from "@/lib/auth/http";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const email = readRequiredFormString(formData, "email");
  const password = readRequiredFormString(formData, "password");
  const nextPath = sanitizeNextPath(readRequiredFormString(formData, "next"));

  if (!email || !password) {
    return redirectTo(
      request,
      pathWithParams("/login", { error: "missing", next: nextPath }),
    );
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return redirectTo(
      request,
      pathWithParams("/login", { error: "invalid", next: nextPath }),
    );
  }

  const accountState = await getCurrentAccountState(supabase);
  return redirectTo(
    request,
    destinationForAccountState(accountState.state, nextPath),
  );
}
