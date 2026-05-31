import { useEffect, useId, useRef, type FC } from "react";
import accessibleAutocomplete from "accessible-autocomplete";
import { SPECIALTIES, specialtiesGroupedBySchool } from "../core";

type SpecialtyAutocompleteSelectProps = {
  value: string;
  onChange: (name: string) => void;
  onCommit?: () => void;
  inputId?: string;
};

const specialtyNames = new Set(SPECIALTIES.map(specialty => specialty.name));
const alphabeticalSpecialtyNames = [...specialtyNames].sort((a, b) =>
  a.localeCompare(b)
);

const selectChevron = ({ className }: { className: string }) => `
  <svg class="${className}" viewBox="0 0 16 16" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
`;

export const SpecialtyAutocompleteSelect: FC<
  SpecialtyAutocompleteSelectProps
> = ({ value, onChange, onCommit, inputId }) => {
  const generatedId = useId();
  const fieldId = inputId ?? `specialty-${generatedId}`;
  const hintId = `${fieldId}-hint`;
  const selectRef = useRef<HTMLSelectElement>(null);
  const onChangeRef = useRef(onChange);
  const onCommitRef = useRef(onCommit);

  useEffect(() => {
    onChangeRef.current = onChange;
    onCommitRef.current = onCommit;
  }, [onChange, onCommit]);

  useEffect(() => {
    const select = selectRef.current;
    if (!select) return;

    select.value = value;
    const previousDisplay = select.style.display;

    accessibleAutocomplete.enhanceSelectElement({
      selectElement: select,
      defaultValue: value,
      source: alphabeticalSpecialtyNames,
      showAllValues: true,
      autoselect: false,
      confirmOnBlur: false,
      dropdownArrow: selectChevron,
      inputClasses: "nhsuk-input",
      menuClasses: "specialty-autocomplete__menu",
      tNoResults: () => "No specialties found",
      tStatusNoResults: () => "No specialties found",
      tStatusResults: length => {
        const result = length === 1 ? "specialty" : "specialties";
        return `${length} ${result} found. Use the up and down arrow keys to choose an option.`;
      },
      onConfirm: confirmed => {
        if (typeof confirmed !== "string" || !specialtyNames.has(confirmed)) {
          return;
        }

        select.value = confirmed;
        onChangeRef.current(confirmed);
        onCommitRef.current?.();
      }
    });

    const autocompleteContainer = select.previousElementSibling;
    const input = autocompleteContainer?.querySelector<HTMLInputElement>(
      `#${CSS.escape(fieldId)}`
    );
    let selectTimeout: number | undefined;

    const selectCurrentChoice = () => {
      if (
        !input ||
        !value ||
        input.value !== value ||
        document.activeElement !== input
      ) {
        return;
      }

      input.select();
    };

    const scheduleSelectCurrentChoice = () => {
      globalThis.clearTimeout(selectTimeout);
      selectTimeout = globalThis.setTimeout(selectCurrentChoice, 0);
    };

    input?.setAttribute("aria-describedby", hintId);
    input?.addEventListener("focus", scheduleSelectCurrentChoice);
    input?.addEventListener("mouseup", scheduleSelectCurrentChoice);
    input?.addEventListener("touchend", scheduleSelectCurrentChoice);

    return () => {
      globalThis.clearTimeout(selectTimeout);
      input?.removeEventListener("focus", scheduleSelectCurrentChoice);
      input?.removeEventListener("mouseup", scheduleSelectCurrentChoice);
      input?.removeEventListener("touchend", scheduleSelectCurrentChoice);
      autocompleteContainer?.remove();
      select.style.display = previousDisplay;
      select.id = fieldId;
    };
  }, [fieldId, hintId, value]);

  return (
    <>
      <div className="nhsuk-hint" id={hintId}>
        Start typing to search specialties, or choose from the full list.
      </div>
      <select
        ref={selectRef}
        className="nhsuk-select"
        id={fieldId}
        value={value}
        aria-describedby={hintId}
        onChange={event => onChange(event.currentTarget.value)}
      >
        <option value="">Select a specialty</option>
        {specialtiesGroupedBySchool().map(group => (
          <optgroup key={group.school} label={group.school}>
            {group.items.map(specialty => (
              <option key={specialty.name} value={specialty.name}>
                {specialty.name}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </>
  );
};
