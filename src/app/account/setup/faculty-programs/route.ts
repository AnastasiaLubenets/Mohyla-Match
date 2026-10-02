import type { NextRequest } from "next/server";

import { saveFacultyProgramsStep } from "@/lib/onboarding/server";

export async function POST(request: NextRequest) {
  return saveFacultyProgramsStep(request);
}
