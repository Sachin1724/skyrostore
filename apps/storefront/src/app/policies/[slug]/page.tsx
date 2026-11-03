import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

type Policy = { title: string; intro: string; sections: Array<[string, string]> };

/*
 * Drafts written from how the store actually works (prepaid via Razorpay,
 * courier via Shipmozo/Delhivery from Odisha). Every number in [brackets] is a
 * business decision for the owner to confirm; the notice stays until then.
 * Razorpay requires these four pages before it activates a live account.
 */
const POLICIES: Record<string, Policy> = {
  shipping: {
    title: "Shipping",
    intro: "Every order ships from our workshop in Odisha by tracked courier.",
    sections: [
      ["Dispatch", "Orders are checked, packed and handed to the courier within [1–2] working days of payment."],
      ["Delivery", "We ship across India through Delhivery and partner couriers. Most orders arrive within [3–7] working days of dispatch; remote PIN codes can take longer. Checkout tells you before you pay if we cannot deliver to your PIN code."],
      ["Shipping charge", "The shipping charge is shown in the payment window before you pay. [Orders above ₹X ship free.]"],
      ["Tracking", "When your parcel is booked you receive the tracking number by email, and live status appears under My orders."],
      ["Lithium batteries", "LiPo packs are shipped by surface transport as courier rules require, which can add [1–3] days."],
    ],
  },
  refunds: {
    title: "Returns and refunds",
    intro: "If something arrives damaged, wrong or faulty, we put it right.",
    sections: [
      ["Damaged or wrong item", "Tell us within [48 hours] of delivery with photos of the parcel and the item. We replace it or refund it in full, including shipping."],
      ["Faulty item", "Report a defect within [7 days] of delivery. After inspection we repair, replace or refund it."],
      ["Change of mind", "Unused items in original packaging can be returned within [7 days] of delivery. Return shipping is paid by the buyer. Batteries, flashed flight controllers and items cut or soldered are not returnable for change of mind."],
      ["Refunds", "Approved refunds go back to the original payment method through Razorpay within [5–7] working days."],
      ["Cancellations", "You can cancel free of charge until the order is packed. After that, use a return."],
    ],
  },
  terms: {
    title: "Terms",
    intro: "These terms apply to purchases on skyrostore.",
    sections: [
      ["Prices", "Prices are in Indian rupees and include GST unless stated. A GST invoice is issued with every order."],
      ["Payment", "Payment is taken in full at checkout through Razorpay. Your order is confirmed only when Razorpay confirms the payment."],
      ["Compatibility checks", "Our compatibility check compares published specifications. It guides, but does not replace, the builder's own judgement about a flight setup."],
      ["Use of drones", "Flying drones in India is regulated by the Drone Rules, 2021 and DGCA. Registration, permissions and safe operation are the buyer's responsibility."],
      ["Contact", "[Registered business name, address, GSTIN, phone and email.]"],
    ],
  },
  privacy: {
    title: "Privacy",
    intro: "We collect only what we need to sell and deliver your order.",
    sections: [
      ["What we collect", "Your name, email, phone number and delivery address; your orders; and how you use the site, to improve it. Card and UPI details are handled by Razorpay and never reach us."],
      ["Who we share it with", "Razorpay (payment), Shipmozo and the courier (delivery), Google Firebase (sign-in) and our hosting providers. We do not sell your data."],
      ["Sign-in", "Phone, Google or email-link sign-in is handled by Firebase. We store the account identifier it returns, not your password."],
      ["Your rights", "You can ask for a copy of your data or for its deletion by writing to [email]. Order records are kept as tax law requires."],
      ["Cookies", "We use a sign-in cookie and first-party analytics only. No advertising trackers."],
    ],
  },
};

export function generateStaticParams() {
  return Object.keys(POLICIES).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const policy = POLICIES[(await params).slug];
  return { title: policy?.title ?? "Policy" };
}

export default async function PolicyPage({ params }: { params: Promise<{ slug: string }> }) {
  const policy = POLICIES[(await params).slug];
  if (!policy) notFound();

  return (
    <>
      <Header />
      <main id="main" className="bg-[#F4F8FC]">
        <article className="mx-auto max-w-[760px] px-5 py-16 md:py-24">
          <h1 className="text-[clamp(2.5rem,1.6rem+4vw,4.5rem)] font-bold leading-[1] tracking-[-0.035em] text-navy">
            {policy.title}
          </h1>
          <p className="mt-5 text-[20px] text-navy">{policy.intro}</p>
          <p className="mt-6 bg-brand-soft px-4 py-3 text-[15px] text-navy" role="note">
            Draft: the values in brackets are awaiting the store owner&apos;s confirmation.
          </p>
          <div className="mt-12 space-y-10">
            {policy.sections.map(([heading, body]) => (
              <section key={heading}>
                <h2 className="text-[22px] font-bold text-navy">{heading}</h2>
                <p className="mt-2 text-[17px] leading-[1.6] text-navy">{body}</p>
              </section>
            ))}
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
