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
