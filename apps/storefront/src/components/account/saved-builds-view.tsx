"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Layers, CheckCircle2, XCircle, ShoppingCart } from "lucide-react";
import { formatPrice } from "@/lib/utils";

type Build = {
  id: string;
  name: string | null;
  status: "DRAFT" | "VALID" | "INVALID" | "ORDERED";
  estimated_weight_g: number | null;
  estimated_flight_time_min: number | null;
  estimated_cost: number | null;
  created_at: string;
};

const STATUS_STYLE: Record<Build["status"], { label: string; icon: typeof CheckCircle2; className: string }> = {
  VALID: { label: "Ready to order", icon: CheckCircle2, className: "text-success" },
  ORDERED: { label: "Ordered", icon: ShoppingCart, className: "text-brand" },
  INVALID: { label: "Needs changes", icon: XCircle, className: "text-error" },
  DRAFT: { label: "Draft", icon: Layers, className: "text-text-muted" },
};

export function SavedBuildsView() {
  const [builds, setBuilds] = useState<Build[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/uav/configurations")
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "Could not load saved builds");
        setBuilds(data.configurations ?? []);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  if (error) {
    return <p className="card p-6 text-[14px] text-error">{error}</p>;
  }

  if (!builds) {
    return (
      <div className="card p-6">
        <div className="skeleton h-48 rounded-lg" />
      </div>
    );
  }

  if (builds.length === 0) {
    return (
      <div className="card flex flex-col items-center gap-3 p-10 text-center">
        <Layers className="h-8 w-8 text-text-muted" aria-hidden />
        <p className="text-[15px] font-bold text-navy">No saved builds yet</p>
        <p className="max-w-xs text-[13px] text-text-secondary">
          Configurations you validate in the Build tool are saved here automatically.
        </p>
        <Link href="/build" className="btn-primary mt-2">
          Start building
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {builds.map((b) => {
        const status = STATUS_STYLE[b.status];
        const Icon = status.icon;
        return (
          <li key={b.id} className="card flex flex-wrap items-center justify-between gap-4 p-4">
            <div>
              <p className="text-[14px] font-bold text-navy">{b.name || "UAV Configuration"}</p>
              <p className="mt-1 flex items-center gap-1.5 text-[12px] font-semibold">
                <Icon className={`h-3.5 w-3.5 ${status.className}`} aria-hidden />
                <span className={status.className}>{status.label}</span>
                <span className="text-text-muted">· {new Date(b.created_at).toLocaleDateString("en-IN")}</span>
              </p>
            </div>
            <div className="flex items-center gap-6 text-[13px] text-text-secondary">
              {b.estimated_weight_g != null && <span>{b.estimated_weight_g} g</span>}
              {b.estimated_flight_time_min != null && <span>{b.estimated_flight_time_min} min flight</span>}
              {b.estimated_cost != null && <span className="font-bold text-navy">{formatPrice(Number(b.estimated_cost), "inr")}</span>}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
