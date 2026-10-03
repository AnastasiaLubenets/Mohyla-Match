import type { NextRequest } from "next/server";

import { completeFacultyOnboarding } from "@/lib/onboarding/server";

export async function POST(request: NextRequest) {
  return completeFacultyOnboarding(request);
}
