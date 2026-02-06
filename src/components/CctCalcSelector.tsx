import type { FC, ChangeEvent } from "react";
import type { CalculationType } from "./types";

type CctCalcSelectorProps = {
  selectedType: CalculationType | null;
  onTypeSelect: (type: CalculationType) => void;
};

const calculationTypeGroups = [
  {
    label: "Work Pattern Changes",
    options: [{ value: "LTFT", label: "LTFT" }]
  },
  {
    label: "Leave Types",
    options: [
      { value: "MATERNITY", label: "Maternity Leave" },
      { value: "OOPC", label: "OOPC (Career Break)" },
      { value: "OOPE", label: "OOPE (Experience)" },
      { value: "PATERNITY", label: "Paternity Leave" },
      { value: "PARENTAL", label: "Shared Parental Leave" },
      { value: "SICKNESS", label: "Sickness (2 weeks minimum)" },

      { value: "UNPAID", label: "Unpaid Leave" }
    ]
  },
  {
    label: "Health & Return",
    options: [
      { value: "SHIELDING", label: "COVID-19 Shielding" },
      { value: "PHASED", label: "Phased Return" }
    ]
  }
];

export const CctCalcSelector: FC<CctCalcSelectorProps> = ({
  selectedType,
  onTypeSelect
}) => {
  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onTypeSelect(event.target.value as CalculationType);
  };

  return (
    <div className="nhsuk-form-group">
      <label className="nhsuk-label" htmlFor="calculation-type-select">
        Add a CCT change type
      </label>
      <select
        className="nhsuk-select"
        id="calculation-type-select"
        name="calculation-type"
        value={selectedType || ""}
        onChange={handleChange}
      >
        <option value="" disabled>
          Select a calculation type
        </option>
        {calculationTypeGroups.map(group => (
          <optgroup key={group.label} label={group.label}>
            {group.options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
};
