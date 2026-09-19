"use client";

import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";

type AuthSubmitButtonProps = Readonly<{
  children: ReactNode;
  pendingLabel: string;
}>;

export function AuthSubmitButton({
  children,
  pendingLabel,
}: AuthSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      className="h-12 w-full rounded-full bg-primary px-5 font-semibold text-white transition hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-70"
      disabled={pending}
      type="submit"
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
