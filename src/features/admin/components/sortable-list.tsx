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
import { motionInteractiveClassName } from "@/features/admin/components/motion-styles";

type SortableItem = {
  id: string;
  label: string;
  sublabel?: string;
};

type SortableListProps = {
  items: SortableItem[];
  onReorder: (orderedIds: string[]) => Promise<{ error?: string } | { success?: boolean }>;
  onRemove?: (id: string) => void | Promise<{ error?: string } | { success?: boolean }>;
  variant?: "light" | "dark";
};

function rowClassName(variant: "light" | "dark", isDragging: boolean) {
  if (variant === "dark") {
    return isDragging
      ? "border-amber-400/60 bg-white/10 shadow-md"
      : "border-white/10 bg-white/5";
  }
  return isDragging
    ? "border-[var(--color-trail-600)] shadow-md"
    : "border-stone-200";
}

function SortableRow({
  item,
  variant,
  onRemove,
  removing,
}: {
  item: SortableItem;
  variant: "light" | "dark";
  onRemove?: (id: string) => void | Promise<{ error?: string } | { success?: boolean }>;
  removing: boolean;
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
      className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${motionInteractiveClassName} ${
        variant === "dark" ? "bg-white/5" : "bg-white"
      } ${rowClassName(variant, isDragging)}`}
    >
      <button
        type="button"
        className={`flex min-h-11 min-w-11 shrink-0 cursor-grab items-center justify-center touch-none rounded-lg text-lg active:cursor-grabbing ${motionInteractiveClassName} ${
          variant === "dark"
            ? "text-white/40 hover:bg-white/10 hover:text-white/70"
            : "text-stone-400 hover:bg-stone-100 hover:text-stone-600"
        }`}
        aria-label={`Drag ${item.label}`}
        {...attributes}
        {...listeners}
      >
        ⠿
      </button>
      <div className="min-w-0 flex-1">
        <p className={`font-medium ${variant === "dark" ? "text-white" : "text-stone-900"}`}>
          {item.label}
        </p>
        {item.sublabel ? (
          <p className={`text-sm ${variant === "dark" ? "text-white/50" : "text-stone-500"}`}>
            {item.sublabel}
          </p>
        ) : null}
      </div>
      {onRemove ? (
        <button
          type="button"
          disabled={removing}
          onClick={() => void onRemove(item.id)}
          className={`shrink-0 rounded-lg px-2 py-1 text-sm ${
            variant === "dark"
              ? "text-red-300 hover:bg-white/10"
              : "text-red-600 hover:bg-red-50"
          } disabled:opacity-50`}
        >
          Remove
        </button>
      ) : null}
    </li>
  );
}

export function SortableList({
  items: initialItems,
  onReorder,
  onRemove,
  variant = "light",
}: SortableListProps) {
  const [items, setItems] = useState(initialItems);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [removingId, setRemovingId] = useState<string | null>(null);

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

  function handleRemove(id: string) {
    if (!onRemove) return;

    startTransition(async () => {
      setRemovingId(id);
      const result = await onRemove(id);
      setRemovingId(null);

      if (result && "error" in result && result.error) {
        setError(result.error);
      } else {
        setError(null);
        setItems((prev) => prev.filter((item) => item.id !== id));
      }
    });
  }

  return (
    <div>
      {error ? (
        <p
          className={`mb-3 text-sm ${variant === "dark" ? "text-red-300" : "text-red-600"}`}
          role="alert"
        >
          {error}
        </p>
      ) : null}
      {pending ? (
        <p className={`mb-3 text-sm ${variant === "dark" ? "text-white/50" : "text-stone-500"}`}>
          Saving order…
        </p>
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
              <SortableRow
                key={item.id}
                item={item}
                variant={variant}
                onRemove={onRemove ? handleRemove : undefined}
                removing={removingId === item.id}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  );
}
