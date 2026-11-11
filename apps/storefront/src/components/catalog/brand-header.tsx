interface BrandHeaderProps {
  brandTitle: string;
  count: number;
}

export function BrandHeader({ brandTitle, count }: BrandHeaderProps) {
  return (
    <div className="mb-6 rounded-xl bg-white p-5 md:p-6">
      <h1 className="text-[clamp(1.75rem,1.3rem+1.5vw,2.4rem)] font-extrabold tracking-[-0.03em] text-navy">{brandTitle}</h1>
      <p className="mt-1 max-w-[55ch] text-[14px] text-text-secondary">
        {count} {brandTitle} {count === 1 ? "part" : "parts"}. Prices include GST, with a GST invoice on every order.
      </p>
    </div>
  );
}
