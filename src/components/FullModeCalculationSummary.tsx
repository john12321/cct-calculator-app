import type { FC } from "react";
import { Table } from "nhsuk-react-components";
import { GradeTable } from "./GradeTable";
import { TimelineProjection } from "./TimelineProjection";
import {
  calendarMonthsForPeriod,
  computeGradeProgressionForTimeline,
  computeTimelineAccrual,
  findSpecialty,
  getGradePeriodTagLabel,
  getTrainingPeriodTypeLabel,
  programmeAdjustedEndDate,
  programmeAdjustedLengthMonths,
  programmeOriginalEndDate,
  projectedCompletionDateForTimeline,
  wteMonthsForPeriod,
  type ProgrammeDetails,
  type TrainingPeriod
} from "../core";
import { formatDate, formatMonths, formatPercent } from "../utils/format";

type FullModeCalculationSummaryProps = {
  programme: ProgrammeDetails;
  timeline: TrainingPeriod[];
  variant?: "inline" | "page";
};

const describePeriod = (period: TrainingPeriod): string => {
  if (period.type !== "GRADE") {
    return getTrainingPeriodTypeLabel(period.type, "short");
  }
  if (period.gradeTag === "REGULAR") return period.grade;
  return `${period.grade} (${getGradePeriodTagLabel(period.gradeTag)})`;
};

