"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { AdminSearchHit } from "@/features/admin/search";

export function AdminGlobalSearch() {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<AdminSearchHit[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const runSearch = useCallback(async (value: string) => {
    const trimmed = value.trim();
    if (trimmed.length < 2) {
      setHits([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/search?q=${encodeURIComponent(trimmed)}`
      );
      const data = (await res.json()) as { hits?: AdminSearchHit[] };
      setHits(data.hits ?? []);
    } catch {
      setHits([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      void runSearch(query);
    }, 220);
    return () => window.clearTimeout(handle);
  }, [query, runSearch]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const showPanel = open && query.trim().length >= 2;

  return (
    <div ref={rootRef} className="relative w-full max-w-xl">
      <label className="sr-only" htmlFor="admin-global-search">
        Search customers, dogs, drivers, vehicles, and routes
      </label>
      <div className="relative">
        <span
          className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-stone-400"
          aria-hidden
        >
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path strokeLinecap="round" d="m20 20-3.5-3.5" />
          </svg>
        </span>
        <input
          ref={inputRef}
          id="admin-global-search"
          type="search"
          autoComplete="off"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-autocomplete="list"
          placeholder="Search customers, dogs, drivers…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className="w-full rounded-xl border border-stone-200 bg-white py-2.5 pl-10 pr-16 text-sm text-stone-900 shadow-sm outline-none ring-[var(--color-trail-600)] placeholder:text-stone-400 focus:ring-2"
        />
        <kbd className="pointer-events-none absolute inset-y-0 right-3 hidden items-center text-[10px] font-medium text-stone-400 sm:flex">
          ⌘K
        </kbd>
      </div>

      {showPanel ? (
        <div
          id={listId}
          role="listbox"
          className="absolute z-50 mt-2 max-h-80 w-full overflow-y-auto rounded-xl border border-stone-200 bg-white py-1 shadow-[var(--elevation-3)]"
        >
          {loading ? (
            <p className="px-3 py-3 text-sm text-stone-500">Searching…</p>
          ) : hits.length === 0 ? (
            <p className="px-3 py-3 text-sm text-stone-500">No matches</p>
          ) : (
            hits.map((hit) => (
              <Link
                key={`${hit.type}-${hit.id}`}
                href={hit.href}
                role="option"
                className="block px-3 py-2.5 hover:bg-[var(--color-trail-50)]"
                onClick={() => {
                  setOpen(false);
                  setQuery("");
                  setHits([]);
                }}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="font-medium text-stone-900">{hit.title}</span>
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">
                    {hit.type}
                  </span>
                </span>
                {hit.subtitle ? (
                  <span className="mt-0.5 block truncate text-xs text-stone-500">
                    {hit.subtitle}
                  </span>
                ) : null}
              </Link>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
