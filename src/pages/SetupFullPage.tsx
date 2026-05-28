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
import { scrollToElement } from "../utils/scroll";

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
    scrollToElement("timeline-table");
  };

  const handleUpdate = (period: TrainingPeriod) => {
    onTimelineChange(timeline.map(p => (p.id === period.id ? period : p)));
    setEditingId(null);
    scrollToElement("timeline-table");
  };

  const handleRemove = (id: string) => {
    onTimelineChange(timeline.filter(p => p.id !== id));
    if (editingId === id) setEditingId(null);
    scrollToElement("training-period-form");
  };

  const handleStartEdit = (id: string) => {
    setEditingId(id);
    scrollToElement("training-period-form");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    scrollToElement("timeline-table");
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
        onSaved={() => scrollToElement("training-timeline-section")}
      />

      {programme && (
        <section id="training-timeline-section" className="nhsuk-u-margin-top-4">
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
              formId="training-period-form"
              onAdd={handleAdd}
              onUpdate={handleUpdate}
              onCancelEdit={handleCancelEdit}
            />
          )}

          <TimelineGrid
            periods={timeline}
            onEdit={handleStartEdit}
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
