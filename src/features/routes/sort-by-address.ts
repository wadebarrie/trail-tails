/** Sort pickup order by street address (number then street name). */

export type AddressSortable = {
  id: string;
  address?: string | null;
  label?: string;
};

function addressSortKey(address: string | null | undefined): {
  street: string;
  number: number;
} {
  const raw = (address ?? "").trim().toLowerCase();
  if (!raw) return { street: "\uffff", number: Number.MAX_SAFE_INTEGER };

  const match = raw.match(/^(\d+[a-z]?)\s+(.+)$/i);
  if (match) {
    const number = Number.parseInt(match[1], 10);
    return {
      number: Number.isFinite(number) ? number : Number.MAX_SAFE_INTEGER,
      street: match[2],
    };
  }

  return { street: raw, number: Number.MAX_SAFE_INTEGER };
}

export function compareByAddress(
  a: AddressSortable,
  b: AddressSortable
): number {
  const ka = addressSortKey(a.address);
  const kb = addressSortKey(b.address);
  const streetCmp = ka.street.localeCompare(kb.street, undefined, {
    sensitivity: "base",
  });
  if (streetCmp !== 0) return streetCmp;
  if (ka.number !== kb.number) return ka.number - kb.number;
  return (a.label ?? "").localeCompare(b.label ?? "", undefined, {
    sensitivity: "base",
  });
}

export function sortIdsByAddress(items: AddressSortable[]): string[] {
  return [...items].sort(compareByAddress).map((item) => item.id);
}
