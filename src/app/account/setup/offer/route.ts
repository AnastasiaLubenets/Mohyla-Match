import type { NextRequest } from "next/server";

import { saveSkillStep } from "@/lib/onboarding/server";

export async function POST(request: NextRequest) {
  return saveSkillStep(
    request,
    "offer",
    2,
    3,
    "Choose at least one skill you can offer.",
  );
}
