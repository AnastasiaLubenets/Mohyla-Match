import type { NextRequest } from "next/server";

import {
  pathWithParams,
  readRequiredFormString,
  redirectTo,
} from "@/lib/auth/http";
import { getAppUrl } from "@/lib/auth/origin";
import {
  destinationForSignupError,
  destinationForSignupResult,
} from "@/lib/auth/signup";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const email = readRequiredFormString(formData, "email");
  const password = readRequiredFormString(formData, "password");
  const passwordConfirmation = readRequiredFormString(
    formData,
    "password_confirmation",
  );

  if (!email || !password || !passwordConfirmation) {
    return redirectTo(request, pathWithParams("/signup", { error: "missing" }));
  }

  if (password !== passwordConfirmation) {
    return redirectTo(request, pathWithParams("/signup", { error: "match" }));
  }

  const supabase = await createSupabaseServerClient();
  const confirmUrl = getAppUrl(request, "/auth/confirm");
  const signUpResult = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: confirmUrl.toString(),
    },
  });
  const { error } = signUpResult;

  if (error) {
    return redirectTo(request, destinationForSignupError(error.message));
  }

  return redirectTo(request, destinationForSignupResult(signUpResult));
}
