import type { SupabaseClient } from "@supabase/supabase-js";
import type { NextRequest, NextResponse } from "next/server";

import { destinationForAccountState } from "@/lib/auth/routing";
import { getCurrentAccountState } from "@/lib/auth/state";
import { pathWithParams, redirectTo } from "@/lib/auth/http";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type ProfileDeleteContext =
  | {
      response: NextResponse;
      supabase?: never;
    }
  | {
      response?: never;
      supabase: SupabaseClient<Database>;
    };

function profileDeleteFailurePath(): string {
  return pathWithParams("/profile", { error: "delete-failed" });
}

async function requireActiveProfileDelete(
  request: NextRequest,
): Promise<ProfileDeleteContext> {
  const supabase = await createSupabaseServerClient();
  const accountState = await getCurrentAccountState(supabase);

  if (accountState.state !== "active") {
    return {
      response: redirectTo(
        request,
        destinationForAccountState(accountState.state, "/profile"),
      ),
    };
  }

  return { supabase };
}

export async function deleteMyProfile(request: NextRequest) {
  const formData = await request.formData();
  const context = await requireActiveProfileDelete(request);

  if (context.response) {
    return context.response;
  }

  if (formData.get("confirmation") !== "DELETE") {
    return redirectTo(request, profileDeleteFailurePath());
  }

  const result = await context.supabase.rpc("delete_my_profile");

  if (result.error || result.data !== true) {
    return redirectTo(request, profileDeleteFailurePath());
  }

  return redirectTo(request, "/account/setup?step=1");
}
