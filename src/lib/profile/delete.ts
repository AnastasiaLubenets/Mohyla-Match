import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { NextRequest, NextResponse } from "next/server";

import { destinationForAccountState } from "@/lib/auth/routing";
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

function hasSupabaseSessionCookie(request: NextRequest): boolean {
  return request.cookies.getAll().some(({ name }) => name.startsWith("sb-"));
}

function clearSupabaseSessionCookies(
  request: NextRequest,
  response: NextResponse,
): void {
  request.cookies.getAll().forEach(({ name }) => {
    if (name.startsWith("sb-")) {
      response.cookies.set(name, "", { maxAge: 0, path: "/" });
    }
  });
}

function accountDeleteSuccessResponse(request: NextRequest): NextResponse {
  const response = redirectTo(request, "/");
  clearSupabaseSessionCookies(request, response);

  return response;
}

function logAccountDeleteFailure(message: string, error: unknown): void {
  console.error(message, error);
}

function isMissingAuthUserError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const { message, status } = error as { message?: unknown; status?: unknown };
  const normalizedMessage =
    typeof message === "string" ? message.toLowerCase() : "";

  return (
    status === 404 ||
    normalizedMessage.includes("not found") ||
    normalizedMessage.includes("does not exist")
  );
}

async function requireAuthenticatedAccountDelete(
  request: NextRequest,
): Promise<AccountDeleteContext> {
  const supabase = await createSupabaseServerClient();
  const userResult = await supabase.auth.getUser();

  if (userResult.error || !userResult.data.user) {
    if (hasSupabaseSessionCookie(request)) {
      return {
        response: accountDeleteSuccessResponse(request),
      };
    }

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
  try {
    const formData = await request.formData();
    const context = await requireAuthenticatedAccountDelete(request);

    if (context.response) {
      return context.response;
    }

    if (formData.get("confirmation") !== "DELETE") {
      return redirectTo(request, accountDeleteFailurePath());
    }

    const adminSupabase = createSupabaseAdminClient();
    const result = await adminSupabase.auth.admin.deleteUser(context.user.id);

    if (result.error) {
      if (isMissingAuthUserError(result.error)) {
        return accountDeleteSuccessResponse(request);
      }

      logAccountDeleteFailure("Account deletion failed.", result.error);

      return redirectTo(request, accountDeleteFailurePath());
    }

    await context.supabase.auth
      .signOut({ scope: "local" })
      .catch(() => undefined);

    return accountDeleteSuccessResponse(request);
  } catch (error) {
    logAccountDeleteFailure("Account deletion failed unexpectedly.", error);

    return redirectTo(request, accountDeleteFailurePath());
  }
}
