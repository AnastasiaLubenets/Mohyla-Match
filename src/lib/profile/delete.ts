import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { NextRequest, NextResponse } from "next/server";

import { destinationForAccountState } from "@/lib/auth/routing";
import { getCurrentAccountState } from "@/lib/auth/state";
import { pathWithParams, redirectTo } from "@/lib/auth/http";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type AccountDeleteContext =
  | {
      response: NextResponse;
      supabase?: never;
      user?: never;
    }
  | {
      response?: never;
      supabase: SupabaseClient<Database>;
      user: User;
    };

function accountDeleteFailurePath(): string {
  return pathWithParams("/profile", { error: "delete-failed" });
}

function clearSupabaseSessionCookies(
  request: NextRequest,
  response: NextResponse,
): void {
  request.cookies.getAll().forEach(({ name }) => {
    if (name.startsWith("sb-")) {
      response.cookies.delete(name);
    }
  });
}

async function requireActiveAccountDelete(
  request: NextRequest,
): Promise<AccountDeleteContext> {
  const supabase = await createSupabaseServerClient();
  const [accountState, userResult] = await Promise.all([
    getCurrentAccountState(supabase),
    supabase.auth.getUser(),
  ]);

  if (accountState.state !== "active") {
    return {
      response: redirectTo(
        request,
        destinationForAccountState(accountState.state, "/profile"),
      ),
    };
  }

  if (userResult.error || !userResult.data.user) {
    return {
      response: redirectTo(
        request,
        destinationForAccountState("anonymous", "/profile"),
      ),
    };
  }

  return { supabase, user: userResult.data.user };
}

export async function deleteMyAccount(request: NextRequest) {
  const formData = await request.formData();
  const context = await requireActiveAccountDelete(request);

  if (context.response) {
    return context.response;
  }

  if (formData.get("confirmation") !== "DELETE") {
    return redirectTo(request, accountDeleteFailurePath());
  }

  const adminSupabase = createSupabaseAdminClient();
  const result = await adminSupabase.auth.admin.deleteUser(context.user.id);

  if (result.error) {
    return redirectTo(request, accountDeleteFailurePath());
  }

  await context.supabase.auth.signOut({ scope: "local" }).catch(() => undefined);

  const response = redirectTo(
    request,
    pathWithParams("/signup", { status: "account-deleted" }),
  );
  clearSupabaseSessionCookies(request, response);

  return response;
}
