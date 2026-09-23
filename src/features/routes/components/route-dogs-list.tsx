"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { SortableList } from "@/features/admin/components/sortable-list";
import { reorderRouteDogsAction } from "@/features/hikes/actions";
import { removeDogFromRouteAction } from "@/features/routes/actions";

type Item = {
  id: string;
  label: string;
  sublabel?: string;
};

export function RouteDogsList({
  routeId,
  items,
}: {
  routeId: string;
  items: Item[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

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
    const result = await removeDogFromRouteAction(routeId, dogId);
    if (!("error" in result && result.error)) {
      startTransition(() => {
        router.refresh();
      });
    }
    return result;
  }

  return <SortableList items={items} onReorder={onReorder} onRemove={onRemove} />;
}
