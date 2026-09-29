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
  benefitsDividers?: boolean;
}>;

export function AuthPageShell({
  active,
  badgeIcon = <GraduationCapIcon className="h-4 w-4" />,
  benefits,
  benefitsDividers = false,
  children,
  subtitle,
  title,
}: AuthPageShellProps) {
  const shellClassName =
    "public-auth-shell relative min-h-screen overflow-x-hidden bg-transparent text-[#101b55] lg:min-h-[100dvh]";
  const benefitsClassName = benefitsDividers
    ? "public-auth-inline-benefits mt-8 grid gap-4 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-[#dce7f7]"
    : "public-auth-inline-benefits mt-8 grid gap-4 sm:grid-cols-3 lg:gap-6";

  return (
    <main className={shellClassName}>
      <PublicWatercolor
        className="auth-watercolor auth-watercolor--full-bleed absolute inset-0 z-0 min-h-full w-full"
        imageClassName="auth-watercolor-image object-cover object-right-bottom"
        priority
        preserveQuality
        sizes="100vw"
      />
      <PublicHeader active={active} />
      <section className="relative grid min-h-[calc(100vh-6rem)] w-full gap-8 px-5 pb-10 pt-8 sm:px-8 lg:min-h-[calc(100dvh-6rem)] lg:grid-cols-[minmax(0,43rem)_1fr] lg:items-start lg:px-[clamp(4.5rem,7vw,12rem)] lg:pt-8 xl:pt-10">
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
          <div className={benefitsClassName}>
            {benefits.map((benefit) => (
              <div
                className={benefitsDividers ? "sm:px-6 sm:first:pl-0 sm:last:pr-0" : ""}
                key={benefit.description}
              >
                <PublicBenefit
                  description={benefit.description}
                  icon={benefit.icon}
                  title={benefit.title}
                />
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
