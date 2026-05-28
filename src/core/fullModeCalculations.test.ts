import { describe, expect, it } from "vitest";
import dayjs from "dayjs";
import type {
  ProgrammeDetails,
  TrainingPeriod
} from "./calculationTypes";
import {
  computeGradeProgressionForTimeline,
  computeTimelineAccrual,
  projectedCompletionDateForTimeline
} from "./fullModeCalculations";
import { DAYS_PER_MONTH } from "./calculations";
import { BEYOND_ST9_GRADE_LABEL } from "./grades";

const programme: ProgrammeDetails = {
  specialty: "Cardiology",
  startDate: "2025-01-01",
  lengthMonths: 12,
  additionalMonths: 0,
  additionalMonthsNotes: "",
  acceleratedMonths: 0,
  acceleratedMonthsNotes: "",
  eighteenMonthFinalGrade: "",
  eighteenMonthFinalGradeNotes: "",
  skippedGrade: "",
  skippedGradeNotes: "",
  startGrade: "ST4",
  startGradeOverrideNotes: ""
};

const grade = (overrides: Partial<TrainingPeriod>): TrainingPeriod => ({
  id: `p-${Math.random()}`,
  type: "GRADE",
  grade: "ST4",
  gradeTag: "REGULAR",
  wte: 100,
  startDate: "2025-01-01",
  endDate: null,
  countedAsTraining: true,
  notes: "",
  ...overrides
});

describe("computeTimelineAccrual", () => {
  it("sums concrete-row WTE months and ignores project-forward rows", () => {
    const timeline: TrainingPeriod[] = [
      grade({
        startDate: "2025-01-01",
        endDate: "2025-06-30",
        wte: 100
      }),
      grade({
        startDate: "2025-07-01",
        endDate: null,
        wte: 50
      })
    ];
    const accrual = computeTimelineAccrual(programme, timeline);
    expect(accrual.totalWteMonthsCompleted).toBeCloseTo(6, 1);
  });

  it("treats countedAsTraining=false as zero WTE accrual but counts calendar", () => {
    const timeline: TrainingPeriod[] = [
      grade({
        startDate: "2025-01-01",
        endDate: "2025-06-30",
        wte: 100,
        countedAsTraining: false
      })
    ];
    const accrual = computeTimelineAccrual(programme, timeline);
    expect(accrual.totalWteMonthsCompleted).toBeCloseTo(0, 5);
    expect(accrual.totalCalendarMonthsCompleted).toBeCloseTo(6, 1);
  });

  it("credits counted OOPT at a fixed 100% WTE", () => {
    const timeline: TrainingPeriod[] = [
      {
        ...grade({}),
        type: "OOPT",
        grade: "",
        wte: null,
        startDate: "2025-01-01",
        endDate: "2025-06-30"
      }
    ];
    const accrual = computeTimelineAccrual(programme, timeline);
    expect(accrual.totalWteMonthsCompleted).toBeCloseTo(6, 1);
  });

  it("does not accrue OOPT when it is marked as not counted as training", () => {
    const timeline: TrainingPeriod[] = [
      {
        ...grade({}),
        type: "OOPT",
        grade: "",
        wte: null,
        startDate: "2025-01-01",
        endDate: "2025-06-30",
        countedAsTraining: false
      }
    ];
    const accrual = computeTimelineAccrual(programme, timeline);
    expect(accrual.totalWteMonthsCompleted).toBeCloseTo(0, 5);
  });

  it("credits approved OOPR at its entered CCT credit percentage", () => {
    const timeline: TrainingPeriod[] = [
      {
        ...grade({}),
        type: "OOPR",
        grade: "",
        wte: 80,
        startDate: "2025-01-01",
        endDate: "2025-06-30"
      }
    ];
    const accrual = computeTimelineAccrual(programme, timeline);
    expect(accrual.totalWteMonthsCompleted).toBeCloseTo(4.8, 1);
  });
});

