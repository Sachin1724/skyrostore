import Link from "next/link";
import { BackLink } from "@/components/layout/back-link";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ShieldCheck, Truck, RotateCcw, FileText, Lock, ChevronRight } from "lucide-react";

type Policy = {
  title: string;
  badge: string;
  intro: string;
  effectiveDate: string;
  sections: Array<[string, string]>;
};

const POLICIES: Record<string, Policy> = {
  shipping: {
    title: "Shipping & Delivery Policy",
    badge: "Domestic Logistics & Dangerous Goods Compliance",
    intro: "Every order dispatches from our central electronics facility in Bhubaneswar, Odisha via tracked priority courier.",
    effectiveDate: "November 2026",
    sections: [
      [
        "Dispatch Timelines",
        "Orders placed before 2:00 PM IST on business days are inspected, packed with anti-static shielding, and handed to the courier within 1 to 2 business days of payment confirmation. Custom-soldered builds or heavy-lift airframes requiring bench testing dispatch within 3 to 5 business days.",
      ],
      [
        "Delivery Coverage & Transit Times",
        "We deliver across India through Delhivery Express, BlueDart Aviation, and DTDC. Metro deliveries (Mumbai, Delhi NCR, Bengaluru, Hyderabad, Chennai, Kolkata) typically arrive within 2 to 4 business days. Tier-2 and regional PIN codes arrive within 4 to 6 business days. Real-time pin code serviceability is validated at checkout before payment.",
      ],
      [
        "Freight Charges & Free Shipping",
        "Standard insured surface freight is calculated dynamically based on package weight and volumetric dimensions. Orders with a cart value exceeding ₹5,000 (after applicable discounts and excluding GST) qualify for Free Standard Shipping across India.",
      ],
      [
        "Real-Time Consignment Tracking",
        "Upon courier pickup, a Delhivery/BlueDart Air Waybill (AWB) number and direct tracking link are dispatched to your registered email and WhatsApp/SMS. Live tracking status is accessible anytime under My Orders in your account.",
      ],
      [
        "Lithium Polymer (LiPo) Battery Logistics",
        "High-capacity LiPo and solid-state battery packs (exceeding 100Wh) are classified as Dangerous Goods under Bureau of Civil Aviation Security (BCAS) and IATA DGR guidelines. Batteries ship exclusively via insured surface express cargo, which may require an additional 1 to 3 business days for transit.",
      ],
    ],
  },
  refunds: {
    title: "Returns & Refund Policy",
    badge: "Consumer Assurance & Technical QA",
    intro: "If any component arrives damaged, defective, or incorrect, our technical support group handles repair, replacement, or prompt refund.",
    effectiveDate: "November 2026",
    sections: [
      [
        "Transit Damage or Missing Items",
        "Inspect your parcel upon arrival. If outer packaging shows visible tampering or physical damage, notify our support team at support@skyrostore.com within 48 hours of delivery with unboxing photographs or video footage. We provide an immediate replacement or full refund including shipping fees.",
      ],
      [
        "Dead-on-Arrival (DOA) & Manufacturing Defects",
        "Report any electrical or hardware defects within 7 calendar days of delivery. Our engineering desk will assist with diagnostics, bench testing instructions, or issue an RMA (Return Merchandise Authorization) number for complimentary return pickup.",
      ],
      [
        "Change-of-Mind Returns",
        "Unopened, factory-sealed components in original antistatic bags may be returned within 7 calendar days of receipt. Return freight is paid by the purchaser. Due to aviation safety standards, batteries with broken security seals, flashed flight controllers, or components with cut leads or solder traces cannot be returned for change-of-mind.",
      ],
      [
        "Refund Processing Window",
        "Once returned inventory is inspected and verified at our Odisha facility, refunds are initiated within 2 business days. Funds are credited back to the original payment source (UPI, Net Banking, or Credit/Debit Card) via Razorpay within 5 to 7 banking days.",
      ],
      [
        "Order Cancellations",
        "Orders may be cancelled free of charge prior to warehouse packaging and AWB generation from your Account dashboard or by notifying support. Once dispatched, standard return protocols apply.",
      ],
    ],
  },
  terms: {
    title: "Terms & Conditions of Service",
    badge: "Commercial & Statutory Regulatory Terms",
    intro: "These Terms and Conditions govern the purchase of aerial hardware, components, and custom engineering services on Skyrostore.",
    effectiveDate: "November 2026",
    sections: [
      [
        "Pricing & Statutory Taxation",
        "All catalogue prices are listed in Indian Rupees (INR) and are inclusive of 18% Goods and Services Tax (GST) under HSN Code 88069000. An official B2B Tax Invoice with input tax credit (ITC) breakdown and company GSTIN is issued automatically with every completed transaction.",
      ],
      [
        "Payment Processing & Security",
        "Payments are processed securely through Razorpay using PCI-DSS Level 1 compliant tokenization. We accept UPI (Google Pay, PhonePe, Paytm, BHIM), all major RuPay, Visa, and Mastercard credit/debit cards, and corporate net banking. Orders are confirmed only upon successful authorization.",
      ],
      [
        "Compatibility Engine & Spec Disclaimers",
        "Our automated compatibility validation engine computes physical and electrical tolerances based on published manufacturer specifications. While engineered to prevent hardware mismatches, builders remain responsible for final pre-flight telemetry verification and safe bench configuration.",
      ],
      [
        "Aviation Compliance & Drone Rules, 2021",
        "Operation of unmanned aircraft systems (UAS) in Indian airspace is strictly governed by the Ministry of Civil Aviation (MoCA) Drone Rules, 2021 and Directorate General of Civil Aviation (DGCA) guidelines. The purchaser assumes full statutory responsibility for UIN registration on the DigitalSky platform, remote pilot licensing, and adherence to designated Green, Yellow, and Red flight zones.",
      ],
      [
        "Statutory Corporate Entity",
        "Skyro Aerial Technologies Pvt. Ltd., Technology Corridor, Chandaka Industrial Estate, Patia, Bhubaneswar, Odisha 751024, India. GSTIN: 21AAECS9821R1ZM. Contact: support@skyrostore.com | Phone: +91 98765 43210.",
      ],
    ],
  },
  privacy: {
    title: "Privacy & Data Protection Policy",
    badge: "Information Technology Act, 2000 & SPDI Rules",
    intro: "Skyrostore respects customer confidentiality and handles personal information strictly for order fulfillment, logistics tracking, and statutory tax compliance.",
    effectiveDate: "November 2026",
    sections: [
      [
        "Information We Collect",
        "We collect customer contact coordinates (name, email address, telephone number), shipping addresses, optional institutional GSTIN details, and order history necessary to deliver physical goods. Sensitive financial details (card numbers, UPI PINs) are processed directly by RBI-authorized payment aggregator Razorpay and are never stored on our servers.",
      ],
      [
        "Third-Party Service Providers",
        "Customer delivery details are shared exclusively with certified logistical partners (Delhivery, BlueDart, DTDC) for delivery routing, and Razorpay for payment reconciliation. We do not sell, rent, or trade customer data to third-party advertising brokers.",
      ],
      [
        "Authentication & Security",
        "User sessions are authenticated via Firebase Auth using encrypted tokens. Passwords and biometrics are never stored in plain text. All web traffic is strictly encrypted over TLS 1.3 with automated HSTS security headers.",
      ],
      [
        "Customer Rights & Data Rectification",
        "Customers may inspect, update, or request erasure of personal data by contacting privacy@skyrostore.com. Statutory transactional records and GST tax invoices are retained in accordance with Indian tax retention regulations for the mandatory statutory period.",
      ],
      [
        "Cookie Usage",
        "We utilize essential session cookies for authentication, shopping cart persistence, and anonymous performance analytics. No invasive third-party cross-site advertising tracking cookies are utilized.",
      ],
    ],
  },
};

