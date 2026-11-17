import { describe, expect, it } from "vitest";
import type {
  PastChange,
  ProgrammeDetails,
  ProposedChange
} from "./calculationTypes";
import { calculateCct } from "./cctEngine";
import { computeGradeProgression } from "./grades";

// Note: the engine's own results are in cctEngine.test.ts (ported from CctEngineTest.java).

const longProgramme: ProgrammeDetails = {
  specialty: "Long comparison programme",
  startDate: "2018-01-01",
  lengthMonths: 120,
  additionalTrainingTime: [],
  acceleratedMonths: 0,
  acceleratedMonthsNotes: "",
  eighteenMonthFinalGrade: "",
  eighteenMonthFinalGradeNotes: "",
  skippedGrade: "",
  skippedGradeNotes: "",
  startGrade: "ST1",
  startGradeOverrideNotes: ""
};

describe("Excel historical period convention", () => {
  it("uses 365 / 12 for grade end dates within a long LTFT history", () => {
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
      startDate: "2024-01-01",
      wte: null
    };

    const gradeRows = computeGradeProgression(longProgramme, changes, proposed);
    expect(gradeRows[3]?.endDate).toBe("2024-06-30");
  });
});

describe("Quick-mode assumed full-time periods", () => {
  it("builds assumed 100% gaps before, between and after changes", () => {
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
      },
      {
        id: "projected-ltft",
        type: "LTFT",
        startDate: "2018-07-01",
        endDate: "",
        wte: 80,
        countedAsTraining: true,
        notes: "",
        projectsRemainingTraining: true
      }
    ];

    expect(
      calculateCct(longProgramme, changes).result.assumedFullTimePeriods.map(
        ({ startDate, endDate }) => ({ startDate, endDate })
      )
    ).toEqual([
      { startDate: "2018-01-01", endDate: "2018-02-28" },
      { startDate: "2018-04-01", endDate: "2018-04-30" },
      { startDate: "2018-06-01", endDate: "2018-06-30" }
    ]);
  });
});
