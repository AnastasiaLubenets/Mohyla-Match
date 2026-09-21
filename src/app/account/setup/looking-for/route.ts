import type { NextRequest } from "next/server";

import { saveSkillStep } from "@/lib/onboarding/server";

export async function POST(request: NextRequest) {
  return saveSkillStep(request, "looking_for", 3, 4, "", {
    allowEmpty: true,
    skipFieldName: "skip",
  });
}
