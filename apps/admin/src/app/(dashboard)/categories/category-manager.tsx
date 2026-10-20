"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2, Pencil, Check, X } from "lucide-react";
import { buildTree, type Category, type CategoryNode } from "@/lib/catalog";

async function call(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

const INPUT = "rounded border border-gray-300 px-2 py-1 text-sm";

function AddRow({ parentId, onAdd, placeholder }: { parentId?: string; onAdd: (name: string, parentId?: string) => Promise<void>; placeholder: string }) {
  const [name, setName] = useState("");
  return (
    <form
      className="flex items-center gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        await onAdd(name, parentId);
        setName("");
      }}
    >
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder={placeholder} className={`${INPUT} w-56`} />
      <button type="submit" disabled={!name.trim()} className="rounded bg-gray-900 px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-40">
        Add
      </button>
    </form>
  );
}

function Row({
  node,
  depth,
  reload,
  setError,
}: {
  node: CategoryNode;
  depth: number;
  reload: () => Promise<void>;
  setError: (m: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(node.name);
  const [adding, setAdding] = useState(false);

  const run = async (fn: () => Promise<unknown>) => {
    setError("");
    try {
      await fn();
      await reload();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Request failed");
    }
  };

  return (
    <li>
      <div className="flex items-center gap-3 rounded px-2 py-1.5 hover:bg-gray-50" style={{ paddingLeft: depth * 24 + 8 }}>
        {editing ? (
          <>
            <input value={name} onChange={(e) => setName(e.target.value)} className={`${INPUT} w-48`} autoFocus />
            <button type="button" aria-label="Save name" onClick={() => run(async () => { await call(`/api/categories/${node.id}`, "PATCH", { name }); setEditing(false); })} className="text-emerald-600"><Check className="h-4 w-4" /></button>
            <button type="button" aria-label="Cancel" onClick={() => { setName(node.name); setEditing(false); }} className="text-gray-400"><X className="h-4 w-4" /></button>
          </>
        ) : (
          <>
            <span className={`text-sm font-medium ${node.is_active ? "text-gray-900" : "text-gray-400 line-through"}`}>{node.name}</span>
            <button type="button" aria-label="Rename" onClick={() => setEditing(true)} className="text-gray-400 hover:text-gray-700"><Pencil className="h-3.5 w-3.5" /></button>
          </>
        )}
        <div className="ml-auto flex items-center gap-3">
          <button type="button" onClick={() => setAdding((v) => !v)} className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-gray-900">
            <Plus className="h-3.5 w-3.5" /> Sub-category
          </button>
          <button
            type="button"
            role="switch"
            aria-checked={node.is_active}
            aria-label={node.is_active ? "Visible. Click to hide." : "Hidden. Click to show."}
            onClick={() => run(() => call(`/api/categories/${node.id}`, "PATCH", { is_active: !node.is_active }))}
            className={`relative h-5 w-9 rounded-full transition-colors ${node.is_active ? "bg-emerald-600" : "bg-gray-300"}`}
          >
            <span className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${node.is_active ? "translate-x-4" : ""}`} />
          </button>
          <button
            type="button"
            aria-label="Delete"
            onClick={() => { if (window.confirm(`Delete "${node.name}"?`)) void run(() => call(`/api/categories/${node.id}`, "DELETE")); }}
            className="text-gray-400 hover:text-rose-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      {adding ? (
        <div style={{ paddingLeft: (depth + 1) * 24 + 8 }} className="py-1.5">
          <AddRow
            parentId={node.id}
            placeholder={`New under ${node.name}`}
            onAdd={async (n, p) => { await run(() => call("/api/categories", "POST", { name: n, parent_category_id: p })); }}
          />
        </div>
      ) : null}
      {node.children.length > 0 ? (
        <ul>
          {node.children.map((child) => (
            <Row key={child.id} node={child} depth={depth + 1} reload={reload} setError={setError} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function CategoryManager() {
  const [tree, setTree] = useState<CategoryNode[] | null>(null);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    try {
      const data = await call("/api/categories", "GET");
      setTree(buildTree(data.product_categories as Category[]));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not load categories");
    }
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  return (
    <div className="mt-6 space-y-4">
      {error ? <p className="rounded border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p> : null}
      <div className="rounded-md border border-gray-200 bg-white p-4">
        <AddRow
          placeholder="New top-level category, e.g. Motors"
          onAdd={async (name) => {
            setError("");
            try { await call("/api/categories", "POST", { name }); await reload(); }
            catch (err: unknown) { setError(err instanceof Error ? err.message : "Request failed"); }
          }}
        />
      </div>
      <div className="rounded-md border border-gray-200 bg-white p-2">
        {tree === null ? (
          <p className="p-4 text-sm text-gray-500">Loading…</p>
        ) : tree.length === 0 ? (
          <p className="p-4 text-sm text-gray-500">No categories yet. Add the first one above.</p>
        ) : (
          <ul>{tree.map((n) => <Row key={n.id} node={n} depth={0} reload={reload} setError={setError} />)}</ul>
        )}
      </div>
    </div>
  );
}
