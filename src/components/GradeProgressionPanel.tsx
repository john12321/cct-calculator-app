import type { FC } from "react";
import { GradeTable } from "./GradeTable";
import {
  computeGradeProgression,
  computeGradeProgressionForTimeline,
  deriveQuickProjection,
  validateTimeline,
  type CalculationMode,
  type GradeYear,
  type PastChange,
  type ProgrammeDetails,
  type TrainingPeriod
} from "../core";

type GradeProgressionPanelProps = {
  mode: CalculationMode;
  programme: ProgrammeDetails;
  pastChanges: PastChange[];
  timeline: TrainingPeriod[];
};

const gradeRowsFor = ({
  mode,
  programme,
  pastChanges,
  timeline
}: GradeProgressionPanelProps): GradeYear[] | null => {
  if (mode === "QUICK") {
    return computeGradeProgression(
      programme,
      pastChanges,
      deriveQuickProjection(programme, pastChanges)
    );
  }
  if (
    timeline.length === 0 ||
    validateTimeline(programme, timeline).issues.length > 0
  ) {
    return null;
  }
  return computeGradeProgressionForTimeline(programme, timeline);
};

export const GradeProgressionPanel: FC<GradeProgressionPanelProps> = props => {
  const rows = gradeRowsFor(props);

  return (
    <section className="nhsuk-u-margin-bottom-6">
      <h2 className="nhsuk-heading-l nhsuk-u-color-blue">Grade progression</h2>
      {rows === null ? (
        <p className="nhsuk-hint">
          Add a valid training timeline to see the grade progression.
        </p>
      ) : (
        <>
          <p className="nhsuk-hint">
            Updates automatically as you record adjustments and changes.
          </p>
          <GradeTable programme={props.programme} rows={rows} />
        </>
      )}
    </section>
  );
};
