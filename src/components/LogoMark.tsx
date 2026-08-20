import Image from "next/image";

type LogoMarkProps = {
  compact?: boolean;
  decorative?: boolean;
};

export function LogoMark({ compact = false, decorative = false }: LogoMarkProps) {
  const size = compact ? 40 : 44;

  return (
    <Image
      src="/brand/br-platform-icon-192.png"
      alt={decorative ? "" : "B.R — Beat Room"}
      aria-hidden={decorative || undefined}
      width={size}
      height={size}
      sizes={`${size}px`}
      className="shrink-0 object-contain drop-shadow-[0_4px_10px_rgba(34,211,238,0.08)]"
    />
  );
}
