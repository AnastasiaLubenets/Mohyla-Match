import Link from "next/link";

import { LandingDemoCard } from "@/components/public/landing-demo-card";
import {
  PublicBadge,
  PublicBenefit,
  PublicUnderline,
} from "@/components/public/public-benefit";
import { PublicHeader } from "@/components/public/public-header";
import {
  ArrowRightIcon,
  BarChartIcon,
  BoltIcon,
  GraduationCapIcon,
  LightbulbIcon,
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

const bottomBenefits = [
  {
    description: "Meet students who share your interests and goals.",
    icon: <UsersIcon className="h-6 w-6" />,
    title: "Real connections",
  },
  {
    description: "Find teammates for projects, competitions, and ideas.",
    icon: <LightbulbIcon className="h-6 w-6" />,
    title: "Build together",
  },
  {
    description: "Connect with students from different faculties and years.",
    icon: <GraduationCapIcon className="h-6 w-6" />,
    title: "Across all of Mohyla",
  },
  {
    description: "From side projects to startups — build what matters.",
    icon: <BarChartIcon className="h-6 w-6" />,
    title: "Turn ideas into impact",
  },
] as const;

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f7fbff] text-[#101b55]">
      <PublicHeader active="landing" />

      <section className="relative mx-auto min-h-[calc(100vh-6rem)] w-full max-w-[1500px] px-5 pb-10 pt-8 sm:px-8 lg:px-12 lg:pt-16 xl:px-16">
        <PublicWatercolor
          className="hidden lg:absolute lg:bottom-0 lg:right-[-4%] lg:top-2 lg:block lg:w-[63%]"
          priority
        />

        <div className="relative z-10 grid gap-10 lg:grid-cols-[0.47fr_0.53fr] lg:items-center">
          <div className="max-w-[43rem]">
            <PublicBadge icon={<GraduationCapIcon className="h-4 w-4" />}>
              Student collaboration network
            </PublicBadge>

            <h1 className="mt-8 font-serif text-6xl font-bold leading-[0.92] tracking-normal text-[#070d35] sm:text-7xl lg:text-[5.7rem] xl:text-[6.4rem]">
              Find your people.
              <br />
              Build something
              <br />
              <span className="relative inline-block italic">
                together.
                <PublicUnderline className="bottom-0" />
              </span>
            </h1>

            <p className="mt-8 max-w-2xl text-xl leading-8 text-[#56637f] sm:text-2xl">
              Discover students across Mohyla based on skills, interests and
              what they want to build.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex h-16 items-center justify-center gap-4 rounded-full bg-[#3154b8] px-9 text-lg font-bold text-white transition hover:bg-[#27469f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#3154b8]"
              >
                Join Mohyla Match
                <ArrowRightIcon className="h-6 w-6" />
              </Link>
              <Link
                href="/login"
                className="inline-flex h-16 items-center justify-center rounded-full border border-[#d7e2f3] bg-white px-10 text-lg font-bold text-[#070d35] transition hover:border-[#3154b8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#3154b8]"
              >
                Login
              </Link>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {miniBenefits.map((benefit) => (
                <div
                  className="flex items-center gap-3"
                  key={benefit.description}
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#edf4ff] text-[#1855b5]">
                    {benefit.icon}
                  </span>
                  <p className="text-sm font-semibold leading-5 text-[#344268]">
                    {benefit.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 flex min-h-[24rem] items-center justify-center overflow-hidden rounded-[2rem] lg:justify-start lg:overflow-visible lg:rounded-none">
            <PublicWatercolor className="absolute inset-0 min-h-full scale-125 lg:hidden" />
            <div className="hidden xl:block">
              <p className="absolute -top-7 right-[18%] rotate-[-8deg] font-serif text-3xl italic leading-8 text-[#739cff]">
                More
                <br />
                students
                <br />
                Brighter
                <br />
                ideas
              </p>
              <p className="absolute bottom-0 right-0 rotate-[-8deg] font-serif text-4xl italic text-[#5b83ee]">
                Mohyla
                <br />
                Connects
              </p>
            </div>
            <div className="relative z-10">
              <LandingDemoCard />
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 border-t border-[#e4edf9] bg-white/85 px-5 py-10 sm:px-8 lg:px-12 xl:px-16">
        <div className="mx-auto grid max-w-[1500px] gap-8 md:grid-cols-2 xl:grid-cols-4">
          {bottomBenefits.map((benefit, index) => (
            <div
              className={`xl:px-7 ${
                index > 0 ? "xl:border-l xl:border-[#dfe8f6]" : ""
              }`}
              key={benefit.title}
            >
              <PublicBenefit
                description={benefit.description}
                icon={benefit.icon}
                title={benefit.title}
              />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