export const FullModeCalculationSummary: FC<FullModeCalculationSummaryProps> = ({
  programme,
  timeline,
  variant = "inline"
}) => {
  const accrual = computeTimelineAccrual(programme, timeline);
  const cct = projectedCompletionDateForTimeline(programme, timeline);
  const originalEnd = programmeOriginalEndDate(programme);
  const adjustedEnd = programmeAdjustedEndDate(programme);
  const adjustedLength = programmeAdjustedLengthMonths(programme);
  const specialtyMeta = findSpecialty(programme.specialty);
  const startGradeIsOverridden =
    specialtyMeta !== undefined &&
    programme.startGrade !== specialtyMeta.entryGrade;

  return (
    <section className={variant === "page" ? "nhsuk-u-margin-top-3" : ""}>
      <dl className="nhsuk-summary-list">
        <div className="nhsuk-summary-list__row">
          <dt className="nhsuk-summary-list__key">Specialty</dt>
          <dd className="nhsuk-summary-list__value">
            {programme.specialty}
            {specialtyMeta?.dual && (
              <span className="nhsuk-u-margin-left-2">
                <strong>({specialtyMeta.dual})</strong>
              </span>
            )}
          </dd>
        </div>
        <div className="nhsuk-summary-list__row">
          <dt className="nhsuk-summary-list__key">Programme length</dt>
          <dd className="nhsuk-summary-list__value">
            {formatMonths(programme.lengthMonths)}
          </dd>
        </div>
        {programme.additionalMonths > 0 && (
          <div className="nhsuk-summary-list__row">
            <dt className="nhsuk-summary-list__key">
              Additional training time
            </dt>
            <dd className="nhsuk-summary-list__value">
              {formatMonths(programme.additionalMonths)}
              {programme.additionalMonthsNotes && (
                <div className="nhsuk-hint nhsuk-u-margin-top-1">
                  {programme.additionalMonthsNotes}
                </div>
              )}
            </dd>
          </div>
        )}
        {programme.acceleratedMonths > 0 && (
          <div className="nhsuk-summary-list__row">
            <dt className="nhsuk-summary-list__key">
              Accelerated training time
            </dt>
            <dd className="nhsuk-summary-list__value">
              {formatMonths(programme.acceleratedMonths)}
              {programme.acceleratedMonthsNotes && (
                <div className="nhsuk-hint nhsuk-u-margin-top-1">
                  {programme.acceleratedMonthsNotes}
                </div>
              )}
            </dd>
          </div>
        )}
        {programme.eighteenMonthFinalGrade && (
          <div className="nhsuk-summary-list__row">
            <dt className="nhsuk-summary-list__key">18-month final year</dt>
            <dd className="nhsuk-summary-list__value">
              {programme.eighteenMonthFinalGrade}
              {programme.eighteenMonthFinalGradeNotes && (
                <div className="nhsuk-hint nhsuk-u-margin-top-1">
                  {programme.eighteenMonthFinalGradeNotes}
                </div>
              )}
            </dd>
          </div>
        )}
        {programme.skippedGrade && (
          <div className="nhsuk-summary-list__row">
            <dt className="nhsuk-summary-list__key">Skipped grade year</dt>
            <dd className="nhsuk-summary-list__value">
              {programme.skippedGrade}
              {programme.skippedGradeNotes && (
                <div className="nhsuk-hint nhsuk-u-margin-top-1">
                  {programme.skippedGradeNotes}
                </div>
              )}
            </dd>
          </div>
        )}
        <div className="nhsuk-summary-list__row">
          <dt className="nhsuk-summary-list__key">Start grade</dt>
          <dd className="nhsuk-summary-list__value">
            {programme.startGrade}
            {startGradeIsOverridden && (
              <span className="nhsuk-hint nhsuk-u-margin-left-2">
                (overridden - default {specialtyMeta?.entryGrade})
              </span>
            )}
            {startGradeIsOverridden && programme.startGradeOverrideNotes && (
              <div className="nhsuk-hint nhsuk-u-margin-top-1">
                {programme.startGradeOverrideNotes}
              </div>
            )}
          </dd>
        </div>
        <div className="nhsuk-summary-list__row">
          <dt className="nhsuk-summary-list__key">Start date</dt>
          <dd className="nhsuk-summary-list__value">
            {formatDate(programme.startDate)}
          </dd>
        </div>
        <div className="nhsuk-summary-list__row">
          <dt className="nhsuk-summary-list__key">Original CCT date</dt>
          <dd className="nhsuk-summary-list__value">{formatDate(originalEnd)}</dd>
        </div>
        {(programme.additionalMonths > 0 ||
          programme.acceleratedMonths > 0) && (
          <div className="nhsuk-summary-list__row">
            <dt className="nhsuk-summary-list__key">
              Adjusted full-time CCT date
            </dt>
            <dd className="nhsuk-summary-list__value">
              {formatDate(adjustedEnd)}
              <span className="nhsuk-hint nhsuk-u-margin-left-2">
                (reflects the other training-time adjustments shown above)
              </span>
            </dd>
          </div>
        )}
        <div className="nhsuk-summary-list__row">
          <dt className="nhsuk-summary-list__key">Required training</dt>
          <dd className="nhsuk-summary-list__value">
            {formatMonths(adjustedLength)}
          </dd>
        </div>
        <div className="nhsuk-summary-list__row">
          <dt className="nhsuk-summary-list__key">WTE months recorded</dt>
          <dd className="nhsuk-summary-list__value">
            {formatMonths(accrual.totalWteMonthsCompleted)}
          </dd>
        </div>
        <div className="nhsuk-summary-list__row">
          <dt className="nhsuk-summary-list__key">Months remaining</dt>
          <dd className="nhsuk-summary-list__value">
            {formatMonths(Math.max(0, accrual.monthsRemaining))}
          </dd>
        </div>
        <div className="nhsuk-summary-list__row">
          <dt className="nhsuk-summary-list__key">Projected completion date</dt>
          <dd className="nhsuk-summary-list__value">
            <strong>{formatDate(cct)}</strong>
          </dd>
        </div>
      </dl>

      <h3 className="nhsuk-heading-m nhsuk-u-color-blue">Training timeline</h3>
      {timeline.length === 0 ? (
        <p className="nhsuk-body-s">No periods recorded.</p>
      ) : (
        <div className="table-wrapper">
          <Table>
            <Table.Head>
              <Table.Row>
                <Table.Cell>Grade / period</Table.Cell>
                <Table.Cell>Start</Table.Cell>
                <Table.Cell>End</Table.Cell>
                <Table.Cell>WTE %</Table.Cell>
                <Table.Cell>Counted as training?</Table.Cell>
                <Table.Cell>Calendar months</Table.Cell>
                <Table.Cell>WTE months</Table.Cell>
                <Table.Cell>Notes</Table.Cell>
              </Table.Row>
            </Table.Head>
            <Table.Body>
              {timeline.map(period => {
                const cal = calendarMonthsForPeriod(period);
                const wteM = wteMonthsForPeriod(period);
                return (
                  <Table.Row key={period.id}>
                    <Table.Cell>{describePeriod(period)}</Table.Cell>
                    <Table.Cell>{formatDate(period.startDate)}</Table.Cell>
                    <Table.Cell>
                      {period.endDate === null
                        ? "Project forward"
                        : formatDate(period.endDate)}
                    </Table.Cell>
                    <Table.Cell>
                      {period.type === "GRADE" && period.wte !== null
                        ? formatPercent(period.wte)
                        : "—"}
                    </Table.Cell>
                    <Table.Cell>
                      {period.countedAsTraining ? "Yes" : "No"}
                    </Table.Cell>
                    <Table.Cell>{cal === null ? "—" : cal.toFixed(1)}</Table.Cell>
                    <Table.Cell>
                      {wteM === null ? "—" : wteM.toFixed(1)}
                    </Table.Cell>
                    <Table.Cell>{period.notes || "—"}</Table.Cell>
                  </Table.Row>
                );
              })}
              <Table.Row>
                <Table.Cell>
                  <strong>Totals</strong>
                </Table.Cell>
                <Table.Cell />
                <Table.Cell />
                <Table.Cell />
                <Table.Cell />
                <Table.Cell>
                  <strong>
                    {accrual.totalCalendarMonthsCompleted.toFixed(1)}
                  </strong>
                </Table.Cell>
                <Table.Cell>
                  <strong>{accrual.totalWteMonthsCompleted.toFixed(1)}</strong>
                </Table.Cell>
                <Table.Cell />
              </Table.Row>
            </Table.Body>
          </Table>
        </div>
      )}

      <h3 className="nhsuk-heading-m nhsuk-u-color-blue nhsuk-u-margin-top-4">
        Projected completion
      </h3>
      <TimelineProjection programme={programme} timeline={timeline} />

      <h3 className="nhsuk-heading-m nhsuk-u-color-blue nhsuk-u-margin-top-4">
        Grade progression
      </h3>
      <GradeTable
        programme={programme}
        rows={computeGradeProgressionForTimeline(programme, timeline)}
      />
    </section>
  );
};
