import { ProductCard } from "./product-card";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ProductGrid({ products }: { products: any[] }) {
  if (products.length === 0) {
    return (
      <p className="py-10 text-center text-[13px] text-text-muted">
        No products found.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
