import type { NextRequest } from "next/server";

import { performDiscoveryAction } from "@/lib/matching/actions";

export async function POST(request: NextRequest) {
  return performDiscoveryAction(request, "/app");
}
