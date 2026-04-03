import type { FC, ChangeEvent } from "react";
import { getCalculationTypeLabel } from "../core/calculationTypeLabels";
import type { CalculationType } from "./types";

type CctCalcSelectorProps = {
  selectedType: CalculationType | null;
  onTypeSelect: (type: CalculationType) => void;
};

const calculationTypeGroups = [
  {
    label: "Work Pattern Changes",
    options: ["LTFT"] as CalculationType[]
  },
  {
    label: "Leave Types",
    options: [
      "OOPC",
      "OOPE",
      "OOPP",
      "PARENTAL",
      "SICKNESS",
      "UNPAID"
    ] as CalculationType[]
  },
  {
    label: "Health & Return",
    options: ["SHIELDING", "PHASED"] as CalculationType[]
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
              <option key={option} value={option}>
                {getCalculationTypeLabel(option, "full")}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
};
