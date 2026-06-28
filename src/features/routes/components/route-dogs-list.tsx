"use client";

import { SortableList } from "@/features/admin/components/sortable-list";
import { reorderRouteDogsAction, autoSortRouteDogsAction } from "@/features/hikes/actions";
import { removeDogFromRouteAction } from "@/features/routes/actions";
import { AutoRouteButton } from "@/features/routes/components/auto-route-button";

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
  const onAutoRoute = autoSortRouteDogsAction.bind(null, routeId);

  return (
    <div className="space-y-3">
      <AutoRouteButton onAutoRoute={onAutoRoute} />
      <SortableList items={items} onReorder={onReorder} onRemove={onRemove} />
    </div>
  );
}
