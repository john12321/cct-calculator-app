import type { FC } from "react";
import dayjs from "dayjs";
import { CalculationSummary } from "../components/CalculationSummary";
import { CompletionDateWarning } from "../components/CompletionDateWarning";
import {
  calendarMonthsFor,
  computeWteAccrual,
  findSpecialty,
  getCalculationTypeLabel,
  programmeAdjustedEndDate,
  projectedCompletionDate,
  wteMonthsFor,
  type PastChange,
  type ProgrammeDetails,
  type ProposedChange
} from "../core";

type SummaryPageProps = {
  programme: ProgrammeDetails;
  pastChanges: PastChange[];
  proposed: ProposedChange;
};

const csvEscape = (value: string | number) => {
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replaceAll('"', '""')}"`;
  }
  return str;
};

export const SummaryPage: FC<SummaryPageProps> = ({
  programme,
  pastChanges,
  proposed
}) => {
  const sorted = [...pastChanges].sort(
    (a, b) => dayjs(a.startDate).valueOf() - dayjs(b.startDate).valueOf()
  );
  const accrual = computeWteAccrual(programme, sorted, proposed.startDate);
  const newCct = projectedCompletionDate(proposed, accrual.monthsRemaining);
  const specialtyMeta = findSpecialty(programme.specialty);
  const startGradeIsOverridden =
    specialtyMeta !== undefined &&
    programme.startGrade !== specialtyMeta.entryGrade;

  const handleExportCsv = () => {
    const proposedWte =
      proposed.kind === "LTFT" && proposed.wte != null ? proposed.wte : 100;

    const headerLines = [
      ["Specialty", programme.specialty],
      ["Programme start", dayjs(programme.startDate).format("YYYY-MM-DD")],
      ["Programme length (months)", programme.lengthMonths.toFixed(1)],
      ["Start grade", programme.startGrade],
      ...(startGradeIsOverridden && programme.startGradeOverrideNotes
        ? [["Start grade override notes", programme.startGradeOverrideNotes]]
        : []),
      ...(programme.additionalMonths > 0
        ? [
            [
              "Additional training time (months)",
              programme.additionalMonths.toFixed(1)
            ],
            ...(programme.additionalMonthsNotes
              ? [["Additional training time notes", programme.additionalMonthsNotes]]
              : [])
          ]
        : []),
      ...(programme.acceleratedMonths > 0
        ? [
            [
              "Accelerated training time (months)",
              programme.acceleratedMonths.toFixed(1)
            ],
            ...(programme.acceleratedMonthsNotes
              ? [
                  [
                    "Accelerated training time notes",
                    programme.acceleratedMonthsNotes
                  ]
                ]
              : [])
          ]
        : []),
      ...(programme.eighteenMonthFinalGrade
        ? [
            ["18-month final year grade", programme.eighteenMonthFinalGrade],
            [
              "18-month final year reason",
              programme.eighteenMonthFinalGradeNotes
            ]
          ]
        : []),
      ...(programme.skippedGrade
        ? [
            ["Skipped grade year", programme.skippedGrade],
            ["Skipped grade year reason", programme.skippedGradeNotes]
          ]
        : []),
      ...(programme.additionalMonths > 0 || programme.acceleratedMonths > 0
        ? [
            [
              "Adjusted full-time CCT date",
              dayjs(programmeAdjustedEndDate(programme)).format("YYYY-MM-DD")
            ]
          ]
        : []),
      [
        "Total WTE completed (months)",
        accrual.totalWteMonthsCompleted.toFixed(2)
      ],
      [
        "Training remaining (months)",
        Math.max(0, accrual.monthsRemaining).toFixed(2)
      ],
      ["Projected completion date", dayjs(newCct).format("YYYY-MM-DD")],
      []
    ];

    const pastHeader = [
      "Section",
      "Type",
      "Notes",
      "Start",
      "End",
      "Calendar months",
      "WTE %",
      "WTE months"
    ];
    const pastRows = sorted.map(c => [
      "Past change",
      getCalculationTypeLabel(c.type, "short"),
      c.notes,
      dayjs(c.startDate).format("YYYY-MM-DD"),
      dayjs(c.endDate).format("YYYY-MM-DD"),
      calendarMonthsFor(c).toFixed(2),
      c.type === "LTFT" && c.wte != null ? `${c.wte}` : "0",
      wteMonthsFor(c).toFixed(2)
    ]);

    const proposedRow = [
      "Next post",
      proposed.kind === "FULL_TIME" ? "Full-time post" : "LTFT post",
      "",
      dayjs(proposed.startDate).format("YYYY-MM-DD"),
      dayjs(newCct).format("YYYY-MM-DD"),
      "",
      String(proposedWte),
      ""
    ];

    const allRows = [...headerLines, pastHeader, ...pastRows, proposedRow];

    const csv = allRows.map(row => row.map(csvEscape).join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cct_summary_${dayjs().format("YYYY-MM-DD_HHmmss")}.csv`;
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => globalThis.print();

  return (
    <>
      <CompletionDateWarning />

      <h2 className="nhsuk-heading-l nhsuk-u-color-blue">
        CCT Calculation Summary
      </h2>

      <CalculationSummary
        programme={programme}
        pastChanges={pastChanges}
        proposed={proposed}
        variant="page"
      />

      <div className="nhsuk-button-group nhsuk-u-margin-top-5 no-print">
        <button
          type="button"
          className="nhsuk-button nhsuk-button--secondary nhsuk-u-margin-right-3"
          onClick={handleExportCsv}
        >
          Export as CSV
        </button>
        <button
          type="button"
          className="nhsuk-button nhsuk-button--secondary"
          onClick={handlePrint}
        >
          Print / save as PDF
        </button>
      </div>
    </>
  );
};
