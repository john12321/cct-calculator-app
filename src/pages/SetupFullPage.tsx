import { useState, type FC } from "react";
import { CompletionDateWarning } from "../components/CompletionDateWarning";
import { GradeTable } from "../components/GradeTable";
import { ProgrammeDetailsSection } from "../components/ProgrammeDetailsSection";
import { TimelineGrid } from "../components/TimelineGrid";
import { TimelineProjection } from "../components/TimelineProjection";
import { TrainingPeriodForm } from "../components/TrainingPeriodForm";
import {
  computeGradeProgressionForTimeline,
  projectedCompletionDateForTimeline,
  type ProgrammeDetails,
  type TrainingPeriod
} from "../core";
import { formatDate } from "../utils/format";
import { scrollTo } from "../utils/scroll";

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
  const [formOpen, setFormOpen] = useState(false);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormOpen(true);
    scrollTo({ id: "training-period-form" });
  };

  const handleAdd = (period: TrainingPeriod) => {
    onTimelineChange([...timeline, period]);
    setFormOpen(false);
    scrollTo({ id: "timeline-table" });
  };

  const handleUpdate = (period: TrainingPeriod) => {
    onTimelineChange(timeline.map(p => (p.id === period.id ? period : p)));
    setEditingId(null);
    setFormOpen(false);
    scrollTo({ id: "timeline-table" });
  };

  const handleRemove = (id: string) => {
    onTimelineChange(timeline.filter(p => p.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setFormOpen(false);
    }
    scrollTo({ id: "timeline-table" });
  };

  const handleStartEdit = (id: string) => {
    setEditingId(id);
    setFormOpen(true);
    scrollTo({ id: "training-period-form" });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormOpen(false);
    scrollTo({ id: "timeline-table" });
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
        onSaved={() => scrollTo({ id: "training-timeline-section" })}
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

          <TimelineGrid
            periods={timeline}
            onEdit={handleStartEdit}
            onRemove={handleRemove}
          />

          {timeline.length > 0 && (
            <>
              <TimelineProjection programme={programme} timeline={timeline} />

              <div className="nhsuk-inset-text nhsuk-u-margin-top-2">
                <p className="nhsuk-u-margin-bottom-0">
                  Projected Completion of Training Date:{" "}
                  <strong>
                    {formatDate(
                      projectedCompletionDateForTimeline(programme, timeline)
                    )}
                  </strong>
                </p>
              </div>
            </>
          )}

          {formOpen && (
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

          {!formOpen && !lastIsProjectForward && (
            <button
              type="button"
              className="nhsuk-button nhsuk-button--secondary nhsuk-u-margin-top-3"
              onClick={handleOpenAdd}
            >
              Add period
            </button>
          )}

          {timeline.length > 0 && (
            <>
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
                disabled={editingId !== null || formOpen}
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
