import { describe, expect, it } from "vitest";
import type {
  CalculationType,
  PastChange,
  ProgrammeDetails
} from "./calculationTypes";
import { calculateCct, deriveQuickProjection } from "./cctEngine";

// Note: ported from CctEngineTest.java in tis-trainee-details, so both engines are held to the same results.

const LONG_PROGRAMME_START = "2018-01-01";
const PAEDIATRICS_START = "2023-08-02";

const programme = (
  startDate: string,
  lengthMonths: number,
  additionalMonths = 0,
  acceleratedMonths = 0
): ProgrammeDetails => ({
  specialty: "Paediatrics",
  startDate,
  lengthMonths,
  // Note: the engine only uses the totals, so one entry each stands in for the BE's single values.
  additionalTrainingTime:
    additionalMonths > 0
      ? [{ id: "additional", grade: "ST1", months: additionalMonths, notes: "" }]
      : [],
  acceleratedTrainingTime:
    acceleratedMonths > 0
      ? [{ id: "accelerated", grade: "ST1", months: acceleratedMonths, notes: "" }]
      : [],
  eighteenMonthFinalGrade: "",
  eighteenMonthFinalGradeNotes: "",
  skippedGrade: "",
  skippedGradeNotes: "",
  startGrade: "ST1",
  startGradeOverrideNotes: ""
});

let nextId = 0;
// Note: endDate null is an open-ended LTFT, as the UI records it.
const change = (
  type: CalculationType,
  startDate: string,
  endDate: string | null,
  wte: number | null,
  countedAsTraining: boolean
): PastChange => ({
  id: `change-${nextId++}`,
  type,
  startDate,
  endDate: endDate ?? "",
  wte,
  countedAsTraining,
  notes: "",
  ...(endDate === null ? { projectsRemainingTraining: true } : {})
});

const result = (
  startDate: string,
  lengthMonths: number,
  changes: PastChange[],
  additionalMonths = 0,
  acceleratedMonths = 0
) =>
  calculateCct(
    programme(startDate, lengthMonths, additionalMonths, acceleratedMonths),
    changes
  ).result;

