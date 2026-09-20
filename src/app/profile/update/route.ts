import type { NextRequest } from "next/server";

import { updateMyProfile } from "@/lib/profile/update";

export async function POST(request: NextRequest) {
  return updateMyProfile(request);
}
