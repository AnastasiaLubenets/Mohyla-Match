"use client";

import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";

type AuthSubmitButtonProps = Readonly<{
  children: ReactNode;
  className?: string;
  pendingLabel: string;
}>;

export function AuthSubmitButton({
  children,
  className = "h-12 w-full rounded-full bg-primary px-5 font-semibold text-white transition hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-70",
  pendingLabel,
}: AuthSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      className={className}
      disabled={pending}
      type="submit"
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
