import { useEffect, useRef, useState, type FC, type ReactNode } from "react";

type DateInputProps = {
  id: string;
  label: string;
  value: string;
  onChange?: (value: string) => void;
  hint?: ReactNode;
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
};

const INVALID_DATE_VALUE = "invalid-date";

const FIELD_LENGTHS = {
  day: 2,
  month: 2,
  year: 4
} as const;

const parseIsoParts = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return { day: "", month: "", year: "" };
  return {
    day: String(Number(match[3])),
    month: String(Number(match[2])),
    year: match[1]
  };
};

const pad2 = (value: number) => String(value).padStart(2, "0");

const normaliseNumericInput = (
  value: string,
  part: "day" | "month" | "year"
) => value.replace(/\D/g, "").slice(0, FIELD_LENGTHS[part]);

const toIsoDate = (day: string, month: string, year: string): string => {
  const trimmedDay = day.trim();
  const trimmedMonth = month.trim();
  const trimmedYear = year.trim();

  if (!trimmedDay && !trimmedMonth && !trimmedYear) return "";
  if (!trimmedDay || !trimmedMonth || !trimmedYear) return "";
  if (!/^\d{4}$/.test(trimmedYear) || !/^\d+$/.test(trimmedDay)) {
    return INVALID_DATE_VALUE;
  }

  const dayNumber = Number(trimmedDay);
  const monthNumber = Number(trimmedMonth);

  return `${trimmedYear}-${pad2(monthNumber)}-${pad2(dayNumber)}`;
};

export const DateInput: FC<DateInputProps> = ({
  id,
  label,
  value,
  onChange,
  hint,
  disabled = false,
  readOnly = false,
  className
}) => {
  const [{ day, month, year }, setParts] = useState(() =>
    parseIsoParts(value)
  );
  const lastEmittedValue = useRef<string | null>(null);

  useEffect(() => {
    if (value === lastEmittedValue.current) {
      lastEmittedValue.current = null;
      return;
    }
    setParts(parseIsoParts(value));
  }, [value]);

  const updatePart = (part: "day" | "month" | "year", nextValue: string) => {
    setParts(current => {
      const next = { ...current, [part]: normaliseNumericInput(nextValue, part) };
      const nextIsoDate = toIsoDate(next.day, next.month, next.year);
      lastEmittedValue.current = nextIsoDate;
      onChange?.(nextIsoDate);
      return next;
    });
  };

  const describedBy = hint ? `${id}-hint` : undefined;

  return (
    <div className={["nhsuk-form-group", className].filter(Boolean).join(" ")}>
      <fieldset
        className="nhsuk-fieldset"
        role="group"
        aria-describedby={describedBy}
      >
        <legend className="nhsuk-fieldset__legend">{label}</legend>
        {hint && (
          <div className="nhsuk-hint" id={`${id}-hint`}>
            {hint}
          </div>
        )}
        <div className="nhsuk-date-input" id={id}>
          <div className="nhsuk-date-input__item">
            <div className="nhsuk-form-group">
              <label
                className="nhsuk-label nhsuk-date-input__label"
                htmlFor={`${id}-day`}
              >
                Day
              </label>
              <input
                className="nhsuk-input nhsuk-date-input__input nhsuk-input--width-2"
                id={`${id}-day`}
                name={`${id}-day`}
                type="text"
                inputMode="numeric"
                maxLength={FIELD_LENGTHS.day}
                value={day}
                disabled={disabled}
                readOnly={readOnly}
                onChange={e => updatePart("day", e.target.value)}
              />
            </div>
          </div>
          <div className="nhsuk-date-input__item">
            <div className="nhsuk-form-group">
              <label
                className="nhsuk-label nhsuk-date-input__label"
                htmlFor={`${id}-month`}
              >
                Month
              </label>
              <input
                className="nhsuk-input nhsuk-date-input__input nhsuk-input--width-2"
                id={`${id}-month`}
                name={`${id}-month`}
                type="text"
                inputMode="numeric"
                maxLength={FIELD_LENGTHS.month}
                value={month}
                disabled={disabled}
                readOnly={readOnly}
                onChange={e => updatePart("month", e.target.value)}
              />
            </div>
          </div>
          <div className="nhsuk-date-input__item">
            <div className="nhsuk-form-group">
              <label
                className="nhsuk-label nhsuk-date-input__label"
                htmlFor={`${id}-year`}
              >
                Year
              </label>
              <input
                className="nhsuk-input nhsuk-date-input__input nhsuk-input--width-4"
                id={`${id}-year`}
                name={`${id}-year`}
                type="text"
                inputMode="numeric"
                maxLength={FIELD_LENGTHS.year}
                value={year}
                disabled={disabled}
                readOnly={readOnly}
                onChange={e => updatePart("year", e.target.value)}
              />
            </div>
          </div>
        </div>
      </fieldset>
    </div>
  );
};
