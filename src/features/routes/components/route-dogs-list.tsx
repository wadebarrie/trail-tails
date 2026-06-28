"use client";

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
  const onReorder = reorderRouteDogsAction.bind(null, routeId);
  const onRemove = removeDogFromRouteAction.bind(null, routeId);

  return <SortableList items={items} onReorder={onReorder} onRemove={onRemove} />;
}
