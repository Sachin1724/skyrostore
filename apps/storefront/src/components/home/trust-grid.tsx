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
      <ul className="grid grid-cols-2 gap-x-6 gap-y-4 lg:grid-cols-4">
        {FACTS.map((f) => (
          <li key={f.title}>
            <Link href={f.href} className="group block">
              <p className="text-[15px] font-semibold text-navy group-hover:text-brand">{f.title}</p>
              <p className="mt-0.5 text-[13px] leading-snug text-text-secondary">{f.text}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
