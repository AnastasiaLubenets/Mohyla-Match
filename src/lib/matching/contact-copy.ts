type ContactPayload = Readonly<{
  email?: unknown;
  error?: unknown;
  fullName?: unknown;
}>;

export type ContactRequestResult = Readonly<{
  ok: boolean;
  payload: unknown;
}>;

export type ContactCopyResult =
  | Readonly<{
      fullName: string | null;
      status: "copied";
    }>
  | Readonly<{
      error: string;
      status: "error";
    }>;

export const contactCopyFallbackError =
  "We could not copy this email. Try again in a moment.";

export const contactClipboardUnavailableError =
  "Your browser could not copy the email automatically. Try again in a supported browser.";

export const contactEmailCopiedLabel = "Email copied";

function isContactPayload(value: unknown): value is ContactPayload {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function payloadError(payload: unknown): string {
  if (isContactPayload(payload) && typeof payload.error === "string") {
    return payload.error;
  }

  return contactCopyFallbackError;
}

export async function requestAndCopyProfileEmail({
  requestContact,
  targetUserId,
  writeClipboard,
}: Readonly<{
  requestContact: (targetUserId: string) => Promise<ContactRequestResult>;
  targetUserId: string;
  writeClipboard: (email: string) => Promise<void>;
}>): Promise<ContactCopyResult> {
  if (!targetUserId.trim()) {
    return { error: contactCopyFallbackError, status: "error" };
  }

  try {
    const response = await requestContact(targetUserId);

    if (
      !response.ok ||
      !isContactPayload(response.payload) ||
      typeof response.payload.email !== "string"
    ) {
      return { error: payloadError(response.payload), status: "error" };
    }

    try {
      await writeClipboard(response.payload.email);
    } catch {
      return { error: contactClipboardUnavailableError, status: "error" };
    }

    return {
      fullName:
        typeof response.payload.fullName === "string"
          ? response.payload.fullName
          : null,
      status: "copied",
    };
  } catch {
    return { error: contactCopyFallbackError, status: "error" };
  }
}
