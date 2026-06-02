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
  deriveQuickProjection,
  inferredFullTimePeriods,
  inclusiveDays,
  projectedCompletionDate,
  wteMonthsFor
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
        countedAsTraining: true,
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
    expect(projectedDate).toBe("2030-06-28");
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
        countedAsTraining: false,
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

describe("Quick-mode approved OOP credit", () => {
  it("credits OOPT at fixed 100% when it is counted as training", () => {
    const oopt: PastChange = {
      id: "oopt",
      type: "OOPT",
      startDate: "2020-01-01",
      endDate: "2020-06-30",
      wte: null,
      countedAsTraining: true,
      notes: ""
    };

    expect(wteMonthsFor(oopt)).toBeCloseTo(6, 1);
    expect(wteMonthsFor({ ...oopt, countedAsTraining: false })).toBe(0);
  });

  it("credits approved OOPR at the entered approved percentage", () => {
    const oopr: PastChange = {
      id: "oopr",
      type: "OOPR",
      startDate: "2020-01-01",
      endDate: "2020-06-30",
      wte: 80,
      countedAsTraining: true,
      notes: ""
    };

    expect(wteMonthsFor(oopr)).toBeCloseTo(4.8, 1);
  });
});

describe("Quick-mode derived projection", () => {
  it("projects full-time from programme start when no changes are recorded", () => {
    expect(deriveQuickProjection(longProgramme, [])).toEqual({
      kind: "FULL_TIME",
      startDate: longProgramme.startDate,
      wte: null
    });
  });

  it("projects full-time from the day after the latest change by default", () => {
    expect(
      deriveQuickProjection(longProgramme, [
        {
          id: "ltft",
          type: "LTFT",
          startDate: "2020-01-01",
          endDate: "2020-06-30",
          wte: 80,
          countedAsTraining: true,
          notes: ""
        }
      ])
    ).toEqual({
      kind: "FULL_TIME",
      startDate: "2020-07-01",
      wte: null
    });
  });

  it("uses the selected LTFT WTE for the remaining-time projection", () => {
    expect(
      deriveQuickProjection(longProgramme, [
        {
          id: "ltft",
          type: "LTFT",
          startDate: "2020-01-01",
          endDate: "2020-06-30",
          wte: 60,
          countedAsTraining: true,
          notes: "",
          projectsRemainingTraining: true
        }
      ])
    ).toEqual({
      kind: "LTFT",
      startDate: "2020-07-01",
      wte: 60
    });
  });

  it("uses an open-ended projected LTFT start date as the projection start", () => {
    const changes: PastChange[] = [
      {
        id: "absence",
        type: "OOPC",
        startDate: "2020-01-01",
        endDate: "2020-06-30",
        wte: null,
        countedAsTraining: false,
        notes: ""
      },
      {
        id: "projected-ltft",
        type: "LTFT",
        startDate: "2020-07-01",
        endDate: "",
        wte: 60,
        countedAsTraining: true,
        notes: "",
        projectsRemainingTraining: true
      }
    ];

    expect(deriveQuickProjection(longProgramme, changes)).toEqual({
      kind: "LTFT",
      startDate: "2020-07-01",
      wte: 60
    });
    expect(
      computeWteAccrual(longProgramme, changes, "2020-07-01")
        .wteMonthsFromPastChanges
    ).toBe(0);
  });
});

describe("Quick-mode inferred full-time periods", () => {
  it("builds assumed 100% gaps before and between completed changes", () => {
    const changes: PastChange[] = [
      {
        id: "absence",
        type: "OOPC",
        startDate: "2018-03-01",
        endDate: "2018-03-31",
        wte: null,
        countedAsTraining: false,
        notes: ""
      },
      {
        id: "ltft",
        type: "LTFT",
        startDate: "2018-05-01",
        endDate: "2018-05-31",
        wte: 80,
        countedAsTraining: true,
        notes: ""
      }
    ];

    expect(
      inferredFullTimePeriods(longProgramme, changes, "2018-07-01")
    ).toEqual([
      {
        id: "assumed-2018-01-01-2018-02-28",
        startDate: "2018-01-01",
        endDate: "2018-02-28"
      },
      {
        id: "assumed-2018-04-01-2018-04-30",
        startDate: "2018-04-01",
        endDate: "2018-04-30"
      },
      {
        id: "assumed-2018-06-01-2018-06-30",
        startDate: "2018-06-01",
        endDate: "2018-06-30"
      }
    ]);
  });
});
