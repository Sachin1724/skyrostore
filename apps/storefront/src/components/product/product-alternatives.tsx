"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle2 } from "lucide-react";

type Alternative = { id: string; title: string; handle: string; thumbnail: string | null; matched: string };

/** Shown on an out-of-stock product page — in-stock parts the compatibility engine confirms are drop-in replacements. */
export function ProductAlternatives({ productId }: { productId: string }) {
  const [alternatives, setAlternatives] = useState<Alternative[] | null>(null);

  useEffect(() => {
    fetch(`/api/products/${productId}/alternatives`)
      .then((r) => r.json())
      .then((d) => setAlternatives(d.alternatives ?? []))
      .catch(() => setAlternatives([]));
  }, [productId]);

  if (!alternatives?.length) return null;

  return (
    <section aria-labelledby="alternatives-heading" className="mt-6 rounded-xl border border-border bg-white p-5">
      <h2 id="alternatives-heading" className="text-[15px] font-bold text-navy">
        In-stock drop-in replacements
      </h2>
      <p className="mt-1 text-[13px] text-text-secondary">Matched on electrical and mechanical specification by our compatibility engine.</p>
      <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {alternatives.map((a) => (
          <li key={a.id}>
            <Link href={`/products/${a.handle}`} className="group block rounded-lg border border-border p-3 transition-colors hover:border-brand">
              <div className="relative aspect-square w-full overflow-hidden rounded-md bg-surface-soft">
                {a.thumbnail ? <Image src={a.thumbnail} alt="" fill sizes="150px" className="object-contain p-3" /> : null}
              </div>
              <p className="mt-2 truncate text-[13px] font-semibold text-navy group-hover:text-brand">{a.title}</p>
              <p className="mt-1 flex items-center gap-1 text-[11px] text-success">
                <CheckCircle2 className="h-3 w-3 shrink-0" aria-hidden />
                <span className="truncate">Matched: {a.matched}</span>
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
