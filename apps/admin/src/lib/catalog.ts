export type Category = {
  id: string;
  name: string;
  handle: string;
  is_active: boolean;
  parent_category_id: string | null;
  rank?: number;
};

export type Brand = {
  id: string;
  title: string;
  handle: string;
  metadata?: { logo?: string } | null;
};

export type CategoryNode = Category & { children: CategoryNode[] };

/** Flat Medusa list -> nested tree, siblings sorted by rank then name. */
export function buildTree(categories: Category[]): CategoryNode[] {
  const nodes = new Map<string, CategoryNode>(categories.map((c) => [c.id, { ...c, children: [] }]));
  const roots: CategoryNode[] = [];
  for (const node of nodes.values()) {
    const parent = node.parent_category_id ? nodes.get(node.parent_category_id) : undefined;
    (parent ? parent.children : roots).push(node);
  }
  const sort = (list: CategoryNode[]) => {
    list.sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0) || a.name.localeCompare(b.name));
    list.forEach((n) => sort(n.children));
  };
  sort(roots);
  return roots;
}

/** "Motors › Brushless › Outrunner" for every category, keyed by id. */
export function pathLabels(categories: Category[]): Map<string, string> {
  const byId = new Map(categories.map((c) => [c.id, c]));
  const labels = new Map<string, string>();
  for (const c of categories) {
    const parts: string[] = [];
    let cur: Category | undefined = c;
    const seen = new Set<string>();
    while (cur && !seen.has(cur.id)) {
      seen.add(cur.id);
      parts.unshift(cur.name);
      cur = cur.parent_category_id ? byId.get(cur.parent_category_id) : undefined;
    }
    labels.set(c.id, parts.join(" › "));
  }
  return labels;
}
