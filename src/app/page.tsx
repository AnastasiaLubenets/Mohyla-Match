import Link from "next/link";

import { LandingDemoCard } from "@/components/public/landing-demo-card";
import { PublicBadge, PublicUnderline } from "@/components/public/public-benefit";
import { PublicHeader } from "@/components/public/public-header";
import {
  ArrowRightIcon,
  BarChartIcon,
  BoltIcon,
  GraduationCapIcon,
  UsersIcon,
} from "@/components/public/public-icons";
import { PublicWatercolor } from "@/components/public/public-watercolor";

const miniBenefits = [
  {
    description: "Meet like-minded students",
    icon: <UsersIcon className="mm-icon" />,
  },
  {
    description: "Find project teammates",
    icon: <BoltIcon className="mm-icon" />,
  },
  {
    description: "Turn ideas into real projects",
    icon: <BarChartIcon className="mm-icon" />,
  },
] as const;

export default function LandingPage() {
  return (
    <main className="landing-shell relative h-screen min-h-[100dvh] overflow-hidden bg-transparent text-[#101b55]">
      <PublicWatercolor
        className="absolute inset-0 z-0 min-h-full w-full"
        imageClassName="object-cover object-right-bottom"
        priority
        preserveQuality
        sizes="100vw"
      />
      <PublicHeader active="landing" />

      <section className="landing-hero-section relative z-10 mx-auto grid h-[calc(100dvh-4.5rem)] w-full max-w-[1125px] items-center px-5 pb-4 pt-1 sm:px-8 lg:grid-cols-[0.52fr_0.48fr] lg:gap-8 lg:px-9">
        <div className="grid min-h-0 gap-6 lg:contents">
          <div className="landing-hero-copy max-w-[32.25rem]">
            <PublicBadge icon={<GraduationCapIcon className="h-4 w-4" />}>
              Student collaboration network
            </PublicBadge>

            <h1 className="landing-hero-heading mt-5 font-serif text-5xl font-bold leading-[0.98] tracking-normal text-[#070d35] sm:mt-6 sm:text-6xl">
              Find your people.
              <br />
              Build something
              <br />
              <span className="relative inline-block italic">
                together.
                <PublicUnderline className="bottom-0" />
              </span>
            </h1>

            <p className="landing-hero-description mt-5 max-w-2xl text-sm leading-5 text-[#56637f] sm:mt-6 sm:text-[0.9375rem] sm:leading-6">
              Discover students across Mohyla based on skills, interests and
              what they want to build.
            </p>

            <div className="landing-hero-actions mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="landing-hero-action mm-button inline-flex items-center justify-center gap-2.5 rounded-full bg-[#3154b8] px-6 font-bold text-white transition hover:bg-[#27469f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#3154b8]"
              >
                Join Mohyla Match
                <ArrowRightIcon className="mm-icon" />
              </Link>
              <Link
                href="/login"
                className="landing-hero-action mm-button inline-flex items-center justify-center rounded-full border border-[#d7e2f3] bg-white/85 px-7 font-bold text-[#070d35] backdrop-blur transition hover:border-[#3154b8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#3154b8]"
              >
                Login
              </Link>
            </div>

            <div className="landing-hero-benefits mt-6 grid gap-2.5 sm:grid-cols-3">
              {miniBenefits.map((benefit) => (
                <div
                  className="landing-hero-benefit flex items-center gap-2.5"
                  key={benefit.description}
                >
                  <span className="landing-hero-benefit-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#edf4ff] text-[#1855b5]">
                    {benefit.icon}
                  </span>
                  <p className="landing-hero-benefit-text text-xs font-semibold leading-4 text-[#344268] sm:text-[0.8125rem] sm:leading-[1.125rem]">
                    {benefit.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 hidden min-h-0 items-center justify-center lg:flex lg:justify-end xl:justify-center">
            <div className="landing-demo-scale relative z-10">
              <LandingDemoCard />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
