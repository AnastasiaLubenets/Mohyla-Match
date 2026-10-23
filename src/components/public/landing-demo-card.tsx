import Image from "next/image";
import Link from "next/link";

import { ArrowRightIcon } from "@/components/public/public-icons";
import { getProgramAvatarSrc } from "@/lib/profile/program-avatar";

const demoAvatarSrc =
  getProgramAvatarSrc("faculty-informatics--program-computer-science") ??
  "/avatars/programs/program-computer-science-v2.png";

export function LandingDemoCard() {
  return (
    <aside
      aria-label="Illustrative featured match preview"
      className="landing-demo-card relative w-full max-w-[22rem] rounded-2xl border border-[#dce7f7] bg-white/95 p-4 text-[#101b55] shadow-[0_18px_50px_rgba(37,76,139,0.14)] backdrop-blur"
    >
      <div className="landing-demo-meta mb-3.5 flex items-center justify-between gap-3">
        <p className="landing-demo-eyebrow inline-flex items-center gap-2 text-xs font-semibold text-[#344268]">
          <span className="h-2 w-2 rounded-full bg-[#84aef9]" />
          Featured match
        </p>
        <span className="landing-demo-match rounded-full bg-[#edf4ff] px-2.5 py-1 text-xs font-bold text-[#174ca7]">
          92% match
        </span>
      </div>

      <div className="landing-demo-profile-row flex items-center gap-3">
        <div className="landing-demo-avatar relative h-16 w-16 overflow-hidden rounded-[0.65rem]">
          <Image
            alt=""
            fill
            sizes="80px"
            src={demoAvatarSrc}
            className="object-cover"
          />
        </div>
        <div>
          <h2 className="landing-demo-name text-base font-bold">Maria Koval</h2>
          <p className="landing-demo-program mt-1 text-xs text-[#5b6683]">
            Computer Science, year 3
          </p>
        </div>
      </div>

      <div className="landing-demo-tags mt-4 flex flex-wrap gap-1.5">
        {["React", "Figma", "Startups", "Education"].map((tag) => (
          <span
            key={tag}
            className="landing-demo-tag rounded-full border border-[#dce7f7] bg-white px-2.5 py-1 text-xs font-semibold text-[#26355f]"
          >
            {tag}
          </span>
        ))}
      </div>

      <p className="landing-demo-description mt-3.5 text-xs leading-4 text-[#56637f]">
        Maria offers React and Figma experience for teams building student
        products.
      </p>

      <div className="landing-demo-footer mt-3.5 border-t border-[#dce7f7] pt-3.5">
        <Link
          href="/signup"
          className="landing-demo-button mm-button inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#eef4ff] font-bold text-[#174ca7] transition hover:bg-[#dfeaff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#3154b8]"
        >
          View profile
          <ArrowRightIcon className="landing-demo-button-icon mm-icon" />
        </Link>
      </div>
    </aside>
  );
}
