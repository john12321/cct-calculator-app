import type { FC } from "react";
import type { ProgrammeDetails } from "../core";
import { formatMonths } from "../utils/format";

type AdditionalTrainingTimeSummaryRowProps = {
  programme: ProgrammeDetails;
};

export const AdditionalTrainingTimeSummaryRow: FC<
  AdditionalTrainingTimeSummaryRowProps
> = ({ programme }) => {
  if (programme.additionalTrainingTime.length === 0) return null;

  return (
    <div className="nhsuk-summary-list__row">
      <dt className="nhsuk-summary-list__key">Additional training time</dt>
      <dd className="nhsuk-summary-list__value">
        {programme.additionalTrainingTime.map(entry => (
          <div key={entry.id} className="nhsuk-u-margin-bottom-1">
            {entry.grade}: {formatMonths(entry.months)}
            <div className="nhsuk-hint nhsuk-u-margin-bottom-0">
              {entry.notes}
            </div>
          </div>
        ))}
      </dd>
    </div>
  );
};
