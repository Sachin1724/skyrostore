"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  Package,
  FileText,
  Wrench,
  ShieldCheck,
  Cpu,
  User,
  Boxes,
  MessageSquare,
  Truck,
  Headphones,
  Mail,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  ArrowRight,
  MapPin,
  Clock,
  Building2,
  Receipt,
  HelpCircle,
} from "lucide-react";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    id: "faq-1",
    question: "How can I track my shipment and AWB?",
    answer:
      "Upon dispatch from our facility in Bhubaneswar, an automated notification containing your Delhivery or BlueDart Air Waybill (AWB) number is emailed to you. You can track transit milestones live in the tracker below or within the 'My Orders' section of your account.",
  },
  {
    id: "faq-2",
    question: "What is the warranty coverage on propulsion & avionics?",
    answer:
      "All flight controllers (Pixhawk, Cube, SpeedyBee), telemetry transmitters, and brushless motors carry a 1-year manufacturer replacement warranty against electrical and manufacturing flaws. LiPo battery packs and carbon propellers are covered under a 7-day dead-on-arrival (DOA) replacement policy.",
  },
  {
    id: "faq-3",
    question: "Do you ship Dangerous Goods (LiPo batteries) across India?",
    answer:
      "Yes. High-capacity LiPo and solid-state batteries are classified as Dangerous Goods under DGCA and BCAS guidelines. We ship battery lots exclusively via insured surface express freight with fire-retardant thermal barriers, reaching all serviceable Indian PIN codes.",
  },
  {
    id: "faq-4",
    question: "Can I claim 18% GST Input Tax Credit (ITC) on my order?",
    answer:
      "Yes. Skyrostore is registered in Odisha under GSTIN 21AAECS9821R1ZM. Enter your enterprise or institutional GSTIN during checkout, and a statutory B2B Tax Invoice with HSN code 88069000 and ITC breakdown will be automatically generated and filed on the GST portal.",
  },
  {
    id: "faq-5",
    question: "How does the automated UAV compatibility check work?",
    answer:
      "Our multi-rotor build engine compares real physical tolerances: propeller diameter vs frame arm clearance, motor peak current draw vs ESC continuous amp rating, and battery voltage window vs motor KV rating. It alerts you before checkout to prevent burned ESCs or unstable thrust-to-weight ratios.",
  },
  {
    id: "faq-6",
    question: "How do I request volume discounts for fleet or institutional orders?",
    answer:
      "Orders of 5 units or more qualify for our Tiered Volume Program (8% to 22% rebates). Submit a bill of materials via our RFQ Portal (/bulk-orders/request) or contact bulk@skyrostore.com for an official quotation valid for 30 days.",
  },
  {
    id: "faq-7",
    question: "What is your return policy for aerial components?",
    answer:
      "Unused, unopened components in their original factory antistatic packaging can be returned within 7 calendar days of receipt. Due to aviation safety standards, components with soldered leads, modified firmware, or broken warranty seals cannot be returned for change-of-mind.",
  },
  {
    id: "faq-8",
    question: "Where can I find ArduPilot and PX4 setup schematics?",
    answer:
      "Wiring pinouts, CAN bus architectures, power module schematics, and recommended parameter (.param) files are accessible under the 'Specs & Documentation' tab on each respective flight controller product page.",
  },
];

const TOPICS = [
  { title: "Orders & Shipping", desc: "AWB tracking, transit times, express dispatch", icon: Package, href: "/account/orders" },
  { title: "Propulsion & ESCs", desc: "Motor KV matching, continuous ratings, timing", icon: Cpu, href: "/parts" },
  { title: "Flight Controllers", desc: "Pixhawk, Cube, ArduPilot, PX4 firmware", icon: Wrench, href: "/parts" },
  { title: "Returns & Warranty", desc: "7-day DOA, RMA request, factory replacement", icon: ShieldCheck, href: "/policies/refunds" },
  { title: "UAV Configurator", desc: "AUW, TWR, motor thrust & flight time engine", icon: Wrench, href: "/build" },
  { title: "Institutional Supply", desc: "University labs, fleet RFQ, volume pricing", icon: Boxes, href: "/bulk-orders" },
  { title: "GST & Invoicing", desc: "B2B input tax credit, HSN codes, invoices", icon: Receipt, href: "/account/orders" },
  { title: "Legal & Compliance", desc: "DGCA Drone Rules 2021, terms & privacy", icon: FileText, href: "/policies/terms" },
  { title: "Contact Engineering", desc: "Direct phone, email, and technical desk", icon: Headphones, href: "#contact-desk" },
];

