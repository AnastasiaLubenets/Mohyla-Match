import type { ReactNode } from "react";

import { PublicHeader } from "@/components/public/public-header";
import {
  PublicBadge,
  PublicBenefit,
  PublicUnderline,
} from "@/components/public/public-benefit";
import { GraduationCapIcon } from "@/components/public/public-icons";
import { PublicWatercolor } from "@/components/public/public-watercolor";

type AuthPageShellProps = Readonly<{
  active: "login" | "signup";
  badgeIcon?: ReactNode;
  benefits: ReadonlyArray<{
    description: string;
    icon: ReactNode;
    title: string;
  }>;
  children: ReactNode;
  subtitle: string;
  title: string;
}>;

export function AuthPageShell({
  active,
  badgeIcon = <GraduationCapIcon className="h-4 w-4" />,
  benefits,
  children,
  subtitle,
  title,
}: AuthPageShellProps) {
  return (
    <main className="public-auth-shell min-h-screen overflow-hidden bg-[#f8fbff] text-[#101b55]">
      <PublicHeader active={active} />
      <section className="relative mx-auto grid min-h-[calc(100vh-6rem)] w-full max-w-[1800px] gap-8 px-5 pb-10 pt-8 sm:px-8 lg:grid-cols-[0.43fr_0.57fr] lg:items-start lg:px-12 lg:pt-8 xl:px-[clamp(5rem,4vw,6rem)] xl:pt-10">
        <div className="relative z-10 min-w-0 max-w-[43rem]">
          <PublicBadge icon={badgeIcon}>Student collaboration network</PublicBadge>
          <h1 className="relative mt-8 max-w-3xl font-serif text-5xl font-bold leading-[0.98] tracking-normal text-[#070d35] sm:text-7xl lg:text-[5.3rem]">
            {title}
            <PublicUnderline className="w-[min(100%,28rem)]" />
          </h1>
          <p className="mt-7 max-w-2xl text-xl leading-8 text-[#56637f] sm:text-2xl">
            {subtitle}
          </p>
          {children}
          <div className="mt-8 grid gap-4 sm:grid-cols-3 lg:gap-6">
            {benefits.map((benefit) => (
              <PublicBenefit
                description={benefit.description}
                icon={benefit.icon}
                key={benefit.description}
                title={benefit.title}
              />
            ))}
          </div>
        </div>
        <PublicWatercolor
          className="auth-watercolor relative z-0 min-h-[22rem] min-w-0 lg:absolute lg:-top-28 lg:bottom-0 lg:right-0 lg:w-[62%] xl:w-[61%]"
          imageClassName="auth-watercolor-image object-cover object-right-bottom"
          priority
        />
      </section>
    </main>
  );
}
