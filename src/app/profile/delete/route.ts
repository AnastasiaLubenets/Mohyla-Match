import type { NextRequest } from "next/server";

import { deleteMyProfile } from "@/lib/profile/delete";

export async function POST(request: NextRequest) {
  return deleteMyProfile(request);
}
