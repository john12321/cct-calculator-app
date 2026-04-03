import { Fragment, type FC } from "react";
import { useFormContext, useFieldArray, type FieldPath } from "react-hook-form";
import { CctCalcSelector } from "./CctCalcSelector";
import { CalculationRow } from "./CalculationRow";
import { Card } from "nhsuk-react-components";
import {
  calculateExtensionDays,
  calculateInclusiveDaySpan,
  calculateNewCct,
  selectCalculationType
} from "../utils/cctCalcUtils";
import type {
  CalculationChange,
  CalculationType,
  CctFormValues
} from "./types";

export const CctCalculations: FC = () => {
  const { control, watch, setValue, trigger } = useFormContext<CctFormValues>();

  const { fields, append, update, remove } = useFieldArray({
    control,
    name: "calculationChanges"
  });

  const programmeStartDate = watch("programmeStartDate");
  const programmeEndDate = watch("programmeEndDate");
  const cctDate = watch("cctDate");
  const calculationChanges: CalculationChange[] =
    watch("calculationChanges") || [];

  const draftCalculation = watch("draftCalculation") ?? {};
  const draftType = watch("draftType");
  const editingIndex = watch("editingIndex");

  const previousChangeEndDate =
    calculationChanges.length > 0
      ? calculationChanges[calculationChanges.length - 1].endDate
      : null;

  const handleTypeSelect = (type: CalculationType) => {
    setValue("draftType", type);
    const newCalc = selectCalculationType(
      type,
      previousChangeEndDate,
      programmeStartDate
    );
    setValue("draftCalculation", newCalc);
    setValue("editingIndex", null); // Not editing
  };

  const handleCalculate = async () => {
    if (!draftCalculation.type) return;

    console.log("Draft calculation before validation:", draftCalculation);

    // First validate all necessary fields
    const calculationType = watch("draftType");
    const fieldsToValidate: FieldPath<CctFormValues>[] = [
      "draftCalculation.changeDate"
    ];

    // Conditionally validate endDate only if untilEndOfProgramme is false
    const untilEndOfProgramme = watch("draftCalculation.untilEndOfProgramme");
    if (!untilEndOfProgramme) {
      fieldsToValidate.push("draftCalculation.endDate");
    }

    // Add LTFT specific field if needed
    if (calculationType === "LTFT") {
      fieldsToValidate.push("draftCalculation.endWte");
    }

    const isValid = await trigger(fieldsToValidate);

    if (!isValid) {
      // could show error here
      return;
    }

    const calculationBaseDate = programmeEndDate;

    console.log("Calculation base date:", calculationBaseDate);

    const calculationId =
      editingIndex !== null
        ? calculationChanges[editingIndex].id
        : `calc-${Date.now()}`;

    console.log("Calculation ID:", calculationId);

    const changeEndDate = draftCalculation.untilEndOfProgramme
      ? programmeEndDate
      : draftCalculation.endDate;

    const changeDaySpan = calculateInclusiveDaySpan(
      draftCalculation?.changeDate as string,
      changeEndDate as string
    );

    console.log("Change day span:", changeDaySpan);

    const daysAdded = calculateExtensionDays(
      changeDaySpan,
      draftCalculation?.endWte
    );

    console.log("CCT extension days:", daysAdded);

    const newCctDate = calculateNewCct(calculationBaseDate, daysAdded);

    console.log("New calculated CCT date:", newCctDate);

    const completeCalculation: CalculationChange = {
      ...draftCalculation,
      id: calculationId,
      daysAdded,
      resultingCctDate: newCctDate
    } as CalculationChange;

    setValue("cctDate", newCctDate);
    if (editingIndex !== null) {
      update(editingIndex, completeCalculation);
    } else {
      append(completeCalculation);
    }
    setValue("calculationPerformed", true);

    // Reset draft
    setValue("draftCalculation", {});
    setValue("draftType", null);
    setValue("editingIndex", null);
  };

  const handleRemoveLastCalculation = () => {
    if (calculationChanges.length === 0) return;
    remove(calculationChanges.length - 1);

    const newCctDate =
      calculationChanges.length > 1
        ? calculationChanges[calculationChanges.length - 2].resultingCctDate
        : programmeEndDate;

    setValue("cctDate", newCctDate);

    // If we remove all calcs...
    if (calculationChanges.length === 1) {
      setValue("calculationPerformed", false);
    }
  };

  const handleCancelCalculation = () => {
    setValue("draftCalculation", {});
    setValue("draftType", null);
    setValue("editingIndex", null);
  };

  const handleEditCalculation = (index: number) => {
    // Only allow editing the latest calculation for now
    if (index === calculationChanges.length - 1) {
      setValue("editingIndex", index);
      setValue("draftCalculation", { ...calculationChanges[index] });
      setValue("draftType", calculationChanges[index].type);
    }
  };

  const handleCancelEdit = () => {
    setValue("draftCalculation", {});
    setValue("draftType", null);
    setValue("editingIndex", null);
  };

  return (
    <>
      {/* Display list of existing calculation changes */}
      {fields.length > 0 && (
        <>
          <h3 className="nhsuk-heading-s">CCT Date Changes:</h3>
          {calculationChanges.map((change, index) => {
            const cumulativeDaysAdded = calculationChanges
              .slice(0, index + 1)
              .reduce((sum, curr) => sum + curr.daysAdded, 0);

            const isEditing = editingIndex === index;
            const isLastCalculation = index === calculationChanges.length - 1;

            return (
              <Fragment key={fields[index].id}>
                <Card>
                  <Card.Content>
                    <h4>{`${index + 1}. ${change.type} change`}</h4>
                    {isEditing ? (
                      <>
                        <CalculationRow
                          calculationType={change.type}
                          change={draftCalculation}
                          isEditing={true}
                          isDraft={true}
                          index={index}
                          programmeStartDate={programmeStartDate}
                          programmeEndDate={programmeEndDate}
                          cctDate={cctDate}
                          cumulativeDaysAdded={cumulativeDaysAdded}
                          previousChangeEndDate={
                            index > 0
                              ? calculationChanges[index - 1].endDate
                              : undefined
                          }
                        />
                        <div className="nhsuk-grid-row">
                          <div className="nhsuk-grid-column-full">
                            <button
                              type="button"
                              className="nhsuk-button nhsuk-u-margin-right-3"
                              onClick={handleCalculate}
                            >
                              Recalculate CCT
                            </button>
                            <button
                              type="button"
                              className="nhsuk-button nhsuk-button--secondary"
                              onClick={handleCancelEdit}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      // View-only display
                      <>
                        <CalculationRow
                          calculationType={change.type}
                          change={change}
                          isEditing={false}
                          isDraft={false}
                          index={index}
                          programmeStartDate={programmeStartDate}
                          programmeEndDate={programmeEndDate}
                          cctDate={cctDate}
                          cumulativeDaysAdded={cumulativeDaysAdded}
                        />
                        {/* Action buttons - only for the last calculation atm */}
                        {isLastCalculation &&
                          editingIndex === null && ( // Hide if editing
                            <div className="nhsuk-grid-row">
                              <div className="nhsuk-grid-column-full">
                                <button
                                  type="button"
                                  className="nhsuk-button nhsuk-u-margin-right-3"
                                  onClick={() => handleEditCalculation(index)}
                                >
                                  Edit calculation
                                </button>
                                <button
                                  type="button"
                                  className="nhsuk-button nhsuk-button--secondary"
                                  onClick={handleRemoveLastCalculation}
                                >
                                  Remove change calculation
                                </button>
                              </div>
                            </div>
                          )}
                      </>
                    )}
                  </Card.Content>
                </Card>
              </Fragment>
            );
          })}
          <hr className="nhsuk-section-break nhsuk-section-break--m nhsuk-section-break--visible" />
        </>
      )}

      {/* Selecting calculation type - Only show if not currently editing or drafting */}
      {editingIndex === null &&
        !draftType &&
        (!calculationChanges.length ||
          (calculationChanges.length > 0 &&
            !calculationChanges[calculationChanges.length - 1]
              .untilEndOfProgramme &&
            calculationChanges[calculationChanges.length - 1].endDate !==
              programmeEndDate)) && (
          <div className="nhsuk-grid-row nhsuk-u-margin-bottom-4">
            <div className="nhsuk-grid-column-full">
              <CctCalcSelector
                selectedType={draftType}
                onTypeSelect={handleTypeSelect}
              />
            </div>
          </div>
        )}

      {/* Form for new calculation - shown directly when type is selected */}
      {draftType && editingIndex === null && (
        <div className="nhsuk-u-margin-bottom-4">
          <CalculationRow
            calculationType={draftType}
            change={draftCalculation}
            isEditing={true}
            isDraft={true}
            programmeStartDate={programmeStartDate}
            programmeEndDate={programmeEndDate}
            cctDate={cctDate}
            previousChangeEndDate={previousChangeEndDate || undefined}
          />

          <div className="nhsuk-button-group nhsuk-u-margin-top-4">
            <button
              type="button"
              className="nhsuk-button nhsuk-u-margin-right-4"
              onClick={handleCalculate}
            >
              Calculate CCT Date
            </button>
            <button
              type="button"
              className="nhsuk-button nhsuk-button--secondary"
              onClick={handleCancelCalculation}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
};
