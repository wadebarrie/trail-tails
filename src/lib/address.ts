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

export type CustomerAddressFields = {
  address_line1: string;
  address_line2: string;
  city: string;
  state_province: string;
  postal_code: string;
};

function hasStructuredLocality(parts: {
  city?: string | null;
  state_province?: string | null;
  postal_code?: string | null;
}): boolean {
  return Boolean(
    parts.city?.trim() ||
      parts.state_province?.trim() ||
      parts.postal_code?.trim()
  );
}

/**
 * Prefill structured address fields for the customer edit form.
 * Legacy rows often store the full freeform string in `address` / line1 with
 * empty city / province / postal — split those so office staff can save.
 */
export function customerAddressFormDefaults(customer: {
  address?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state_province?: string | null;
  postal_code?: string | null;
}): CustomerAddressFields {
  if (hasStructuredLocality(customer)) {
    return {
      address_line1:
        customer.address_line1?.trim() || customer.address?.trim() || "",
      address_line2: customer.address_line2?.trim() || "",
      city: customer.city?.trim() || "",
      state_province: customer.state_province?.trim() || "",
      postal_code: customer.postal_code?.trim() || "",
    };
  }

  const freeform =
    customer.address?.trim() ||
    customer.address_line1?.trim() ||
    "";
  const parsed = parseFreeformAddress(freeform);
  // Require province or postal so we don't treat unit numbers as a city
  // (e.g. "225 Mowat Street, 301").
  const confident = Boolean(
    parsed.state_province?.trim() || parsed.postal_code?.trim()
  );

  if (!confident) {
    return {
      address_line1:
        customer.address_line1?.trim() || freeform || "",
      address_line2: customer.address_line2?.trim() || "",
      city: "",
      state_province: "",
      postal_code: "",
    };
  }

  return {
    address_line1: parsed.address_line1,
    address_line2:
      parsed.address_line2?.trim() || customer.address_line2?.trim() || "",
    city: parsed.city?.trim() || "",
    state_province: parsed.state_province?.trim() || "",
    postal_code: parsed.postal_code?.trim() || "",
  };
}

/**
 * When city / province / postal are blank but line1 still holds a freeform
 * address (common on legacy saves), split before schema validation.
 */
export function coerceStructuredCustomerAddress(parts: {
  address_line1: string;
  address_line2?: string | null;
  city?: string | null;
  state_province?: string | null;
  postal_code?: string | null;
}): CustomerAddressFields {
  const line1 = parts.address_line1?.trim() || "";
  const line2 = parts.address_line2?.trim() || "";
  const city = parts.city?.trim() || "";
  const state_province = parts.state_province?.trim() || "";
  const postal_code = parts.postal_code?.trim() || "";

  if (city && state_province && postal_code) {
    return {
      address_line1: line1,
      address_line2: line2,
      city,
      state_province,
      postal_code,
    };
  }

  const freeform = [line1, line2, city, state_province, postal_code]
    .filter(Boolean)
    .join(", ");
  const parsed = parseFreeformAddress(freeform);

  return {
    address_line1: parsed.address_line1 || line1,
    address_line2: parsed.address_line2?.trim() || line2,
    city: city || parsed.city?.trim() || "",
    state_province: state_province || parsed.state_province?.trim() || "",
    postal_code: postal_code || parsed.postal_code?.trim() || "",
  };
}

export type ParsedCustomerAddress = {
  address_line1: string;
  address_line2: string | null;
  city: string | null;
  state_province: string | null;
  postal_code: string | null;
};

const CA_POSTAL = /\b([A-Za-z]\d[A-Za-z])\s?(\d[A-Za-z]\d)\b/;
const US_ZIP = /\b(\d{5})(?:-(\d{4}))?\b/;

const REGION_ALIASES: Record<string, string> = {
  // Canada
  ab: "AB",
  alberta: "AB",
  bc: "BC",
  "british columbia": "BC",
  mb: "MB",
  manitoba: "MB",
  nb: "NB",
  "new brunswick": "NB",
  nl: "NL",
  newfoundland: "NL",
  "newfoundland and labrador": "NL",
  ns: "NS",
  "nova scotia": "NS",
  nt: "NT",
  "northwest territories": "NT",
  nu: "NU",
  nunavut: "NU",
  on: "ON",
  ontario: "ON",
  pe: "PE",
  "prince edward island": "PE",
  qc: "QC",
  quebec: "QC",
  québec: "QC",
  sk: "SK",
  saskatchewan: "SK",
  yt: "YT",
  yukon: "YT",
  // Common US (import may include cross-border)
  wa: "WA",
  washington: "WA",
  or: "OR",
  oregon: "OR",
  ca: "CA",
  california: "CA",
  ny: "NY",
  "new york": "NY",
};

