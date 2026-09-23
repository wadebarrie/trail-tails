/** Compose structured address parts into a single geocode/display string. */
export function formatCustomerAddress(parts: {
  address_line1: string;
  address_line2?: string | null;
  city?: string | null;
  state_province?: string | null;
  postal_code?: string | null;
}): string {
  const line1 = parts.address_line1.trim();
  const line2 = parts.address_line2?.trim() || "";
  const city = parts.city?.trim() || "";
  const region = parts.state_province?.trim() || "";
  const postal = parts.postal_code?.trim() || "";

  const street = [line1, line2].filter(Boolean).join(", ");
  const locality = [city, region].filter(Boolean).join(", ");
  const cityRegionPostal = [locality, postal].filter(Boolean).join(" ");

  return [street, cityRegionPostal].filter(Boolean).join(", ");
}

/** Split a legacy freeform address into line1-only (best-effort backfill). */
export function legacyAddressToLine1(address: string): string {
  return address.trim();
}
