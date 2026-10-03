export type ActionToastTone = "success" | "error";

export type ActionToastInput = Readonly<{
  message: string;
  tone?: ActionToastTone;
}>;

export type ActionToast = ActionToastInput &
  Readonly<{
    id: string;
  }>;

export const toastVisibleMs = 3000;
export const toastExitMs = 180;

export const savedProfileToastMessages = {
  saved: "Added to Saved",
  unsaved: "Removed from Saved",
} as const;

export function saveStatusToast(status?: string): ActionToast | null {
  if (status !== "saved" && status !== "unsaved") {
    return null;
  }

  return {
    id: `save-${status}`,
    message: savedProfileToastMessages[status],
    tone: "success",
  };
}
