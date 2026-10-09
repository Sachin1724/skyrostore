"use client";

import { useState } from "react";
import Image from "next/image";
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
  Phone,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    id: "faq-1",
    question: "How can I track my order?",
    answer:
      "You can track your order by entering your order number on the tracking section above or from your account dashboard. You will also receive email updates with live tracking links from Delhivery or BlueDart at each dispatch milestone.",
  },
  {
    id: "faq-2",
    question: "What is the warranty on products?",
    answer:
      "All flight controllers, telemetry units, and motors carry a standard 1-year manufacturer warranty against manufacturing defects. LiPo batteries and carbon props are covered under dead-on-arrival (DOA) replacement within 7 days.",
  },
  {
    id: "faq-3",
    question: "Do you ship across India?",
    answer:
      "Yes, Skyrostore provides express insured surface and air shipping to all pin codes across India via BlueDart, Delhivery, and DTDC with full transit insurance.",
  },
  {
    id: "faq-4",
    question: "Can I return a product?",
    answer:
      "Unopened items in original factory packaging can be returned within 7 days of delivery. Custom-soldered components or UAV airframes configured to order are non-returnable once bench-tested and dispatched.",
  },
  {
    id: "faq-5",
    question: "How do I check component compatibility?",
    answer:
      "Use our automated UAV Builder tool (/build) to verify thrust-to-weight ratios, ESC burst current margins, flight controller protocols, and propeller clearance automatically.",
  },
  {
    id: "faq-6",
    question: "Do you offer bulk discounts?",
    answer:
      "Yes! Institutional and commercial purchases of 5+ units qualify for tiered pricing. Submit a quotation request via our Bulk Orders Dashboard (/bulk-orders/request).",
  },
  {
    id: "faq-7",
    question: "How long does delivery take?",
    answer:
      "Standard orders dispatch within 24 hours. Transit takes 2-4 business days for metro locations and 4-6 days for regional destinations.",
  },
  {
    id: "faq-8",
    question: "Can you help with custom UAV builds?",
    answer:
      "Our engineering team designs bespoke quadcopters, hexacopters, and VTOLs tailored for LiDAR survey, agricultural spraying, and high-altitude flight missions.",
  },
  {
    id: "faq-9",
    question: "Where can I download product manuals?",
    answer:
      "Technical datasheets, pinout diagrams, and ArduPilot/PX4 wiring manuals are available on each product page under the 'Documentation' tab.",
  },
  {
    id: "faq-10",
    question: "How do I update firmware?",
    answer:
      "Connect your flight controller via USB-C to Mission Planner or QGroundControl, navigate to Initial Setup > Install Firmware, and select the latest ArduCopter or PX4 release.",
  },
];

const ARTICLES = [
  {
    id: "art-1",
    title: "How to Choose the Right Motor for Your UAV",
    description: "Learn about KV rating, thrust, and propeller compatibility.",
    image: "/images/products/art-motor.png",
  },
  {
    id: "art-2",
    title: "Battery Safety Guidelines",
    description: "Best practices for LiPo battery usage and storage.",
    image: "/images/products/art-battery.png",
  },
  {
    id: "art-3",
    title: "Flight Controller Setup Guide",
    description: "Step-by-step setup for popular flight controllers.",
    image: "/images/products/art-fc.png",
  },
  {
    id: "art-4",
    title: "Using the UAV Builder",
    description: "Create compatible configurations with our builder tool.",
    image: "/images/products/art-builder.png",
  },
  {
    id: "art-5",
    title: "Shipping and Delivery Information",
    description: "Delivery timelines, tracking and supported locations.",
    image: "/images/products/art-shipping.png",
  },
];

const TOPICS = [
  { title: "Orders & Shipping", desc: "Track orders, shipping, delivery timelines", icon: Package },
  { title: "Product Guides", desc: "Setup guides, manuals and documentation", icon: FileText },
  { title: "Technical Support", desc: "Troubleshooting and technical assistance", icon: Wrench },
  { title: "Returns & Warranty", desc: "Returns, replacements and warranty claims", icon: ShieldCheck },
  { title: "UAV Builder", desc: "Configuration help and compatibility", icon: Wrench },
  { title: "Firmware & Software", desc: "Updates, configuration and calibration", icon: Cpu },
  { title: "Account & Payments", desc: "Account settings, payments, invoices", icon: User },
  { title: "Bulk Orders", desc: "Large quantity orders and custom builds", icon: Boxes },
  { title: "Contact Us", desc: "Get in touch with our team", icon: MessageSquare },
];

