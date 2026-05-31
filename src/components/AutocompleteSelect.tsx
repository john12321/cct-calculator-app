import { useEffect, useId, useRef, type FC, type ReactNode } from "react";
import accessibleAutocomplete from "accessible-autocomplete";

export type AutocompleteSelectOption = {
  value: string;
  label: string;
};

export type AutocompleteSelectGroup = {
  label: string;
  options: AutocompleteSelectOption[];
};

type AutocompleteSelectWidth = 2 | 3 | 4 | 5 | 10 | 20 | 30;

type AutocompleteSelectProps = {
  id?: string;
  value: string;
  placeholder: string;
  options: AutocompleteSelectOption[];
  onChange: (value: string) => void;
  onCommit?: () => void;
  hint?: ReactNode;
  groups?: AutocompleteSelectGroup[];
  noResultsText?: string;
  resultName?: string;
  resultPluralName?: string;
  inputClasses?: string;
  width?: AutocompleteSelectWidth;
  menuClasses?: string;
};

const selectChevron = ({ className }: { className: string }) => `
  <svg class="${className}" viewBox="0 0 16 16" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
`;

export const AutocompleteSelect: FC<AutocompleteSelectProps> = ({
  id,
  value,
  placeholder,
  options,
  onChange,
  onCommit,
  hint,
  groups,
  noResultsText = "No options found",
  resultName = "option",
  resultPluralName = `${resultName}s`,
  inputClasses = "nhsuk-input",
  width,
  menuClasses = "autocomplete-select__menu"
}) => {
  const generatedId = useId();
  const fieldId = id ?? `autocomplete-${generatedId}`;
  const hintId = `${fieldId}-hint`;
  const selectRef = useRef<HTMLSelectElement>(null);
  const onChangeRef = useRef(onChange);
  const onCommitRef = useRef(onCommit);
  const widthClassName = width ? `nhsuk-input--width-${width}` : undefined;
  const autocompleteInputClasses = [inputClasses, widthClassName]
    .filter(Boolean)
    .join(" ");

  useEffect(() => {
    onChangeRef.current = onChange;
    onCommitRef.current = onCommit;
  }, [onChange, onCommit]);

  useEffect(() => {
    const select = selectRef.current;
    if (!select) return;

    const labelsByValue = new Map(
      options.map(option => [option.value, option.label])
    );
    const valuesByLabel = new Map(
      options.map(option => [option.label, option.value])
    );
    const source = options.map(option => option.label);
    const selectedLabel = labelsByValue.get(value) ?? "";
    const previousDisplay = select.style.display;

    select.value = value;

    accessibleAutocomplete.enhanceSelectElement({
      selectElement: select,
      defaultValue: selectedLabel,
      source,
      showAllValues: true,
      autoselect: false,
      confirmOnBlur: false,
      dropdownArrow: selectChevron,
      inputClasses: autocompleteInputClasses,
      menuClasses,
      tNoResults: () => noResultsText,
      tStatusNoResults: () => noResultsText,
      tStatusResults: length => {
        const noun = length === 1 ? resultName : resultPluralName;
        return `${length} ${noun} found. Use the up and down arrow keys to choose an option.`;
      },
      onConfirm: confirmed => {
        if (typeof confirmed !== "string") return;
        const nextValue = valuesByLabel.get(confirmed);
        if (nextValue === undefined) return;

        select.value = nextValue;
        onChangeRef.current(nextValue);
        onCommitRef.current?.();
      }
    });

    const autocompleteContainer = select.previousElementSibling;
    if (widthClassName) {
      autocompleteContainer?.classList.add(
        ...widthClassName.split(" ").filter(Boolean)
      );
    }
    const input = autocompleteContainer?.querySelector<HTMLInputElement>(
      `#${CSS.escape(fieldId)}`
    );
    let selectTimeout: number | undefined;

    const selectCurrentChoice = () => {
      if (
        !input ||
        !selectedLabel ||
        input.value !== selectedLabel ||
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

    if (hint) input?.setAttribute("aria-describedby", hintId);
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
  }, [
    fieldId,
    autocompleteInputClasses,
    hint,
    hintId,
    menuClasses,
    noResultsText,
    options,
    resultName,
    resultPluralName,
    value,
    widthClassName
  ]);

  const selectClasses = ["nhsuk-select", widthClassName]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      {hint && (
        <div className="nhsuk-hint" id={hintId}>
          {hint}
        </div>
      )}
      <select
        ref={selectRef}
        className={selectClasses}
        id={fieldId}
        value={value}
        aria-describedby={hint ? hintId : undefined}
        onChange={event => onChange(event.currentTarget.value)}
      >
        <option value="">{placeholder}</option>
        {groups
          ? groups.map(group => (
              <optgroup key={group.label} label={group.label}>
                {group.options.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </optgroup>
            ))
          : options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
      </select>
    </>
  );
};
