"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { TableShell, motionTableRowClassName } from "@/features/admin/components/ui";

export type RosterColumn = {
  key: string;
  label: string;
};

export type RosterRow = {
  id: string;
  href: string;
  cells: Record<string, string>;
};

export function RosterTable({
  noun,
  columns,
  rows,
  searchPlaceholder,
}: {
  noun: string;
  columns: RosterColumn[];
  rows: RosterRow[];
  searchPlaceholder: string;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const [sortKey, setSortKey] = useState(columns[0]?.key ?? "");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const hasStatus = columns.some((column) => column.key === "status");

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = rows.filter((row) => {
      if (hasStatus && status !== "all") {
        const value = (row.cells.status ?? "").toLowerCase();
        if (status === "active" && value !== "active") return false;
        if (status === "inactive" && value === "active") return false;
      }
      if (!needle) return true;
      return Object.values(row.cells).some((cell) =>
        cell.toLowerCase().includes(needle)
      );
    });
    const sorted = [...filtered].sort((a, b) => {
      const left = (a.cells[sortKey] ?? "").toLowerCase();
      const right = (b.cells[sortKey] ?? "").toLowerCase();
      const cmp = left.localeCompare(right, "en-CA", { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [hasStatus, query, rows, sortDir, sortKey, status]);

  function toggleSort(key: string) {
    if (sortKey === key) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir("asc");
  }

  const countLabel =
    visible.length === rows.length
      ? `${rows.length} ${noun}${rows.length === 1 ? "" : "s"}`
      : `Showing ${visible.length} of ${rows.length} ${noun}${rows.length === 1 ? "" : "s"}`;

  return (
    <div>
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={searchPlaceholder}
          aria-label={`Search ${noun}s`}
          className="min-h-11 w-full max-w-md rounded-lg border border-stone-300 px-3 py-2 text-sm"
        />
        <p className="text-sm text-stone-500">{countLabel}</p>
      </div>
      {hasStatus ? (
        <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="Status filter">
          {(
            [
              ["all", "All"],
              ["active", "Active"],
              ["inactive", "Inactive"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={status === value}
              onClick={() => setStatus(value)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                status === value
                  ? "bg-[var(--color-trail-700)] text-white"
                  : "bg-stone-100 text-stone-600"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      ) : null}
      {visible.length === 0 ? (
        <p className="text-sm text-stone-500">No {noun}s match that search.</p>
      ) : (
        <TableShell minWidth="42rem">
          <table className="min-w-full text-sm">
            <thead className="bg-stone-50 text-left text-stone-500">
              <tr>
                {columns.map((column) => {
                  const active = sortKey === column.key;
                  return (
                    <th key={column.key} scope="col" className="px-4 py-3 font-medium">
                      <button
                        type="button"
                        onClick={() => toggleSort(column.key)}
                        className="inline-flex items-center gap-1 hover:text-stone-800"
                      >
                        {column.label}
                        <span aria-hidden className="text-[10px] text-stone-400">
                          {active ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
                        </span>
                        <span className="sr-only">
                          {active
                            ? `, sorted ${sortDir === "asc" ? "ascending" : "descending"}`
                            : ", sort"}
                        </span>
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {visible.map((row) => (
                <tr key={row.id} className={motionTableRowClassName}>
                  {columns.map((column, index) => (
                    <td key={column.key} className="px-4 py-3 text-stone-600">
                      {index === 0 ? (
                        <Link
                          href={row.href}
                          className="font-medium text-[var(--color-trail-700)] hover:underline"
                        >
                          {row.cells[column.key] || "—"}
                        </Link>
                      ) : (
                        row.cells[column.key] || "—"
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </TableShell>
      )}
    </div>
  );
}
