import Image from "next/image";

/**
 * The Skyro logo: the master artwork ("Skyro Cybernetic Bird Logo.png" in the repo root, copied unchanged
 * to public/brand/skyro-logo.png) shown at header size, followed by the Skyrostore name.
 * The tab and home-screen icons (app/icon.png, app/apple-icon.png) are the same artwork on a square canvas.
 */
export function SkyroLogo({ className = "", light = false, priority = false }: { className?: string; light?: boolean; priority?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <Image
        src="/brand/skyro-logo.png"
        alt=""
        width={1536}
        height={1024}
        priority={priority}
        sizes="96px"
        className={light ? "h-20 w-auto" : "h-12 w-auto md:h-14"}
      />
      <span className={`text-[20px] font-bold tracking-[-0.03em] ${light ? "text-white" : "text-navy"}`}>Skyrostore</span>
    </span>
  );
}
