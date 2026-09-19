import type { NextRequest } from "next/server";

import { saveBasicProfile } from "@/lib/onboarding/server";

export async function POST(request: NextRequest) {
  return saveBasicProfile(request);
}
