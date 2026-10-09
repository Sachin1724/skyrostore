import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Hero } from "@/components/home/hero";
import { ProductGrid } from "@/components/product/product-grid";
import { getProducts } from "@/lib/data/products";
import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, Truck, FileText, Headphones, ChevronRight } from "lucide-react";

const SYSTEM_CATEGORIES = [
  { name: "Complete UAVs", handle: "uavs", href: "/uavs", image: "/images/products/cat-complete-uavs.png" },
  { name: "Flight Controllers", handle: "flight-controllers", href: "/parts?category=flight-controllers", image: "/images/products/cat-flight-controllers.png" },
  { name: "ESCs", handle: "escs", href: "/parts?category=escs", image: "/images/products/cat-escs.png" },
  { name: "Motors", handle: "motors", href: "/parts?category=motors", image: "/images/products/cat-motors.png" },
  { name: "Propellers", handle: "propellers", href: "/parts?category=propellers", image: "/images/products/cat-propellers.png" },
  { name: "GPS Modules", handle: "gps", href: "/parts?category=gps", image: "/images/products/cat-gps.png" },
  { name: "Batteries", handle: "batteries", href: "/parts?category=batteries", image: "/images/products/cat-batteries.png" },
  { name: "Frames", handle: "frames", href: "/parts?category=frames", image: "/images/products/cat-frames.png" },
];

export default async function HomePage() {
  const { products: featured } = await getProducts({ limit: 8 });

  return (
    <>
      <Header />
      <main>
        <Hero />

        {/* Trust strip */}
        <section className="bg-white" style={{ borderBottom: "1px solid var(--color-border)" }}>
          <div className="mx-auto grid max-w-[1280px] grid-cols-2 gap-0 px-8 md:grid-cols-4 md:px-10">
            {[
              { title: "Genuine Products", desc: "Trusted brands", icon: ShieldCheck },
              { title: "Fast Shipping", desc: "Pan India", icon: Truck },
              { title: "GST Invoicing", desc: "For businesses", icon: FileText },
              { title: "Expert Support", desc: "For builders & teams", icon: Headphones },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="flex items-center gap-3 py-6 px-4 md:px-6"
                  style={{
                    borderRight: i < 3 ? "1px solid var(--color-border)" : undefined,
                  }}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface-soft text-graphite">
                    <Icon className="h-4 w-4" strokeWidth={1.8} />
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-graphite">{item.title}</p>
                    <p className="text-[12px] text-text-muted">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Featured Products */}
        <section className="mx-auto max-w-[1280px] px-8 py-14 md:px-10">
          <div className="flex items-center justify-between">
            <h2 className="text-[24px] font-extrabold tracking-[-0.03em] text-graphite">
              Featured Products
            </h2>
            <Link
              href="/parts"
              className="text-[13px] font-semibold text-text-secondary hover:text-graphite transition-colors"
            >
              View all &rarr;
            </Link>
          </div>
          <div className="mt-8">
            <ProductGrid products={featured} />
          </div>
        </section>

        {/* Shop by System */}
        <section className="bg-surface-soft py-14" style={{ borderTop: "1px solid var(--color-border)" }}>
          <div className="mx-auto max-w-[1280px] px-8 md:px-10">
            <div className="flex items-center justify-between">
              <h2 className="text-[24px] font-extrabold tracking-[-0.03em] text-graphite">
                Shop by System
              </h2>
              <Link
                href="/parts"
                className="text-[13px] font-semibold text-text-secondary hover:text-graphite transition-colors"
              >
                View all &rarr;
              </Link>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {SYSTEM_CATEGORIES.map((cat) => (
                <Link
                  key={cat.name}
                  href={cat.href}
                  className="group flex items-center justify-between rounded-lg border border-border bg-white p-3.5 transition-all hover:border-border-strong hover:shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded bg-surface-soft p-1">
                      <Image
                        src={cat.image}
                        alt={cat.name}
                        fill
                        className="object-contain transition-transform group-hover:scale-105"
                      />
                    </div>
                    <span className="text-[13px] font-bold text-graphite">
                      {cat.name}
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-text-disabled transition-transform group-hover:translate-x-0.5 group-hover:text-graphite" />
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Build CTA */}
        <section className="mx-auto max-w-[1280px] px-8 py-14 md:px-10">
          <div className="relative overflow-hidden rounded-xl bg-graphite px-8 py-14 text-center md:px-14">
            {/* Blueprint wireframe drone on right */}
            <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 md:block opacity-75">
              <Image
                src="/images/hero/blueprint-drone.png"
                alt="UAV Blueprint Architecture"
                fill
                className="object-contain object-right"
              />
            </div>
            <div className="relative z-10 max-w-lg mx-auto text-center">
              <h2 className="text-[28px] font-extrabold tracking-[-0.02em] text-white md:text-[32px]">
                Build Your UAV
              </h2>
              <p className="mt-2.5 text-[14px] leading-relaxed text-text-disabled">
                Select components, validate compatibility, and configure a custom
                aerial platform for your application.
              </p>
              <Link
                href="/build"
                className="mt-7 inline-flex items-center gap-2 rounded-md bg-accent px-7 py-3.5 text-[13px] font-extrabold text-graphite transition-all hover:bg-accent-hover hover:shadow-md"
              >
                Start Configuration &rarr;
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
