import Image from "next/image";

type PublicWatercolorProps = Readonly<{
  className?: string;
  imageClassName?: string;
  priority?: boolean;
}>;

export function PublicWatercolor({
  className = "",
  imageClassName = "",
  priority = false,
}: PublicWatercolorProps) {
  return (
    <div className={`pointer-events-none overflow-hidden ${className}`}>
      <Image
        alt=""
        className={`object-contain object-right-bottom ${imageClassName}`}
        fill
        priority={priority}
        sizes="(max-width: 768px) 100vw, 58vw"
        src="/branding/mohyla-campus-watercolor.png"
      />
    </div>
  );
}
