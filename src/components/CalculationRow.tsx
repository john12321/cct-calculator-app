import { useMemo, type FC, type ChangeEvent, type ReactNode } from "react";
import dayjs from "dayjs";
import {
  useFormContext,
  useWatch,
  Controller,
  type FieldError,
  type FieldErrors
} from "react-hook-form";
import CreatableSelect from "react-select/creatable";
import { colourStyles } from "../utils/selectFieldUtils";
import { getCalculationTypeLabel } from "../core/calculationTypeLabels";
import type { CSSObjectWithLabel, ControlProps } from "react-select";
import type { CalculationType, DraftCalculation } from "./types";

type CalculationRowProps = {
  calculationType: CalculationType;
  change: DraftCalculation;
  isEditing: boolean;
  programmeStartDate: string;
  programmeEndDate: string;
  cctDate?: string;
  previousChangeEndDate?: string;
  cumulativeDaysAdded?: number;
  index?: number;
  isDraft?: boolean;
};

const FormField = ({
  label,
  id,
  children,
  error
}: {
  label: string;
  id?: string;
  children: ReactNode;
  error?: FieldError;
}) => (
  <div className={`nhsuk-form-group ${error ? "nhsuk-form-group--error" : ""}`}>
    {label && (
      <label className="nhsuk-label" htmlFor={id}>
        {label}
      </label>
    )}
    {error && (
      <span className="nhsuk-error-message" id={`${id}-error`}>
        <span className="nhsuk-u-visually-hidden">Error:</span> {error.message}
      </span>
    )}
    {children}
  </div>
);

