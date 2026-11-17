import { useState, type FC } from "react";
import dayjs from "dayjs";
import { Table } from "nhsuk-react-components";
import {
  calculateCct,
  getCalculationTypeLabel,
  isOpenProjectedLtftChange,
  wtePercentForPastChange,
  type CctAssumedFullTimePeriod,
  type CctCalculatedChange,
  type PastChange,
  type ProgrammeDetails
} from "../core";
import { formatDate, formatPercent } from "../utils/format";

type PastChangesListProps = {
  programme: ProgrammeDetails;
  changes: PastChange[];
  editingId: string | null;
  errorsById: Record<string, string>;
  onRemove: (id: string) => void;
  onEdit: (id: string) => void;
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

export const PastChangesList: FC<PastChangesListProps> = ({
  programme,
  changes,
  editingId,
  errorsById,
  onRemove,
  onEdit
}) => {
  const [showAssumedPeriods, setShowAssumedPeriods] = useState(false);

  const { changes: calculatedChanges, result } = calculateCct(
    programme,
    changes
  );
  const { projection } = result;
  const projectionWte = Math.round(projection.wte * 100);
  const projectionTypeLabel =
    projection.wte === 1 ? "Full-time projection" : "LTFT projection";
  const projectionWteMonths = Math.max(0, projection.wteMonths);
  const projectionCalendarMonths = Math.max(0, projection.calendarMonths);

  const assumedPeriods = result.assumedFullTimePeriods;
  const userRows = calculatedChanges.map(
    (calculated): ChangeRow => ({ kind: "user", calculated })
  );
  const rows = sortRows(
    showAssumedPeriods
      ? [
          ...userRows,
          ...assumedPeriods.map(
            (period): ChangeRow => ({ kind: "assumed", period })
          )
        ]
      : userRows
  );
  const userCalendarMonths = calculatedChanges.reduce(
    (sum, calculated) => sum + (calculated.calendarMonths ?? 0),
    0
  );
  const userWteMonths = calculatedChanges.reduce(
    (sum, calculated) => sum + (calculated.wteMonths ?? 0),
    0
  );
  const assumedCalendarMonths = assumedPeriods.reduce(
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
      <Table.Cell />
      <Table.Cell />
      <Table.Cell />
      <Table.Cell>
        <strong>{calendarMonths.toFixed(1)}</strong>
      </Table.Cell>
      <Table.Cell>
        <strong>{wteMonths.toFixed(1)}</strong>
      </Table.Cell>
      <Table.Cell />
    </Table.Row>
  );

  return (
    <>
      {assumedPeriods.length > 0 && (
        <div className="nhsuk-checkboxes nhsuk-u-margin-bottom-3">
          <div className="nhsuk-checkboxes__item">
            <input
              className="nhsuk-checkboxes__input"
              id="show-assumed-full-time-periods"
              type="checkbox"
              checked={showAssumedPeriods}
              onChange={e => setShowAssumedPeriods(e.target.checked)}
            />
            <label
              className="nhsuk-label nhsuk-checkboxes__label"
              htmlFor="show-assumed-full-time-periods"
            >
              Show assumed full-time periods
            </label>
          </div>
        </div>
      )}

      <div id="past-changes-table" className="table-wrapper">
        <Table>
          <Table.Head>
            <Table.Row>
              <Table.Cell>Type</Table.Cell>
              <Table.Cell>Notes</Table.Cell>
              <Table.Cell>Start</Table.Cell>
              <Table.Cell>End</Table.Cell>
              <Table.Cell>WTE %</Table.Cell>
              <Table.Cell>Counted as training?</Table.Cell>
              <Table.Cell>Calendar months</Table.Cell>
              <Table.Cell>WTE months</Table.Cell>
              <Table.Cell aria-label="Actions" />
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
                    <Table.Cell>Assumed full-time</Table.Cell>
                    <Table.Cell>Not added by user</Table.Cell>
                    <Table.Cell>{formatDate(row.period.startDate)}</Table.Cell>
                    <Table.Cell>{formatDate(row.period.endDate)}</Table.Cell>
                    <Table.Cell>100%</Table.Cell>
                    <Table.Cell>Yes</Table.Cell>
                    <Table.Cell>{calendarMonths.toFixed(1)}</Table.Cell>
                    <Table.Cell>{calendarMonths.toFixed(1)}</Table.Cell>
                    <Table.Cell>Read only</Table.Cell>
                  </Table.Row>
                );
              }

              const { change, calendarMonths, wteMonths } = row.calculated;
              const error = errorsById[change.id];
              const rowStyle = error
                ? { backgroundColor: "#fdf1f1" }
                : undefined;
              return (
                <Table.Row key={change.id} style={rowStyle}>
                  <Table.Cell>
                    {getCalculationTypeLabel(change.type, "short")}
                    {error && (
                      <span
                        className="nhsuk-u-margin-left-2"
                        style={{ color: "#d5281b", fontWeight: 600 }}
                      >
                        ⚠ invalid
                      </span>
                    )}
                  </Table.Cell>
                  <Table.Cell>{change.notes || "—"}</Table.Cell>
                  <Table.Cell>{formatDate(change.startDate)}</Table.Cell>
                  <Table.Cell>
                    {isOpenProjectedLtftChange(change)
                      ? "For remainder of training"
                      : formatDate(change.endDate)}
                  </Table.Cell>
                  <Table.Cell>
                    {formatPercent(wtePercentForPastChange(change) ?? 0)}
                  </Table.Cell>
                  <Table.Cell>
                    {change.countedAsTraining ? "Yes" : "No"}
                  </Table.Cell>
                  <Table.Cell>{formatMonthsCell(calendarMonths)}</Table.Cell>
                  <Table.Cell>{formatMonthsCell(wteMonths)}</Table.Cell>
                  <Table.Cell>
                    <div className="table-actions">
                      <button
                        type="button"
                        className="nhsuk-button nhsuk-button--secondary nhsuk-button--small"
                        onClick={() => onEdit(change.id)}
                        disabled={
                          editingId !== null && editingId !== change.id
                        }
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="nhsuk-button nhsuk-button--secondary nhsuk-button--small"
                        onClick={() => onRemove(change.id)}
                        disabled={editingId !== null}
                      >
                        Remove
                      </button>
                    </div>
                  </Table.Cell>
                </Table.Row>
              );
            })}
            {changes.length > 0 &&
              (showAssumedPeriods
                ? renderTotalsRow(
                    "Total",
                    userCalendarMonths + assumedCalendarMonths,
                    userWteMonths + assumedCalendarMonths
                  )
                : (
                    <>
                      {renderTotalsRow(
                        "Entered changes total",
                        userCalendarMonths,
                        userWteMonths
                      )}
                      {assumedPeriods.length > 0 &&
                        renderTotalsRow(
                          "Including assumed full-time total (hidden)",
                          userCalendarMonths + assumedCalendarMonths,
                          userWteMonths + assumedCalendarMonths
                        )}
                    </>
                  ))}
            <Table.Row className="projection-row">
              <Table.Cell>
                <strong>{projectionTypeLabel}</strong>
              </Table.Cell>
              <Table.Cell>Projects to completion</Table.Cell>
              <Table.Cell>{formatDate(projection.startDate)}</Table.Cell>
              <Table.Cell>
                <strong>{formatDate(result.cctDate)}</strong>
              </Table.Cell>
              <Table.Cell>{projectionWte}%</Table.Cell>
              <Table.Cell>Yes</Table.Cell>
              <Table.Cell>{projectionCalendarMonths.toFixed(1)}</Table.Cell>
              <Table.Cell>{projectionWteMonths.toFixed(1)}</Table.Cell>
              <Table.Cell>Read only</Table.Cell>
            </Table.Row>
            {changes.length > 0 &&
              renderTotalsRow(
                "Total to completion",
                userCalendarMonths +
                  assumedCalendarMonths +
                  projectionCalendarMonths,
                userWteMonths + assumedCalendarMonths + projectionWteMonths
              )}
          </Table.Body>
        </Table>
      </div>
    </>
  );
};
