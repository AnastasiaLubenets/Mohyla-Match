import { NextResponse, type NextRequest } from "next/server";

import { getCurrentAccountState } from "@/lib/auth/state";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const unavailableMessage = "Direct email contact is not available for this profile.";
const prepareErrorMessage = "We could not copy this email. Try again in a moment.";

function contactError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as
    | { targetUserId?: unknown }
    | null;
  const targetUserId = body?.targetUserId;

  if (typeof targetUserId !== "string" || !targetUserId.trim()) {
    return contactError(prepareErrorMessage, 400);
  }

  const supabase = await createSupabaseServerClient();
  const accountState = await getCurrentAccountState(supabase);

  if (accountState.state !== "active") {
    return contactError("Sign in with an active profile to get this email.", 401);
  }

  const contactResult = await supabase.rpc("get_profile_contact_email", {
    target_user_id: targetUserId,
  });
  const contact = contactResult.data?.[0] ?? null;

  if (contactResult.error || !contact) {
    return contactError(unavailableMessage, 404);
  }

  const logResult = await supabase.rpc("log_email_contact_clicked", {
    target_user_id: targetUserId,
  });

  if (logResult.error || logResult.data !== true) {
    return contactError(prepareErrorMessage, 500);
  }

  return NextResponse.json({
    email: contact.contact_email,
    fullName: contact.full_name,
  });
}