export const CalculationRow: FC<CalculationRowProps> = ({
  calculationType,
  change,
  isEditing,
  programmeStartDate,
  programmeEndDate,
  previousChangeEndDate,
  cumulativeDaysAdded,
  index,
  isDraft = false
}) => {
  const {
    setValue,
    register,
    formState: { errors },
    clearErrors,
    control
  } = useFormContext();
  const fieldId = index ?? "new";

  const namespace = isDraft
    ? "draftCalculation"
    : index !== undefined
      ? `calculationChanges.${index}`
      : undefined;

  const fieldNames = [
    namespace && `${namespace}.changeDate`,
    namespace && `${namespace}.endDate`,
    namespace && `${namespace}.untilEndOfProgramme`,
    namespace && `${namespace}.daysAdded`,
    namespace && `${namespace}.resultingCctDate`
    // endWte handled by Controller because of react-select
  ].filter(Boolean) as string[];

  const watchedFields = useWatch({
    name: fieldNames
  });

  const fieldValues = useMemo(() => {
    const [
      changeDate,
      endDate,
      untilEndOfProgramme,
      daysAdded,
      resultingCctDate,
      endWte
    ] = watchedFields;
    return {
      changeDate,
      endDate,
      untilEndOfProgramme,
      daysAdded,
      resultingCctDate,
      endWte: calculationType === "LTFT" ? endWte : undefined
    };
  }, [
    namespace,
    watchedFields,
    change,
    previousChangeEndDate,
    programmeStartDate,
    calculationType
  ]);

  const getFieldPath = (fieldName: string) =>
    namespace ? `${namespace}.${fieldName}` : undefined;

  const getFieldError = (fieldName: string) => {
    if (!namespace) return undefined;
    return (errors[namespace] as FieldErrors)?.[fieldName];
  };

  const handleChangeDateChange = (e: ChangeEvent<HTMLInputElement>) => {
    const fieldPath = getFieldPath("changeDate");
    if (fieldPath) {
      setValue(fieldPath, e.target.value);
    }
  };

  const handleEndDateChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedEndDate = e.target.value;
    if (!selectedEndDate || selectedEndDate <= programmeEndDate) {
      const fieldPath = getFieldPath("endDate");
      if (fieldPath) {
        setValue(fieldPath, selectedEndDate);
        // Also uncheck the "until end" checkbox
        setValue(getFieldPath("untilEndOfProgramme")!, false);
      }
    }
  };

  const handleUntilEndChange = (checked: boolean) => {
    const fieldPath = getFieldPath("untilEndOfProgramme");
    if (fieldPath) {
      setValue(fieldPath, checked);
      if (checked) {
        setValue(getFieldPath("endDate")!, "");
        clearErrors(`${namespace}.endDate`);
      }
    }
  };

  // WTE options and handling
  const wteOptions = [
    { value: 1, label: "100%" },
    { value: 0.8, label: "80%" },
    { value: 0.7, label: "70%" },
    { value: 0.6, label: "60%" },
    { value: 0.5, label: "50%" }
  ];

  const formatWtePercentLabel = (value: number) => `${value * 100}%`;

  const toDecimalWte = (value: string | number): number => {
    const parsed = Number.parseFloat(value.toString());
    if (Number.isNaN(parsed)) {
      return parsed;
    }

    // free-text input, normalise to decimal.
    return parsed > 1 ? parsed / 100 : parsed;
  };

  const selectStyles = {
    ...colourStyles,
    control: (
      provided: CSSObjectWithLabel,
      state: ControlProps<{ value: number; label: string }, false>
    ) => ({
      ...colourStyles.control(provided, state),
      borderRadius: 0
    })
  };

  const {
    changeDate,
    endDate,
    untilEndOfProgramme,
    daysAdded,
    resultingCctDate
  } = fieldValues;

  return (
    <>
      {isEditing && (
        <h3 className="nhsuk-heading-m nhsuk-u-color-blue">
          {getCalculationTypeLabel(calculationType, "short")} Calculation
        </h3>
      )}

      {/* Common fields row */}
      <div className="nhsuk-grid-row">
        {/* Change date */}
        <div className="nhsuk-grid-column-one-quarter">
          <FormField
            label="Start date of change"
            id={`change-date-${fieldId}`}
            error={getFieldError("changeDate") as FieldError}
          >
            <input
              className={`nhsuk-input ${
                getFieldError("changeDate") ? "nhsuk-input--error" : ""
              }`}
              id={`change-date-${fieldId}`}
              type="date"
              value={changeDate || ""}
              onChange={handleChangeDateChange}
              disabled={!isEditing}
              {...(namespace &&
                register(`${namespace}.changeDate`, {
                  required: "Please enter a start date for this change",
                  validate: value => {
                    // First check: changeDate cannot be after programmeEndDate
                    if (value > programmeEndDate) {
                      return `Start date cannot be after programme end date (${dayjs(
                        programmeEndDate
                      ).format("DD/MM/YYYY")})`;
                    }
                    // Second check: previousChangeEndDate validation
                    if (previousChangeEndDate) {
                      // Need day after previous end date
                      const minDate = dayjs(previousChangeEndDate)
                        .add(1, "day")
                        .format("YYYY-MM-DD");
                      return (
                        value >= minDate ||
                        `Start date must be after ${dayjs(
                          previousChangeEndDate
                        ).format("DD/MM/YYYY")}`
                      );
                    }
                    // Third check: against programme start date
                    return (
                      value >= programmeStartDate ||
                      `Start date cannot be before programme start date (${dayjs(
                        programmeStartDate
                      ).format("DD/MM/YYYY")})`
                    );
                  }
                }))}
            />
          </FormField>
        </div>

        {/* End date */}
        <div className="nhsuk-grid-column-one-quarter">
          <FormField
            label="End Date"
            id={`end-date-${fieldId}`}
            error={getFieldError("endDate") as FieldError}
          >
            <input
              className={`nhsuk-input ${
                getFieldError("endDate") ? "nhsuk-input--error" : ""
              }`}
              id={`end-date-${fieldId}`}
              type="date"
              value={endDate || ""}
              onChange={handleEndDateChange}
              disabled={!isEditing || untilEndOfProgramme}
              {...(namespace &&
                register(`${namespace}.endDate`, {
                  validate: value => {
                    // Only require endDate when untilEndOfProgramme is false
                    if (!untilEndOfProgramme && !value) {
                      return "Please enter an end date or select 'OR set End date to Programme End date'";
                    }
                    // Check if endDate exceeds programmeEndDate
                    if (value > programmeEndDate) {
                      return `End date cannot be after programme end date (${dayjs(
                        programmeEndDate
                      ).format("DD/MM/YYYY")})`;
                    }

                    // Check if endDate is before changeDate
                    if (value < changeDate) {
                      return "End date cannot be before start date of change";
                    }
                    return true;
                  }
                }))}
            />
          </FormField>
        </div>
      </div>

      {/* Until end checkbox */}
      <div className="nhsuk-grid-row">
        <div className="nhsuk-grid-column-one-quarter">
          <FormField
            label={`OR set End date to Programme End date (${dayjs(
              programmeEndDate
            ).format("DD/MM/YYYY")})`}
            id={`until-end-checkbox-${fieldId}`}
          >
            <div className="nhsuk-checkboxes__item">
              <input
                className="nhsuk-checkboxes__input"
                id={`until-end-checkbox-${fieldId}`}
                type="checkbox"
                checked={untilEndOfProgramme || false}
                onChange={e => handleUntilEndChange(e.target.checked)}
                disabled={!isEditing}
              />
              <label
                className="nhsuk-label nhsuk-checkboxes__label"
                htmlFor={`until-end-checkbox-${fieldId}`}
              ></label>
            </div>
          </FormField>
        </div>
      </div>

      {/* WTE field row (only for LTFT) */}
      {calculationType === "LTFT" && (
        <div className="nhsuk-grid-row">
          <div className="nhsuk-grid-column-one-quarter">
            <FormField
              label="LTFT % for this period"
              id={`end-wte-select-${fieldId}`}
              error={getFieldError("endWte") as FieldError}
            >
              {namespace && (
                <Controller
                  name={`${namespace}.endWte`}
                  control={control}
                  rules={{
                    required: "Please select or enter a LTFT % for this period"
                  }}
                  render={({ field }) => (
                    <CreatableSelect
                      id={`end-wte-select-${fieldId}`}
                      options={wteOptions}
                      value={
                        field.value !== null && field.value !== undefined
                          ? {
                              value: field.value,
                              label: formatWtePercentLabel(field.value)
                            }
                          : null
                      }
                      onChange={option => {
                        const value = option
                          ? toDecimalWte(option.value)
                          : null;
                        field.onChange(value);
                      }}
                      placeholder="Select or enter WTE %"
                      isClearable
                      isDisabled={!isEditing}
                      formatCreateLabel={inputValue => `Add "${inputValue}%"`}
                      getOptionLabel={option => option.label}
                      styles={selectStyles}
                      onBlur={field.onBlur}
                    />
                  )}
                />
              )}
            </FormField>
          </div>
        </div>
      )}

      {/* Days added display */}
      {!isEditing && daysAdded && (
        <div className="nhsuk-grid-row">
          {/* This calculation's days added */}
          <div className="nhsuk-grid-column-one-quarter">
            <FormField label="CCT Days Added (this change)" id="">
              <div className="nhsuk-input nhsuk-u-width-one-quarter">
                {daysAdded > 0 ? `+${daysAdded}` : daysAdded}
              </div>
            </FormField>
          </div>

          {/* Cumulative days added */}
          {cumulativeDaysAdded !== undefined && (
            <div className="nhsuk-grid-column-one-quarter">
              <FormField label="Total CCT Days Added" id="">
                <div className="nhsuk-input nhsuk-u-width-one-quarter">
                  {cumulativeDaysAdded > 0
                    ? `+${cumulativeDaysAdded}`
                    : cumulativeDaysAdded}
                </div>
              </FormField>
            </div>
          )}

          {/* Resulting CCT date */}
          <div className="nhsuk-grid-column-one-quarter">
            <FormField label="New CCT Date" id="">
              <div className="nhsuk-input">
                {resultingCctDate
                  ? dayjs(resultingCctDate).format("DD/MM/YYYY")
                  : "Not calculated"}
              </div>
            </FormField>
          </div>
        </div>
      )}
    </>
  );
};
