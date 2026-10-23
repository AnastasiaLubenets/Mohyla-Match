import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { onboardingStepCount, type OnboardingStep } from "@/lib/onboarding/progress";

type OnboardingShellProps = Readonly<{
  children: ReactNode;
  error?: string;
  step: OnboardingStep;
  title: string;
  description: string;
}>;

function OnboardingProgress({ step }: Readonly<{ step: OnboardingStep }>) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#245ba2]">
        Step {step} of {onboardingStepCount}
      </p>
      <div className="mt-3 grid grid-cols-4 gap-2" aria-hidden="true">
        {[1, 2, 3, 4].map((item) => (
          <span
            className={`h-1 rounded-full ${
              item <= step ? "bg-[#3567a8]" : "bg-[#dbe5f4]"
            }`}
            key={item}
          />
        ))}
      </div>
    </div>
  );
}

function SetupErrorMessage({ message }: Readonly<{ message?: string }>) {
  if (!message) {
    return null;
  }

  return (
    <div className="mt-4 rounded-lg border border-red-200 bg-red-50/95 px-4 py-2.5 text-sm font-semibold text-red-900">
      {message}
    </div>
  );
}

function BrandMark() {
  return (
    <Link
      className="inline-flex items-center gap-2.5 text-[#07133f] no-underline"
      href="/"
    >
      <Image
        alt=""
        className="h-9 w-auto object-contain"
        height={443}
        priority
        sizes="56px"
        src="/branding/mohyla-onboarding-emblem.png"
        unoptimized
        width={563}
      />
      <span className="font-serif text-lg font-bold leading-none">
        Mohyla Match
      </span>
    </Link>
  );
}

export function OnboardingShell({
  children,
  description,
  error,
  step,
  title,
}: OnboardingShellProps) {
  return (
    <main className="relative min-h-screen overflow-x-hidden px-4 py-4 text-[#102653] sm:px-6 lg:py-5">
      <div className="fixed inset-0 -z-20">
        <Image
          alt=""
          className="object-cover object-center"
          fill
          priority
          quality={100}
          sizes="100vw"
          src="/branding/mohyla-onboarding-watercolor.png"
          unoptimized
        />
      </div>

      <section className="mx-auto w-full max-w-[720px]">
        <nav className="mb-4 flex items-center justify-between gap-4">
          <BrandMark />
          <form action="/auth/logout" method="post">
            <button
              className="mm-button inline-flex min-w-20 items-center justify-center rounded-full border border-[#cddaf0] bg-white/70 px-4 font-bold text-[#102653] backdrop-blur-md transition hover:border-[#3567a8] hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#245ba2]"
              type="submit"
            >
              Logout
            </button>
          </form>
        </nav>

        <div className="rounded-2xl border border-[#becde4]/70 bg-white/92 px-4 py-5 shadow-[0_12px_35px_rgba(34,80,130,0.08)] backdrop-blur-md sm:px-6 sm:py-6 lg:px-7 lg:py-7">
          <OnboardingProgress step={step} />
          <SetupErrorMessage message={error} />

          <div className="mt-5">
            <h1 className="font-serif text-[1.875rem] font-bold leading-[1.06] text-[#07133f] sm:text-[2.125rem]">
              {title}
            </h1>
            <p className="mt-2 max-w-[40rem] text-[0.8125rem] leading-5 text-[#66769e] sm:text-sm">
              {description}
            </p>
          </div>

          {children}
        </div>
      </section>
    </main>
  );
}
