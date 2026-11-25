import { AsyncLocalStorage } from "node:async_hooks";
import {
  SMS_REQUEST_BUDGET_MS,
  nestedBudgetMs,
  smsSliceMs,
} from "@/lib/twilio/outcome";

export { SMS_CALL_FLOOR_MS, SMS_REQUEST_BUDGET_MS } from "@/lib/twilio/outcome";

type SmsBudgetStore = {
  deadlineMs: number;
  /** Time held back for a later send in this request (gallery after drop-off). */
  reserveMs: number;
};

const budget = new AsyncLocalStorage<SmsBudgetStore>();

export function smsBudgetActive(): boolean {
  return budget.getStore() != null;
}

/**
 * Start a budget. Inside a parent budget, the child is
 * min(requested, time still left) so a cron cannot hand each company a fresh 20s.
 */
export function runWithSmsBudget<T>(
  fn: () => Promise<T>,
  budgetMs = SMS_REQUEST_BUDGET_MS
): Promise<T> {
  const parent = budget.getStore();
  const now = Date.now();
  const parentRemaining = parent ? Math.max(0, parent.deadlineMs - now) : null;
  const slice = nestedBudgetMs(budgetMs, parentRemaining);
  return budget.run(
    { deadlineMs: now + slice, reserveMs: parent?.reserveMs ?? 0 },
    fn
  );
}

export function setSmsBudgetReserve(reserveMs: number) {
  const store = budget.getStore();
  if (store) store.reserveMs = Math.max(0, reserveMs);
}

export function smsBudgetRemaining(now = Date.now()): number | null {
  const store = budget.getStore();
  if (!store) return null;
  return Math.max(0, store.deadlineMs - now);
}

/** Timeout for the next Twilio send or lookup, or null to skip it. */
export function takeSmsSlice(
  requestedMs: number,
  options?: { ignoreReserve?: boolean }
): number | null {
  const store = budget.getStore();
  return smsSliceMs({
    remainingMs: store ? Math.max(0, store.deadlineMs - Date.now()) : null,
    requestedMs,
    reserveMs: options?.ignoreReserve ? 0 : (store?.reserveMs ?? 0),
  });
}
