import type { NextRequest } from "next/server";

import { verifyFacultyCodeAndContinue } from "@/lib/onboarding/faculty-verification";

export async function POST(request: NextRequest) {
  return verifyFacultyCodeAndContinue(request);
}