export function SupportView() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFaq, setExpandedFaq] = useState<string | null>("faq-1");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingResult, setTrackingResult] = useState<string | null>(null);

  const handleTrackOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingNumber.trim()) return;
    setTrackingResult(
      `Order ${trackingNumber} is in transit via Delhivery Express. Estimated delivery: 2 business days.`
    );
  };

  const toggleFaq = (id: string) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  return (
    <div className="space-y-12">
      {/* 1. HERO TOP BANNER WITH GLOWING DRONE GRAPHIC */}
      <section className="relative overflow-hidden rounded-2xl bg-[#181B20] text-white">
        <div className="mx-auto flex max-w-[1280px] flex-col justify-between px-8 py-10 md:flex-row md:items-center md:px-12">
          {/* Left Text & Search */}
          <div className="relative z-10 max-w-xl">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#84cc16]">
              SUPPORT CENTER
            </span>
            <h1 className="mt-2 text-[36px] font-extrabold tracking-tight text-white md:text-[44px]">
              How can we help you?
            </h1>
            <p className="mt-2 text-[14px] leading-relaxed text-gray-300">
              Find answers, track your order, get technical support or contact our team.
            </p>

            {/* Large Integrated Search Bar */}
            <div className="mt-6 flex items-center overflow-hidden rounded-lg bg-white p-1 shadow-lg">
              <Search className="ml-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search for help articles, guides, or topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent px-3 py-2 text-[13px] text-graphite placeholder:text-gray-400 focus:outline-none"
              />
              <button
                type="button"
                className="rounded-md bg-[#84cc16] px-6 py-2.5 text-[13px] font-bold text-graphite transition-colors hover:bg-[#a3e635]"
              >
                Search
              </button>
            </div>

            {/* Popular Searches Tag Strip */}
            <div className="mt-4 flex flex-wrap items-center gap-2 text-[12px] text-gray-400">
              <span className="font-medium text-gray-300">Popular searches:</span>
              {[
                "Track Order",
                "Firmware Update",
                "Compatibility",
                "Returns",
                "Bulk Orders",
              ].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSearchQuery(tag)}
                  className="rounded-full border border-gray-700 bg-[#22272e] px-3 py-1 text-[11px] text-gray-300 transition-colors hover:border-[#84cc16] hover:text-white"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Right Floating Drone Asset */}
          <div className="pointer-events-none relative mt-6 h-48 w-full max-w-[500px] md:mt-0 md:h-64">
            <Image
              src="/images/hero/support-hero-drone.png"
              alt="High-Tech Surveillance UAV"
              fill
              className="object-contain object-right"
            />
          </div>
        </div>
      </section>

      {/* 2. BROWSE HELP TOPICS GRID (9 Cards) */}
      <section>
        <div>
          <h2 className="text-[22px] font-bold tracking-tight text-graphite">
            Browse Help Topics
          </h2>
          <p className="mt-1 text-[13px] text-text-muted">Find information by category</p>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TOPICS.map((topic, idx) => {
            const Icon = topic.icon;
            return (
              <div
                key={idx}
                className="group flex cursor-pointer items-center justify-between rounded-xl border border-border bg-white p-5 shadow-sm transition-all hover:border-gray-400 hover:shadow-md"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-soft text-graphite transition-colors group-hover:bg-[#84cc16]/10 group-hover:text-[#65a30d]">
                    <Icon className="h-5 w-5 stroke-[1.8]" />
                  </div>
                  <div>
                    <h3 className="text-[14px] font-bold text-graphite group-hover:text-[#65a30d]">
                      {topic.title}
                    </h3>
                    <p className="mt-0.5 text-[12px] leading-relaxed text-text-muted">
                      {topic.desc}
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-text-muted transition-transform group-hover:translate-x-1" />
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. LOWER 3-COLUMN SECTION: ARTICLES, TRACK/CONTACT, FAQS */}
      <section className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        {/* LEFT COLUMN: RECOMMENDED ARTICLES (4 cols) */}
        <div className="space-y-4 lg:col-span-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[16px] font-bold text-graphite">Recommended Articles</h3>
            <span className="cursor-pointer text-[12px] font-bold text-text-secondary hover:text-graphite">
              View all &rarr;
            </span>
          </div>

          <div className="space-y-3">
            {ARTICLES.map((article) => (
              <div
                key={article.id}
                className="group flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border bg-white p-3 shadow-sm transition-all hover:border-gray-400 hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded border border-border bg-surface-soft">
                    <Image
                      src={article.image}
                      alt={article.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="text-[12px] font-bold text-graphite group-hover:text-[#65a30d]">
                      {article.title}
                    </h4>
                    <p className="line-clamp-1 text-[11px] text-text-muted">
                      {article.description}
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-text-muted transition-transform group-hover:translate-x-1" />
              </div>
            ))}
          </div>
        </div>

        {/* CENTER COLUMN: TRACK ORDER & CONTACT SUPPORT (4 cols) */}
        <div className="space-y-6 lg:col-span-4">
          {/* Track Order Card */}
          <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f0fdf4] text-[#16a34a]">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-graphite">Track Your Order</h3>
                <p className="text-[11px] text-text-muted">
                  Enter your order number to get real-time updates.
                </p>
              </div>
            </div>

            <form onSubmit={handleTrackOrder} className="mt-4 space-y-3">
              <input
                type="text"
                placeholder="Enter order number (e.g. #SKY-2026-00124)"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                className="w-full rounded-md border border-border px-3.5 py-2.5 text-[12px] text-graphite placeholder:text-text-disabled focus:border-graphite focus:outline-none"
              />
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-md bg-graphite py-2.5 text-[12px] font-bold text-white transition-colors hover:bg-graphite-soft"
              >
                <span>Track Order</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </form>

            {trackingResult && (
              <div className="mt-3 rounded border border-emerald-200 bg-emerald-50 p-3 text-[12px] text-emerald-800">
                {trackingResult}
              </div>
            )}

            {/* Need help with a recent order callout */}
            <div className="mt-5 rounded-lg border border-emerald-100 bg-[#f0fdf4] p-4 text-[12px]">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-[#16a34a]" />
                <div>
                  <p className="font-bold text-graphite">Need help with a recent order?</p>
                  <p className="mt-0.5 text-text-secondary">
                    You can also track your order from your account dashboard.
                  </p>
                  <Link
                    href="/account/orders"
                    className="mt-2 inline-flex items-center gap-1 font-bold text-[#16a34a] hover:underline"
                  >
                    Go to My Orders &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Support Card */}
          <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f0fdf4] text-[#16a34a]">
                <Headphones className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-graphite">Contact Support</h3>
                <p className="text-[11px] text-text-muted">Our team is here to help you.</p>
              </div>
            </div>

            <div className="mt-4 space-y-3 text-[12px]">
              <div className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-surface-soft">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-4 w-4 text-graphite" />
                  <div>
                    <p className="font-bold text-graphite">Live Chat</p>
                    <p className="text-[10px] text-text-muted">Available 9 AM - 6 PM (IST)</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-text-muted" />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-surface-soft">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-graphite" />
                  <div>
                    <p className="font-bold text-graphite">Email Support</p>
                    <p className="text-[10px] text-text-muted">support@skyrostore.com • Replies in 24h</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-text-muted" />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-surface-soft">
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-graphite" />
                  <div>
                    <p className="font-bold text-graphite">Phone Support</p>
                    <p className="text-[10px] text-text-muted">+91 98765 43210 • Mon - Sat, 9 AM - 6 PM</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-text-muted" />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: FAQS ACCORDION (4 cols) */}
        <div className="space-y-4 lg:col-span-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[16px] font-bold text-graphite">Frequently Asked Questions</h3>
            <span className="cursor-pointer text-[12px] font-bold text-text-secondary hover:text-graphite">
              View all &rarr;
            </span>
          </div>

          <div className="space-y-2.5">
            {FAQS.map((faq) => {
              const isOpen = expandedFaq === faq.id;
              return (
                <div
                  key={faq.id}
                  className="rounded-lg border border-border bg-white shadow-sm overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(faq.id)}
                    className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-surface-soft/50"
                  >
                    <span className="text-[13px] font-bold text-graphite">{faq.question}</span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-text-muted transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-graphite" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="border-t border-border bg-surface-soft/30 px-4 py-3 text-[12px] leading-relaxed text-text-secondary">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
