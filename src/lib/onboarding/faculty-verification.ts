import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";

import { destinationForAccountState } from "@/lib/auth/routing";
import { getCurrentAccountState } from "@/lib/auth/state";
import { pathWithParams, redirectTo } from "@/lib/auth/http";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

const facultyVerificationCodeEnv = "FACULTY_VERIFICATION_CODE";
const facultyVerificationFieldName = "facultyVerificationCode";
const genericVerificationError = "We could not verify that code. Try again.";
const missingCodeError = "Enter your Faculty verification code.";
const rateLimitWindowMs = 15 * 60 * 1000;
const maxUserFailuresPerWindow = 5;
const maxIpFailuresPerWindow = 30;
const maxCodeLength = 240;
const minConfiguredCodeLength = 12;
const attemptRetentionMs = 24 * 60 * 60 * 1000;

type AdminSupabase = SupabaseClient<Database>;

type VerificationAttemptInsert =
  Database["public"]["Tables"]["faculty_verification_attempts"]["Insert"];

export function facultyVerificationPath(error?: string): string {
  return pathWithParams("/account/setup", {
    error,
    verifyFaculty: "1",
  });
}

function configuredFacultyVerificationCode(): string | null {
  const code = process.env[facultyVerificationCodeEnv]?.trim();

  if (!code || code.length < minConfiguredCodeLength) {
    return null;
  }

  return code;
}

function digest(value: string): Buffer {
  return createHash("sha256").update(value, "utf8").digest();
}

function timingSafeCodeMatches(submittedCode: string, expectedCode: string): boolean {
  const submittedDigest = digest(submittedCode.trim());
  const expectedDigest = digest(expectedCode.trim());

  return timingSafeEqual(submittedDigest, expectedDigest);
}

function clientIpHash(request: NextRequest): string | null {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const rawIp = forwardedFor?.split(",")[0]?.trim() || realIp?.trim();

  if (!rawIp) {
    return null;
  }

  return createHash("sha256").update(rawIp, "utf8").digest("hex");
}

async function pruneOldAttempts(adminSupabase: AdminSupabase) {
  const retentionCutoff = new Date(Date.now() - attemptRetentionMs).toISOString();

  await adminSupabase
    .from("faculty_verification_attempts")
    .delete()
    .lt("created_at", retentionCutoff);
}

async function countRecentFailures(
  adminSupabase: AdminSupabase,
  column: "ip_hash" | "user_id",
  value: string,
): Promise<number> {
  const windowCutoff = new Date(Date.now() - rateLimitWindowMs).toISOString();
  const { count, error } = await adminSupabase
    .from("faculty_verification_attempts")
    .select("id", { count: "exact", head: true })
    .eq(column, value)
    .eq("succeeded", false)
    .gte("created_at", windowCutoff);

  if (error) {
    throw error;
  }

  return count ?? 0;
}

async function isRateLimited(
  adminSupabase: AdminSupabase,
  userId: string,
  ipHash: string | null,
): Promise<boolean> {
  const [userFailures, ipFailures] = await Promise.all([
    countRecentFailures(adminSupabase, "user_id", userId),
    ipHash
      ? countRecentFailures(adminSupabase, "ip_hash", ipHash)
      : Promise.resolve(0),
  ]);

  return (
    userFailures >= maxUserFailuresPerWindow ||
    ipFailures >= maxIpFailuresPerWindow
  );
}

async function recordVerificationAttempt(
  adminSupabase: AdminSupabase,
  attempt: VerificationAttemptInsert,
) {
  const { error } = await adminSupabase
    .from("faculty_verification_attempts")
    .insert(attempt);

  if (error) {
    throw error;
  }
}

async function markFacultyVerified(
  adminSupabase: AdminSupabase,
  userId: string,
) {
  const roleResult = await adminSupabase.from("account_roles").upsert(
    {
      account_role: "faculty",
      faculty_verification_status: "verified",
      user_id: userId,
    },
    { onConflict: "user_id" },
  );

  if (roleResult.error) {
    throw roleResult.error;
  }

  const profileResult = await adminSupabase
    .from("profiles")
    .update({ faculty_verification_status: "verified" })
    .eq("user_id", userId)
    .eq("account_role", "faculty");

  if (profileResult.error) {
    throw profileResult.error;
  }
}

export async function verifyFacultyCodeAndContinue(request: NextRequest) {
  const formData = await request.formData();
  const submittedCode = formData.get(facultyVerificationFieldName);
  const supabase = await createSupabaseServerClient();
  const { data: userResult, error: userError } = await supabase.auth.getUser();
  const userId = userResult.user?.id;

  if (userError || !userId) {
    return redirectTo(request, "/login");
  }

  const accountState = await getCurrentAccountState(supabase);

  if (accountState.state !== "onboarding_incomplete") {
    return redirectTo(
      request,
      destinationForAccountState(accountState.state, "/account/setup"),
    );
  }

  if (typeof submittedCode !== "string" || !submittedCode.trim()) {
    return redirectTo(request, facultyVerificationPath(missingCodeError));
  }

  if (submittedCode.length > maxCodeLength) {
    return redirectTo(request, facultyVerificationPath(genericVerificationError));
  }

  const expectedCode = configuredFacultyVerificationCode();
  const ipHash = clientIpHash(request);

  try {
    const adminSupabase = createSupabaseAdminClient();

    await pruneOldAttempts(adminSupabase);

    if (await isRateLimited(adminSupabase, userId, ipHash)) {
      await recordVerificationAttempt(adminSupabase, {
        ip_hash: ipHash,
        succeeded: false,
        user_id: userId,
      });

      return redirectTo(request, facultyVerificationPath(genericVerificationError));
    }

    const verified = expectedCode
      ? timingSafeCodeMatches(submittedCode, expectedCode)
      : false;

    await recordVerificationAttempt(adminSupabase, {
      ip_hash: ipHash,
      succeeded: verified,
      user_id: userId,
    });

    if (!verified) {
      return redirectTo(request, facultyVerificationPath(genericVerificationError));
    }

    await markFacultyVerified(adminSupabase, userId);
  } catch {
    return redirectTo(request, facultyVerificationPath(genericVerificationError));
  }

  return redirectTo(request, "/account/setup?step=1");
}

export { facultyVerificationCodeEnv, facultyVerificationFieldName };
