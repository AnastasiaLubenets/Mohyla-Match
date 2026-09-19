import type { NextRequest } from "next/server";

import {
  pathWithParams,
  readRequiredFormString,
  redirectTo,
} from "@/lib/auth/http";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function classifySignupError(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes("corporate") || normalized.includes("domain")) {
    return "domain";
  }

  if (normalized.includes("password")) {
    return "password";
  }

  return "signup";
}

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
  const confirmUrl = new URL("/auth/confirm", request.url);
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: confirmUrl.toString(),
    },
  });

  if (error) {
    return redirectTo(
      request,
      pathWithParams("/signup", { error: classifySignupError(error.message) }),
    );
  }

  return redirectTo(request, pathWithParams("/signup", { status: "check-email" }));
}
