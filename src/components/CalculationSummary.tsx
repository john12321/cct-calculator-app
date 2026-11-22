import { useState, type FC } from "react";
import dayjs from "dayjs";
import { Table } from "nhsuk-react-components";
import { GradeTrainingTimeSummaryRow } from "./GradeTrainingTimeSummaryRow";
import { ACCELERATED_TIME, ADDITIONAL_TIME } from "./gradeTrainingTimeKinds";
import { GradeTable } from "./GradeTable";
import { NextPostSummary } from "./NextPostSummary";
import {
  calculateCct,
  computeGradeProgression,
  findSpecialty,
  getCalculationTypeLabel,
  isOpenProjectedLtftChange,
  wtePercentForPastChange,
  type CctAssumedFullTimePeriod,
  type CctCalculatedChange,
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

type ChangeRow =
  | { kind: "user"; calculated: CctCalculatedChange }
  | { kind: "assumed"; period: CctAssumedFullTimePeriod };

const rowStart = (row: ChangeRow): string =>
  row.kind === "user" ? row.calculated.change.startDate : row.period.startDate;

const sortRows = (rows: ChangeRow[]): ChangeRow[] =>
  [...rows].sort(
    (a, b) => dayjs(rowStart(a)).valueOf() - dayjs(rowStart(b)).valueOf()
  );

const formatMonthsCell = (months: number | null): string =>
  months === null ? "-" : months.toFixed(1);

export const CalculationSummary: FC<CalculationSummaryProps> = ({
  programme,
  pastChanges,
  proposed,
  variant = "inline"
}) => {
  const [hideAssumedPeriods, setHideAssumedPeriods] = useState(false);
  const { changes: calculatedChanges, result } = calculateCct(
    programme,
    pastChanges
  );
  const specialtyMeta = findSpecialty(programme.specialty);
  const lengthIsOverridden =
    specialtyMeta !== undefined &&
    programme.lengthMonths !== specialtyMeta.lengthMonths;
  const startGradeIsOverridden =
    specialtyMeta !== undefined &&
    programme.startGrade !== specialtyMeta.entryGrade;

  const assumedPeriods = result.assumedFullTimePeriods;
  const userRows = calculatedChanges.map(
    (calculated): ChangeRow => ({ kind: "user", calculated })
  );
  const rows = sortRows(
    hideAssumedPeriods
      ? userRows
      : [
          ...userRows,
          ...assumedPeriods.map(
            (period): ChangeRow => ({ kind: "assumed", period })
          )
        ]
  );
  const totalUserCalendar = calculatedChanges.reduce(
    (sum, calculated) => sum + (calculated.calendarMonths ?? 0),
    0
  );
  const totalUserWte = calculatedChanges.reduce(
    (sum, calculated) => sum + (calculated.wteMonths ?? 0),
    0
  );
  const totalAssumedCalendar = assumedPeriods.reduce(
    (sum, period) => sum + period.months,
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
            {programme.lengthMonths} months
            {lengthIsOverridden && (
              <span className="nhsuk-hint nhsuk-u-margin-left-2">
                (default for this specialty is {specialtyMeta?.lengthMonths} months)
              </span>
            )}
            {lengthIsOverridden && programme.lengthOverrideNotes && (
              <div className="nhsuk-hint nhsuk-u-margin-top-1">
                {programme.lengthOverrideNotes}
              </div>
            )}
          </dd>
        </div>
        <GradeTrainingTimeSummaryRow
          kind={ADDITIONAL_TIME}
          programme={programme}
        />
        <GradeTrainingTimeSummaryRow
          kind={ACCELERATED_TIME}
          programme={programme}
        />
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
                (default for this specialty is {specialtyMeta?.entryGrade})
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
            {formatDate(result.originalProgrammeEndDate)}
          </dd>
        </div>
        {(programme.additionalTrainingTime.length > 0 ||
          programme.acceleratedTrainingTime.length > 0) && (
          <div className="nhsuk-summary-list__row">
            <dt className="nhsuk-summary-list__key">
              Adjusted programme end date before changes
            </dt>
            <dd className="nhsuk-summary-list__value">
              {formatDate(result.adjustedProgrammeEndDate)}
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
            {formatMonths(result.totalWteMonthsCompleted)}
          </dd>
        </div>
        <div className="nhsuk-summary-list__row">
          <dt className="nhsuk-summary-list__key">Training remaining</dt>
          <dd className="nhsuk-summary-list__value">
            {formatMonths(Math.max(0, result.monthsRemaining))}
          </dd>
        </div>
        <div className="nhsuk-summary-list__row">
          <dt className="nhsuk-summary-list__key">
            Projected Completion of Training Date
          </dt>
          <dd className="nhsuk-summary-list__value">
            <strong>{formatDate(result.cctDate)}</strong>
          </dd>
        </div>
      </dl>

      <h3 className="nhsuk-heading-m nhsuk-u-color-blue">
        Grade progression
      </h3>
      <GradeTable
        programme={programme}
        rows={computeGradeProgression(programme, pastChanges, proposed)}
      />

      <h3 className="nhsuk-heading-m nhsuk-u-color-blue nhsuk-u-margin-top-4">
        Completed changes
      </h3>
      {calculatedChanges.length === 0 ? (
        <p className="nhsuk-body-s">No completed changes recorded.</p>
      ) : (
        <>
          {assumedPeriods.length > 0 && (
            <div className="nhsuk-checkboxes nhsuk-u-margin-bottom-3">
              <div className="nhsuk-checkboxes__item">
                <input
                  className="nhsuk-checkboxes__input"
                  id="summary-hide-assumed-full-time-periods"
                  type="checkbox"
                  checked={hideAssumedPeriods}
                  onChange={e => setHideAssumedPeriods(e.target.checked)}
                />
                <label
                  className="nhsuk-label nhsuk-checkboxes__label"
                  htmlFor="summary-hide-assumed-full-time-periods"
                >
                  Hide assumed full-time periods
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
                    const calendarMonths = row.period.months;
                    return (
                      <Table.Row
                        key={`assumed-${row.period.startDate}`}
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

                  const { change, calendarMonths, wteMonths } =
                    row.calculated;
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
                        {formatMonthsCell(calendarMonths)}
                      </Table.Cell>
                      <Table.Cell>
                        {formatPercent(wtePercentForPastChange(change) ?? 0)}
                      </Table.Cell>
                      <Table.Cell>
                        {change.countedAsTraining ? "Yes" : "No"}
                      </Table.Cell>
                      <Table.Cell>{formatMonthsCell(wteMonths)}</Table.Cell>
                    </Table.Row>
                  );
                })}
                {hideAssumedPeriods
                  ? (
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
                    )
                  : renderTotalsRow(
                      "Total",
                      totalUserCalendar + totalAssumedCalendar,
                      totalUserWte + totalAssumedCalendar
                    )}
              </Table.Body>
            </Table>
          </div>
        </>
      )}

      <h3 className="nhsuk-heading-m nhsuk-u-color-blue nhsuk-u-margin-top-4">
        Projection
      </h3>
      <NextPostSummary programme={programme} pastChanges={pastChanges} />
    </section>
  );
};
