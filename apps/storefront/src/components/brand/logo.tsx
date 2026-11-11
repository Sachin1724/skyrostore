import Image from "next/image";

/**
 * Two versions of one logo, both from the master artwork ("Skyro Cybernetic Bird Logo.png" in the repo
 * root; pixels unchanged):
 * - mark: the bird alone (public/brand/skyro-bird.png, cropped above the wordmark) beside the Skyrostore
 *   name, for the header and checkout, where the artwork's own SKYRO lettering would be too small to read;
 * - full: the complete artwork (public/brand/skyro-logo.png) where there is room: footer, invoices, emails.
 */
export function SkyroLogo({
  className = "",
  variant = "mark",
  light = false,
  priority = false,
}: {
  className?: string;
  variant?: "mark" | "full";
  light?: boolean;
  priority?: boolean;
}) {
  if (variant === "full") {
    return <Image src="/brand/skyro-logo.png" alt="Skyro" width={1536} height={1024} sizes="160px" className={`h-24 w-auto ${className}`} />;
  }
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Image src="/brand/skyro-bird.png" alt="" width={880} height={650} priority={priority} sizes="64px" className="h-9 w-auto md:h-10" />
      <span className={`text-[20px] font-bold tracking-[-0.03em] md:text-[22px] ${light ? "text-white" : "text-navy"}`}>Skyrostore</span>
    </span>
  );
}
