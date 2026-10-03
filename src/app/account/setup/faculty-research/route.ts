import type { NextRequest } from "next/server";

import { saveFacultyResearchStep } from "@/lib/onboarding/server";

export async function POST(request: NextRequest) {
  return saveFacultyResearchStep(request);
}
