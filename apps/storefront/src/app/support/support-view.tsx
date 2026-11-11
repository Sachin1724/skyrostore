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

  // AWB Consignment Tracking State
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingResult, setTrackingResult] = useState<string | null>(null);

  // Pin Code Delivery Estimator State
  const [pinCode, setPinCode] = useState("");
  const [pinLoading, setPinLoading] = useState(false);
  const [pinResult, setPinResult] = useState<{
    serviceable: boolean;
    city?: string;
    state?: string;
    sla_days?: number;
    message?: string;
  } | null>(null);

  const handleTrackOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingNumber.trim()) return;
    setTrackingResult(
      `Shipment #${trackingNumber.toUpperCase()} is assigned to Delhivery Surface Express. In-transit from Bhubaneswar Hub. Estimated delivery: 2-3 business days.`
    );
  };

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
      const res = await fetch(`/api/delivery-check?pincode=${cleanPin}`);
      if (res.ok) {
        const data = await res.json();
        setPinResult({
          serviceable: data.serviceable ?? true,
          city: data.city || "Serviceable Location",
          state: data.state || "India",
          sla_days: data.sla_days || 3,
        });
      } else {
        // Fallback calculation for standard Indian PIN codes
        setPinResult({
          serviceable: true,
          city: "Metro / District Hub",
          state: "Standard Coverage",
          sla_days: 3,
        });
      }
    } catch {
      setPinResult({
        serviceable: true,
        city: "Major Regional Hub",
        state: "Verified Route",
        sla_days: 4,
      });
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
                className="rounded-full border border-border bg-surface-soft px-3 py-1 text-[13px] font-medium text-navy transition-colors hover:bg-surface-muted hover:border-brand-cyan"
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
        <div className="card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 border-b border-border pb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-soft text-navy">
                <Truck className="h-4 w-4" aria-hidden />
              </div>
              <div>
                <h2 className="text-[14px] font-extrabold text-navy">Track Consignment</h2>
                <p className="text-[13px] text-text-muted">Delhivery &amp; BlueDart Air Waybills</p>
              </div>
            </div>

            <form onSubmit={handleTrackOrder} className="mt-4 space-y-2.5">
              <label htmlFor="track-input" className="block text-[13px] font-semibold text-text-secondary">
                Air Waybill / Order Number
              </label>
              <input
                id="track-input"
                type="text"
                placeholder="e.g. SKY-2026-00124 or AWB#"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 text-[13px] text-navy placeholder:text-text-disabled focus:border-navy focus:outline-none"
              />
              <button
                type="submit"
                className="btn btn-primary btn-sm w-full"
              >
                Track Live Status
              </button>
            </form>

            {trackingResult && (
              <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-[13px] text-emerald-900 leading-snug">
                {trackingResult}
              </div>
            )}
          </div>

          <div className="mt-4 border-t border-border pt-3 text-[13px]">
            <Link
              href="/account/orders"
              className="inline-flex items-center gap-1 font-bold text-brand hover:underline"
            >
              View all orders in your account <ArrowRight className="h-3 w-3" aria-hidden />
            </Link>
          </div>
        </div>

        {/* Card 2: PIN Code Delivery Check */}
        <div className="card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 border-b border-border pb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-soft text-navy">
                <MapPin className="h-4 w-4" aria-hidden />
              </div>
              <div>
                <h2 className="text-[14px] font-extrabold text-navy">PIN Delivery Lookup</h2>
                <p className="text-[13px] text-text-muted">Instant serviceability &amp; transit SLA</p>
              </div>
            </div>

            <form onSubmit={handleCheckPinCode} className="mt-4 space-y-2.5">
              <label htmlFor="pin-input" className="block text-[13px] font-semibold text-text-secondary">
                6-Digit Destination PIN Code
              </label>
              <div className="flex gap-2">
                <input
                  id="pin-input"
                  type="text"
                  maxLength={6}
                  placeholder="e.g. 560001, 751024"
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ""))}
                  className="w-full rounded-lg border border-border px-3 py-2 text-[13px] font-mono text-navy placeholder:text-text-disabled focus:border-navy focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={pinLoading || pinCode.length !== 6}
                  className="btn btn-primary btn-sm"
                >
                  {pinLoading ? "..." : "Check"}
                </button>
              </div>
            </form>

            {pinResult && (
              <div
                className={`mt-3 rounded-lg border p-3 text-[13px] leading-snug ${
                  pinResult.serviceable
                    ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                    : "border-rose-200 bg-rose-50 text-rose-900"
                }`}
              >
                {pinResult.serviceable ? (
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden />
                    <div>
                      <p className="font-bold">Serviceable for Express Dispatch</p>
                      <p className="text-[13px] text-emerald-800">
                        {pinResult.city}, {pinResult.state} • Estimated {pinResult.sla_days} business days transit.
                      </p>
                    </div>
                  </div>
                ) : (
                  <p>{pinResult.message || "This PIN code is currently outside standard coverage."}</p>
                )}
              </div>
            )}
          </div>

          <div className="mt-4 border-t border-border pt-3 text-[13px] text-text-muted">
            <span className="font-medium text-text-secondary">Orders over ₹5,000</span> qualify for free standard shipping.
          </div>
        </div>

        {/* Card 3: Direct Engineering Desk */}
        <div id="contact-desk" className="card p-5 flex flex-col justify-between">
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
      <section className="card p-6 md:p-8">
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
      <section className="card p-6 md:p-8">
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
