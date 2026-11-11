import Link from "next/link";

/**
 * The thin blue strip above the header: three facts that are true for every order, standing still so
 * they can be read. Phones show the first one only.
 */
const ITEMS = [
  { text: "Pay by UPI, card or netbanking, secured by Razorpay", short: "Secure payment by Razorpay", href: "/support" },
  { text: "GST invoice with every order", href: "/policies/shipping" },
  { text: "Bulk orders with formal quotations", href: "/bulk-orders" },
];

export function Ticker() {
  return (
    <div className="overflow-hidden bg-brand text-[13px] text-white">
      <ul className="mx-auto flex h-8 max-w-[1760px] items-center justify-center gap-8 px-4 md:px-8">
        {ITEMS.map((item, i) => (
          <li key={item.href} className={i === 1 ? "hidden md:block" : i === 2 ? "hidden lg:block" : undefined}>
            <Link href={item.href} className="whitespace-nowrap hover:underline">
              {"short" in item ? (
                <>
                  <span className="sm:hidden">{item.short}</span>
                  <span className="hidden sm:inline">{item.text}</span>
                </>
              ) : (
                item.text
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
