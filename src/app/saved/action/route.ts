import type { NextRequest } from "next/server";

import { performSavedProfileAction } from "@/lib/matching/actions";

export async function POST(request: NextRequest) {
  return performSavedProfileAction(request, "/saved");
}