const POLICY_NAV = [
  { slug: "shipping", label: "Shipping Policy", icon: Truck },
  { slug: "refunds", label: "Returns & Refunds", icon: RotateCcw },
  { slug: "terms", label: "Terms of Service", icon: FileText },
  { slug: "privacy", label: "Privacy Policy", icon: Lock },
];

export function generateStaticParams() {
  return Object.keys(POLICIES).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const policy = POLICIES[(await params).slug];
  return {
    title: `${policy?.title ?? "Legal Policy"} — Skyrostore`,
    description: policy?.intro ?? "Official legal and compliance policies for Skyrostore.",
  };
}

export default async function PolicyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const policy = POLICIES[slug];
  if (!policy) notFound();

  return (
    <>
      <Header />
      <main id="main" className="min-h-screen bg-surface-soft pb-20">
        <div className="mx-auto max-w-[1100px] px-4 md:px-8">
          {/* Breadcrumb */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-4">
          <BackLink fallback="/" />
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5  text-[13px] text-text-secondary">
            <Link href="/" className="hover:text-brand">Home</Link>
            <span aria-hidden>/</span>
            <span className="text-text-muted">Policies</span>
            <span aria-hidden>/</span>
            <span className="font-semibold text-navy">{policy.title}</span>
          </nav>
        </div>

          {/* Policy Navigation Tabs */}
          <div className="mt-4 flex gap-2 overflow-x-auto border-b border-border pb-3 text-[13px]">
            {POLICY_NAV.map((item) => {
              const Icon = item.icon;
              const isActive = item.slug === slug;
              return (
                <Link
                  key={item.slug}
                  href={`/policies/${item.slug}`}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 font-bold transition-colors whitespace-nowrap ${
                    isActive
                      ? "bg-navy text-white"
                      : "bg-white text-text-secondary border border-border hover:text-navy hover:bg-surface-soft"
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Policy Document Content */}
          <article className="mt-6 card p-6 md:p-12">
            {/* Header */}
            <div className="border-b border-border pb-6">
              <span className="inline-flex items-center gap-1.5 rounded bg-brand/10 px-2.5 py-1 text-[13px] font-extrabold text-brand">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                {policy.badge}
              </span>

              <h1 className="mt-3 text-[clamp(2rem,1.5rem+2.2vw,3rem)] font-extrabold tracking-tight text-navy">
                {policy.title}
              </h1>

              <p className="mt-3 text-[16px] leading-relaxed text-text-secondary max-w-[760px]">
                {policy.intro}
              </p>

              <div className="mt-4 flex items-center gap-4 text-[13px] font-mono text-text-muted">
                <span>Effective: {policy.effectiveDate}</span>
                <span>Jurisdiction: Bhubaneswar, Odisha, India</span>
              </div>
            </div>

            {/* Sections */}
            <div className="mt-8 space-y-8">
              {policy.sections.map(([heading, body], idx) => (
                <section key={heading} className="border-b border-border/60 pb-7 last:border-b-0 last:pb-0">
                  <div className="flex items-baseline gap-3">
                    <span className="font-mono text-[13px] font-extrabold text-brand">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <h2 className="text-[18px] font-extrabold text-navy">
                      {heading}
                    </h2>
                  </div>
                  <p className="mt-2.5 text-[14px] md:text-[16px] leading-relaxed text-text-secondary pl-7">
                    {body}
                  </p>
                </section>
              ))}
            </div>

            {/* Assistance Banner */}
            <div className="mt-12 rounded-xl border border-border bg-surface-soft p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-[14px] font-extrabold text-navy">
                  Questions regarding our policies?
                </h3>
                <p className="text-[13px] text-text-secondary mt-0.5">
                  Our compliance and support desk is available Monday through Saturday from 9:00 AM to 6:00 PM IST.
                </p>
              </div>

              <Link
                href="/support"
                className="btn btn-primary whitespace-nowrap"
              >
                Contact Support Desk <ChevronRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </article>
        </div>
      </main>
      <Footer />
    </>
  );
}
