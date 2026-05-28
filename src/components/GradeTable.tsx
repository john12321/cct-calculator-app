import type { FC } from "react";
import { Table } from "nhsuk-react-components";
import {
  findSpecialty,
  type GradeYear,
  type ProgrammeDetails
} from "../core";
import { formatDate } from "../utils/format";

type GradeTableProps = {
  programme: ProgrammeDetails;
  rows: GradeYear[];
};

export const GradeTable: FC<GradeTableProps> = ({ programme, rows }) => {
  if (rows.length === 0) {
    return null;
  }

  const specialty = findSpecialty(programme.specialty);
  const twentyFourMonthGrade = specialty?.twentyFourMonthGrade ?? null;
  const hasEighteenMonthFinalYear = rows.some(r => r.extendedToEighteenMonths);
  const hasTwentyFourMonthYear = rows.some(r => r.extendedToTwentyFourMonths);
  const hasSkippedGrade = rows.some(r => r.skippedGradeBeforeThisRow !== null);
  const hasBeyondKnownGrade = rows.some(r => r.exceedsKnownTrainingGrade);
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
                  {row.skippedGradeBeforeThisRow && (
                    <span
                      className="nhsuk-u-margin-left-2"
                      style={{
                        fontSize: "0.85em",
                        color: "#005eb8",
                        fontWeight: 600
                      }}
                    >
                      ({row.skippedGradeBeforeThisRow} skipped)
                    </span>
                  )}
                  {row.extendedToEighteenMonths && (
                    <span
                      className="nhsuk-u-margin-left-2"
                      style={{
                        fontSize: "0.85em",
                        color: "#005eb8",
                        fontWeight: 600
                      }}
                    >
                      (18-month final year)
                    </span>
                  )}
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
                  {row.exceedsKnownTrainingGrade && (
                    <span
                      className="nhsuk-u-margin-left-2"
                      style={{
                        fontSize: "0.85em",
                        color: "#005eb8",
                        fontWeight: 600
                      }}
                    >
                      (grade label not automatically assigned)
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

      {hasBeyondKnownGrade && (
        <div
          className="nhsuk-warning-callout nhsuk-u-margin-top-3"
          role="alert"
        >
          <h3 className="nhsuk-warning-callout__label">
            <span role="text">
              <span className="nhsuk-u-visually-hidden">Important: </span>
              Grade progression beyond ST9
            </span>
          </h3>
          <p className="nhsuk-u-margin-0">
            The calculated training timeline extends beyond the highest
            specialty training grade the app assigns automatically. Later rows
            are shown as <strong>Additional training after ST9</strong> rather
            than inventing labels such as ST10. Check the official training
            record or, in Full mode, record confirmed ST9 grade periods where
            applicable.
          </p>
        </div>
      )}

      <div
        className="nhsuk-inset-text nhsuk-u-margin-top-3"
        style={{ borderLeftColor: "#005eb8" }}
      >
        <p className="nhsuk-u-margin-0">
          <strong>About grade end dates:</strong> These dates are calculated
          from the information you enter in this setup section. They may not
          match confirmed end dates in your official training record. Check your
          official training records if you need a confirmed grade end date.
        </p>
      </div>

      {hasEighteenMonthFinalYear && (
        <div
          className="nhsuk-inset-text nhsuk-u-margin-top-3"
          style={{ borderLeftColor: "#005eb8" }}
        >
          <p className="nhsuk-u-margin-0">
            <strong>
              Why does {programme.eighteenMonthFinalGrade} last 18 months?
            </strong>{" "}
            This programme has an 18-month final year recorded for{" "}
            <strong>{programme.eighteenMonthFinalGrade}</strong>. It uses six
            months already included in the standard programme length, so it
            changes the grade progression without itself extending the
            Completion of Training Date.
          </p>
        </div>
      )}

      {hasTwentyFourMonthYear && twentyFourMonthGrade && specialty && (
        <div
          className="nhsuk-inset-text nhsuk-u-margin-top-3"
          style={{ borderLeftColor: "#005eb8" }}
        >
          <p className="nhsuk-u-margin-0">
            <strong>Why does {twentyFourMonthGrade} last 24 months?</strong> For{" "}
            <em>{specialty.name}</em>, {twentyFourMonthGrade} is a 24-month
            grade rather than the standard 12. Subsequent grade years shift
            accordingly, so the programme finishes at{" "}
            <strong>{finalGrade}</strong> rather than one grade higher within
            the standard {programme.lengthMonths}-month programme.
          </p>
        </div>
      )}

      {hasSkippedGrade && (
        <div
          className="nhsuk-inset-text nhsuk-u-margin-top-3"
          style={{ borderLeftColor: "#005eb8" }}
        >
          <p className="nhsuk-u-margin-0">
            <strong>Why is {programme.skippedGrade} not shown?</strong> This
            programme records <strong>{programme.skippedGrade}</strong> as a
            skipped grade year, so the displayed progression moves to the
            following grade from that point. This does not itself shorten the
            Completion of Training Date; any reduced duration is recorded
            separately as accelerated training time.
          </p>
        </div>
      )}
    </>
  );
};
