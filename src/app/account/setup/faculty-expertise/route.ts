import type { NextRequest } from "next/server";

import { saveFacultyExpertiseStep } from "@/lib/onboarding/server";

export async function POST(request: NextRequest) {
  return saveFacultyExpertiseStep(request);
}
