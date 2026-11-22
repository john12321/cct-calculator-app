import type { FC } from "react";
import type { ProgrammeDetails } from "../core";
import type { GradeTrainingTimeKind } from "./gradeTrainingTimeKinds";

type GradeTrainingTimeSummaryRowProps = {
  kind: GradeTrainingTimeKind;
  programme: ProgrammeDetails;
};

export const GradeTrainingTimeSummaryRow: FC<
  GradeTrainingTimeSummaryRowProps
> = ({ kind, programme }) => {
  const entries = programme[kind.field];
  if (entries.length === 0) return null;

  return (
    <div className="nhsuk-summary-list__row">
      <dt className="nhsuk-summary-list__key">{kind.title}</dt>
      <dd className="nhsuk-summary-list__value">
        {entries.map(entry => (
          <div key={entry.id} className="nhsuk-u-margin-bottom-1">
            {entry.grade}: {entry.months} months
            <div className="nhsuk-hint nhsuk-u-margin-bottom-0">
              {entry.notes}
            </div>
          </div>
        ))}
      </dd>
    </div>
  );
};