describe("calculateCct", () => {
  it("projects full time from the day after the last change ends", () => {
    const r = result(LONG_PROGRAMME_START, 120, [
      change("LTFT", "2018-01-01", "2022-12-31", 50, true)
    ]);

    expect(r.totalWteMonthsCompleted).toBeCloseTo(30.0164383562, 9);
    expect(r.projection.startDate).toBe("2023-01-01");
    expect(r.cctDate).toBe("2030-06-28");
  });

  it("matches the POC for an uncounted absence then an open LTFT change", () => {
    const r = result(LONG_PROGRAMME_START, 120, [
      change("OOPC", "2020-01-01", "2022-12-31", null, false),
      change("LTFT", "2024-01-01", null, 50, true)
    ]);

    expect(r.totalCalendarMonthsCompleted).toBeCloseTo(72.0328767123, 9);
    expect(r.totalWteMonthsCompleted).toBeCloseTo(36, 9);
    expect(r.cctDate).toBe("2037-12-25");
  });

  it("credits OOPT at full time only when counted", () => {
    const counted = calculateCct(programme(LONG_PROGRAMME_START, 120), [
      change("OOPT", "2020-01-01", "2020-06-30", null, true)
    ]);
    const uncounted = calculateCct(programme(LONG_PROGRAMME_START, 120), [
      change("OOPT", "2020-01-01", "2020-06-30", null, false)
    ]);

    expect(counted.changes[0].wteMonths).toBeCloseTo(6, 1);
    expect(uncounted.changes[0].wteMonths).toBe(0);
  });

  it("credits counted OOPR at the approved WTE", () => {
    const response = calculateCct(programme(LONG_PROGRAMME_START, 120), [
      change("OOPR", "2020-01-01", "2020-06-30", 80, true)
    ]);

    expect(response.changes[0].wteMonths).toBeCloseTo(4.8, 1);
  });

  it("leaves the whole adjusted length remaining when there are no changes", () => {
    const r = result(LONG_PROGRAMME_START, 120, [], 6, 3);

    expect(r.totalWteMonthsCompleted).toBe(0);
    expect(r.monthsRemaining).toBe(123);
    expect(r.assumedFullTimePeriods).toEqual([]);
    expect(r.projection.wteMonths).toBe(123);
  });

  it("breaks the result down into periods", () => {
    const response = calculateCct(programme(PAEDIATRICS_START, 96), [
      change("PARENTAL", "2024-02-01", "2024-08-01", null, false)
    ]);
    const assumed = response.result.assumedFullTimePeriods;

    expect(response.changes[0].wteMonths).toBe(0);
    expect(assumed).toHaveLength(1);
    expect(assumed[0].startDate).toBe("2023-08-02");
    expect(assumed[0].endDate).toBe("2024-01-31");
  });

  it("rounds months remaining before projecting", () => {
    const r = result(PAEDIATRICS_START, 84, [
      change("LTFT", "2023-11-21", "2025-11-09", 50, true)
    ]);

    expect(r.monthsRemaining).toBe(68.52);
    expect(r.projection.wteMonths).toBe(68.52);
    expect(r.cctDate).toBe("2031-07-25");
  });

  it("projects rounded months remaining at the open LTFT WTE", () => {
    const r = result(PAEDIATRICS_START, 84, [
      change("LTFT", "2024-02-01", null, 60, true)
    ]);

    expect(r.monthsRemaining).toBe(77.98);
    expect(r.projection.calendarMonths).toBeCloseTo(77.98 / 0.6, 9);
    expect(r.cctDate).toBe("2034-11-25");
  });

  it("floors a whole number of days when float noise leaves it just short", () => {
    const r = result(PAEDIATRICS_START, 84, [
      change("LTFT", PAEDIATRICS_START, null, 56, true)
    ]);

    expect(r.monthsRemaining).toBe(84);
    expect(r.cctDate).toBe("2036-01-26");
  });

  it("gives the day training completes when a change runs past it", () => {
    const r = result(PAEDIATRICS_START, 84, [
      change("LTFT", "2030-01-01", "2032-12-31", 50, true)
    ]);

    expect(r.monthsRemaining).toBe(-11.08);
    expect(r.cctDate).toBe("2031-02-26");
    expect(r.projection.startDate).toBe("2033-01-01");
    expect(r.projection.wteMonths).toBe(-11.08);
  });

  it.each([
    ["2031-02-25", 0.02, "2031-02-26"],
    ["2031-02-26", 0, "2031-02-27"],
    ["2031-02-27", -0.02, "2031-02-28"]
  ])(
    "gives the day training completes when a change ends around it (%s)",
    (endDate, monthsRemaining, projectionStartDate) => {
      const r = result(PAEDIATRICS_START, 84, [
        change("LTFT", "2030-01-01", endDate, 50, true)
      ]);

      expect(r.monthsRemaining).toBe(monthsRemaining);
      expect(r.cctDate).toBe("2031-02-26");
      expect(r.projection.startDate).toBe(projectionStartDate);
      expect(r.projection.wteMonths).toBe(monthsRemaining);
    }
  );

  it.each([
    ["2026-01-30", -0.02],
    ["2026-01-31", -0.05]
  ])(
    "allows small negative months remaining when a change completes training (%s)",
    (endDate, monthsRemaining) => {
      const r = result(PAEDIATRICS_START, 30, [
        change("OOPR", PAEDIATRICS_START, endDate, 100, true)
      ]);

      expect(r.monthsRemaining).toBe(monthsRemaining);
      expect(r.cctDate).toBe("2026-01-30");
    }
  );

  it.each([
    [[change("LTFT", "2030-01-01", "2032-12-31", 50, true)], "2031-02-26"],
    [[change("OOPR", "2029-01-01", "2031-06-30", 100, true)], "2030-07-30"],
    [
      [
        change("OOPR", "2029-01-01", "2031-06-30", 100, true),
        change("PARENTAL", "2031-07-01", "2032-03-31", null, false)
      ],
      "2030-07-30"
    ],
    [[change("LTFT", "2031-01-01", null, 20, true)], "2030-07-30"],
    [[change("LTFT", "2029-01-01", "2031-08-18", 60, true)], "2031-08-18"]
  ])("gives the day training completes when changes complete it (%#)", (changes, cctDate) => {
    expect(result(PAEDIATRICS_START, 84, changes).cctDate).toBe(cctDate);
  });

  it.each([
    [0, "2030-07-29"],
    [6, "2031-01-28"]
  ])("floors programme end dates (+%i months)", (additionalMonths, adjustedEnd) => {
    const r = result(PAEDIATRICS_START, 84, [], additionalMonths);

    expect(r.originalProgrammeEndDate).toBe("2030-07-29");
    expect(r.adjustedProgrammeEndDate).toBe(adjustedEnd);
    expect(r.cctDate).toBe(adjustedEnd);
  });

  it("calculates the result when there are no changes", () => {
    expect(calculateCct(programme(PAEDIATRICS_START, 84), [])).toEqual({
      changes: [],
      result: {
        cctDate: "2030-07-29",
        originalProgrammeEndDate: "2030-07-29",
        adjustedProgrammeEndDate: "2030-07-29",
        totalCalendarMonthsCompleted: 0,
        totalWteMonthsCompleted: 0,
        monthsRemaining: 84,
        assumedFullTimePeriods: [],
        projection: {
          startDate: "2023-08-02",
          wte: 1,
          calendarMonths: 84,
          wteMonths: 84
        }
      }
    });
  });

  it("calculates the result when there is a dated LTFT change", () => {
    const ltft = change("LTFT", "2024-02-01", "2024-08-01", 60, true);

    expect(calculateCct(programme(PAEDIATRICS_START, 84), [ltft])).toEqual({
      changes: [
        {
          change: ltft,
          calendarMonths: 6.016438356164383,
          wteMonths: 3.6098630136986296
        }
      ],
      result: {
        cctDate: "2030-10-10",
        originalProgrammeEndDate: "2030-07-29",
        adjustedProgrammeEndDate: "2030-07-29",
        totalCalendarMonthsCompleted: expect.closeTo(12.03287671232877, 12),
        totalWteMonthsCompleted: 9.626301369863013,
        monthsRemaining: 74.37,
        assumedFullTimePeriods: [
          {
            startDate: "2023-08-02",
            endDate: "2024-01-31",
            months: 6.016438356164383
          }
        ],
        projection: {
          startDate: "2024-08-02",
          wte: 1,
          calendarMonths: 74.37,
          wteMonths: 74.37
        }
      }
    });
  });

  it("calculates the result when there is an open LTFT change", () => {
    const ltft = change("LTFT", "2025-02-01", null, 60, true);

    expect(calculateCct(programme(PAEDIATRICS_START, 84), [ltft])).toEqual({
      changes: [{ change: ltft, calendarMonths: null, wteMonths: null }],
      result: {
        cctDate: "2034-03-27",
        originalProgrammeEndDate: "2030-07-29",
        adjustedProgrammeEndDate: "2030-07-29",
        totalCalendarMonthsCompleted: 18.04931506849315,
        totalWteMonthsCompleted: 18.04931506849315,
        monthsRemaining: 65.95,
        assumedFullTimePeriods: [
          {
            startDate: "2023-08-02",
            endDate: "2025-01-31",
            months: 18.04931506849315
          }
        ],
        projection: {
          startDate: "2025-02-01",
          wte: 0.6,
          calendarMonths: 109.91666666666667,
          wteMonths: 65.95
        }
      }
    });
  });

  it("projects from the day after the latest end when there are only dated changes", () => {
    const response = calculateCct(programme(PAEDIATRICS_START, 84), [
      change("LTFT", "2025-01-01", "2025-06-30", 50, true),
      change("OOPC", "2024-01-01", "2024-03-31", null, false)
    ]);
    const r = response.result;

    expect(response.changes).toHaveLength(2);
    expect(response.changes[0].change.startDate).toBe("2025-01-01");
    expect(r.assumedFullTimePeriods).toHaveLength(2);
    expect(r.projection.startDate).toBe("2025-07-01");
    expect(r.monthsRemaining).toBe(66.99);
    expect(r.cctDate).toBe("2031-01-27");
  });

  it("projects at the open LTFT WTE when it follows a dated change", () => {
    const r = result(PAEDIATRICS_START, 84, [
      change("LTFT", "2024-02-01", "2024-08-01", 50, true),
      change("LTFT", "2024-08-02", null, 80, true)
    ]);

    expect(r.assumedFullTimePeriods).toHaveLength(1);
    expect(r.projection.startDate).toBe("2024-08-02");
    expect(r.projection.calendarMonths).toBe(93.725);
    expect(r.monthsRemaining).toBe(74.98);
    expect(r.cctDate).toBe("2032-05-21");
  });

  it("assumes full time before an open LTFT change that follows a gap", () => {
    const r = result(PAEDIATRICS_START, 84, [
      change("LTFT", "2024-02-01", "2024-08-01", 50, true),
      change("LTFT", "2025-02-01", null, 80, true)
    ]);
    const assumed = r.assumedFullTimePeriods;

    expect(assumed).toHaveLength(2);
    expect(assumed[1].startDate).toBe("2024-08-02");
    expect(assumed[1].endDate).toBe("2025-01-31");
    expect(r.projection.startDate).toBe("2025-02-01");
    expect(r.monthsRemaining).toBe(68.96);
    expect(r.cctDate).toBe("2032-04-05");
  });

  it("matches README worked example 4 (several changes)", () => {
    const r = result(PAEDIATRICS_START, 84, [
      change("PARENTAL", "2024-06-01", "2024-11-30", null, false),
      change("OOPR", "2025-09-01", "2026-08-31", 50, true),
      change("LTFT", "2027-02-01", null, 80, true)
    ]);

    expect(r.assumedFullTimePeriods).toHaveLength(3);
    expect(r.monthsRemaining).toBe(53.97);
    expect(r.cctDate).toBe("2032-09-12");
  });

  it("calculates when a change starts before the programme", () => {
    const r = result("2024-03-01", 84, [
      change("PARENTAL", "2024-02-01", "2024-08-01", null, false)
    ]);

    expect(r.monthsRemaining).toBe(84);
    expect(r.cctDate).toBe("2031-07-30");
  });

  it("totals assumed periods when a change starts before the programme", () => {
    const r = result("2024-03-01", 84, [
      change("PARENTAL", "2024-02-01", "2024-08-01", null, false),
      change("PARENTAL", "2025-02-01", "2025-08-01", null, false)
    ]);

    expect(r.assumedFullTimePeriods).toHaveLength(1);
    expect(r.totalWteMonthsCompleted).toBe(r.assumedFullTimePeriods[0].months);
  });

  it("calculates when a change ends before the programme", () => {
    const r = result("2024-09-01", 84, [
      change("LTFT", "2024-02-01", "2024-08-01", 50, true)
    ]);

    expect(r.assumedFullTimePeriods).toEqual([]);
    expect(r.monthsRemaining).toBe(84);
    expect(r.cctDate).toBe("2031-08-29");
  });

  it.each([
    [
      [change("LTFT", "2023-06-01", "2024-01-31", 50, true)],
      [change("LTFT", PAEDIATRICS_START, "2024-01-31", 50, true)]
    ],
    [
      [
        change("LTFT", "2023-01-01", "2023-08-01", 50, true),
        change("OOPT", "2024-01-01", "2024-06-30", null, true)
      ],
      [change("OOPT", "2024-01-01", "2024-06-30", null, true)]
    ],
    [
      [change("LTFT", "2023-05-01", null, 60, true)],
      [change("LTFT", PAEDIATRICS_START, null, 60, true)]
    ]
  ])("counts changes from the programme start (%#)", (changes, trimmedChanges) => {
    expect(result(PAEDIATRICS_START, 84, changes)).toEqual(
      result(PAEDIATRICS_START, 84, trimmedChanges)
    );
  });

  it("shows changes as entered with months counted from the programme start", () => {
    const straddling = change("LTFT", "2023-06-01", "2024-01-31", 50, true);
    const endsBefore = change("LTFT", "2023-01-01", "2023-08-01", 50, true);
    const response = calculateCct(programme(PAEDIATRICS_START, 84), [
      straddling,
      endsBefore
    ]);
    const trimmed = calculateCct(programme(PAEDIATRICS_START, 84), [
      { ...straddling, startDate: PAEDIATRICS_START }
    ]).changes[0];

    expect(response.changes).toEqual([
      {
        change: straddling,
        calendarMonths: trimmed.calendarMonths,
        wteMonths: trimmed.wteMonths
      },
      { change: endsBefore, calendarMonths: 0, wteMonths: 0 }
    ]);
  });

  it("does not walk days that credit nothing", { timeout: 5000 }, () => {
    expect(() =>
      result(PAEDIATRICS_START, 84, [
        change("PARENTAL", "2024-01-01", "2999-12-31", null, false)
      ])
    ).not.toThrow();
  });

  it("gives the adjusted programme end date when there are no changes", () => {
    for (let length = 1; length <= 120; length++) {
      for (let additional = 0; additional <= 24; additional++) {
        for (
          let accelerated = 0;
          accelerated <= 12 && accelerated < length + additional;
          accelerated++
        ) {
          const r = result(PAEDIATRICS_START, length, [], additional, accelerated);
          expect(
            r.cctDate,
            `${length} + ${additional} - ${accelerated} months`
          ).toBe(r.adjustedProgrammeEndDate);
        }
      }
    }
  });

  it.each([
    [[]],
    [[change("LTFT", "2024-02-01", "2024-08-01", 60, true)]],
    [[change("LTFT", "2025-02-01", null, 60, true)]],
    [
      [
        change("OOPT", "2024-01-01", "2024-12-31", null, true),
        change("OOPR", "2025-03-01", "2026-02-28", 50, true),
        change("LTFT", "2026-06-01", null, 80, true)
      ]
    ],
    [
      [
        change("PARENTAL", "2026-01-01", "2026-09-30", null, false),
        change("OOPR", "2024-01-01", "2024-06-30", null, false)
      ]
    ],
    [[change("LTFT", "2030-01-01", "2032-12-31", 50, true)]]
  ])("credits the adjusted length across periods (%#)", changes => {
    const response = calculateCct(programme(PAEDIATRICS_START, 84, 6, 3), changes);
    const r = response.result;

    const changesWteMonths = response.changes.reduce(
      (sum, c) => sum + (c.wteMonths ?? 0),
      0
    );
    const assumedWteMonths = r.assumedFullTimePeriods.reduce(
      (sum, p) => sum + p.months,
      0
    );
    expect(
      changesWteMonths + assumedWteMonths + r.projection.wteMonths
    ).toBeCloseTo(87, 2);
  });
});

describe("deriveQuickProjection", () => {
  it("projects full time from the programme start when there are no changes", () => {
    expect(deriveQuickProjection(programme(LONG_PROGRAMME_START, 120), [])).toEqual({
      kind: "FULL_TIME",
      startDate: LONG_PROGRAMME_START,
      wte: null
    });
  });

  it("projects full time from the day after the latest change", () => {
    expect(
      deriveQuickProjection(programme(LONG_PROGRAMME_START, 120), [
        change("LTFT", "2020-01-01", "2020-06-30", 80, true)
      ])
    ).toEqual({ kind: "FULL_TIME", startDate: "2020-07-01", wte: null });
  });

  it("projects at an open LTFT change's WTE from its start date", () => {
    expect(
      deriveQuickProjection(programme(LONG_PROGRAMME_START, 120), [
        change("OOPC", "2020-01-01", "2020-06-30", null, false),
        change("LTFT", "2020-07-01", null, 60, true)
      ])
    ).toEqual({ kind: "LTFT", startDate: "2020-07-01", wte: 60 });
  });
});
