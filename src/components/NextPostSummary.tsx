import type { FC } from "react";
import { Table } from "nhsuk-react-components";
import { calculateCct, type PastChange, type ProgrammeDetails } from "../core";
import { formatDate, formatMonths } from "../utils/format";

type NextPostSummaryProps = {
  programme: ProgrammeDetails;
  pastChanges: PastChange[];
};

export const NextPostSummary: FC<NextPostSummaryProps> = ({
  programme,
  pastChanges
}) => {
  const { result } = calculateCct(programme, pastChanges);
  const { projection } = result;

  const trainingRemainingMonths = Math.max(0, projection.wteMonths);
  const calendarMonthsToCompletion = Math.max(0, projection.calendarMonths);

  const proposedWte = Math.round(projection.wte * 100);
  const proposedLabel =
    projection.wte === 1
      ? "Full-time projection (100%)"
      : `LTFT projection (${proposedWte}%)`;

  return (
    <div className="table-wrapper">
      <Table>
        <Table.Head>
          <Table.Row>
            <Table.Cell>Type</Table.Cell>
            <Table.Cell>Projection starts</Table.Cell>
            <Table.Cell>WTE %</Table.Cell>
            <Table.Cell>Training remaining (WTE)</Table.Cell>
            <Table.Cell>Calendar time to completion</Table.Cell>
            <Table.Cell>Projected Completion of Training Date</Table.Cell>
          </Table.Row>
        </Table.Head>
        <Table.Body>
          <Table.Row>
            <Table.Cell>{proposedLabel}</Table.Cell>
            <Table.Cell>{formatDate(projection.startDate)}</Table.Cell>
            <Table.Cell>{proposedWte}%</Table.Cell>
            <Table.Cell>{formatMonths(trainingRemainingMonths)}</Table.Cell>
            <Table.Cell>{formatMonths(calendarMonthsToCompletion)}</Table.Cell>
            <Table.Cell>
              <strong>{formatDate(result.cctDate)}</strong>
            </Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table>
    </div>
  );
};
