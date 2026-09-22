"use server";

import { getCurrentAccountState } from "@/lib/auth/state";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ContactRevealState = Readonly<{
  email: string | null;
  error: string | null;
  fullName: string | null;
}>;

export const initialContactRevealState: ContactRevealState = {
  email: null,
  error: null,
  fullName: null,
};

export async function revealProfileContact(
  _previousState: ContactRevealState,
  formData: FormData,
): Promise<ContactRevealState> {
  const targetUserId = formData.get("targetUserId");

  if (typeof targetUserId !== "string" || !targetUserId.trim()) {
    return {
      email: null,
      error: "We could not prepare this email. Try again in a moment.",
      fullName: null,
    };
  }

  const supabase = await createSupabaseServerClient();
  const accountState = await getCurrentAccountState(supabase);

  if (accountState.state !== "active") {
    return {
      email: null,
      error: "Sign in with an active profile to write by email.",
      fullName: null,
    };
  }

  const contactResult = await supabase.rpc("get_profile_contact_email", {
    target_user_id: targetUserId,
  });
  const contact = contactResult.data?.[0] ?? null;

  if (contactResult.error || !contact) {
    return {
      email: null,
      error: "Direct email contact is not available for this profile.",
      fullName: null,
    };
  }

  const logResult = await supabase.rpc("log_email_contact_clicked", {
    target_user_id: targetUserId,
  });

  if (logResult.error || logResult.data !== true) {
    return {
      email: null,
      error: "We could not prepare this email. Try again in a moment.",
      fullName: null,
    };
  }

  return {
    email: contact.contact_email,
    error: null,
    fullName: contact.full_name,
  };
}
