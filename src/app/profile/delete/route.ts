import type { NextRequest } from "next/server";

import { deleteMyAccount } from "@/lib/profile/delete";

export async function POST(request: NextRequest) {
  return deleteMyAccount(request);
}
