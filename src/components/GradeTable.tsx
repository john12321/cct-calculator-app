import type { FC } from "react";
import { Table } from "nhsuk-react-components";
import {
  computeGradeProgression,
  type PastChange,
  type ProgrammeDetails,
  type ProposedChange
} from "../core";
import { formatDate } from "../utils/format";

type GradeTableProps = {
  programme: ProgrammeDetails;
  pastChanges: PastChange[];
  proposed: ProposedChange | null;
};

export const GradeTable: FC<GradeTableProps> = ({
  programme,
  pastChanges,
  proposed
}) => {
  const rows = computeGradeProgression(programme, pastChanges, proposed);

  if (rows.length === 0) {
    return null;
  }

  return (
    <div className="table-wrapper">
      <Table>
        <Table.Head>
          <Table.Row>
            <Table.Cell>Training year</Table.Cell>
            <Table.Cell>Grade</Table.Cell>
            <Table.Cell>Grade end date</Table.Cell>
          </Table.Row>
        </Table.Head>
        <Table.Body>
          {rows.map(row => (
            <Table.Row key={row.yearNumber}>
              <Table.Cell>Year {row.yearNumber}</Table.Cell>
              <Table.Cell>{row.grade}</Table.Cell>
              <Table.Cell>
                {row.endDate ? formatDate(row.endDate) : "—"}
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </div>
  );
};
