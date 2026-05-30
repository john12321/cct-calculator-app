import { useState, type FC } from "react";
import dayjs from "dayjs";
import { Table } from "nhsuk-react-components";
import { GradeTable } from "./GradeTable";
import { NextPostSummary } from "./NextPostSummary";
import {
  calendarMonthsFor,
  COMPLETED_PERIOD_DAYS_PER_MONTH,
  computeGradeProgression,
  computeWteAccrual,
  findSpecialty,
  getCalculationTypeLabel,
  inferredFullTimePeriods,
  isOpenProjectedLtftChange,
  programmeAdjustedEndDate,
  programmeOriginalEndDate,
  projectedCompletionDate,
  inclusiveDays,
  wtePercentForPastChange,
  wteMonthsFor,
  type InferredFullTimePeriod,
  type PastChange,
  type ProgrammeDetails,
  type ProposedChange
} from "../core";
import { formatDate, formatMonths, formatPercent } from "../utils/format";

type CalculationSummaryProps = {
  programme: ProgrammeDetails;
  pastChanges: PastChange[];
  proposed: ProposedChange;
  variant?: "inline" | "page";
};

const sortByStart = (changes: PastChange[]): PastChange[] =>
  [...changes].sort(
    (a, b) => dayjs(a.startDate).valueOf() - dayjs(b.startDate).valueOf()
  );

type ChangeRow =
  | { kind: "user"; change: PastChange }
  | { kind: "assumed"; period: InferredFullTimePeriod };

const sortRows = (rows: ChangeRow[]): ChangeRow[] =>
  [...rows].sort((a, b) => {
    const startA =
      a.kind === "user" ? a.change.startDate : a.period.startDate;
    const startB =
      b.kind === "user" ? b.change.startDate : b.period.startDate;
    return dayjs(startA).valueOf() - dayjs(startB).valueOf();
  });

const assumedMonthsFor = (period: InferredFullTimePeriod): number =>
  inclusiveDays(period.startDate, period.endDate) /
  COMPLETED_PERIOD_DAYS_PER_MONTH;

