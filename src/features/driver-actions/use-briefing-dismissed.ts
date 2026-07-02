"use client";

const STORAGE_PREFIX = "packroute-briefing-dismissed";

export function briefingStorageKey(date: string): string {
  return `${STORAGE_PREFIX}:${date}`;
}

export function isBriefingDismissed(date: string): boolean {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(briefingStorageKey(date)) === "1";
}

export function dismissBriefingForDate(date: string): void {
  window.sessionStorage.setItem(briefingStorageKey(date), "1");
}
