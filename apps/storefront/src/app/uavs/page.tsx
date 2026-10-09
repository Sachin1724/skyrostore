import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ProductGrid } from "@/components/product/product-grid";
import { getProducts, getCollections } from "@/lib/data/products";

export const metadata = { title: "UAVs" };

export default async function UavsPage() {
  const collections = await getCollections();
  const uavCollection = collections.find(
    (c) => c.handle === "uavs" || c.title?.toLowerCase().includes("uav")
  );

  const { products } = uavCollection
    ? await getProducts({ collection_id: [uavCollection.id], limit: 40 })
    : await getProducts({ limit: 40 });

  return (
    <>
      <Header />
      <main className="mx-auto max-w-[1280px] px-8 py-6 md:px-10">
        <h1 className="text-[28px] font-bold tracking-[-0.025em] text-graphite">UAVs</h1>
        <p className="mt-1 text-[14px] text-text-secondary">
          Professional unmanned aerial vehicles for mapping, inspection, agriculture, and custom applications.
        </p>
        <div className="mt-8">
          <ProductGrid products={products} />
        </div>
      </main>
      <Footer />
    </>
  );
}
