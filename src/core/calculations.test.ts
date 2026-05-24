import dayjs from "dayjs";
import { describe, expect, it } from "vitest";
import type {
  PastChange,
  ProgrammeDetails,
  ProposedChange
} from "./calculationTypes";
import {
  DAYS_PER_MONTH,
  computeWteAccrual,
  inclusiveDays,
  projectedCompletionDate
} from "./calculations";
import { computeGradeProgression } from "./grades";

const longProgramme: ProgrammeDetails = {
  specialty: "Long comparison programme",
  startDate: "2018-01-01",
  lengthMonths: 120,
  additionalMonths: 0,
  additionalMonthsNotes: "",
  acceleratedMonths: 0,
  acceleratedMonthsNotes: "",
  eighteenMonthFinalGrade: "",
  eighteenMonthFinalGradeNotes: "",
  skippedGrade: "",
  skippedGradeNotes: "",
  startGrade: "ST1",
  startGradeOverrideNotes: ""
};

const nextPostStart = "2024-01-01";

const legacyProjectedCompletionDate = (
  changes: PastChange[],
  proposed: ProposedChange
): string => {
  const totalHistoricalMonths =
    dayjs(proposed.startDate).diff(dayjs(longProgramme.startDate), "day") /
    DAYS_PER_MONTH;
  const changedCalendarMonths = changes.reduce(
    (sum, change) =>
      sum + inclusiveDays(change.startDate, change.endDate) / DAYS_PER_MONTH,
    0
  );
  const changedWteMonths = changes.reduce((sum, change) => {
    const fraction =
      change.type === "LTFT" && change.wte !== null ? change.wte / 100 : 0;
    return (
      sum +
      (inclusiveDays(change.startDate, change.endDate) / DAYS_PER_MONTH) *
        fraction
    );
  }, 0);
  const completedMonths =
    totalHistoricalMonths - changedCalendarMonths + changedWteMonths;
  return projectedCompletionDate(
    proposed,
    longProgramme.lengthMonths - completedMonths
  );
};

describe("Excel historical period convention", () => {
  it("uses 365 / 12 for a long LTFT history while retaining 30.4 projection", () => {
    const changes: PastChange[] = [
      {
        id: "ltft-five-years",
        type: "LTFT",
        startDate: "2018-01-01",
        endDate: "2022-12-31",
        wte: 50,
        notes: ""
      }
    ];
    const proposed: ProposedChange = {
      kind: "FULL_TIME",
      startDate: nextPostStart,
      wte: null
    };
    const accrual = computeWteAccrual(
      longProgramme,
      changes,
      proposed.startDate
    );
    const projectedDate = projectedCompletionDate(
      proposed,
      accrual.monthsRemaining
    );

    expect(accrual.totalWteMonthsCompleted).toBeCloseTo(42.0164383562, 9);
    expect(projectedDate).toBe("2030-06-29");
    expect(legacyProjectedCompletionDate(changes, proposed)).toBe(
      "2030-06-28"
    );

    const gradeRows = computeGradeProgression(longProgramme, changes, proposed);
    expect(gradeRows[3]?.endDate).toBe("2024-06-30");
  });

  it("uses 365 / 12 for full-time accrual around a long absence history", () => {
    const changes: PastChange[] = [
      {
        id: "absence-three-years",
        type: "OOPC",
        startDate: "2020-01-01",
        endDate: "2022-12-31",
        wte: null,
        notes: ""
      }
    ];
    const proposed: ProposedChange = {
      kind: "LTFT",
      startDate: nextPostStart,
      wte: 50
    };
    const accrual = computeWteAccrual(
      longProgramme,
      changes,
      proposed.startDate
    );
    const projectedDate = projectedCompletionDate(
      proposed,
      accrual.monthsRemaining
    );

    expect(accrual.totalWteMonthsCompleted).toBeCloseTo(36, 9);
    expect(projectedDate).toBe("2037-12-25");
    expect(legacyProjectedCompletionDate(changes, proposed)).toBe(
      "2037-12-24"
    );
  });
});
