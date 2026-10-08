"use client";

import Link from "next/link";
import { useState } from "react";

import { AuthSubmitButton } from "@/components/auth-submit-button";
import {
  onboardingFieldClass,
  onboardingPrimaryButtonClass,
  onboardingSecondaryButtonClass,
} from "@/components/onboarding-styles";

type FacultyVerificationFormProps = Readonly<{
  fieldName: string;
}>;

export function FacultyVerificationForm({
  fieldName,
}: FacultyVerificationFormProps) {
  const [showCode, setShowCode] = useState(false);

  return (
    <form
      action="/account/setup/faculty-verification"
      className="mt-8 space-y-6"
      method="post"
    >
      <label className="block">
        <span className="text-sm font-bold text-[#132a56]">
          Faculty verification code
        </span>
        <span className="mt-2 flex rounded-lg border border-[#cddaf0] bg-white focus-within:border-[#245ba2]">
          <input
            autoComplete="off"
            className={`${onboardingFieldClass} mt-0 border-0 bg-transparent focus:border-0`}
            maxLength={240}
            name={fieldName}
            required
            type={showCode ? "text" : "password"}
          />
          <button
            className="shrink-0 px-4 text-sm font-bold text-[#245ba2] transition hover:text-[#102653] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#245ba2]"
            onClick={() => setShowCode((current) => !current)}
            type="button"
          >
            {showCode ? "Hide" : "Show"}
          </button>
        </span>
      </label>

      <div className="flex flex-col-reverse gap-3 pt-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          className={onboardingSecondaryButtonClass}
          href="/account/setup?role=select"
        >
          Back to role selection
        </Link>
        <div className="sm:w-52">
          <AuthSubmitButton
            className={onboardingPrimaryButtonClass}
            pendingLabel="Verifying..."
          >
            Verify &amp; continue <span aria-hidden="true">→</span>
          </AuthSubmitButton>
        </div>
      </div>
    </form>
  );
}
