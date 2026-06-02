import { describe, expect, it } from "vitest";
import type {
  PastChange,
  ProgrammeDetails,
  TrainingPeriod
} from "./calculationTypes";
import {
  computeWteAccrual,
  deriveQuickProjection,
  projectedCompletionDate
} from "./calculations";
import { projectedCompletionDateForTimeline } from "./fullModeCalculations";

// Quick and Full mode share the same accrual maths and must therefore agree on
// the projected completion date for equivalent inputs. These tests run analogous scenarios through both engines
// and assert parity, guarding against the two ever diverging.

const baseProgramme: ProgrammeDetails = {
  specialty: "Cardiology",
  startDate: "2020-08-05",
  lengthMonths: 60,
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

const quickCompletionDate = (
  programme: ProgrammeDetails,
  pastChanges: PastChange[]
): string => {
  const proposed = deriveQuickProjection(programme, pastChanges);
  const accrual = computeWteAccrual(programme, pastChanges, proposed.startDate);
  return projectedCompletionDate(proposed, accrual.monthsRemaining);
};

describe("Quick vs Full mode projected completion date parity", () => {
  it("agrees for a completed 50% LTFT year then full-time to completion", () => {
    const pastChanges: PastChange[] = [
      {
        id: "ltft",
        type: "LTFT",
        startDate: "2021-08-05",
        endDate: "2022-08-04",
        wte: 50,
        countedAsTraining: true,
        notes: ""
      }
    ];
    const timeline: TrainingPeriod[] = [
      {
        id: "g1",
        type: "GRADE",
        grade: "ST1",
        gradeTag: "REGULAR",
        wte: 100,
        startDate: "2020-08-05",
        endDate: "2021-08-04",
        countedAsTraining: true,
        notes: ""
      },
      {
        id: "g2",
        type: "GRADE",
        grade: "ST2",
        gradeTag: "REGULAR",
        wte: 50,
        startDate: "2021-08-05",
        endDate: "2022-08-04",
        countedAsTraining: true,
        notes: ""
      },
      {
        id: "g3",
        type: "GRADE",
        grade: "ST3",
        gradeTag: "REGULAR",
        wte: 100,
        startDate: "2022-08-05",
        endDate: null,
        countedAsTraining: true,
        notes: ""
      }
    ];

    expect(quickCompletionDate(baseProgramme, pastChanges)).toBe(
      projectedCompletionDateForTimeline(baseProgramme, timeline)
    );
  });

  it("agrees for a straight full-time projection with no past changes", () => {
    const programme = { ...baseProgramme, lengthMonths: 48 };
    const timeline: TrainingPeriod[] = [
      {
        id: "g1",
        type: "GRADE",
        grade: "ST1",
        gradeTag: "REGULAR",
        wte: 100,
        startDate: "2020-08-05",
        endDate: null,
        countedAsTraining: true,
        notes: ""
      }
    ];

    expect(quickCompletionDate(programme, [])).toBe(
      projectedCompletionDateForTimeline(programme, timeline)
    );
  });

  it("agrees across a sweep of programme lengths", () => {
    // Sweeping the length walks the day-remainder through every fractional value, so any rounding-policy mismatch would surface on at least one.
    for (let lengthMonths = 12; lengthMonths <= 72; lengthMonths += 1) {
      const programme = { ...baseProgramme, lengthMonths };
      const timeline: TrainingPeriod[] = [
        {
          id: "g1",
          type: "GRADE",
          grade: "ST1",
          gradeTag: "REGULAR",
          wte: 100,
          startDate: "2020-08-05",
          endDate: null,
          countedAsTraining: true,
          notes: ""
        }
      ];

      expect(quickCompletionDate(programme, [])).toBe(
        projectedCompletionDateForTimeline(programme, timeline)
      );
    }
  });
});
