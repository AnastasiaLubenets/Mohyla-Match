import type { NextRequest } from "next/server";

import { blockProfile } from "@/lib/matching/actions";

export async function POST(request: NextRequest) {
  return blockProfile(request);
}
