import Link from "next/link";

// Only what is true for every order. Dispatch times, coverage counts and distributor status go here once
// the owner confirms them in writing.
const FACTS = [
  { title: "Tracked delivery", text: "Delhivery and partners, tracking number by email", href: "/policies/shipping" },
  { title: "Secure payment", text: "UPI, cards and netbanking through Razorpay", href: "/support" },
  { title: "Parts that fit", text: "We check your parts work together before you pay", href: "/build" },
  { title: "GST invoice", text: "With every order, prices include GST", href: "/support" },
];

export function TrustGrid() {
  return (
    <section aria-label="Why buy here" className="rounded-xl bg-white px-5 py-4 md:px-6">
      <ul className="grid grid-cols-2 gap-x-4 gap-y-3 sm:gap-x-6 sm:gap-y-4 lg:grid-cols-4">
        {FACTS.map((f) => (
          <li key={f.title}>
            <Link href={f.href} className="group flex min-h-10 flex-col justify-center sm:block sm:min-h-0">
              <p className="text-[14px] font-semibold text-navy group-hover:text-brand sm:text-[15px]">{f.title}</p>
              {/* Phones show the four headings only; the detail line joins from sm up, where it fits on one or two lines. */}
              <p className="mt-0.5 hidden text-[13px] leading-snug text-text-secondary sm:block">{f.text}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
