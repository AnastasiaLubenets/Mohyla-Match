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
      <p className="text-[0.8125rem] font-bold uppercase tracking-[0.22em] text-[#245ba2]">
        Step {step} of {onboardingStepCount}
      </p>
      <div className="mt-4 grid grid-cols-4 gap-2.5" aria-hidden="true">
        {[1, 2, 3, 4].map((item) => (
          <span
            className={`h-1.5 rounded-full ${
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
    <div className="mt-6 rounded-[0.875rem] border border-red-200 bg-red-50/95 px-4 py-3 text-sm font-semibold text-red-900">
      {message}
    </div>
  );
}

function BrandMark() {
  return (
    <Link
      className="inline-flex items-center gap-3 text-[#07133f] no-underline"
      href="/"
    >
      <span className="relative flex size-9 overflow-hidden rounded-lg">
        <Image
          alt=""
          className="object-cover object-left"
          fill
          sizes="36px"
          src="/branding/mohyla-match-logo.png"
        />
      </span>
      <span className="font-serif text-2xl font-bold leading-none">
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
    <main className="relative min-h-screen overflow-x-hidden px-5 py-6 text-[#102653] sm:px-8 lg:py-8">
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

      <section className="mx-auto w-full max-w-[900px]">
        <nav className="mb-5 flex items-center justify-between gap-4 sm:mb-6">
          <BrandMark />
          <form action="/auth/logout" method="post">
            <button
              className="inline-flex h-11 min-w-24 items-center justify-center rounded-full border border-[#cddaf0] bg-white/70 px-5 text-sm font-bold text-[#102653] backdrop-blur-md transition hover:border-[#3567a8] hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#245ba2]"
              type="submit"
            >
              Logout
            </button>
          </form>
        </nav>

        <div className="rounded-[1.375rem] border border-[#becde4]/70 bg-white/92 px-5 py-7 shadow-[0_12px_35px_rgba(34,80,130,0.08)] backdrop-blur-md sm:px-8 sm:py-9 lg:px-12 lg:py-10">
          <OnboardingProgress step={step} />
          <SetupErrorMessage message={error} />

          <div className="mt-9">
            <h1 className="font-serif text-[2.375rem] font-bold leading-[1.05] text-[#07133f] sm:text-[3rem]">
              {title}
            </h1>
            <p className="mt-3 max-w-[44rem] text-base leading-7 text-[#66769e] sm:text-lg">
              {description}
            </p>
          </div>

          {children}
        </div>
      </section>
    </main>
  );
}
