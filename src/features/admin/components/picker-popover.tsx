"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

type PickerPopoverProps = {
  trigger: (props: {
    open: boolean;
    toggle: () => void;
    buttonId: string;
    panelId: string;
  }) => ReactNode;
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  align?: "start" | "end";
};

export function PickerPopover({
  trigger,
  children,
  open: controlledOpen,
  onOpenChange,
  align = "start",
}: PickerPopoverProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  function setOpen(next: boolean) {
    if (isControlled) {
      onOpenChange?.(next);
    } else {
      setInternalOpen(next);
    }
  }
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonId = useId();
  const panelId = useId();

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, setOpen]);

  return (
    <div ref={containerRef} className="relative">
      {trigger({
        open,
        toggle: () => setOpen(!open),
        buttonId,
        panelId,
      })}
      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-modal="false"
          aria-labelledby={buttonId}
          className={`absolute z-50 mt-1 rounded-xl border border-stone-200 bg-white p-3 shadow-lg ${
            align === "end" ? "right-0" : "left-0"
          }`}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
