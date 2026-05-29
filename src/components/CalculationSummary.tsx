import type { FC } from "react";
import dayjs from "dayjs";
import { Table } from "nhsuk-react-components";
import { GradeTable } from "./GradeTable";
import { NextPostSummary } from "./NextPostSummary";
import {
  calendarMonthsFor,
  computeGradeProgression,
  computeWteAccrual,
  findSpecialty,
  getCalculationTypeLabel,
  isOpenProjectedLtftChange,
  programmeAdjustedEndDate,
  programmeOriginalEndDate,
  projectedCompletionDate,
  wtePercentForPastChange,
  wteMonthsFor,
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

export const CalculationSummary: FC<CalculationSummaryProps> = ({
  programme,
  pastChanges,
  proposed,
  variant = "inline"
}) => {
  const sorted = sortByStart(pastChanges);
  const accrual = computeWteAccrual(programme, sorted, proposed.startDate);
  const newCct = projectedCompletionDate(proposed, accrual.monthsRemaining);
  const originalEnd = programmeOriginalEndDate(programme);
  const adjustedEnd = programmeAdjustedEndDate(programme);
  const specialtyMeta = findSpecialty(programme.specialty);
  const startGradeIsOverridden =
    specialtyMeta !== undefined &&
    programme.startGrade !== specialtyMeta.entryGrade;

  const totalPastCalendar = sorted.reduce(
    (sum, c) => sum + calendarMonthsFor(c),
    0
  );
  const totalPastWte = sorted.reduce((sum, c) => sum + wteMonthsFor(c), 0);

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
                <Table.Cell>Projects remaining training?</Table.Cell>
                <Table.Cell>WTE months</Table.Cell>
              </Table.Row>
            </Table.Head>
            <Table.Body>
              {sorted.map(change => (
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
                    {change.projectsRemainingTraining ? "Yes" : "No"}
                  </Table.Cell>
                  <Table.Cell>
                    {isOpenProjectedLtftChange(change)
                      ? "-"
                      : wteMonthsFor(change).toFixed(1)}
                  </Table.Cell>
                </Table.Row>
              ))}
              <Table.Row>
                <Table.Cell>
                  <strong>Totals</strong>
                </Table.Cell>
                <Table.Cell />
                <Table.Cell />
                <Table.Cell>
                  <strong>{totalPastCalendar.toFixed(1)}</strong>
                </Table.Cell>
                <Table.Cell />
                <Table.Cell />
                <Table.Cell />
                <Table.Cell>
                  <strong>{totalPastWte.toFixed(1)}</strong>
                </Table.Cell>
              </Table.Row>
            </Table.Body>
          </Table>
        </div>
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
