import { redirect } from "next/navigation";

import {
  destinationForAccountState,
  isAllowedAccountState,
  type AccountState,
} from "@/lib/auth/routing";
import { getCurrentAccountState } from "@/lib/auth/state";

export async function requireAccountState(
  requestedPath: string,
  allowedStates: readonly AccountState[],
) {
  const accountState = await getCurrentAccountState();

  if (!isAllowedAccountState(accountState.state, allowedStates)) {
    redirect(destinationForAccountState(accountState.state, requestedPath));
  }

  return accountState;
}
