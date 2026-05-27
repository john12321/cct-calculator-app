import { useState, type FC } from "react";
import { CompletionDateWarning } from "../components/CompletionDateWarning";
import { GradeTable } from "../components/GradeTable";
import { ProgrammeDetailsSection } from "../components/ProgrammeDetailsSection";
import { TimelineGrid } from "../components/TimelineGrid";
import { TimelineProjection } from "../components/TimelineProjection";
import { TrainingPeriodForm } from "../components/TrainingPeriodForm";
import {
  computeGradeProgressionForTimeline,
  type ProgrammeDetails,
  type TrainingPeriod
} from "../core";

type SetupFullPageProps = {
  programme: ProgrammeDetails | null;
  timeline: TrainingPeriod[];
  onProgrammeChange: (programme: ProgrammeDetails) => void;
  onTimelineChange: (timeline: TrainingPeriod[]) => void;
  onContinue: () => void;
};

export const SetupFullPage: FC<SetupFullPageProps> = ({
  programme,
  timeline,
  onProgrammeChange,
  onTimelineChange,
  onContinue
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleAdd = (period: TrainingPeriod) => {
    onTimelineChange([...timeline, period]);
  };

  const handleUpdate = (period: TrainingPeriod) => {
    onTimelineChange(timeline.map(p => (p.id === period.id ? period : p)));
    setEditingId(null);
  };

  const handleRemove = (id: string) => {
    onTimelineChange(timeline.filter(p => p.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const editingPeriod =
    editingId === null
      ? null
      : (timeline.find(p => p.id === editingId) ?? null);

  const priorPeriods =
    editingPeriod === null
      ? timeline
      : timeline.filter(p => p.id !== editingPeriod.id);

  const lastIsProjectForward =
    editingPeriod === null && timeline.at(-1)?.endDate === null;

  return (
    <>
      <CompletionDateWarning />

      <ProgrammeDetailsSection
        programme={programme}
        onChange={onProgrammeChange}
      />

      {programme && (
        <section className="nhsuk-u-margin-top-4">
          <h2 className="nhsuk-heading-l nhsuk-u-color-blue">
            Training timeline
          </h2>
          <p className="nhsuk-body">
            Record every grade, out-of-programme period and leave period as a
            contiguous timeline starting at the programme start date. The next
            period's start date follows on automatically.
          </p>

          {lastIsProjectForward ? (
            <div className="nhsuk-inset-text" role="note">
              <span className="nhsuk-u-visually-hidden">Information: </span>
              <p>
                The most recent period is set to project forward. To add
                another period, edit it and set an end date instead.
              </p>
            </div>
          ) : (
            <TrainingPeriodForm
              key={editingId ?? "new"}
              programme={programme}
              priorPeriods={priorPeriods}
              editing={editingPeriod}
              onAdd={handleAdd}
              onUpdate={handleUpdate}
              onCancelEdit={() => setEditingId(null)}
            />
          )}

          <TimelineGrid
            periods={timeline}
            onEdit={id => setEditingId(id)}
            onRemove={handleRemove}
          />

          {timeline.length > 0 && (
            <>
              <h3 className="nhsuk-heading-m nhsuk-u-color-blue nhsuk-u-margin-top-4">
                Projected Completion of Training Date
              </h3>
              <TimelineProjection programme={programme} timeline={timeline} />

              <h3 className="nhsuk-heading-m nhsuk-u-color-blue nhsuk-u-margin-top-4">
                Grade progression
              </h3>
              <GradeTable
                programme={programme}
                rows={computeGradeProgressionForTimeline(programme, timeline)}
              />

              <button
                type="button"
                className="nhsuk-button nhsuk-u-margin-top-4"
                onClick={onContinue}
                disabled={editingId !== null}
              >
                Show summary
              </button>
            </>
          )}
        </section>
      )}
    </>
  );
};
