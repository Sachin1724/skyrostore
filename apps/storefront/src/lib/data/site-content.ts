import { unstable_cache } from "next/cache";
import { medusa } from "@/lib/medusa";

export type HeroSlide = { image: string; title: string; text: string; cta: string; href: string };

export type SiteContent = {
  heroSlides: HeroSlide[];
  heroTitle: string;
  heroSentence: string;
  faq: { q: string; a: string }[];
  closingTitle: string;
  closingSentence: string;
};

// Shown until the team publishes their own copy from the admin, and for any field left empty.
export const DEFAULT_CONTENT: SiteContent = {
  // Shown until the team publishes its own banners; every one points at a real page.
  heroSlides: [
    { image: "/images/hero/storefront-hero-drone.png", title: "Parts that fly together.", text: "Motors, props, ESCs, packs and frames, checked against each other before they ship.", cta: "Shop all parts", href: "/parts" },
    { image: "/images/hero/builder-drone-frame.png", title: "Build it before you buy it.", text: "Pick every part and we check the voltages, currents and clearances as you go.", cta: "Build your drone", href: "/build" },
    { image: "/images/hero/bulk-hero-drone.png", title: "Equipping a team?", text: "Send quantities for a fleet, a lab or a course and we reply with a quotation.", cta: "Request a quote", href: "/bulk-orders" },
  ],
  heroTitle: "Parts that fly together.",
  heroSentence: "Motors, props, ESCs, packs and frames, each checked against the others before it ships from Odisha.",
  faq: [
    { q: "How does the compatibility check work?", a: "It compares the published specifications of the parts you pick: motor voltage range against the pack, recommended prop size against the prop, current against the ESC. It flags a mismatch before you pay." },
    { q: "Where do orders ship from?", a: "From our workshop in Odisha, by tracked courier (Delhivery and partners), to most PIN codes in India. Checkout tells you before payment if we cannot reach yours." },
    { q: "How do I pay?", a: "Through Razorpay: UPI, cards, net banking or wallets. Your address is filled from Razorpay, so there is no long form." },
    { q: "Do I get a GST invoice?", a: "Yes, with every order. Prices include GST." },
    { q: "Can I track my parcel?", a: "Yes. The tracking number arrives by email when the courier is booked, and live status sits under My orders." },
    { q: "What if a part arrives damaged?", a: "Tell us with photos and we replace or refund it. The returns page has the details." },
    { q: "Do you supply teams and institutions?", a: "Yes. Send a bulk request with quantities and we reply with a quotation; accepted quotes become normal orders." },
    { q: "Do I need permission to fly?", a: "Drone flying in India follows the Drone Rules, 2021. Registration and permissions are the operator's responsibility." },
  ],
  closingTitle: "Equipping a team?",
  closingSentence: "Send quantities for a fleet, a lab or a course. We reply with a quotation and a GST invoice.",
};

async function fetchContent(): Promise<SiteContent> {
  const { content } = await medusa.client.fetch<{ content: Partial<SiteContent> | null }>("/store/site-content");
  const c = content ?? {};
  return {
    heroSlides: c.heroSlides?.filter((s) => s.image).length ? c.heroSlides.filter((s) => s.image) : DEFAULT_CONTENT.heroSlides,
    heroTitle: c.heroTitle || DEFAULT_CONTENT.heroTitle,
    heroSentence: c.heroSentence || DEFAULT_CONTENT.heroSentence,
    faq: c.faq?.length ? c.faq : DEFAULT_CONTENT.faq,
    closingTitle: c.closingTitle || DEFAULT_CONTENT.closingTitle,
    closingSentence: c.closingSentence || DEFAULT_CONTENT.closingSentence,
  };
}

const cached = unstable_cache(fetchContent, ["site-content"], { revalidate: 3600, tags: ["site-content"] });

/** Published homepage copy; the admin's publish clears the "site-content" tag. A failed fetch is not cached. */
export const getSiteContent = () => cached().catch(() => DEFAULT_CONTENT);
