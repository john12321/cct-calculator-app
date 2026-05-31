import { type FC } from "react";
import { Table } from "nhsuk-react-components";
import {
  getGradePeriodTagLabel,
  getTrainingPeriodTypeLabel,
  wtePercentForPeriod,
  type TrainingPeriod
} from "../core";
import { formatDate, formatPercent } from "../utils/format";

type TimelineGridProps = {
  periods: TrainingPeriod[];
  onEdit: (id: string) => void;
  onRemove: (id: string) => void;
};

const describeType = (period: TrainingPeriod): string => {
  if (period.type !== "GRADE") {
    return getTrainingPeriodTypeLabel(period.type, "short");
  }
  if (period.gradeTag === "REGULAR") return period.grade;
  return `${period.grade} (${getGradePeriodTagLabel(period.gradeTag)})`;
};

export const TimelineGrid: FC<TimelineGridProps> = ({
  periods,
  onEdit,
  onRemove
}) => {
  if (periods.length === 0) {
    return (
      <p className="nhsuk-body">
        No periods recorded yet. Add the first period (your training start)
        using the form above.
      </p>
    );
  }

  const lastId = periods.at(-1)?.id;

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
            const isLast = period.id === lastId;
            return (
              <Table.Row key={period.id}>
                <Table.Cell>{describeType(period)}</Table.Cell>
                <Table.Cell>{formatDate(period.startDate)}</Table.Cell>
                <Table.Cell>
                  {period.endDate === null
                    ? "Project forward"
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
                      disabled={!isLast}
                      title={
                        isLast
                          ? undefined
                          : "Only the most recent period can be edited. Remove later periods first."
                      }
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="nhsuk-button nhsuk-button--secondary nhsuk-button--small"
                      onClick={() => onRemove(period.id)}
                      disabled={!isLast}
                      title={
                        isLast
                          ? undefined
                          : "Only the most recent period can be removed."
                      }
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
