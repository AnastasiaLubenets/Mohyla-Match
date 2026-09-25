import Image from "next/image";
import Link from "next/link";

import { ArrowRightIcon } from "@/components/public/public-icons";

export function LandingDemoCard() {
  return (
    <aside
      aria-label="Illustrative featured match preview"
      className="relative w-full max-w-[26rem] rounded-[1.35rem] border border-[#dce7f7] bg-white/95 p-6 text-[#101b55] shadow-[0_18px_50px_rgba(37,76,139,0.14)] backdrop-blur"
    >
      <div className="mb-5 flex items-center justify-between gap-4">
        <p className="inline-flex items-center gap-2 text-sm font-semibold text-[#344268]">
          <span className="h-2.5 w-2.5 rounded-full bg-[#84aef9]" />
          Featured match
        </p>
        <span className="rounded-full bg-[#edf4ff] px-3 py-1 text-sm font-bold text-[#174ca7]">
          92% match
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative h-20 w-20 overflow-hidden rounded-full">
          <Image
            alt=""
            fill
            sizes="80px"
            src="/avatars/programs/program-computer-science.png"
            className="object-cover"
          />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Maria Koval</h2>
          <p className="mt-1 text-[#5b6683]">Computer Science, year 3</p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {["React", "Figma", "Startups", "Education"].map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-[#dce7f7] bg-white px-4 py-2 text-sm font-semibold text-[#26355f]"
          >
            {tag}
          </span>
        ))}
      </div>

      <p className="mt-5 leading-7 text-[#56637f]">
        Maria offers React and Figma experience for teams building student
        products.
      </p>

      <div className="mt-6 border-t border-[#dce7f7] pt-5">
        <Link
          href="/signup"
          className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-full bg-[#eef4ff] font-bold text-[#174ca7] transition hover:bg-[#dfeaff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#3154b8]"
        >
          View profile
          <ArrowRightIcon className="h-5 w-5" />
        </Link>
      </div>
    </aside>
  );
}
