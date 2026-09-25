import type { ReactNode } from "react";

type PublicBenefitProps = Readonly<{
  description?: string;
  icon: ReactNode;
  title?: string;
}>;

export function PublicBenefit({ description, icon, title }: PublicBenefitProps) {
  return (
    <div className="flex gap-4">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#edf4ff] text-[#1855b5]">
        {icon}
      </span>
      <div>
        {title ? (
          <h3 className="font-bold text-[#0c3c93]">{title}</h3>
        ) : null}
        {description ? (
          <p
            className={`text-sm leading-6 text-[#5b6683] sm:text-[0.95rem] ${
              title ? "mt-1" : "font-semibold text-[#344268]"
            }`}
          >
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function PublicBadge({
  children,
  icon,
}: Readonly<{ children: ReactNode; icon: ReactNode }>) {
  return (
    <p className="inline-flex items-center gap-2 rounded-full bg-[#edf4ff] px-4 py-2 text-sm font-semibold text-[#174ca7]">
      <span className="text-[#1855b5]">{icon}</span>
      {children}
    </p>
  );
}

export function PublicUnderline({ className = "" }: Readonly<{ className?: string }>) {
  return (
    <svg
      aria-hidden="true"
      className={`pointer-events-none absolute -bottom-2 left-0 h-4 w-full text-[#7ea7ff] ${className}`}
      fill="none"
      preserveAspectRatio="none"
      viewBox="0 0 280 24"
    >
      <path
        d="M5 17c54-14 132-18 270-6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="5"
      />
    </svg>
  );
}
