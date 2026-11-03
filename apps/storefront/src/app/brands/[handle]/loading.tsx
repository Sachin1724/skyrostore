import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CatalogSkeleton } from "@/components/layout/skeleton";

export default function Loading() {
  return (
    <>
      <Header />
      <CatalogSkeleton />
      <Footer />
    </>
  );
}
