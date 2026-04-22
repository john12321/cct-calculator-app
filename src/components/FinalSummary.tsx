import type { FC } from "react";
import dayjs from "dayjs";
import { useFormContext } from "react-hook-form";
import { Table } from "nhsuk-react-components";
import { getCalculationTypeLabel } from "../core/calculationTypeLabels";
import type { CalculationChange, CctFormValues } from "./types";

export const FinalSummary: FC = () => {
  const { watch } = useFormContext<CctFormValues>();

  const formatWtePercent = (wte: number) => `${wte}%`;

  const calculationChanges = watch("calculationChanges") || [];
  const cctDate = watch("cctDate");
  const programmeEndDate = watch("programmeEndDate");
  const programmeName = watch("programmeName");
  const programmeStartDate = watch("programmeStartDate");

  const hasWteChanges = calculationChanges.some(
    (change: CalculationChange) => change.type === "LTFT"
  );
  const displayedCompletionDate = dayjs(cctDate).format("DD/MM/YYYY");

  let runningTotal = 0;
  const changesWithCumulative = calculationChanges.map(
    (change: CalculationChange) => {
      runningTotal += change.daysAdded;
      return { ...change, cumulativeDaysAdded: runningTotal };
    }
  );

  const handleExportCSV = () => {
    const headers = [
      "Change Type",
      "Start Date",
      "End Date",
      ...(hasWteChanges ? ["LTFT % for period"] : []),
      "CCT Days Added (this change)",
      "Total CCT Days Added",
      "New CCT Date"
    ];

    const rows = changesWithCumulative.map(
      (change: CalculationChange & { cumulativeDaysAdded: number }) => {
        const row = [
          getCalculationTypeLabel(change.type, "short"),
          dayjs(change.changeDate).format("DD/MM/YYYY"),
          change.untilEndOfProgramme
            ? dayjs(programmeEndDate).format("DD/MM/YYYY")
            : dayjs(change.endDate).format("DD/MM/YYYY"),
          ...(hasWteChanges
            ? [
                change.type === "LTFT" && change.endWte !== undefined
                  ? formatWtePercent(change.endWte)
                  : "-"
              ]
            : []),
          change.daysAdded > 0 ? `+${change.daysAdded}` : change.daysAdded,
          change.cumulativeDaysAdded > 0
            ? `+${change.cumulativeDaysAdded}`
            : change.cumulativeDaysAdded,
          dayjs(change.resultingCctDate).format("DD/MM/YYYY")
        ];
        return row.map(val => `"${val}"`).join(",");
      }
    );

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `cct_calculation_summary_${dayjs().format("YYYY-MM-DD_HHmmss")}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <dl className="nhsuk-summary-list">
        <div className="nhsuk-summary-list__row">
          <dt className="nhsuk-summary-list__key">Programme</dt>
          <dd className="nhsuk-summary-list__value">
            {programmeName || "Unnamed programme"}
          </dd>
        </div>

        <div className="nhsuk-summary-list__row">
          <dt className="nhsuk-summary-list__key">Original Programme Dates</dt>
          <dd className="nhsuk-summary-list__value">
            {dayjs(programmeStartDate).format("DD/MM/YYYY")} to{" "}
            {dayjs(programmeEndDate).format("DD/MM/YYYY")}
          </dd>
        </div>
        <div className="nhsuk-summary-list__row">
          <dt className="nhsuk-summary-list__key">Original CCT Date</dt>
          <dd className="nhsuk-summary-list__value">
            {dayjs(programmeEndDate).format("DD/MM/YYYY")}
          </dd>
        </div>
        <div className="nhsuk-summary-list__row">
          <dt className="nhsuk-summary-list__key">New CCT Date</dt>
          <dd className="nhsuk-summary-list__value">
            {displayedCompletionDate}
          </dd>
        </div>
        <p>The new CCT Date is indicative and will be confirmed at ARCP.</p>
      </dl>
      <div className="table-wrapper">
        <Table>
          <Table.Head>
            <Table.Row>
              <Table.Cell>Change Type</Table.Cell>
              <Table.Cell>Start Date</Table.Cell>
              <Table.Cell>End Date</Table.Cell>
              {hasWteChanges && <Table.Cell>LTFT % for period</Table.Cell>}
              <Table.Cell>CCT Days Added (this change)</Table.Cell>
              <Table.Cell>Total CCT Days Added</Table.Cell>
              <Table.Cell>New CCT Date</Table.Cell>
            </Table.Row>
          </Table.Head>
          <Table.Body>
            {changesWithCumulative.map(
              (change: CalculationChange & { cumulativeDaysAdded: number }) => (
                <Table.Row key={change.id}>
                  <Table.Cell>
                    {getCalculationTypeLabel(change.type, "short")}
                  </Table.Cell>
                  <Table.Cell>
                    {dayjs(change.changeDate).format("DD/MM/YYYY")}
                  </Table.Cell>
                  <Table.Cell>
                    {change.untilEndOfProgramme
                      ? dayjs(programmeEndDate).format("DD/MM/YYYY")
                      : dayjs(change.endDate).format("DD/MM/YYYY")}
                  </Table.Cell>
                  {hasWteChanges && (
                    <Table.Cell>
                      {change.type === "LTFT" && change.endWte !== undefined
                        ? formatWtePercent(change.endWte)
                        : "-"}
                    </Table.Cell>
                  )}
                  <Table.Cell>
                    {change.daysAdded > 0
                      ? `+${change.daysAdded}`
                      : change.daysAdded}
                  </Table.Cell>
                  <Table.Cell>
                    {change.cumulativeDaysAdded > 0
                      ? `+${change.cumulativeDaysAdded}`
                      : change.cumulativeDaysAdded}
                  </Table.Cell>
                  <Table.Cell>
                    {dayjs(change.resultingCctDate).format("DD/MM/YYYY")}
                  </Table.Cell>
                </Table.Row>
              )
            )}
          </Table.Body>
        </Table>
      </div>

      <div className="nhsuk-u-margin-top-5 nhsuk-u-text-align-center no-print">
        <button
          type="button"
          className="nhsuk-button nhsuk-button--secondary nhsuk-u-margin-right-3"
          onClick={handleExportCSV}
        >
          Export table contents
        </button>
        <button
          type="button"
          className="nhsuk-button nhsuk-button--secondary"
          onClick={handlePrint}
        >
          Print PDF
        </button>
      </div>
    </>
  );
};
