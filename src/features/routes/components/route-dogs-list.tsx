"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { SortableList } from "@/features/admin/components/sortable-list";
import { reorderRouteDogsAction } from "@/features/hikes/actions";
import { removeDogFromRouteAction } from "@/features/routes/actions";
import { sortIdsByAddress } from "@/features/routes/sort-by-address";

type Item = {
  id: string;
  label: string;
  sublabel?: string;
  address?: string | null;
};

export function RouteDogsList({
  routeId,
  items,
}: {
  routeId: string;
  items: Item[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  async function onReorder(orderedIds: string[]) {
    const result = await reorderRouteDogsAction(routeId, orderedIds);
    if (!("error" in result && result.error)) {
      startTransition(() => {
        router.refresh();
      });
    }
    return result;
  }

  async function onRemove(dogId: string) {
    const dog = items.find((item) => item.id === dogId);
    const name = dog?.label ?? "this dog";
    if (
      !window.confirm(
        `Remove ${name} from this route? They won’t appear on future days until you add them again.`
      )
    ) {
      return { error: "Cancelled" };
    }
    const result = await removeDogFromRouteAction(routeId, dogId);
    if (!("error" in result && result.error)) {
      startTransition(() => {
        router.refresh();
      });
    }
    return result;
  }

  function sortByAddress() {
    const orderedIds = sortIdsByAddress(items);
    startTransition(async () => {
      const result = await reorderRouteDogsAction(routeId, orderedIds);
      if (!("error" in result && result.error)) {
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-3">
      {items.length > 1 ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-stone-500">
            Drag to set pickup order, or sort by street address.
          </p>
          <button
            type="button"
            onClick={sortByAddress}
            disabled={pending}
            className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50"
          >
            Sort by address
          </button>
        </div>
      ) : null}
      <SortableList
        items={items.map((item) => ({
          id: item.id,
          label: item.label,
          sublabel: [item.sublabel, item.address].filter(Boolean).join(" · "),
        }))}
        onReorder={onReorder}
        onRemove={onRemove}
      />
    </div>
  );
}