describe("projectedCompletionDateForTimeline", () => {
  it("returns null for an empty timeline", () => {
    expect(projectedCompletionDateForTimeline(programme, [])).toBeNull();
  });

  it("extrapolates when only a project-forward row exists (open-ended)", () => {
    const timeline = [
      grade({ startDate: "2025-01-01", endDate: null, wte: 100 })
    ];
    const cct = projectedCompletionDateForTimeline(programme, timeline);
    const expected = dayjs("2025-01-01")
      .add(Math.floor(12 * DAYS_PER_MONTH), "day")
      .format("YYYY-MM-DD");
    expect(cct).toBe(expected);
  });

  it("returns the last end date when timeline already covers required (Excel branch A)", () => {
    const timeline = [
      grade({
        startDate: "2025-01-01",
        endDate: "2025-12-31",
        wte: 100
      })
    ];
    const cct = projectedCompletionDateForTimeline(programme, timeline);
    expect(cct).toBe("2025-12-31");
  });

  it("extrapolates from last end date when closed timeline under-covers required", () => {
    const timeline = [
      grade({
        startDate: "2025-01-01",
        endDate: "2025-06-30",
        wte: 100
      })
    ];
    const cct = projectedCompletionDateForTimeline(programme, timeline);
    const recordedWte = 181 / (365 / 12);
    const excelRemaining = Number((12 - recordedWte).toFixed(2));
    const expected = dayjs("2025-07-01")
      .add(Math.floor(excelRemaining * DAYS_PER_MONTH), "day")
      .format("YYYY-MM-DD");
    expect(cct).toBe(expected);
  });

  it("projects after an absence at the most recent grade WTE", () => {
    const timeline = [
      grade({
        startDate: "2025-01-01",
        endDate: "2025-06-30",
        wte: 50
      }),
      {
        ...grade({
          startDate: "2025-07-01",
          endDate: "2025-09-30",
          wte: null,
          countedAsTraining: false
        }),
        type: "SICK" as const,
        grade: ""
      }
    ];
    const cct = projectedCompletionDateForTimeline(programme, timeline);
    const atFullTime = projectedCompletionDateForTimeline(programme, [
      { ...timeline[0], wte: 100 },
      timeline[1]
    ]);

    expect(dayjs(cct ?? "").isAfter(atFullTime ?? "")).toBe(true);
  });

  it("doubles the projection at 50% WTE on a project-forward last row", () => {
    const timeline = [
      grade({ startDate: "2025-01-01", endDate: null, wte: 50 })
    ];
    const cct = projectedCompletionDateForTimeline(programme, timeline);
    const expected = dayjs("2025-01-01")
      .add(Math.floor((12 / 0.5) * DAYS_PER_MONTH), "day")
      .format("YYYY-MM-DD");
    expect(cct).toBe(expected);
  });
});

