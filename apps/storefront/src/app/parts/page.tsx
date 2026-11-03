import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CatalogView, type CatalogParams } from "@/components/catalog/catalog-view";

export const metadata = { title: "UAV Parts & Components" };

export default async function PartsPage({ searchParams }: { searchParams: Promise<CatalogParams> }) {
  return (
    <>
      <Header />
      <CatalogView params={await searchParams} basePath="/parts" crumbs={[{ href: "/parts", label: "Parts" }]} />
      <Footer />
    </>
  );
}
