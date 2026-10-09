import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BuilderView } from "@/components/builder/builder-view";
import { getUAVComponents } from "@/lib/data/uav-components";

export const metadata = { title: "UAV Builder — Skyrostore" };

export default async function BuildPage() {
  const components = await getUAVComponents();

  return (
    <>
      <Header />
      <main className="mx-auto max-w-[1280px] px-8 py-8 md:px-10">
        <h1 className="text-[28px] font-bold tracking-[-0.025em] text-graphite">UAV Builder</h1>
        <p className="mb-8 mt-1 text-[14px] text-text-secondary">
          Select components to build a custom UAV. Compatibility validated in real time.
        </p>
        <BuilderView components={components} />
      </main>
      <Footer />
    </>
  );
}
