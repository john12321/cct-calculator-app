import { useState, type FC } from "react";
import {
  programmeAdjustedEndDate,
  programmeAdjustedLengthMonths,
  totalAdditionalMonths,
  type ProgrammeDetails
} from "../core";
import { formatDate, formatMonths } from "../utils/format";
import { AcceleratedTrainingTimeSection } from "./AcceleratedTrainingTimeSection";
import { AdditionalTrainingTimeSection } from "./AdditionalTrainingTimeSection";

type TrainingTimeAdjustmentsSectionProps = {
  programme: ProgrammeDetails;
  onChange: (programme: ProgrammeDetails) => void;
  onFormOpenChange: (open: boolean) => void;
};

export const TrainingTimeAdjustmentsSection: FC<
  TrainingTimeAdjustmentsSectionProps
> = ({ programme, onChange, onFormOpenChange }) => {
  const [openForms, setOpenForms] = useState({
    additional: false,
    accelerated: false
  });

  const handleFormOpenChange =
    (form: keyof typeof openForms) => (open: boolean) => {
      const next = { ...openForms, [form]: open };
      setOpenForms(next);
      onFormOpenChange(next.additional || next.accelerated);
    };

  const additionalMonths = totalAdditionalMonths(programme);
  const hasAdjustment = additionalMonths > 0 || programme.acceleratedMonths > 0;

  return (
    <section className="nhsuk-u-margin-bottom-6">
      <h2 className="nhsuk-heading-l nhsuk-u-color-blue">
        Training time adjustments
      </h2>

      <AdditionalTrainingTimeSection
        programme={programme}
        onChange={onChange}
        onFormOpenChange={handleFormOpenChange("additional")}
      />

      <AcceleratedTrainingTimeSection
        programme={programme}
        onChange={onChange}
        onFormOpenChange={handleFormOpenChange("accelerated")}
      />

      {hasAdjustment && (
        <>
          <h3 className="nhsuk-heading-m nhsuk-u-color-blue">
            Adjusted programme length
          </h3>
          <dl className="nhsuk-summary-list">
            <div className="nhsuk-summary-list__row">
              <dt className="nhsuk-summary-list__key">
                Initial programme length
              </dt>
              <dd className="nhsuk-summary-list__value">
                {formatMonths(programme.lengthMonths)}
              </dd>
            </div>
            {additionalMonths > 0 && (
              <div className="nhsuk-summary-list__row">
                <dt className="nhsuk-summary-list__key">
                  Additional training time
                </dt>
                <dd className="nhsuk-summary-list__value">
                  +{formatMonths(additionalMonths)}
                </dd>
              </div>
            )}
            {programme.acceleratedMonths > 0 && (
              <div className="nhsuk-summary-list__row">
                <dt className="nhsuk-summary-list__key">
                  Accelerated training time
                </dt>
                <dd className="nhsuk-summary-list__value">
                  -{formatMonths(programme.acceleratedMonths)}
                </dd>
              </div>
            )}
            <div className="nhsuk-summary-list__row">
              <dt className="nhsuk-summary-list__key">
                Adjusted programme length
              </dt>
              <dd className="nhsuk-summary-list__value">
                {formatMonths(programmeAdjustedLengthMonths(programme))}
              </dd>
            </div>
            <div className="nhsuk-summary-list__row">
              <dt className="nhsuk-summary-list__key">
                Adjusted programme end date before changes
              </dt>
              <dd className="nhsuk-summary-list__value">
                {formatDate(programmeAdjustedEndDate(programme))}
                <span className="nhsuk-hint nhsuk-u-margin-left-2">
                  (based on programme length and training-time adjustments only)
                </span>
              </dd>
            </div>
          </dl>
        </>
      )}
    </section>
  );
};
