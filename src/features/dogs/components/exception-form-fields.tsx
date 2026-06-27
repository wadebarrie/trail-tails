export const exceptionInputClassName =
  "mt-1 w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm focus:border-[var(--color-trail-600)] focus:outline-none focus:ring-2 focus:ring-[var(--color-trail-600)]/20";

type DogOption = { id: string; name: string };

type ExceptionFormFieldsProps = {
  dogs: DogOption[];
  dogId?: string;
  exceptionType?: string;
  startDate?: string;
  endDate?: string;
  reason?: string | null;
  idPrefix?: string;
};

export function ExceptionFormFields({
  dogs,
  dogId,
  exceptionType = "skip_date",
  startDate,
  endDate,
  reason,
  idPrefix = "",
}: ExceptionFormFieldsProps) {
  const fieldId = (name: string) => (idPrefix ? `${idPrefix}-${name}` : name);

  return (
    <>
      <div>
        <label htmlFor={fieldId("dog_id")} className="block text-sm text-stone-600">
          Dog
        </label>
        <select
          id={fieldId("dog_id")}
          name="dog_id"
          required
          defaultValue={dogId}
          className={exceptionInputClassName}
        >
          <option value="">Select dog</option>
          {dogs.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label
          htmlFor={fieldId("exception_type")}
          className="block text-sm text-stone-600"
        >
          Type
        </label>
        <select
          id={fieldId("exception_type")}
          name="exception_type"
          defaultValue={exceptionType}
          className={exceptionInputClassName}
        >
          <option value="skip_date">Skip date</option>
          <option value="vacation">Vacation</option>
          <option value="pause">Pause</option>
        </select>
      </div>
      <div>
        <label htmlFor={fieldId("start_date")} className="block text-sm text-stone-600">
          Start date
        </label>
        <input
          id={fieldId("start_date")}
          name="start_date"
          type="date"
          required
          defaultValue={startDate}
          className={exceptionInputClassName}
        />
      </div>
      <div>
        <label htmlFor={fieldId("end_date")} className="block text-sm text-stone-600">
          End date (optional for pause)
        </label>
        <input
          id={fieldId("end_date")}
          name="end_date"
          type="date"
          defaultValue={endDate ?? ""}
          className={exceptionInputClassName}
        />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor={fieldId("reason")} className="block text-sm text-stone-600">
          Reason
        </label>
        <input
          id={fieldId("reason")}
          name="reason"
          defaultValue={reason ?? ""}
          className={exceptionInputClassName}
        />
      </div>
    </>
  );
}
