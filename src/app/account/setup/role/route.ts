import type { NextRequest } from "next/server";

import { saveAccountRole } from "@/lib/onboarding/server";

export async function POST(request: NextRequest) {
  return saveAccountRole(request);
}
