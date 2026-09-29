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
    icon: <UsersIcon className="h-5 w-5" />,
  },
  {
    description: "Find project teammates",
    icon: <BoltIcon className="h-5 w-5" />,
  },
  {
    description: "Turn ideas into real projects",
    icon: <BarChartIcon className="h-5 w-5" />,
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

      <section className="landing-hero-section relative z-10 mx-auto grid h-[calc(100dvh-6rem)] w-full max-w-[1500px] items-center px-5 pb-6 pt-2 sm:px-8 lg:grid-cols-[0.52fr_0.48fr] lg:gap-10 lg:px-12 xl:px-16">
        <div className="grid min-h-0 gap-8 lg:contents">
          <div className="landing-hero-copy max-w-[43rem]">
            <PublicBadge icon={<GraduationCapIcon className="h-4 w-4" />}>
              Student collaboration network
            </PublicBadge>

            <h1 className="landing-hero-heading mt-6 font-serif text-[3.35rem] font-bold leading-[0.94] tracking-normal text-[#070d35] sm:mt-8 sm:text-7xl lg:text-[5.35rem] xl:text-[6.1rem]">
              Find your people.
              <br />
              Build something
              <br />
              <span className="relative inline-block italic">
                together.
                <PublicUnderline className="bottom-0" />
              </span>
            </h1>

            <p className="landing-hero-description mt-7 max-w-2xl text-lg leading-7 text-[#56637f] sm:mt-9 sm:text-2xl sm:leading-8">
              Discover students across Mohyla based on skills, interests and
              what they want to build.
            </p>

            <div className="landing-hero-actions mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4 lg:mt-10">
              <Link
                href="/signup"
                className="landing-hero-action inline-flex h-14 items-center justify-center gap-4 rounded-full bg-[#3154b8] px-8 text-base font-bold text-white transition hover:bg-[#27469f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#3154b8] sm:h-16 sm:px-9 sm:text-lg"
              >
                Join Mohyla Match
                <ArrowRightIcon className="h-6 w-6" />
              </Link>
              <Link
                href="/login"
                className="landing-hero-action inline-flex h-14 items-center justify-center rounded-full border border-[#d7e2f3] bg-white/85 px-9 text-base font-bold text-[#070d35] backdrop-blur transition hover:border-[#3154b8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#3154b8] sm:h-16 sm:px-10 sm:text-lg"
              >
                Login
              </Link>
            </div>

            <div className="landing-hero-benefits mt-8 grid gap-3 sm:grid-cols-3 lg:mt-10">
              {miniBenefits.map((benefit) => (
                <div
                  className="landing-hero-benefit flex items-center gap-3"
                  key={benefit.description}
                >
                  <span className="landing-hero-benefit-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#edf4ff] text-[#1855b5]">
                    {benefit.icon}
                  </span>
                  <p className="landing-hero-benefit-text text-sm font-semibold leading-5 text-[#344268]">
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
