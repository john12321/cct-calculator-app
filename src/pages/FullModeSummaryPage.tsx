import type { FC } from "react";
import dayjs from "dayjs";
import { CompletionDateWarning } from "../components/CompletionDateWarning";
import { FullModeCalculationSummary } from "../components/FullModeCalculationSummary";
import {
  calendarMonthsForPeriod,
  computeTimelineAccrual,
  getGradePeriodTagLabel,
  getTrainingPeriodTypeLabel,
  programmeAdjustedEndDate,
  projectedCompletionDateForTimeline,
  wtePercentForPeriod,
  wteMonthsForPeriod,
  type ProgrammeDetails,
  type TrainingPeriod
} from "../core";

type FullModeSummaryPageProps = {
  programme: ProgrammeDetails;
  timeline: TrainingPeriod[];
};

const csvEscape = (value: string | number) => {
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replaceAll('"', '""')}"`;
  }
  return str;
};

const describePeriod = (period: TrainingPeriod): string => {
  if (period.type !== "GRADE") {
    return getTrainingPeriodTypeLabel(period.type, "short");
  }
  if (period.gradeTag === "REGULAR") return period.grade;
  return `${period.grade} (${getGradePeriodTagLabel(period.gradeTag)})`;
};

export const FullModeSummaryPage: FC<FullModeSummaryPageProps> = ({
  programme,
  timeline
}) => {
  const accrual = computeTimelineAccrual(programme, timeline);
  const cct = projectedCompletionDateForTimeline(programme, timeline);

  const handleExportCsv = () => {
    const headerLines = [
      ["Specialty", programme.specialty],
      ["Programme start", dayjs(programme.startDate).format("YYYY-MM-DD")],
      ["Programme length (months)", programme.lengthMonths.toFixed(1)],
      ["Start grade", programme.startGrade],
      ...(programme.startGradeOverrideNotes
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
              "Adjusted full-time Completion of Training Date",
              dayjs(programmeAdjustedEndDate(programme)).format("YYYY-MM-DD")
            ]
          ]
        : []),
      [
        "Total WTE months recorded",
        accrual.totalWteMonthsCompleted.toFixed(2)
      ],
      [
        "Training remaining (months)",
        Math.max(0, accrual.monthsRemaining).toFixed(2)
      ],
      [
        "Projected Completion of Training Date",
        cct ? dayjs(cct).format("YYYY-MM-DD") : ""
      ],
      []
    ];

    const timelineHeader = [
      "Grade / period",
      "Grade tag",
      "Start",
      "End",
      "WTE %",
      "Counted as training?",
      "Calendar months",
      "WTE months",
      "Notes"
    ];
    const timelineRows = timeline.map(period => {
      const cal = calendarMonthsForPeriod(period);
      const wteM = wteMonthsForPeriod(period);
      return [
        describePeriod(period),
        period.type === "GRADE" ? period.gradeTag : "",
        dayjs(period.startDate).format("YYYY-MM-DD"),
        period.endDate === null
          ? "Project forward"
          : dayjs(period.endDate).format("YYYY-MM-DD"),
        wtePercentForPeriod(period) !== null
          ? String(wtePercentForPeriod(period))
          : "",
        period.countedAsTraining ? "Yes" : "No",
        cal === null ? "" : cal.toFixed(2),
        wteM === null ? "" : wteM.toFixed(2),
        period.notes
      ];
    });

    const allRows = [...headerLines, timelineHeader, ...timelineRows];
    const csv = allRows.map(row => row.map(csvEscape).join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cct_training_record_${dayjs().format("YYYY-MM-DD_HHmmss")}.csv`;
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
        Training record and Completion of Training Date calculation
      </h2>

      <FullModeCalculationSummary
        programme={programme}
        timeline={timeline}
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
