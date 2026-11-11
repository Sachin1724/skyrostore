import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CatalogView, type CatalogParams } from "@/components/catalog/catalog-view";
import { getCategoryTree } from "@/lib/data/catalog";

export const metadata = { title: "Drones" };

export default async function UavsPage({ searchParams }: { searchParams: Promise<CatalogParams> }) {
  // Complete aircraft live in a top-level category named for UAVs or drones.
  const uavs = (await getCategoryTree()).find((c) => /uav|drone/i.test(c.name));
  return (
    <>
      <Header />
      {uavs ? (
        <CatalogView
          params={await searchParams}
          basePath="/uavs"
          fixed={{ category: uavs.handle }}
          heading="Drones"
          intro="Ready-to-fly and kit aircraft for mapping, inspection, agriculture and research."
          crumbs={[{ href: "/uavs", label: "Drones" }]}
        />
      ) : (
        <main id="main" className="mx-auto min-h-[50vh] max-w-xl px-4 py-16 text-center">
          <h1 className="text-[28px] font-extrabold text-navy">Drones</h1>
          <p className="mt-3 text-text-secondary">No complete drones are listed yet.</p>
        </main>
      )}
      <Footer />
    </>
  );
}
