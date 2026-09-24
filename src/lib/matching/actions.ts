import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { readRequiredFormString, redirectTo } from "@/lib/auth/http";
import {
  destinationForAccountState,
  sanitizeNextPath,
} from "@/lib/auth/routing";
import { getCurrentAccountState } from "@/lib/auth/state";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  isDiscoveryAction,
  isReportReason,
  type DiscoveryAction,
} from "@/lib/matching/view-model";
import { pathWithMergedParams } from "@/lib/matching/return-path";
import type { Database } from "@/types/database";

type MatchingActionContext =
  | {
      response: NextResponse;
      supabase?: never;
    }
  | {
      response?: never;
      supabase: SupabaseClient<Database>;
    };

function wantsJson(request: NextRequest) {
  return request.headers.get("accept")?.includes("application/json") ?? false;
}

function actionError(message: string, status = 400) {
  return NextResponse.json({ error: message, ok: false }, { status });
}

async function requireActiveMatchingAction(
  request: NextRequest,
  requestedPath: string,
): Promise<MatchingActionContext> {
  const supabase = await createSupabaseServerClient();
  const accountState = await getCurrentAccountState(supabase);

  if (accountState.state !== "active") {
    if (wantsJson(request)) {
      return {
        response: NextResponse.json(
          {
            error: "Sign in with an active profile to continue.",
            ok: false,
            redirectTo: destinationForAccountState(
              accountState.state,
              requestedPath,
            ),
          },
          { status: 401 },
        ),
      };
    }

    return {
      response: redirectTo(
        request,
        destinationForAccountState(accountState.state, requestedPath),
      ),
    };
  }

  return { supabase };
}

function safeReturnPath(value: FormDataEntryValue | null, fallbackPath: string) {
  if (typeof value !== "string") {
    return fallbackPath;
  }

  const sanitized = sanitizeNextPath(value);
  return sanitized === "/app" && value !== "/app" ? fallbackPath : sanitized;
}

function statusPath(pathname: string, status: string) {
  return pathWithMergedParams(pathname, { status });
}

function errorPath(pathname: string, error: string) {
  return pathWithMergedParams(pathname, { error });
}

export async function performDiscoveryAction(
  request: NextRequest,
  fallbackPath = "/app",
) {
  const formData = await request.formData();
  const returnPath = safeReturnPath(formData.get("returnTo"), fallbackPath);
  const context = await requireActiveMatchingAction(request, returnPath);

  if (context.response) {
    return context.response;
  }

  const targetUserId = readRequiredFormString(formData, "targetUserId");
  const requestedAction = readRequiredFormString(formData, "action");

  if (!targetUserId || !isDiscoveryAction(requestedAction)) {
    if (wantsJson(request)) {
      return actionError("We could not save that discovery action. Try again.");
    }

    return redirectTo(request, errorPath(returnPath, "action-failed"));
  }

  const result = await context.supabase.rpc("set_discovery_action", {
    requested_action: requestedAction,
    target_user_id: targetUserId,
  });

  if (result.error) {
    if (wantsJson(request)) {
      return actionError("We could not save that discovery action. Try again.", 500);
    }

    return redirectTo(request, errorPath(returnPath, "action-failed"));
  }

  const actionResult = result.data?.[0];
  const status = actionStatus(requestedAction, Boolean(actionResult?.matched));

  if (wantsJson(request)) {
    return NextResponse.json({
      action: requestedAction,
      matched: Boolean(actionResult?.matched),
      ok: true,
      status,
    });
  }

  return redirectTo(request, statusPath(returnPath, status));
}

function actionStatus(action: DiscoveryAction, matched: boolean) {
  if (matched) {
    return "matched";
  }

  if (action === "connect") {
    return "connected";
  }

  if (action === "save") {
    return "saved";
  }

  return "passed";
}

export async function performSavedProfileAction(
  request: NextRequest,
  fallbackPath = "/saved",
) {
  const formData = await request.formData();
  const returnPath = safeReturnPath(formData.get("returnTo"), fallbackPath);
  const context = await requireActiveMatchingAction(request, returnPath);

  if (context.response) {
    return context.response;
  }

  const targetUserId = readRequiredFormString(formData, "targetUserId");
  const intent = readRequiredFormString(formData, "intent");

  if (!targetUserId || (intent !== "save" && intent !== "remove")) {
    if (wantsJson(request)) {
      return actionError("We could not update Saved. Try again.");
    }

    return redirectTo(request, errorPath(returnPath, "save-failed"));
  }

  const result = await context.supabase.rpc("set_saved_profile", {
    should_save: intent === "save",
    target_user_id: targetUserId,
  });

  if (result.error) {
    if (wantsJson(request)) {
      return actionError("We could not update Saved. Try again.", 500);
    }

    return redirectTo(request, errorPath(returnPath, "save-failed"));
  }

  if (wantsJson(request)) {
    return NextResponse.json({
      ok: true,
      saved: intent === "save",
      status: intent === "save" ? "saved" : "unsaved",
    });
  }

  return redirectTo(
    request,
    statusPath(returnPath, intent === "save" ? "saved" : "unsaved"),
  );
}

export async function blockProfile(request: NextRequest) {
  const formData = await request.formData();
  const context = await requireActiveMatchingAction(request, "/app");

  if (context.response) {
    return context.response;
  }

  const targetUserId = readRequiredFormString(formData, "targetUserId");

  if (!targetUserId) {
    return redirectTo(request, errorPath("/app", "block-failed"));
  }

  const result = await context.supabase.rpc("block_user", {
    target_user_id: targetUserId,
  });

  if (result.error || result.data !== true) {
    return redirectTo(request, errorPath("/app", "block-failed"));
  }

  return redirectTo(request, statusPath("/app", "blocked"));
}

export async function reportProfile(request: NextRequest) {
  const formData = await request.formData();
  const returnPath = safeReturnPath(formData.get("returnTo"), "/app");
  const context = await requireActiveMatchingAction(request, returnPath);

  if (context.response) {
    return context.response;
  }

  const targetUserId = readRequiredFormString(formData, "targetUserId");
  const reasonCode = readRequiredFormString(formData, "reasonCode");
  const details = readRequiredFormString(formData, "details");

  if (!targetUserId || !isReportReason(reasonCode)) {
    return redirectTo(request, errorPath(returnPath, "report-failed"));
  }

  const result = await context.supabase.rpc("report_user", {
    details,
    reason_code: reasonCode,
    target_user_id: targetUserId,
  });

  if (result.error || !result.data) {
    return redirectTo(request, errorPath(returnPath, "report-failed"));
  }

  return redirectTo(request, statusPath(returnPath, "reported"));
}
