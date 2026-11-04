/**
 * The thin blue strip above the header. It scrolls because the three facts it
 * used to hold left most of the bar empty. The list is doubled so the loop has
 * no seam; it pauses on hover and stands still under reduced motion (globals.css).
 */
const ITEMS = [
  "Pay by UPI, card or netbanking, secured by Razorpay",
  "Delivered across India by Delhivery, BlueDart and DTDC",
  "GST invoice with every order, input tax credit for businesses",
  "Every part checked against the rest of your build before it ships",
  "Motors, ESCs, flight controllers, props, packs and frames",
  "Free shipping on orders over ₹5,000",
  "Dispatched from our Odisha workshop within 24 hours",
  "Damaged on arrival? Replaced or refunded",
  "Bulk and institutional supply with formal quotations",
];

export function Ticker() {
  const loop = [...ITEMS, ...ITEMS];
  return (
    <div className="ticker overflow-hidden bg-brand py-1.5 text-[13px] text-white">
      <ul className="ticker-track flex w-max items-center">
        {loop.map((text, i) => (
          <li key={i} aria-hidden={i >= ITEMS.length ? true : undefined} className="flex items-center whitespace-nowrap">
            <span className="px-6">{text}</span>
            <span aria-hidden className="h-1 w-1 rounded-full bg-white/50" />
          </li>
        ))}
      </ul>
    </div>
  );
}
