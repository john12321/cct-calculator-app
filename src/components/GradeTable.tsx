import type { FC } from "react";
import { Table } from "nhsuk-react-components";
import {
  computeGradeProgression,
  findSpecialty,
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

  const specialty = findSpecialty(programme.specialty);
  const twentyFourMonthGrade = specialty?.twentyFourMonthGrade ?? null;
  const hasTwentyFourMonthYear = rows.some(r => r.extendedToTwentyFourMonths);
  const finalGrade = rows.at(-1)?.grade;

  return (
    <>
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
                <Table.Cell>
                  {row.grade}
                  {row.extendedToTwentyFourMonths && (
                    <span
                      className="nhsuk-u-margin-left-2"
                      style={{
                        fontSize: "0.85em",
                        color: "#005eb8",
                        fontWeight: 600
                      }}
                    >
                      (24-month year)
                    </span>
                  )}
                </Table.Cell>
                <Table.Cell>
                  {row.endDate ? formatDate(row.endDate) : "—"}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </div>

      {hasTwentyFourMonthYear && twentyFourMonthGrade && specialty && (
        <div
          className="nhsuk-inset-text nhsuk-u-margin-top-3"
          style={{ borderLeftColor: "#005eb8" }}
        >
          <p className="nhsuk-u-margin-0">
            <strong>Why does {twentyFourMonthGrade} last 24 months?</strong>{" "}
            For <em>{specialty.name}</em>, {twentyFourMonthGrade} is a
            24-month grade rather than the standard 12. Subsequent grade years
            shift accordingly, so the programme finishes at{" "}
            <strong>{finalGrade}</strong> rather than one grade higher, while
            keeping the total length at {programme.lengthMonths} months.
          </p>
        </div>
      )}
    </>
  );
};
