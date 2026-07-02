"use client";

import { useState } from "react";
import { DayPicker } from "react-day-picker";
import { PickerPopover } from "@/features/admin/components/picker-popover";
import {
  formatDisplayDate,
  formatIsoDate,
  parseIsoDate,
} from "@/features/admin/components/picker-format";
import { PickerTriggerButton } from "@/features/admin/components/picker-trigger-button";

type DatePickerFieldProps = {
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

export function DatePickerField({
  id,
  name,
  defaultValue = "",
  value: controlledValue,
  onChange,
  className,
  disabled,
  required,
  placeholder = "Select date",
}: DatePickerFieldProps) {
  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const value = isControlled ? controlledValue : internalValue;
  const selected = parseIsoDate(value);

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
            displayValue={formatDisplayDate(value)}
            placeholder={placeholder}
            disabled={disabled}
            className={className}
            icon="calendar"
          />
        )}
      >
        <DayPicker
          mode="single"
          selected={selected}
          defaultMonth={selected}
          onSelect={(date) => {
            if (!date) return;
            updateValue(formatIsoDate(date));
            setOpen(false);
          }}
          className="packroute-day-picker"
        />
      </PickerPopover>
    </>
  );
}
