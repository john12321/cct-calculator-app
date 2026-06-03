import { useState, type FC } from "react";
import { CompletionDateWarning } from "../components/CompletionDateWarning";
import { GradeTable } from "../components/GradeTable";
import { ProgrammeDetailsSection } from "../components/ProgrammeDetailsSection";
import { TimelineGrid } from "../components/TimelineGrid";
import { TimelineProjection } from "../components/TimelineProjection";
import { TrainingPeriodForm } from "../components/TrainingPeriodForm";
import {
  computeGradeProgressionForTimeline,
  describeTrainingPeriod,
  firstContiguityGapStart,
  insertPeriodChronologically,
  projectedCompletionDateForTimeline,
  validateTimeline,
  type ProgrammeDetails,
  type TrainingPeriod
} from "../core";
import { formatDate } from "../utils/format";
import { scrollTo, timelineRowId } from "../utils/scroll";

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
    onTimelineChange(insertPeriodChronologically(timeline, period));
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

  const lastId = timeline.at(-1)?.id;

  const validation = programme
    ? validateTimeline(programme, timeline)
    : { rowErrors: {}, issues: [] };
  const hasTimelineErrors = validation.issues.length > 0;

  // Note: gap-fill start, and whether the add form should insert rather than append.
  const gapStart = programme
    ? firstContiguityGapStart(programme, timeline)
    : null;
  const addIsInsert = editingPeriod === null && hasTimelineErrors;

  // Note: only a clean append or an edit of the final row may project forward.
  const allowProjectForward =
    editingPeriod === null
      ? !hasTimelineErrors
      : editingPeriod.id === lastId;

  // Note: hide "Add period" once the final row projects forward, unless a gap needs filling.
  const lastIsProjectForward =
    editingPeriod === null && timeline.at(-1)?.endDate === null;
  const showAddButton =
    !formOpen && (!lastIsProjectForward || hasTimelineErrors);

  const handleGoToRow = (id: string) => scrollTo({ id: timelineRowId(id) });

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

          {hasTimelineErrors && (
            <div
              className="nhsuk-error-summary"
              aria-labelledby="timeline-error-summary-title"
              role="alert"
            >
              <h3
                className="nhsuk-error-summary__title"
                id="timeline-error-summary-title"
              >
                There{" "}
                {validation.issues.length === 1
                  ? "is 1 issue"
                  : `are ${validation.issues.length} issues`}{" "}
                with the timeline
              </h3>
              <div className="nhsuk-error-summary__body">
                <p>
                  Editing or removing a period can leave gaps, overlaps or other
                  problems. Fix the periods below to continue.
                </p>
                <ul className="nhsuk-list nhsuk-error-summary__list">
                  {validation.issues.map(issue => {
                    const period = timeline.find(p => p.id === issue.id);
                    return (
                      <li key={issue.id}>
                        <a
                          href={`#${timelineRowId(issue.id)}`}
                          onClick={e => {
                            e.preventDefault();
                            handleGoToRow(issue.id);
                          }}
                        >
                          Row {issue.index + 1}
                          {period ? ` (${describeTrainingPeriod(period)})` : ""}:{" "}
                          {issue.message}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          )}

          <TimelineGrid
            periods={timeline}
            rowErrors={validation.rowErrors}
            onEdit={handleStartEdit}
            onRemove={handleRemove}
          />

          {timeline.length > 0 && !hasTimelineErrors && (
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
              allowProjectForward={allowProjectForward}
              lockStart={!addIsInsert}
              startSuggestion={gapStart}
              formId="training-period-form"
              onAdd={handleAdd}
              onUpdate={handleUpdate}
              onCancelEdit={handleCancelEdit}
            />
          )}

          {showAddButton && (
            <button
              type="button"
              className="nhsuk-button nhsuk-button--secondary nhsuk-u-margin-top-3"
              onClick={handleOpenAdd}
            >
              {hasTimelineErrors ? "Add period to fill gap" : "Add period"}
            </button>
          )}

          {timeline.length > 0 && !hasTimelineErrors && (
            <>
              <h3 className="nhsuk-heading-m nhsuk-u-color-blue nhsuk-u-margin-top-4">
                Grade progression
              </h3>
              <GradeTable
                programme={programme}
                rows={computeGradeProgressionForTimeline(programme, timeline)}
              />
            </>
          )}

          {timeline.length > 0 && (
            <>
              {hasTimelineErrors && (
                <p className="nhsuk-hint nhsuk-u-margin-top-4">
                  Resolve the timeline issues above to see the grade progression
                  and continue to the summary.
                </p>
              )}
              <button
                type="button"
                className="nhsuk-button nhsuk-u-margin-top-4"
                onClick={onContinue}
                disabled={editingId !== null || formOpen || hasTimelineErrors}
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
