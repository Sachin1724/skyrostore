import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BuilderView } from "@/components/builder/builder-view";
import { getUAVComponents } from "@/lib/data/uav-components";

export const metadata = {
  title: "Multi-Rotor UAV Build Configurator — Skyrostore",
  description: "Select components, validate propulsion compatibility, and configure a custom aerial platform with automated spec validation.",
};

export default async function BuildPage() {
  const components = await getUAVComponents();

  return (
    <>
      <Header />
      <main id="main" className="min-h-screen bg-surface-soft pb-20">
        <div className="mx-auto max-w-[1760px] px-4 md:px-8">
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 pt-5 text-[13px] text-text-secondary">
            <Link href="/" className="hover:text-brand">Home</Link>
            <span aria-hidden>/</span>
            <span className="font-semibold text-navy">Build Configurator</span>
          </nav>

          <h1 className="mt-4 text-2xl font-bold text-navy md:text-3xl">Build your drone</h1>
          <p className="mt-1 max-w-[640px] text-[14px] text-text-secondary">
            Pick parts step by step. We check that the motors, ESC, battery and propellers work together.
          </p>

          {/* Main Builder View */}
          <section className="mt-6">
            <BuilderView components={components} />
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