function normalizeRegion(raw: string): string | null {
  const key = raw.trim().toLowerCase().replace(/\./g, "");
  if (!key) return null;
  return REGION_ALIASES[key] ?? (raw.trim().length <= 3 ? raw.trim().toUpperCase() : raw.trim());
}

function formatCaPostal(match: RegExpMatchArray): string {
  return `${match[1]!.toUpperCase()} ${match[2]!.toUpperCase()}`;
}

function formatUsZip(match: RegExpMatchArray): string {
  return match[2] ? `${match[1]}-${match[2]}` : match[1]!;
}

/**
 * Best-effort split of a freeform address (CSV import) into structured fields.
 * Prefers Canadian postal + province patterns; falls back to line1-only.
 */
export function parseFreeformAddress(raw: string): ParsedCustomerAddress {
  const trimmed = raw.trim().replace(/\s+/g, " ");
  if (!trimmed) {
    return {
      address_line1: "",
      address_line2: null,
      city: null,
      state_province: null,
      postal_code: null,
    };
  }

  let working = trimmed;
  let postal_code: string | null = null;
  let state_province: string | null = null;
  let city: string | null = null;

  const caPostal = working.match(CA_POSTAL);
  if (caPostal) {
    postal_code = formatCaPostal(caPostal);
    working = `${working.slice(0, caPostal.index)}${working.slice(
      (caPostal.index ?? 0) + caPostal[0].length
    )}`.replace(/\s+,/g, ",").replace(/,\s*$/, "").trim();
  } else {
    const usZip = working.match(US_ZIP);
    if (usZip) {
      postal_code = formatUsZip(usZip);
      working = `${working.slice(0, usZip.index)}${working.slice(
        (usZip.index ?? 0) + usZip[0].length
      )}`.replace(/\s+,/g, ",").replace(/,\s*$/, "").trim();
    }
  }

  const parts = working
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return {
      address_line1: trimmed,
      address_line2: null,
      city: null,
      state_province: null,
      postal_code,
    };
  }

  if (parts.length === 1) {
    // "123 Main St Vancouver BC" — try trailing city + region without commas
    const tokens = parts[0]!.split(/\s+/);
    if (tokens.length >= 3) {
      const maybeRegion = normalizeRegion(tokens[tokens.length - 1]!);
      const regionKey = tokens[tokens.length - 1]!.toLowerCase().replace(/\./g, "");
      if (maybeRegion && REGION_ALIASES[regionKey]) {
        state_province = maybeRegion;
        city = tokens[tokens.length - 2]!;
        return {
          address_line1: tokens.slice(0, -2).join(" "),
          address_line2: null,
          city,
          state_province,
          postal_code,
        };
      }
    }
    return {
      address_line1: parts[0]!,
      address_line2: null,
      city: null,
      state_province: null,
      postal_code,
    };
  }

  // Last segment: "Vancouver BC" or just "BC" / "Vancouver"
  const last = parts[parts.length - 1]!;
  const lastTokens = last.split(/\s+/);
  if (lastTokens.length >= 2) {
    const regionKey = lastTokens[lastTokens.length - 1]!.toLowerCase().replace(/\./g, "");
    if (REGION_ALIASES[regionKey]) {
      state_province = REGION_ALIASES[regionKey]!;
      city = lastTokens.slice(0, -1).join(" ");
      parts.pop();
    } else {
      city = last;
      parts.pop();
    }
  } else {
    const regionKey = last.toLowerCase().replace(/\./g, "");
    if (REGION_ALIASES[regionKey] && parts.length >= 2) {
      state_province = REGION_ALIASES[regionKey]!;
      parts.pop();
      city = parts.pop() ?? null;
    } else {
      city = last;
      parts.pop();
    }
  }

  // Optional: previous segment is line2 if we still have 2+ street parts
  let address_line1 = parts.join(", ");
  let address_line2: string | null = null;
  if (parts.length >= 2) {
    address_line1 = parts[0]!;
    address_line2 = parts.slice(1).join(", ");
  }

  return {
    address_line1: address_line1 || trimmed,
    address_line2,
    city,
    state_province,
    postal_code,
  };
}
