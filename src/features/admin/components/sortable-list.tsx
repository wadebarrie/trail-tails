"use client";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState, useTransition } from "react";

type SortableItem = {
  id: string;
  label: string;
  sublabel?: string;
};

function SortableRow({
  item,
}: {
  item: SortableItem;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={`flex items-center gap-3 rounded-lg border bg-white px-4 py-3 ${
        isDragging
          ? "border-[var(--color-trail-600)] shadow-md"
          : "border-stone-200"
      }`}
    >
      <button
        type="button"
        className="flex min-h-11 min-w-11 shrink-0 cursor-grab items-center justify-center touch-none rounded-lg text-lg text-stone-400 hover:bg-stone-100 hover:text-stone-600 active:cursor-grabbing"
        aria-label={`Drag ${item.label}`}
        {...attributes}
        {...listeners}
      >
        ⠿
      </button>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-stone-900">{item.label}</p>
        {item.sublabel ? (
          <p className="text-sm text-stone-500">{item.sublabel}</p>
        ) : null}
      </div>
    </li>
  );
}

type SortableListProps = {
  items: SortableItem[];
  onReorder: (orderedIds: string[]) => Promise<{ error?: string } | { success?: boolean }>;
};

export function SortableList({ items: initialItems, onReorder }: SortableListProps) {
  const [items, setItems] = useState(initialItems);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    const next = arrayMove(items, oldIndex, newIndex);
    setItems(next);

    startTransition(async () => {
      const result = await onReorder(next.map((i) => i.id));
      if ("error" in result && result.error) {
        setError(result.error);
        setItems(initialItems);
      } else {
        setError(null);
      }
    });
  }

  return (
    <div>
      {error ? (
        <p className="mb-3 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      {pending ? (
        <p className="mb-3 text-sm text-stone-500">Saving order…</p>
      ) : null}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map((i) => i.id)}
          strategy={verticalListSortingStrategy}
        >
          <ul className="space-y-2">
            {items.map((item) => (
              <SortableRow key={item.id} item={item} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  );
}
