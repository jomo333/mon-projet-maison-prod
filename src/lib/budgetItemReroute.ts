export type ReroutableBudgetItem = {
  name: string;
  cost: number;
  quantity: string;
  unit: string;
};

export type ReroutableBudgetCategory = {
  name: string;
  items?: ReroutableBudgetItem[];
};

const normalize = (s: unknown) =>
  String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const isDrainRemblai = (name: string) => {
  const n = normalize(name);
  return (
    n.includes("drain") ||
    n.includes("remblai") ||
    n.includes("puisard") ||
    n.includes("drain francais")
  );
};

const isSlab = (name: string) => {
  const n = normalize(name);

  const hasDalle = n.includes("dalle") || n.includes("plancher beton");
  const has4in = n.includes("4 pouces") || n.includes("4\"") || n.includes("4 po");
  const hasSousSol = n.includes("sous-sol") || n.includes("sous sol");
  const hasCoffrageFinition = n.includes("coffrage et finition");
  const has25mpa = n.includes("25 mpa") || n.includes("beton 25");

  // 25MPA alone is not enough (foundation walls can also be 25MPA).
  return hasDalle || has4in || hasCoffrageFinition || (has25mpa && (hasDalle || has4in || hasSousSol));
};

/**
 * Moves misclassified items OUT of "Fondation" into:
 * - "Excavation" for drain/remblai items
 * - "Coulage de dalle du sous-sol" for slab/dalle items
 *
 * Budgets are left unchanged; this only reroutes the item lists.
 */
export function rerouteFoundationItems<T extends ReroutableBudgetCategory>(categories: T[]): T[] {
  const byName = new Map(categories.map((c) => [c.name, c] as const));
  const fondation = byName.get("Fondation");
  if (!fondation || !Array.isArray(fondation.items) || fondation.items.length === 0) {
    return categories;
  }

  const excavation = byName.get("Excavation");
  const dalle = byName.get("Coulage de dalle du sous-sol");
  if (!excavation || !dalle) return categories;

  const next = categories.map((c) => ({ ...c })) as T[];
  const nextByName = new Map(next.map((c) => [c.name, c] as const));
  const nextFondation = nextByName.get("Fondation")!;
  const nextExcavation = nextByName.get("Excavation")!;
  const nextDalle = nextByName.get("Coulage de dalle du sous-sol")!;

  const toExcavation: ReroutableBudgetItem[] = [];
  const toDalle: ReroutableBudgetItem[] = [];
  const keepInFondation: ReroutableBudgetItem[] = [];

  for (const item of nextFondation.items as ReroutableBudgetItem[]) {
    if (isDrainRemblai(item.name)) {
      toExcavation.push(item);
      continue;
    }
    if (isSlab(item.name)) {
      toDalle.push(item);
      continue;
    }
    keepInFondation.push(item);
  }

  nextFondation.items = keepInFondation as any;
  nextExcavation.items = ([...((nextExcavation.items as any) || []), ...toExcavation] as any) as any;
  nextDalle.items = ([...((nextDalle.items as any) || []), ...toDalle] as any) as any;

  return next;
}
