import { type FC } from "react";
import { Table } from "nhsuk-react-components";
import {
  describeTrainingPeriod,
  wtePercentForPeriod,
  type TrainingPeriod
} from "../core";
import { formatDate, formatPercent } from "../utils/format";
import { timelineRowId } from "../utils/scroll";

type TimelineGridProps = {
  periods: TrainingPeriod[];
  // Note: period id -> error message, for failing rows.
  rowErrors?: Record<string, string>;
  onEdit: (id: string) => void;
  onRemove: (id: string) => void;
};

export const TimelineGrid: FC<TimelineGridProps> = ({
  periods,
  rowErrors = {},
  onEdit,
  onRemove
}) => {
  if (periods.length === 0) {
    return (
      <p className="nhsuk-body">
        No periods recorded yet. Use the "Add period" button below to record
        your first period (your training start).
      </p>
    );
  }

  return (
    <div id="timeline-table" className="table-wrapper">
      <Table>
        <Table.Head>
          <Table.Row>
            <Table.Cell>Grade / period</Table.Cell>
            <Table.Cell>Start</Table.Cell>
            <Table.Cell>End</Table.Cell>
            <Table.Cell>WTE %</Table.Cell>
            <Table.Cell>Counted as training?</Table.Cell>
            <Table.Cell>Notes</Table.Cell>
            <Table.Cell aria-label="Actions" />
          </Table.Row>
        </Table.Head>
        <Table.Body>
          {periods.map(period => {
            const rowError = rowErrors[period.id];
            return (
              <Table.Row
                key={period.id}
                id={timelineRowId(period.id)}
                className={rowError ? "timeline-row--error" : undefined}
              >
                <Table.Cell>
                  {rowError && (
                    <span
                      className="timeline-row__error-icon"
                      role="img"
                      aria-label="Has a validation issue"
                      title={rowError}
                    >
                      ⚠
                    </span>
                  )}
                  {describeTrainingPeriod(period)}
                </Table.Cell>
                <Table.Cell>{formatDate(period.startDate)}</Table.Cell>
                <Table.Cell>
                  {period.endDate === null
                    ? "For remainder of training"
                    : formatDate(period.endDate)}
                </Table.Cell>
                <Table.Cell>
                  {wtePercentForPeriod(period) !== null
                    ? formatPercent(wtePercentForPeriod(period) ?? 0)
                    : "—"}
                </Table.Cell>
                <Table.Cell>
                  {period.countedAsTraining ? "Yes" : "No"}
                </Table.Cell>
                <Table.Cell>{period.notes || "—"}</Table.Cell>
                <Table.Cell>
                  <div className="table-actions">
                    <button
                      type="button"
                      className="nhsuk-button nhsuk-button--secondary nhsuk-button--small"
                      onClick={() => onEdit(period.id)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="nhsuk-button nhsuk-button--secondary nhsuk-button--small"
                      onClick={() => onRemove(period.id)}
                    >
                      Remove
                    </button>
                  </div>
                </Table.Cell>
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table>
    </div>
  );
};
