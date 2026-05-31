import { type FC } from "react";
import { SPECIALTIES, specialtiesGroupedBySchool } from "../core";
import {
  AutocompleteSelect,
  type AutocompleteSelectGroup,
  type AutocompleteSelectOption
} from "./AutocompleteSelect";

type SpecialtyAutocompleteSelectProps = {
  value: string;
  onChange: (name: string) => void;
  onCommit?: () => void;
  inputId?: string;
};

const specialtyOptions: AutocompleteSelectOption[] = [
  ...new Set(SPECIALTIES.map(specialty => specialty.name))
]
  .map(name => ({ value: name, label: name }))
  .sort((a, b) => a.label.localeCompare(b.label));

const specialtyGroups: AutocompleteSelectGroup[] = specialtiesGroupedBySchool()
  .map(group => ({
    label: group.school,
    options: group.items.map(specialty => ({
      value: specialty.name,
      label: specialty.name
    }))
  }));

export const SpecialtyAutocompleteSelect: FC<
  SpecialtyAutocompleteSelectProps
> = ({ value, onChange, onCommit, inputId }) => (
  <AutocompleteSelect
    id={inputId}
    value={value}
    placeholder="Select a specialty"
    options={specialtyOptions}
    groups={specialtyGroups}
    onChange={onChange}
    onCommit={onCommit}
    hint="Start typing to search specialties, or choose from the full list."
    noResultsText="No specialties found"
    resultName="specialty"
    resultPluralName="specialties"
    menuClasses="specialty-autocomplete__menu"
  />
);
