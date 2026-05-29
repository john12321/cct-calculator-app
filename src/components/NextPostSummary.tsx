import type { FC } from "react";
import { Table } from "nhsuk-react-components";
import {
  computeWteAccrual,
  projectedCompletionDate,
  type PastChange,
  type ProgrammeDetails,
  type ProposedChange
} from "../core";
import { formatDate } from "../utils/format";

type NextPostSummaryProps = {
  programme: ProgrammeDetails;
  pastChanges: PastChange[];
  proposed: ProposedChange;
};

export const NextPostSummary: FC<NextPostSummaryProps> = ({
  programme,
  pastChanges,
  proposed
}) => {
  const accrual = computeWteAccrual(programme, pastChanges, proposed.startDate);
  const newCct = projectedCompletionDate(proposed, accrual.monthsRemaining);

  const proposedWte =
    proposed.kind === "LTFT" && proposed.wte != null ? proposed.wte : 100;
  const proposedLabel =
    proposed.kind === "FULL_TIME"
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
            <Table.Cell>Projected Completion of Training Date</Table.Cell>
          </Table.Row>
        </Table.Head>
        <Table.Body>
          <Table.Row>
            <Table.Cell>{proposedLabel}</Table.Cell>
            <Table.Cell>{formatDate(proposed.startDate)}</Table.Cell>
            <Table.Cell>{proposedWte}%</Table.Cell>
            <Table.Cell>
              <strong>{formatDate(newCct)}</strong>
            </Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table>
    </div>
  );
};
