import { phoneMatchKey } from "@/lib/phone";

/** Outbound texts a trial company may send per local day. */
export const TRIAL_DAILY_SMS_CAP = 25;

export type SmsMode = "test" | "live";

/** Production never uses the global redirect. Local dev still can. */
export function globalSmsRedirect(input: {
  nodeEnv: string | undefined;
  redirectTo: string | null | undefined;
}): string | null {
  if (input.nodeEnv === "production") return null;
  const value = input.redirectTo?.trim();
  return value ? value : null;
}

export function companyOutboundTarget(input: {
  smsMode: SmsMode;
  smsTestPhone: string | null | undefined;
  globalRedirect: string | null;
}): { redirectTo: string | null; blocked: "test_phone_missing" | null } {
  if (input.smsMode === "test") {
    const phone = input.smsTestPhone?.trim();
    if (!phone) return { redirectTo: null, blocked: "test_phone_missing" };
    return { redirectTo: phone, blocked: null };
  }
  return { redirectTo: input.globalRedirect, blocked: null };
}

export function trialOutboundCapReached(
  sentToday: number,
  cap = TRIAL_DAILY_SMS_CAP
): boolean {
  return sentToday >= cap;
}

export type InboundCandidate = {
  companyId: string;
  companyName: string;
  customerId: string;
};

export function resolveInboundTenant(input: {
  candidates: InboundCandidate[];
  latestOutboundCompanyId: string | null;
  body: string;
}):
  | { kind: "one"; companyId: string; customerId: string }
  | { kind: "ask"; reply: string }
  | { kind: "none" } {
  const byCompany = new Map<string, InboundCandidate>();
  for (const candidate of input.candidates) {
    if (!byCompany.has(candidate.companyId)) {
      byCompany.set(candidate.companyId, candidate);
    }
  }
  const companies = [...byCompany.values()];
  if (companies.length === 0) return { kind: "none" };
  if (companies.length === 1) {
    return {
      kind: "one",
      companyId: companies[0].companyId,
      customerId: companies[0].customerId,
    };
  }

  if (input.latestOutboundCompanyId) {
    const recent = companies.find(
      (company) => company.companyId === input.latestOutboundCompanyId
    );
    if (recent) {
      return {
        kind: "one",
        companyId: recent.companyId,
        customerId: recent.customerId,
      };
    }
  }

  const named = input.body.trim().toLowerCase();
  const nameHits = companies.filter(
    (company) => company.companyName.trim().toLowerCase() === named
  );
  if (nameHits.length === 1) {
    return {
      kind: "one",
      companyId: nameHits[0].companyId,
      customerId: nameHits[0].customerId,
    };
  }

  const names = companies.map((company) => company.companyName).join(", ");
  return {
    kind: "ask",
    reply: `Your number is on file with more than one company (${names}). Reply with the company name so we update the right schedule.`,
  };
}

export function phonesShareKey(a: string, b: string): boolean {
  return phoneMatchKey(a) === phoneMatchKey(b) && phoneMatchKey(a).length > 0;
}
