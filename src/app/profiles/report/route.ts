import type { NextRequest } from "next/server";

import { reportProfile } from "@/lib/matching/actions";

export async function POST(request: NextRequest) {
  return reportProfile(request);
}
