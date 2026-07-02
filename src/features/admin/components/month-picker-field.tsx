"use client";

import { useState } from "react";
import { PickerPopover } from "@/features/admin/components/picker-popover";
import {
  formatDisplayMonth,
  formatMonth,
  MONTH_LABELS,
  parseMonth,
} from "@/features/admin/components/picker-format";
import { PickerTriggerButton } from "@/features/admin/components/picker-trigger-button";

type MonthPickerFieldProps = {
  id?: string;
  name: string;
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
};

export function MonthPickerField({
  id,
  name,
  defaultValue = "",
  value: controlledValue,
  onChange,
  className,
  disabled,
  required,
  placeholder = "Select month",
}: MonthPickerFieldProps) {
  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const value = isControlled ? controlledValue : internalValue;
  const parsed = parseMonth(value) ?? {
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  };
  const [viewYear, setViewYear] = useState(parsed.year);

  function updateValue(next: string) {
    if (!isControlled) {
      setInternalValue(next);
    }
    onChange?.(next);
  }

  return (
    <>
      <input type="hidden" name={name} value={value} required={required && !value} />
      <PickerPopover
        open={open}
        onOpenChange={setOpen}
        trigger={({ open, toggle, buttonId, panelId }) => (
          <PickerTriggerButton
            id={id}
            buttonId={buttonId}
            panelId={panelId}
            open={open}
            toggle={toggle}
            displayValue={formatDisplayMonth(value)}
            placeholder={placeholder}
            disabled={disabled}
            className={className}
            icon="calendar"
          />
        )}
      >
        <div className="min-w-[15rem]">
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setViewYear((year) => year - 1)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-stone-600 transition hover:bg-stone-100 hover:text-[var(--color-forest)]"
              aria-label="Previous year"
            >
              ‹
            </button>
            <p className="text-sm font-semibold text-[var(--color-ink)]">{viewYear}</p>
            <button
              type="button"
              onClick={() => setViewYear((year) => year + 1)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-stone-600 transition hover:bg-stone-100 hover:text-[var(--color-forest)]"
              aria-label="Next year"
            >
              ›
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {MONTH_LABELS.map((label, index) => {
              const month = index + 1;
              const selected = parsed.year === viewYear && parsed.month === month;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    updateValue(formatMonth(viewYear, month));
                    setOpen(false);
                  }}
                  className={`rounded-lg px-2 py-2 text-sm font-medium transition ${
                    selected
                      ? "bg-[var(--color-forest)] text-white"
                      : "text-stone-700 hover:bg-[var(--color-trail-100)] hover:text-[var(--color-forest)]"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </PickerPopover>
    </>
  );
}
