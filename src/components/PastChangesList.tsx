import type { FC } from "react";
import dayjs from "dayjs";
import { Table } from "nhsuk-react-components";
import {
  calendarMonthsFor,
  getCalculationTypeLabel,
  wteMonthsFor,
  type PastChange
} from "../core";
import { formatDate, formatPercent } from "../utils/format";

type PastChangesListProps = {
  changes: PastChange[];
  editingId: string | null;
  errorsById: Record<string, string>;
  onRemove: (id: string) => void;
  onEdit: (id: string) => void;
};

const sortByStart = (changes: PastChange[]): PastChange[] =>
  [...changes].sort(
    (a, b) => dayjs(a.startDate).valueOf() - dayjs(b.startDate).valueOf()
  );

export const PastChangesList: FC<PastChangesListProps> = ({
  changes,
  editingId,
  errorsById,
  onRemove,
  onEdit
}) => {
  if (changes.length === 0) {
    return (
      <p className="nhsuk-body">
        No past changes added yet. Use the form above to record any LTFT posts
        or absences before you add your proposed next post details.
      </p>
    );
  }

  const sorted = sortByStart(changes);

  return (
    <div className="table-wrapper">
      <Table>
        <Table.Head>
          <Table.Row>
            <Table.Cell>Type</Table.Cell>
            <Table.Cell>Notes</Table.Cell>
            <Table.Cell>Start</Table.Cell>
            <Table.Cell>End</Table.Cell>
            <Table.Cell>WTE %</Table.Cell>
            <Table.Cell>Calendar months</Table.Cell>
            <Table.Cell>WTE months</Table.Cell>
            <Table.Cell aria-label="Actions" />
          </Table.Row>
        </Table.Head>
        <Table.Body>
          {sorted.map(change => {
            const error = errorsById[change.id];
            const rowStyle = error ? { backgroundColor: "#fdf1f1" } : undefined;
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
                <Table.Cell>{formatDate(change.endDate)}</Table.Cell>
                <Table.Cell>
                  {change.type === "LTFT" ? formatPercent(change.wte) : "0%"}
                </Table.Cell>
                <Table.Cell>{calendarMonthsFor(change).toFixed(1)}</Table.Cell>
                <Table.Cell>{wteMonthsFor(change).toFixed(1)}</Table.Cell>
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
        </Table.Body>
      </Table>
    </div>
  );
};