describe("computeGradeProgressionForTimeline (lookup branch)", () => {
  const threeYearProg: ProgrammeDetails = {
    ...programme,
    lengthMonths: 36,
    startGrade: "ST4"
  };

  it("uses interpolation when timeline is open-ended", () => {
    const timeline = [
      grade({ startDate: "2025-01-01", endDate: null, wte: 100 })
    ];
    const rows = computeGradeProgressionForTimeline(threeYearProg, timeline);
    expect(rows[0].endDate).not.toBeNull();
    expect(rows[0].grade).toBe("ST4");
  });

  it("uses interpolation for a grade threshold not yet covered by recorded WTE", () => {
    const timeline = [
      grade({
        startDate: "2025-01-01",
        endDate: "2025-06-30",
        wte: 100
      })
    ];
    const rows = computeGradeProgressionForTimeline(threeYearProg, timeline);
    // Year 1 (ST4) end date is interpolated, not from the timeline row
    expect(rows[0].endDate).not.toBe("2025-06-30");
  });

  it("uses lookup for an achieved grade even when the overall programme remains under-planned", () => {
    const timeline = [
      grade({
        id: "p1",
        grade: "ST4",
        startDate: "2025-01-01",
        endDate: "2025-12-31",
        wte: 100
      })
    ];
    const rows = computeGradeProgressionForTimeline(threeYearProg, timeline);
    expect(rows[0]).toMatchObject({ grade: "ST4", endDate: "2025-12-31" });
    expect(rows[1]?.endDate).not.toBeNull();
  });

  it("uses lookup for each achieved grade, returning the timeline's grade end dates", () => {
    const timeline = [
      grade({
        id: "p1",
        grade: "ST4",
        startDate: "2025-01-01",
        endDate: "2025-12-31",
        wte: 100
      }),
      grade({
        id: "p2",
        grade: "ST5",
        startDate: "2026-01-01",
        endDate: "2026-12-31",
        wte: 100
      }),
      grade({
        id: "p3",
        grade: "ST6",
        startDate: "2027-01-01",
        endDate: "2027-12-31",
        wte: 100
      })
    ];
    const rows = computeGradeProgressionForTimeline(threeYearProg, timeline);
    expect(rows[0]).toMatchObject({ grade: "ST4", endDate: "2025-12-31" });
    expect(rows[1]).toMatchObject({ grade: "ST5", endDate: "2026-12-31" });
    expect(rows[2]).toMatchObject({ grade: "ST6", endDate: "2027-12-31" });
  });

  it("returns null for a grade year that has no matching timeline row (closed over-planned)", () => {
    const timeline = [
      grade({
        id: "p1",
        grade: "ST4",
        startDate: "2025-01-01",
        endDate: "2027-12-31",
        wte: 100
      })
    ];
    const rows = computeGradeProgressionForTimeline(threeYearProg, timeline);
    expect(rows[0]).toMatchObject({ grade: "ST4", endDate: "2027-12-31" });
    expect(rows[1]).toMatchObject({ grade: "ST5", endDate: null });
    expect(rows[2]).toMatchObject({ grade: "ST6", endDate: null });
  });

  it("ignores grade tag when matching", () => {
    const timeline = [
      grade({
        id: "p1",
        grade: "ST4",
        gradeTag: "ACF",
        startDate: "2025-01-01",
        endDate: "2025-12-31",
        wte: 100
      }),
      grade({
        id: "p2",
        grade: "ST4",
        gradeTag: "ADDITIONAL_TRAINING_TIME",
        startDate: "2026-01-01",
        endDate: "2026-03-31",
        wte: 100
      }),
      grade({
        id: "p3",
        grade: "ST5",
        startDate: "2026-04-01",
        endDate: "2027-12-31",
        wte: 100
      })
    ];
    const rows = computeGradeProgressionForTimeline(threeYearProg, timeline);
    // ST4 should resolve to the LAST ST4-tagged row (2026-03-31), not the ACF one
    expect(rows[0]).toMatchObject({ grade: "ST4", endDate: "2026-03-31" });
  });

  it("uses explicit ST9 timeline periods but does not invent ST10", () => {
    const longProg: ProgrammeDetails = {
      ...programme,
      specialty: "Intensive care with Respiratory medicine, and GIM",
      startGrade: "ST3",
      lengthMonths: 96
    };
    const timeline = [
      grade({
        id: "p1",
        grade: "ST3",
        startDate: "2025-01-01",
        endDate: "2025-12-31"
      }),
      grade({
        id: "p2",
        grade: "ST4",
        startDate: "2026-01-01",
        endDate: "2026-12-31"
      }),
      grade({
        id: "p3",
        grade: "ST5",
        startDate: "2027-01-01",
        endDate: "2027-12-31"
      }),
      grade({
        id: "p4",
        grade: "ST6",
        startDate: "2028-01-01",
        endDate: "2028-12-31"
      }),
      grade({
        id: "p5",
        grade: "ST7",
        startDate: "2029-01-01",
        endDate: "2029-12-31"
      }),
      grade({
        id: "p6",
        grade: "ST8",
        startDate: "2030-01-01",
        endDate: "2030-12-31"
      }),
      grade({
        id: "p7",
        grade: "ST9",
        startDate: "2031-01-01",
        endDate: "2031-12-31"
      }),
      grade({
        id: "p8",
        grade: "ST9",
        startDate: "2032-01-01",
        endDate: "2032-12-31"
      })
    ];

    const rows = computeGradeProgressionForTimeline(longProg, timeline);

    expect(rows[6]).toMatchObject({ grade: "ST9", endDate: "2032-12-31" });
    expect(rows[7]).toMatchObject({
      grade: BEYOND_ST9_GRADE_LABEL,
      endDate: null,
      exceedsKnownTrainingGrade: true
    });
  });
});