export function SupportView() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFaq, setExpandedFaq] = useState<string | null>("faq-1");

  // PIN check: the courier's own answer (yes, no, or could not say). Nothing is estimated here.
  const [pinCode, setPinCode] = useState("");
  const [pinLoading, setPinLoading] = useState(false);
  const [pinResult, setPinResult] = useState<{ serviceable: boolean | null; message?: string } | null>(null);

  const handleCheckPinCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pinCode.trim();
    if (!/^\d{6}$/.test(cleanPin)) {
      setPinResult({
        serviceable: false,
        message: "Please enter a valid 6-digit Indian PIN code.",
      });
      return;
    }

    setPinLoading(true);
    setPinResult(null);

    try {
      const res = await fetch(`/api/delivery-check?pin=${cleanPin}`);
      const data = res.ok ? ((await res.json()) as { serviceable: boolean | null }) : { serviceable: null };
      setPinResult({ serviceable: data.serviceable });
    } catch {
      setPinResult({ serviceable: null });
    } finally {
      setPinLoading(false);
    }
  };

  const filteredFaqs = FAQS.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="mt-4 space-y-10">
      {/* 1. Hero Search & Assistance Banner */}
      <section className="rounded-2xl bg-white px-6 py-12 text-center text-navy md:py-16">
        <div className="mx-auto max-w-[720px]">

          <h1 className="mt-3 text-[clamp(2rem,1.5rem+2.6vw,3.6rem)] font-extrabold leading-[1.08] tracking-[-0.03em] text-navy">
            How can we help?
          </h1>

          <p className="mt-3 text-[14px] md:text-[16px] leading-relaxed text-text-secondary">
            Search technical setup guides, track active courier consignments, verify delivery timelines to your PIN code, or consult directly with our applications engineering team.
          </p>

          {/* Integrated Search Input */}
          <div className="mt-6 flex items-center overflow-hidden rounded-lg bg-white p-1 border border-white/20">
            <Search className="ml-3 h-5 w-5 text-text-muted shrink-0" aria-hidden />
            <input
              type="text"
              placeholder="Search help topics, error codes, ArduPilot setup, or policies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent px-3 py-2 text-[14px] text-navy placeholder:text-text-muted focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="mr-2 text-[13px] font-bold text-text-muted hover:text-navy"
              >
                Clear
              </button>
            )}
          </div>

          {/* Popular Search Tags */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[13px] text-text-secondary">
            <span className="font-semibold text-navy">Quick links:</span>
            {[
              "Track Order",
              "PIN Delivery Check",
              "LiPo Shipping Policy",
              "GST Invoice Download",
              "Bulk RFQ",
              "Warranty RMA",
            ].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setSearchQuery(tag)}
                className="inline-flex min-h-10 items-center rounded-full border border-border bg-surface-soft px-3.5 text-[14px] font-medium text-navy transition-colors hover:border-brand-cyan hover:bg-surface-muted"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 2. Interactive Diagnostics Row (3 Columns: Track, PIN Check, Direct Desk) */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Track Shipment */}
        <div className="card flex flex-col justify-between p-4 sm:p-5">
          <div>
            <div className="flex items-center gap-2.5 border-b border-border pb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-soft text-navy">
                <Truck className="h-4 w-4" aria-hidden />
              </div>
              <div>
                <h2 className="text-[14px] font-extrabold text-navy">Track an order</h2>
                <p className="text-[13px] text-text-muted">Courier and tracking number</p>
              </div>
            </div>

            <p className="mt-4 text-[14px] leading-relaxed text-text-secondary">
              When your order ships, the courier and tracking number are emailed to you and shown on the order
              in your account, with the latest status from the courier.
            </p>
          </div>

          <div className="mt-4 border-t border-border pt-3 text-[13px]">
            <Link
              href="/account/orders"
              className="inline-flex items-center gap-1 font-bold text-brand hover:underline"
            >
              Go to your orders <ArrowRight className="h-3 w-3" aria-hidden />
            </Link>
          </div>
        </div>

        {/* Card 2: PIN Code Delivery Check */}
        <div className="card flex flex-col justify-between p-4 sm:p-5">
          <div>
            <div className="flex items-center gap-2.5 border-b border-border pb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-soft text-navy">
                <MapPin className="h-4 w-4" aria-hidden />
              </div>
              <div>
                <h2 className="text-[14px] font-extrabold text-navy">Delivery to your PIN code</h2>
                <p className="text-[13px] text-text-muted">Check that we deliver to your PIN code</p>
              </div>
            </div>

            <form onSubmit={handleCheckPinCode} className="mt-4 space-y-2.5">
              <label htmlFor="pin-input" className="block text-[13px] font-semibold text-text-secondary">
                6-digit PIN code
              </label>
              <div className="flex gap-2">
                <input
                  id="pin-input"
                  type="text"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  maxLength={6}
                  placeholder="e.g. 560001, 751024"
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ""))}
                  className="w-full rounded-lg border border-border px-3 py-2 text-[14px] tabular-nums text-navy placeholder:text-text-disabled focus:border-navy focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={pinLoading || pinCode.length !== 6}
                  className="btn btn-primary btn-sm"
                >
                  {pinLoading ? "Checking…" : "Check"}
                </button>
              </div>
            </form>

            {pinResult && (
              <p
                aria-live="polite"
                className={`mt-3 rounded-lg p-3 text-[14px] leading-snug ${
                  pinResult.serviceable === true
                    ? "bg-success-soft text-success"
                    : pinResult.serviceable === false
                      ? "bg-error-soft text-error"
                      : "bg-surface-soft text-text-secondary"
                }`}
              >
                {pinResult.message ??
                  (pinResult.serviceable === true
                    ? `We deliver to ${pinCode}.`
                    : pinResult.serviceable === false
                      ? `Couriers do not reach ${pinCode} yet. Contact us for other options.`
                      : `We could not check ${pinCode} right now. Delivery is confirmed at checkout.`)}
              </p>
            )}
          </div>

        </div>

        {/* Card 3: Direct Engineering Desk */}
        <div id="contact-desk" className="card flex flex-col justify-between p-4 sm:p-5">
          <div>
            <div className="flex items-center gap-2.5 border-b border-border pb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-soft text-navy">
                <Headphones className="h-4 w-4" aria-hidden />
              </div>
              <div>
                <h2 className="text-[14px] font-extrabold text-navy">Contact us</h2>
                <p className="text-[13px] text-text-muted">Bhubaneswar Facility • 9 AM - 6 PM IST</p>
              </div>
            </div>

            <div className="mt-4 space-y-3 text-[13px]">
              <div className="flex items-start gap-2.5">
                <Mail className="h-4 w-4 text-brand shrink-0 mt-0.5" aria-hidden />
                <div>
                  <p className="font-bold text-navy">Orders and product questions</p>
                  <a href="mailto:support@skyrostore.com" className="text-text-secondary hover:text-brand hover:underline">
                    support@skyrostore.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Building2 className="h-4 w-4 text-brand shrink-0 mt-0.5" aria-hidden />
                <div>
                  <p className="font-bold text-navy">Bulk orders and quotations</p>
                  <a href="mailto:bulk@skyrostore.com" className="text-text-secondary hover:text-brand hover:underline">
                    bulk@skyrostore.com
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 border-t border-border pt-3 text-[13px]">
            <Link
              href="/bulk-orders/request"
              className="inline-flex items-center gap-1 font-bold text-navy hover:text-brand"
            >
              Submit formal RFQ requisition <ArrowRight className="h-3 w-3" aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      {/* 3. Browse Help Categories Grid (9 Cards) */}
      <section className="card p-4 sm:p-6 md:p-8">
        <div className="border-b border-border pb-4">
          <h2 className="text-[20px] font-extrabold text-navy">
            Technical Knowledge &amp; Category Topics
          </h2>
          <p className="mt-1 text-[13px] text-text-secondary">
            Find documentation, guides, and self-service procedures by avionics system.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TOPICS.map((topic) => {
            const Icon = topic.icon;
            return (
              <Link
                key={topic.title}
                href={topic.href}
                className="group flex items-start justify-between rounded-xl border border-border bg-surface-soft p-4 transition-all hover:border-slate-400 hover:bg-white"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white border border-border text-navy group-hover:bg-navy group-hover:text-white transition-colors">
                    <Icon className="h-4 w-4" aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[13px] font-extrabold text-navy group-hover:text-brand truncate">
                      {topic.title}
                    </h3>
                    <p className="mt-0.5 text-[13px] leading-relaxed text-text-muted">
                      {topic.desc}
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-text-muted transition-transform group-hover:translate-x-1 mt-1" aria-hidden />
              </Link>
            );
          })}
        </div>
      </section>

      {/* 4. Frequently Asked Questions Accordion */}
      <section className="card p-4 sm:p-6 md:p-8">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h2 className="text-[20px] font-extrabold text-navy">
              Frequently Asked Questions
            </h2>
            <p className="mt-1 text-[13px] text-text-secondary">
              Direct answers to procurement, compatibility, Dangerous Goods shipping, and warranties.
            </p>
          </div>

          <span className="text-[13px] font-mono text-text-muted">
            {filteredFaqs.length} Articles
          </span>
        </div>

        <div className="mt-6 space-y-3">
          {filteredFaqs.map((faq) => {
            const isOpen = expandedFaq === faq.id;
            return (
              <div
                key={faq.id}
                className="rounded-lg border border-border overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setExpandedFaq(isOpen ? null : faq.id)}
                  className="flex w-full items-center justify-between p-4 text-left font-bold text-[14px] text-navy transition hover:bg-surface-soft"
                >
                  <span className="pr-4">{faq.question}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-text-muted transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-navy" : ""
                    }`}
                    aria-hidden
                  />
                </button>
                {isOpen && (
                  <div className="border-t border-border bg-surface-soft/60 px-4 py-3.5 text-[13px] leading-relaxed text-text-secondary">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
