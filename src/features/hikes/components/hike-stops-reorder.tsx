"use client";

import { SortableList } from "@/features/admin/components/sortable-list";
import { reorderStopsAction } from "@/features/hikes/actions";
import type { StopType } from "@/types";

type HikeStopsReorderProps = {
  hikeId: string;
  stopType: StopType;
  items: { id: string; label: string; sublabel?: string }[];
};

export function HikeStopsReorder({ hikeId, stopType, items }: HikeStopsReorderProps) {
  async function onReorder(orderedIds: string[]) {
    return reorderStopsAction(hikeId, stopType, orderedIds);
  }

  return <SortableList items={items} onReorder={onReorder} />;
}
