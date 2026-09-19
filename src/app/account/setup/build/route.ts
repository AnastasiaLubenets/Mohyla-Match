import type { NextRequest } from "next/server";

import { saveBuildStep } from "@/lib/onboarding/server";

export async function POST(request: NextRequest) {
  return saveBuildStep(request);
}
