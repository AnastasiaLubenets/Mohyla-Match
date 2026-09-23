import { NextResponse, type NextRequest } from "next/server";

import { getCurrentAccountState } from "@/lib/auth/state";
import { loadProfileEditData } from "@/lib/profile/data";
import { mergeProfileSectionUpdate } from "@/lib/profile/section-update";
import { saveProfileUpdate } from "@/lib/profile/update";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const safeError = "We could not save this profile section. Try again.";

function jsonError(message = safeError, status = 400) {
  return NextResponse.json({ error: message, ok: false }, { status });
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const accountState = await getCurrentAccountState(supabase);

  if (accountState.state === "anonymous") {
    return jsonError("Sign in to update your profile.", 401);
  }

  if (accountState.state !== "active" || !accountState.userId) {
    return jsonError("Complete onboarding before editing your profile.", 403);
  }

  const currentProfile = await loadProfileEditData(supabase, accountState.userId);

  if (currentProfile.error || !currentProfile.data) {
    return jsonError();
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError("Choose a profile section to update.");
  }

  const merged = mergeProfileSectionUpdate(currentProfile.data, body);

  if (!merged.ok) {
    return jsonError(merged.error);
  }

  const result = await saveProfileUpdate(supabase, merged.payload);

  if (!result.ok) {
    return jsonError(result.error);
  }

  return NextResponse.json({
    ok: true,
    payload: merged.payload,
    section: merged.section,
  });
}
