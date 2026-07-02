"use client";

import { useMemo, useState } from "react";
import { PickerPopover } from "@/features/admin/components/picker-popover";
import {
  formatDisplayTime,
  formatTime,
  parseTime,
} from "@/features/admin/components/picker-format";
import { pickerSelectClassName } from "@/features/admin/components/picker-styles";
import { PickerTriggerButton } from "@/features/admin/components/picker-trigger-button";

const HOURS = Array.from({ length: 24 }, (_, hour) => hour);
const MINUTES = Array.from({ length: 60 }, (_, minute) => minute);

type TimePickerFieldProps = {
  id?: string;
  name?: string;
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
};

export function TimePickerField({
  id,
  name,
  defaultValue = "",
  value: controlledValue,
  onChange,
  className,
  disabled,
  required,
  placeholder = "Select time",
}: TimePickerFieldProps) {
  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue);
  const value = isControlled ? controlledValue : internalValue;
  const parsed = parseTime(value) ?? { hour: 8, minute: 0 };

  function updateValue(next: string) {
    if (!isControlled) {
      setInternalValue(next);
    }
    onChange?.(next);
  }

  const hourOptions = useMemo(
    () =>
      HOURS.map((hour) => ({
        value: hour,
        label: formatTime(hour, 0).slice(0, 2),
      })),
    []
  );

  return (
    <>
      {name ? (
        <input type="hidden" name={name} value={value} required={required && !value} />
      ) : null}
      <PickerPopover
        trigger={({ open, toggle, buttonId, panelId }) => (
          <PickerTriggerButton
            id={id}
            buttonId={buttonId}
            panelId={panelId}
            open={open}
            toggle={toggle}
            displayValue={formatDisplayTime(value)}
            placeholder={placeholder}
            disabled={disabled}
            className={className}
            icon="clock"
          />
        )}
      >
        <div className="flex min-w-[14rem] items-end gap-2">
          <label className="flex-1 text-xs font-medium text-stone-600">
            Hour
            <select
              value={parsed.hour}
              onChange={(event) =>
                updateValue(formatTime(Number(event.target.value), parsed.minute))
              }
              className={`${pickerSelectClassName} mt-1 w-full`}
            >
              {hourOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex-1 text-xs font-medium text-stone-600">
            Minute
            <select
              value={parsed.minute}
              onChange={(event) =>
                updateValue(formatTime(parsed.hour, Number(event.target.value)))
              }
              className={`${pickerSelectClassName} mt-1 w-full`}
            >
              {MINUTES.map((minute) => (
                <option key={minute} value={minute}>
                  {String(minute).padStart(2, "0")}
                </option>
              ))}
            </select>
          </label>
        </div>
      </PickerPopover>
    </>
  );
}