import Image from "next/image";

type PublicWatercolorProps = Readonly<{
  className?: string;
  imageClassName?: string;
  preserveQuality?: boolean;
  priority?: boolean;
  sizes?: string;
}>;

export function PublicWatercolor({
  className = "",
  imageClassName = "",
  preserveQuality = false,
  priority = false,
  sizes = "(max-width: 768px) 100vw, 58vw",
}: PublicWatercolorProps) {
  return (
    <div className={`pointer-events-none overflow-hidden ${className}`}>
      <Image
        alt=""
        className={`object-contain object-right-bottom ${imageClassName}`}
        fill
        priority={priority}
        quality={preserveQuality ? 100 : undefined}
        sizes={sizes}
        src="/branding/mohyla-campus-watercolor.png"
        unoptimized={preserveQuality}
      />
    </div>
  );
}
