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
  benefitsPlacement?: "inline" | "bottom-panel";
  children: ReactNode;
  subtitle: string;
  title: string;
}>;

export function AuthPageShell({
  active,
  badgeIcon = <GraduationCapIcon className="h-4 w-4" />,
  benefits,
  benefitsPlacement = "inline",
  children,
  subtitle,
  title,
}: AuthPageShellProps) {
  const hasBottomPanel = benefitsPlacement === "bottom-panel";
  const sectionClassName = hasBottomPanel
    ? "relative grid w-full flex-1 gap-8 px-5 pb-8 pt-8 sm:px-8 lg:min-h-0 lg:grid-cols-[minmax(0,43rem)_1fr] lg:items-start lg:px-[clamp(4.5rem,7vw,12rem)] lg:pb-[7.5rem] lg:pt-0 [@media(min-width:1024px)_and_(max-height:850px)]:pb-4"
    : "relative grid min-h-[calc(100vh-6rem)] w-full gap-8 px-5 pb-10 pt-8 sm:px-8 lg:min-h-[calc(100dvh-6rem)] lg:grid-cols-[minmax(0,43rem)_1fr] lg:items-start lg:px-[clamp(4.5rem,7vw,12rem)] lg:pt-8 xl:pt-10";
  const titleClassName = hasBottomPanel
    ? "relative mt-5 max-w-3xl font-serif text-5xl font-bold leading-[0.98] tracking-normal text-[#070d35] sm:text-6xl lg:text-[4.15rem]"
    : "relative mt-8 max-w-3xl font-serif text-5xl font-bold leading-[0.98] tracking-normal text-[#070d35] sm:text-7xl lg:text-[5.3rem]";
  const subtitleClassName = hasBottomPanel
    ? "mt-5 max-w-2xl text-lg leading-7 text-[#56637f] sm:text-xl"
    : "mt-7 max-w-2xl text-xl leading-8 text-[#56637f] sm:text-2xl";

  return (
    <main className="public-auth-shell flex min-h-screen flex-col overflow-x-hidden bg-[#f8fbff] text-[#101b55] lg:min-h-[100dvh]">
      <PublicHeader active={active} layout="auth" />
      <section className={sectionClassName}>
        <div className="relative z-10 min-w-0 max-w-[43rem]">
          <PublicBadge icon={badgeIcon}>Student collaboration network</PublicBadge>
          <h1 className={titleClassName}>
            {title}
            <PublicUnderline className="w-[min(100%,28rem)]" />
          </h1>
          <p className={subtitleClassName}>{subtitle}</p>
          {children}
          {benefitsPlacement === "inline" ? (
            <div className="public-auth-inline-benefits mt-8 grid gap-4 sm:grid-cols-3 lg:gap-6">
              {benefits.map((benefit) => (
                <PublicBenefit
                  description={benefit.description}
                  icon={benefit.icon}
                  key={benefit.description}
                  title={benefit.title}
                />
              ))}
            </div>
          ) : null}
        </div>
        <PublicWatercolor
          className="auth-watercolor relative z-0 min-h-[22rem] min-w-0 lg:absolute lg:-top-28 lg:bottom-0 lg:right-0 lg:w-[58vw]"
          imageClassName="auth-watercolor-image object-cover object-right-bottom"
          priority
        />
      </section>
      {hasBottomPanel ? (
        <aside className="public-auth-bottom-benefits relative z-20 border-t border-[#dce7f7] bg-white/95 px-5 py-5 backdrop-blur sm:px-8 lg:fixed lg:inset-x-0 lg:bottom-0 lg:h-[6.25rem] lg:px-[clamp(4.5rem,7vw,12rem)] lg:py-0 [@media(min-width:1024px)_and_(max-height:850px)]:relative [@media(min-width:1024px)_and_(max-height:850px)]:inset-auto">
          <div className="grid h-full w-full gap-5 sm:grid-cols-3 sm:divide-x sm:divide-[#dce7f7]">
            {benefits.map((benefit) => (
              <div
                className="flex items-center sm:px-6 sm:first:pl-0 sm:last:pr-0"
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
        </aside>
      ) : null}
    </main>
  );
}
