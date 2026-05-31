declare module "accessible-autocomplete" {
  type AutocompleteSource = string[] | ((query: string, populateResults: (results: string[]) => void) => void);

  type AutocompleteOptions = {
    element?: HTMLElement;
    id?: string;
    name?: string;
    source?: AutocompleteSource;
    selectElement?: HTMLSelectElement;
    defaultValue?: string;
    showAllValues?: boolean;
    showNoOptionsFound?: boolean;
    autoselect?: boolean;
    confirmOnBlur?: boolean;
    dropdownArrow?: ({ className }: { className: string }) => string;
    minLength?: number;
    displayMenu?: "inline" | "overlay";
    inputClasses?: string;
    hintClasses?: string;
    menuClasses?: string;
    menuAttributes?: Record<string, string>;
    placeholder?: string;
    required?: boolean;
    preserveNullOptions?: boolean;
    tNoResults?: () => string;
    tStatusNoResults?: () => string;
    tStatusResults?: (length: number, contentSelectedOption?: string) => string;
    tStatusSelectedOption?: (
      selectedOption: string,
      length: number,
      index: number
    ) => string;
    onConfirm?: (confirmed: string | undefined) => void;
  };

  type AccessibleAutocomplete = {
    (options: AutocompleteOptions & { element: HTMLElement; id: string; source: AutocompleteSource }): void;
    enhanceSelectElement: (
      options: AutocompleteOptions & { selectElement: HTMLSelectElement }
    ) => void;
  };

  const accessibleAutocomplete: AccessibleAutocomplete;
  export default accessibleAutocomplete;
}
