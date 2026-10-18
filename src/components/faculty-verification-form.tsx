import Link from "next/link";

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
        <input
          autoComplete="off"
          className={onboardingFieldClass}
          maxLength={240}
          name={fieldName}
          required
          type="password"
        />
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
