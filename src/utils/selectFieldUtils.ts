import type {
  CSSObjectWithLabel,
  ControlProps,
  OptionProps
} from "react-select";

export const colourStyles = {
  option: (
    baseStyles: CSSObjectWithLabel,
    { isFocused }: OptionProps<{ value: number; label: string }, false>
  ) => ({
    ...baseStyles,
    background: isFocused ? "#2884FF" : "none",
    color: isFocused ? "white" : undefined,
    zIndex: 1,
    fontSize: "1rem",
    "@media (min-width: 40.0625em)": {
      ...(baseStyles["@media (min-width: 40.0625em)"] as CSSObjectWithLabel),
      fontSize: "1.1875rem"
    },
    paddingTop: "1px",
    paddingBottom: "1px"
  }),
  control: (
    baseStyles: CSSObjectWithLabel,
    { isFocused }: ControlProps<{ value: number; label: string }, false>
  ) => ({
    ...baseStyles,
    border: "0.0625rem solid #4C6272",
    borderColor: "#4C6272",
    "&:hover": {
      borderColor: "#4C6272"
    },
    boxShadow: isFocused ? "inset 0 0 0 2px" : "none",
    outline: isFocused ? "4px solid #ffeb3b" : "1px solid #4c6272"
  }),
  singleValue: (baseStyles: CSSObjectWithLabel) => ({
    ...baseStyles,
    fontSize: "1rem",
    "@media (min-width: 40.0625em)": {
      ...(baseStyles["@media (min-width: 40.0625em)"] as CSSObjectWithLabel),
      fontSize: "1.1875rem"
    }
  }),
  dropdownIndicator: (baseStyles: CSSObjectWithLabel) => ({
    ...baseStyles,
    padding: "0 2px 0 2px",
    width: "1.125rem",
    color: "#212b32"
  }),
  clearIndicator: (baseStyles: CSSObjectWithLabel) => ({
    ...baseStyles,
    padding: "0 2px 0 0",
    width: "1.125rem",
    color: "#212b32"
  }),
  container: (baseStyles: CSSObjectWithLabel) => ({
    ...baseStyles,
    width: "max-content",
    minWidth: "70%",
    maxWidth: "100%"
  })
};