export const CalculationSummary: FC<CalculationSummaryProps> = ({
  programme,
  pastChanges,
  proposed,
  variant = "inline"
}) => {
  const [showAssumedPeriods, setShowAssumedPeriods] = useState(false);
  const sorted = sortByStart(pastChanges);
  const accrual = computeWteAccrual(programme, sorted, proposed.startDate);
  const newCct = projectedCompletionDate(proposed, accrual.monthsRemaining);
  const originalEnd = programmeOriginalEndDate(programme);
  const adjustedEnd = programmeAdjustedEndDate(programme);
  const specialtyMeta = findSpecialty(programme.specialty);
  const startGradeIsOverridden =
    specialtyMeta !== undefined &&
    programme.startGrade !== specialtyMeta.entryGrade;

  const assumedPeriods = inferredFullTimePeriods(
    programme,
    sorted,
    proposed.startDate
  );
  const rows = showAssumedPeriods
    ? sortRows([
        ...sorted.map((change): ChangeRow => ({ kind: "user", change })),
        ...assumedPeriods.map(
          (period): ChangeRow => ({ kind: "assumed", period })
        )
      ])
    : sorted.map((change): ChangeRow => ({ kind: "user", change }));
  const totalUserCalendar = sorted.reduce(
    (sum, change) =>
      sum + (isOpenProjectedLtftChange(change) ? 0 : calendarMonthsFor(change)),
    0
  );
  const totalUserWte = sorted.reduce(
    (sum, change) =>
      sum + (isOpenProjectedLtftChange(change) ? 0 : wteMonthsFor(change)),
    0
  );
  const totalAssumedCalendar = assumedPeriods.reduce(
    (sum, period) => sum + assumedMonthsFor(period),
    0
  );
  const renderTotalsRow = (
    label: string,
    calendarMonths: number,
    wteMonths: number
  ) => (
    <Table.Row className="changes-total-row">
      <Table.Cell>
        <strong>{label}</strong>
      </Table.Cell>
      <Table.Cell />
      <Table.Cell />
      <Table.Cell>
        <strong>{calendarMonths.toFixed(1)}</strong>
      </Table.Cell>
      <Table.Cell />
      <Table.Cell />
      <Table.Cell>
        <strong>{wteMonths.toFixed(1)}</strong>
      </Table.Cell>
    </Table.Row>
  );

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
          <dt className="nhsuk-summary-list__key">
            Original Completion of Training Date
          </dt>
          <dd className="nhsuk-summary-list__value">
            {formatDate(originalEnd)}
          </dd>
        </div>
        {(programme.additionalMonths > 0 ||
          programme.acceleratedMonths > 0) && (
          <div className="nhsuk-summary-list__row">
            <dt className="nhsuk-summary-list__key">
              Adjusted full-time Completion of Training Date
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
          <dt className="nhsuk-summary-list__key">
            Total WTE completed (up to projection start)
          </dt>
          <dd className="nhsuk-summary-list__value">
            {formatMonths(accrual.totalWteMonthsCompleted)}
          </dd>
        </div>
        <div className="nhsuk-summary-list__row">
          <dt className="nhsuk-summary-list__key">Training remaining</dt>
          <dd className="nhsuk-summary-list__value">
            {formatMonths(Math.max(0, accrual.monthsRemaining))}
          </dd>
        </div>
        <div className="nhsuk-summary-list__row">
          <dt className="nhsuk-summary-list__key">
            Projected Completion of Training Date
          </dt>
          <dd className="nhsuk-summary-list__value">
            <strong>{formatDate(newCct)}</strong>
          </dd>
        </div>
      </dl>

      <h3 className="nhsuk-heading-m nhsuk-u-color-blue">
        Completed changes
      </h3>
      {sorted.length === 0 ? (
        <p className="nhsuk-body-s">No completed changes recorded.</p>
      ) : (
        <>
          {assumedPeriods.length > 0 && (
            <div className="nhsuk-checkboxes nhsuk-u-margin-bottom-3">
              <div className="nhsuk-checkboxes__item">
                <input
                  className="nhsuk-checkboxes__input"
                  id="summary-show-assumed-full-time-periods"
                  type="checkbox"
                  checked={showAssumedPeriods}
                  onChange={e => setShowAssumedPeriods(e.target.checked)}
                />
                <label
                  className="nhsuk-label nhsuk-checkboxes__label"
                  htmlFor="summary-show-assumed-full-time-periods"
                >
                  Show assumed full-time periods
                </label>
              </div>
            </div>
          )}

          <div className="table-wrapper">
            <Table>
              <Table.Head>
                <Table.Row>
                  <Table.Cell>Type</Table.Cell>
                  <Table.Cell>Start</Table.Cell>
                  <Table.Cell>End</Table.Cell>
                  <Table.Cell>Calendar months</Table.Cell>
                  <Table.Cell>WTE %</Table.Cell>
                  <Table.Cell>Counted as training?</Table.Cell>
                  <Table.Cell>WTE months</Table.Cell>
                </Table.Row>
              </Table.Head>
              <Table.Body>
                {rows.map(row => {
                  if (row.kind === "assumed") {
                    const calendarMonths = assumedMonthsFor(row.period);
                    return (
                      <Table.Row
                        key={row.period.id}
                        className="assumed-full-time-row"
                      >
                        <Table.Cell>
                          <strong>Assumed full-time</strong>
                          <div className="nhsuk-hint nhsuk-u-margin-top-1">
                            Not added by user
                          </div>
                        </Table.Cell>
                        <Table.Cell>
                          {formatDate(row.period.startDate)}
                        </Table.Cell>
                        <Table.Cell>{formatDate(row.period.endDate)}</Table.Cell>
                        <Table.Cell>{calendarMonths.toFixed(1)}</Table.Cell>
                        <Table.Cell>100%</Table.Cell>
                        <Table.Cell>Yes</Table.Cell>
                        <Table.Cell>{calendarMonths.toFixed(1)}</Table.Cell>
                      </Table.Row>
                    );
                  }

                  const change = row.change;
                  return (
                    <Table.Row key={change.id}>
                      <Table.Cell>
                        {getCalculationTypeLabel(change.type, "short")}
                        {change.notes ? ` — ${change.notes}` : ""}
                      </Table.Cell>
                      <Table.Cell>{formatDate(change.startDate)}</Table.Cell>
                      <Table.Cell>
                        {isOpenProjectedLtftChange(change)
                          ? "For remainder of training"
                          : formatDate(change.endDate)}
                      </Table.Cell>
                      <Table.Cell>
                        {isOpenProjectedLtftChange(change)
                          ? "-"
                          : calendarMonthsFor(change).toFixed(1)}
                      </Table.Cell>
                      <Table.Cell>
                        {formatPercent(wtePercentForPastChange(change) ?? 0)}
                      </Table.Cell>
                      <Table.Cell>
                        {change.countedAsTraining ? "Yes" : "No"}
                      </Table.Cell>
                      <Table.Cell>
                        {isOpenProjectedLtftChange(change)
                          ? "-"
                          : wteMonthsFor(change).toFixed(1)}
                      </Table.Cell>
                    </Table.Row>
                  );
                })}
                {showAssumedPeriods
                  ? renderTotalsRow(
                      "Total",
                      totalUserCalendar + totalAssumedCalendar,
                      totalUserWte + totalAssumedCalendar
                    )
                  : (
                      <>
                        {renderTotalsRow(
                          "Entered changes total",
                          totalUserCalendar,
                          totalUserWte
                        )}
                        {assumedPeriods.length > 0 &&
                          renderTotalsRow(
                            "Including assumed full-time total (hidden)",
                            totalUserCalendar + totalAssumedCalendar,
                            totalUserWte + totalAssumedCalendar
                          )}
                      </>
                    )}
              </Table.Body>
            </Table>
          </div>
        </>
      )}

      <h3 className="nhsuk-heading-m nhsuk-u-color-blue nhsuk-u-margin-top-4">
        Projection
      </h3>
      <NextPostSummary
        programme={programme}
        pastChanges={pastChanges}
        proposed={proposed}
      />
      <h3 className="nhsuk-heading-m nhsuk-u-color-blue nhsuk-u-margin-top-4">
        Grade progression
      </h3>
      <GradeTable
        programme={programme}
        rows={computeGradeProgression(programme, pastChanges, proposed)}
      />
    </section>
  );
};
