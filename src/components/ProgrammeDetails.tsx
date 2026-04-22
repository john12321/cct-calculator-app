import { useFormContext } from "react-hook-form";
import type { CctFormValues } from "./types";
import dayjs from "dayjs";

export const ProgrammeDetails = () => {
  const {
    register,
    formState: { errors },
    watch
  } = useFormContext<CctFormValues>();

  const programmeStartDate = watch("programmeStartDate");
  const calculationPerformed = watch("calculationPerformed");

  return (
    <>
      <div className="nhsuk-grid-row">
        <div className="nhsuk-grid-column-one-half">
          <div
            className={`nhsuk-form-group ${
              errors.programmeName ? "nhsuk-form-group--error" : ""
            }`}
          >
            <label className="nhsuk-label" htmlFor="programme-name">
              Programme Name
            </label>
            {errors.programmeName && (
              <span className="nhsuk-error-message">
                <span className="nhsuk-u-visually-hidden">Error:</span>
                {errors.programmeName.message?.toString()}
              </span>
            )}
            <input
              className={`nhsuk-input nhsuk-input--width-40${
                errors.programmeName ? "nhsuk-input--error" : ""
              }`}
              id="programme-name"
              type="text"
              {...register("programmeName", {
                required: "Programme name is required"
              })}
            />
            {calculationPerformed && (
              <p className="nhsuk-hint nhsuk-u-margin-top-1">
                You can still edit the Programme Name!
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="nhsuk-grid-row">
        <div className="nhsuk-grid-column-one-quarter">
          <div
            className={`nhsuk-form-group ${
              errors.programmeStartDate ? "nhsuk-form-group--error" : ""
            }`}
          >
            <label className="nhsuk-label" htmlFor="programme-start-date">
              Programme Start Date
            </label>
            {errors.programmeStartDate && (
              <span className="nhsuk-error-message">
                <span className="nhsuk-u-visually-hidden">Error:</span>
                {errors.programmeStartDate.message?.toString()}
              </span>
            )}
            <input
              className={`nhsuk-input nhsuk-input--width-10 ${
                errors.programmeStartDate ? "nhsuk-input--error" : ""
              }`}
              id="programme-start-date"
              type="date"
              readOnly={calculationPerformed}
              {...register("programmeStartDate", {
                required: "Programme start date is required"
              })}
            />
            {calculationPerformed && (
              <p className="nhsuk-hint nhsuk-u-margin-top-1">
                Start date locked for editing (used in calculations)
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="nhsuk-grid-row">
        <div className="nhsuk-grid-column-one-quarter">
          <div
            className={`nhsuk-form-group ${
              errors.programmeEndDate ? "nhsuk-form-group--error" : ""
            }`}
          >
            <label className="nhsuk-label" htmlFor="programme-end-date">
              End date (current CCT date)
            </label>
            {errors.programmeEndDate && (
              <span className="nhsuk-error-message">
                <span className="nhsuk-u-visually-hidden">Error:</span>
                {errors.programmeEndDate.message?.toString()}
              </span>
            )}
            <input
              className={`nhsuk-input nhsuk-input--width-10 ${
                errors.programmeEndDate ? "nhsuk-input--error" : ""
              }`}
              id="programme-end-date"
              type="date"
              readOnly={calculationPerformed}
              {...register("programmeEndDate", {
                required: "Programme end date is required",
                validate: value =>
                  dayjs(value).isAfter(dayjs(programmeStartDate)) ||
                  "End date must be after start date"
              })}
            />
            {calculationPerformed && (
              <p className="nhsuk-hint nhsuk-u-margin-top-1">
                End date locked for editing (used in calculations)
              </p>
            )}
          </div>
        </div>
      </div>

      {calculationPerformed && (
        <div className="nhsuk-inset-text">
          <p>
            To change Programme dates, please 'Start Over' but be aware this
            will delete all your CCT Calculations.
          </p>
        </div>
      )}
    </>
  );
};
