"use client";

import {
  pickerIconClassName,
  pickerTriggerClassName,
  pickerTriggerPlaceholderClassName,
} from "@/features/admin/components/picker-styles";

type PickerTriggerButtonProps = {
  id?: string;
  buttonId: string;
  panelId: string;
  open: boolean;
  toggle: () => void;
  displayValue: string;
  placeholder: string;
  disabled?: boolean;
  className?: string;
  icon: "calendar" | "clock";
};

function CalendarIcon() {
  return (
    <svg
      className={pickerIconClassName}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
    >
      <path d="M6 2a1 1 0 0 0-1 1v1H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1V3a1 1 0 1 0-2 0v1H7V3a1 1 0 0 0-1-1ZM4 8h12v8H4V8Z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      className={pickerIconClassName}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm-.75-11.5a.75.75 0 0 0-1.5 0v4c0 .414.336.75.75.75h3a.75.75 0 0 0 0-1.5h-2.25V6.5Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function PickerTriggerButton({
  id,
  buttonId,
  panelId,
  open,
  toggle,
  displayValue,
  placeholder,
  disabled,
  className = "",
  icon,
}: PickerTriggerButtonProps) {
  return (
    <button
      id={id ?? buttonId}
      type="button"
      disabled={disabled}
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-controls={panelId}
      onClick={toggle}
      className={`${pickerTriggerClassName} ${className}`.trim()}
    >
      <span className={displayValue ? "text-stone-900" : pickerTriggerPlaceholderClassName}>
        {displayValue || placeholder}
      </span>
      {icon === "calendar" ? <CalendarIcon /> : <ClockIcon />}
    </button>
  );
}
