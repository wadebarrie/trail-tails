/** Strip to digits for fuzzy phone matching. */
export function digitsOnly(phone: string): string {
  return phone.replace(/\D/g, "");
}

/** Last 10 digits (US/local match when E.164 differs). */
export function phoneMatchKey(phone: string): string {
  const digits = digitsOnly(phone);
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

export function phonesMatch(a: string, b: string): boolean {
  const ka = phoneMatchKey(a);
  const kb = phoneMatchKey(b);
  return ka.length > 0 && ka === kb;
}

/** Display-only North American format. Storage and SMS stay E.164. */
export function formatPhoneDisplay(phone: string | null | undefined): string {
  if (!phone?.trim()) return "";
  const digits = digitsOnly(phone);
  const local =
    digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  // NANP area codes do not start with 0 or 1. Incomplete numbers stay as stored.
  if (local.length !== 10 || local.startsWith("0") || local.startsWith("1")) {
    return phone.trim();
  }
  return `(${local.slice(0, 3)}) ${local.slice(3, 6)}-${local.slice(6)}`;
}
