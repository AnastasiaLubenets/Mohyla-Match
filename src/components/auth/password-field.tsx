"use client";

import { useId, useState } from "react";

import {
  EyeIcon,
  EyeOffIcon,
  LockIcon,
} from "@/components/public/public-icons";

type PasswordFieldProps = Readonly<{
  autoComplete: string;
  helper?: string;
  label: string;
  name: string;
}>;

export function PasswordField({
  autoComplete,
  helper,
  label,
  name,
}: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false);
  const helperId = useId();

  return (
    <label className="block">
      <span className="sr-only">{label}</span>
      <span className="mm-control flex items-center gap-2.5 rounded-lg border border-[#d7e2f3] bg-white px-3.5 text-[#101b55] transition focus-within:border-[#3154b8] focus-within:ring-4 focus-within:ring-[#3154b8]/10">
        <LockIcon className="mm-icon shrink-0 text-[#56637f]" />
        <input
          aria-describedby={helper ? helperId : undefined}
          aria-label={label}
          autoComplete={autoComplete}
          className="min-w-0 flex-1 bg-transparent font-medium outline-none placeholder:text-[#66728f]"
          minLength={6}
          name={name}
          placeholder={label}
          required
          type={isVisible ? "text" : "password"}
        />
        <button
          aria-label={isVisible ? "Hide password" : "Show password"}
          className="rounded-md p-1.5 text-[#56637f] transition hover:text-[#174ca7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3154b8]"
          onClick={() => setIsVisible((current) => !current)}
          type="button"
        >
          {isVisible ? (
            <EyeOffIcon className="mm-icon" />
          ) : (
            <EyeIcon className="mm-icon" />
          )}
        </button>
      </span>
      {helper ? (
        <span
          className="mt-1.5 block px-12 text-[0.7rem] font-medium text-[#6a7590]"
          id={helperId}
        >
          {helper}
        </span>
      ) : null}
    </label>
  );
}
