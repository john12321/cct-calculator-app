import { useState, type FC } from "react";
import dayjs from "dayjs";
import { Table } from "nhsuk-react-components";
import {
  calendarMonthsFor,
  COMPLETED_PERIOD_DAYS_PER_MONTH,
  getCalculationTypeLabel,
  inferredFullTimePeriods,
  isOpenProjectedLtftChange,
  wtePercentForPastChange,
  wteMonthsFor,
  type InferredFullTimePeriod,
  type PastChange,
  type ProgrammeDetails,
  type ProposedChange
} from "../core";
import { formatDate, formatPercent } from "../utils/format";

type PastChangesListProps = {
  programme: ProgrammeDetails;
  changes: PastChange[];
  projected: ProposedChange;
  editingId: string | null;
  errorsById: Record<string, string>;
  onRemove: (id: string) => void;
  onEdit: (id: string) => void;
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

export const PastChangesList: FC<PastChangesListProps> = ({
  programme,
  changes,
  projected,
  editingId,
  errorsById,
  onRemove,
  onEdit
}) => {
  const [showAssumedPeriods, setShowAssumedPeriods] = useState(false);

  if (changes.length === 0) {
    return (
      <p className="nhsuk-body">
        No completed changes added yet. Use the form above to record any LTFT
        posts or absences. The calculator will project from the programme start
        at 100% WTE until you add changes.
      </p>
    );
  }

  const sorted = sortByStart(changes);
  const assumedPeriods = inferredFullTimePeriods(
    programme,
    changes,
    projected.startDate
  );
  const rows = showAssumedPeriods
    ? sortRows([
        ...sorted.map((change): ChangeRow => ({ kind: "user", change })),
        ...assumedPeriods.map(
          (period): ChangeRow => ({ kind: "assumed", period })
        )
      ])
    : sorted.map((change): ChangeRow => ({ kind: "user", change }));
  const userCalendarMonths = sorted.reduce(
    (sum, change) =>
      sum + (isOpenProjectedLtftChange(change) ? 0 : calendarMonthsFor(change)),
    0
  );
  const userWteMonths = sorted.reduce(
    (sum, change) =>
      sum + (isOpenProjectedLtftChange(change) ? 0 : wteMonthsFor(change)),
    0
  );
  const assumedCalendarMonths = assumedPeriods.reduce(
    (sum, period) =>
      sum +
      (dayjs(period.endDate).diff(dayjs(period.startDate), "day") + 1) /
        COMPLETED_PERIOD_DAYS_PER_MONTH,
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
                const calendarMonths =
                  (dayjs(row.period.endDate).diff(
                    dayjs(row.period.startDate),
                    "day"
                  ) +
                    1) /
                  COMPLETED_PERIOD_DAYS_PER_MONTH;
                return (
                  <Table.Row
                    key={row.period.id}
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

              const change = row.change;
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
                  <Table.Cell>
                    {isOpenProjectedLtftChange(change)
                      ? "-"
                      : calendarMonthsFor(change).toFixed(1)}
                  </Table.Cell>
                  <Table.Cell>
                    {isOpenProjectedLtftChange(change)
                      ? "-"
                      : wteMonthsFor(change).toFixed(1)}
                  </Table.Cell>
                  <Table.Cell>
                    <button
                      type="button"
                      className="nhsuk-button nhsuk-button--secondary"
                      style={{ margin: "0 12px 8px 0" }}
                      onClick={() => onEdit(change.id)}
                      disabled={editingId !== null && editingId !== change.id}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="nhsuk-button nhsuk-button--secondary"
                      style={{ margin: "0 0 8px 0" }}
                      onClick={() => onRemove(change.id)}
                      disabled={editingId !== null}
                    >
                      Remove
                    </button>
                  </Table.Cell>
                </Table.Row>
              );
            })}
            {showAssumedPeriods
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
                )}
          </Table.Body>
        </Table>
      </div>
    </>
  );
};
