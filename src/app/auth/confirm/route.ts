import type { EmailOtpType } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";

import { pathWithParams, redirectTo } from "@/lib/auth/http";
import { onboardingPath, sanitizeNextPath } from "@/lib/auth/routing";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const emailOtpTypes = new Set([
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
]);

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const nextPath = sanitizeNextPath(
    requestUrl.searchParams.get("next") ?? onboardingPath,
  );

  if (!tokenHash || !type || !emailOtpTypes.has(type)) {
    return redirectTo(
      request,
      pathWithParams("/auth/error", { reason: "invalid-link" }),
    );
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: type as EmailOtpType,
  });

  if (error) {
    return redirectTo(
      request,
      pathWithParams("/auth/error", { reason: "verification-failed" }),
    );
  }

  return redirectTo(request, nextPath);
}
