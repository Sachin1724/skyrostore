"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { COMPONENT_SPEC_TEMPLATES } from "@/lib/technical-specs";
import { UploadButton, LibraryButton } from "../image-uploader";

type Category = { id: string; name: string };

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

const FIELD = "mt-1 w-full rounded border border-gray-300 px-2.5 py-1.5 text-sm";
const LABEL = "block text-xs font-medium text-gray-600";

export function NewProductForm({ categories, brands }: { categories: Category[]; brands: Category[] }) {
  const router = useRouter();
  const [brandId, setBrandId] = useState("");

  const [title, setTitle] = useState("");
  const [handle, setHandle] = useState("");
  const [handleEdited, setHandleEdited] = useState(false);
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [componentType, setComponentType] = useState("");
  const [sku, setSku] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [price, setPrice] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const effectiveHandle = handleEdited ? handle : slugify(title);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          handle: effectiveHandle,
          description,
          category_id: categoryId || undefined,
          collection_id: brandId || undefined,
          component_type: componentType || undefined,
          sku: sku || undefined,
          thumbnail: thumbnail || undefined,
          price: Number(price),
          status,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not create the product.");
        return;
      }
      router.push(`/products/${data.product.id}`);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Request failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 max-w-3xl space-y-5">
      {error ? (
        <p className="rounded border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>
      ) : null}

      <section className="rounded-md border border-gray-200 bg-white p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Details</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className={LABEL}>
            Title
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="T-Motor U5 KV400"
              className={FIELD}
            />
          </label>
          <label className={LABEL}>
            Handle
            <input
              value={effectiveHandle}
              onChange={(e) => {
                setHandleEdited(true);
                setHandle(e.target.value);
              }}
              placeholder="auto-generated from the title"
              className={`${FIELD} font-mono`}
            />
          </label>
          <label className={`${LABEL} sm:col-span-2`}>
            Description
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={FIELD}
            />
          </label>
        </div>
      </section>

      <section className="rounded-md border border-gray-200 bg-white p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
          Catalogue placement
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className={LABEL}>
            Category
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={FIELD}>
              <option value="">No category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label className={LABEL}>
            Brand
            <select value={brandId} onChange={(e) => setBrandId(e.target.value)} className={FIELD}>
              <option value="">No brand</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </label>
          <label className={LABEL}>
            Component type
            <select
              value={componentType}
              onChange={(e) => setComponentType(e.target.value)}
              className={FIELD}
            >
              <option value="">Not a UAV component</option>
              {Object.keys(COMPONENT_SPEC_TEMPLATES).map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-[11px] font-normal text-gray-500">
              Needed for the builder and compatibility checks. Specs are filled in after saving.
            </span>
          </label>
        </div>
      </section>

      <section className="rounded-md border border-gray-200 bg-white p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
          Price, media & visibility
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className={LABEL}>
            Price (₹, whole rupees)
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              inputMode="numeric"
              placeholder="18999"
              className={FIELD}
            />
          </label>
          <label className={LABEL}>
            SKU
            <input
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="derived from the handle if left blank"
              className={`${FIELD} font-mono`}
            />
          </label>
          <div className={`${LABEL} sm:col-span-2`}>
            Main image
            <div className="mt-1 flex items-center gap-3">
              {thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={thumbnail} alt="" className="h-16 w-16 rounded border border-gray-200 object-contain" />
              ) : null}
              <UploadButton
                multiple={false}
                label={thumbnail ? "Replace image" : "Upload image"}
                onUploaded={(urls) => setThumbnail(urls[0] || "")}
              />
              <LibraryButton onPicked={(urls) => setThumbnail(urls[0] || "")} />
            </div>
            <span className="mt-1 block text-[11px] font-normal text-gray-500">
              More images can be added after the product is created. Without an image the storefront
              shows a typed placeholder.
            </span>
          </div>
          <label className={LABEL}>
            Status
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as "draft" | "published")}
              className={FIELD}
            >
              <option value="draft">Draft — hidden from the storefront</option>
              <option value="published">Published — visible</option>
            </select>
          </label>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving || !title.trim() || !price.trim()}
          className="rounded bg-gray-900 px-4 py-2 text-xs font-semibold text-white disabled:opacity-40"
        >
          {saving ? "Creating…" : "Create product"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/products")}
          className="rounded border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
