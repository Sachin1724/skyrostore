import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CatalogView, type CatalogParams } from "@/components/catalog/catalog-view";
import { getBrands } from "@/lib/data/catalog";

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const brand = (await getBrands()).find((b) => b.handle === handle);
  return { title: brand?.title ?? "Brand" };
}

export default async function BrandPage({
  params,
  searchParams,
}: {
  params: Promise<{ handle: string }>;
  searchParams: Promise<CatalogParams>;
}) {
  const { handle } = await params;
  const brand = (await getBrands()).find((b) => b.handle === handle);
  if (!brand) notFound();

  return (
    <>
      <Header />
      <CatalogView
        params={await searchParams}
        basePath={`/brands/${handle}`}
        fixed={{ brand: handle }}
        heading={brand.title}
        crumbs={[{ href: "/brands", label: "Brands" }, { href: `/brands/${handle}`, label: brand.title }]}
      />
      <Footer />
    </>
  );
}
