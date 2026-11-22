import dayjs from "dayjs";
import { describe, expect, it } from "vitest";
import type {
  AcceleratedTrainingTime,
  AdditionalTrainingTime,
  PastChange,
  ProgrammeDetails
} from "./calculationTypes";
import {
  programmeAdjustedEndDate,
  programmeAdjustedLengthMonths
} from "./calculations";
import { calculateCct, deriveQuickProjection } from "./cctEngine";
import {
  beyondKnownGradeLabel,
  computeGradeProgression,
  eighteenMonthFinalGradeFor
} from "./grades";
import {
  validateAcceleratedTrainingTime,
  validateAdditionalTrainingTime,
  validateProgrammeDetails
} from "./validation";

const tripleCctProgramme: ProgrammeDetails = {
  specialty: "Intensive care with Acute internal medicine, and GIM",
  startDate: "2026-01-01",
  lengthMonths: 90,
  additionalTrainingTime: [],
  acceleratedTrainingTime: [],
  eighteenMonthFinalGrade: "",
  eighteenMonthFinalGradeNotes: "",
  skippedGrade: "",
  skippedGradeNotes: "",
  startGrade: "ST3",
  startGradeOverrideNotes: ""
};

describe("grade end date display parity", () => {
  it("displays projected grade dates using Excel fractional-day truncation", () => {
    const rows = computeGradeProgression(tripleCctProgramme, [], null);

    expect(rows.map(row => row.endDate)).toEqual([
      "2026-12-31",
      "2027-12-31",
      "2028-12-30",
      "2029-12-30",
      "2030-12-30",
      "2031-12-29",
      "2032-12-28",
      "2033-06-29"
    ]);
  });

  it("walks completed absence and LTFT segments before projecting remaining training", () => {
    const rows = computeGradeProgression(
      tripleCctProgramme,
      [
        {
          id: "absence",
          type: "OOPC",
          startDate: "2026-07-01",
          endDate: "2026-12-31",
          wte: null,
          countedAsTraining: false,
          notes: ""
        },
        {
          id: "ltft",
          type: "LTFT",
          startDate: "2027-01-01",
          endDate: "2027-12-31",
          wte: 50,
          countedAsTraining: true,
          notes: ""
        }
      ],
      {
        kind: "FULL_TIME",
        startDate: "2028-01-01",
        wte: null
      }
    );

    expect(rows[0]?.endDate).toBe("2028-01-02");
    expect(rows.at(-1)?.endDate).toBe("2034-06-30");
  });
});

describe("changes outside the programme", () => {
  const ltft = (startDate: string, endDate: string): PastChange => ({
    id: "ltft",
    type: "LTFT",
    startDate,
    endDate,
    wte: 50,
    countedAsTraining: true,
    notes: ""
  });
  const gradeDates = (changes: PastChange[]) =>
    computeGradeProgression(
      tripleCctProgramme,
      changes,
      deriveQuickProjection(tripleCctProgramme, changes)
    ).map(row => row.endDate);

  it("counts a change starting before the programme from the programme start", () => {
    expect(gradeDates([ltft("2025-01-01", "2026-06-30")])).toEqual(
      gradeDates([ltft("2026-01-01", "2026-06-30")])
    );
  });

  it("does not count a change ending before the programme", () => {
    expect(gradeDates([ltft("2025-01-01", "2025-12-31")])).toEqual(
      gradeDates([])
    );
  });

  // Note: validation blocks overlaps; this guards parity with the engine's assumed periods.
  it("does not assume full-time training inside an earlier, longer change", () => {
    const changes: PastChange[] = [
      {
        id: "outer",
        type: "OOPC",
        startDate: "2026-03-01",
        endDate: "2026-12-31",
        wte: null,
        countedAsTraining: false,
        notes: ""
      },
      ltft("2026-05-01", "2026-06-30")
    ];

    expect(gradeDates(changes).at(-1)).toBe(
      calculateCct(tripleCctProgramme, changes).result.cctDate
    );
  });
});

const additional = (
  grade: string,
  months: number,
  id = `additional-${grade}`
): AdditionalTrainingTime => ({ id, grade, months, notes: "ARCP outcome 3" });

describe("additional training time by grade", () => {
  const withAdditional = (...entries: AdditionalTrainingTime[]) => ({
    ...tripleCctProgramme,
    additionalTrainingTime: entries
  });
  const endDates = (programme: ProgrammeDetails) =>
    computeGradeProgression(programme, [], null).map(row => row.endDate);
  const baseline = endDates(tripleCctProgramme);
  // Note: grade rows are ST3..ST9 then one beyond-ST9 row.
  const st5 = 2;
  const st7 = 4;

  it("leaves grades before the extended grade unchanged", () => {
    const dates = endDates(withAdditional(additional("ST5", 6)));

    expect(dates.slice(0, st5)).toEqual(baseline.slice(0, st5));
  });

  it("lengthens the extended grade and moves later grades on", () => {
    const dates = endDates(withAdditional(additional("ST5", 6)));

    expect(dates[st5]).toBe("2029-06-30");
    dates.slice(st5).forEach((date, i) =>
      expect(dayjs(date).isAfter(dayjs(baseline[st5 + i]))).toBe(true)
    );
  });

  it("carries extensions in several grades", () => {
    const rows = computeGradeProgression(
      withAdditional(additional("ST5", 6), additional("ST7", 3)),
      [],
      null
    );
    const onlySt5 = endDates(withAdditional(additional("ST5", 6)));

    expect(rows.map(row => row.additionalMonths)).toEqual([0, 0, 6, 0, 3, 0, 0, 0]);
    expect(rows.slice(0, st7).map(row => row.endDate)).toEqual(
      onlySt5.slice(0, st7)
    );
    expect(rows[st7]?.endDate).not.toBe(onlySt5[st7]);
  });

  it("adds two extensions to the same grade together", () => {
    expect(
      endDates(
        withAdditional(additional("ST5", 4, "first"), additional("ST5", 2, "second"))
      )
    ).toEqual(endDates(withAdditional(additional("ST5", 6))));
  });

  it("finishes the last grade on the CCT date", () => {
    const programme = withAdditional(additional("ST5", 6), additional("ST7", 3));

    expect(endDates(programme).at(-1)).toBe(
      calculateCct(programme, []).result.cctDate
    );
  });
});

const accelerated = (
  grade: string,
  months: number,
  id = `accelerated-${grade}`
): AcceleratedTrainingTime => ({
  id,
  grade,
  months,
  notes: "Recognised prior learning"
});

describe("accelerated training time by grade", () => {
  const withAccelerated = (...entries: AcceleratedTrainingTime[]) => ({
    ...tripleCctProgramme,
    acceleratedTrainingTime: entries
  });
  const endDates = (programme: ProgrammeDetails) =>
    computeGradeProgression(programme, [], null).map(row => row.endDate);
  const baseline = endDates(tripleCctProgramme);
  const st5 = 2;

  it("leaves grades before the shortened grade unchanged", () => {
    const dates = endDates(withAccelerated(accelerated("ST5", 6)));

    expect(dates.slice(0, st5)).toEqual(baseline.slice(0, st5));
  });

  it("shortens the grade and moves later grades earlier", () => {
    const rows = computeGradeProgression(
      withAccelerated(accelerated("ST5", 6)),
      [],
      null
    );

    expect(rows.map(row => row.acceleratedMonths)).toEqual([0, 0, 6, 0, 0, 0, 0, 0]);
    expect(rows[st5]?.endDate).toBe("2028-07-01");
    rows.slice(st5).forEach((row, i) =>
      expect(dayjs(row.endDate).isBefore(dayjs(baseline[st5 + i]))).toBe(true)
    );
  });

  it("shortens every grade from the start when recorded on the start grade", () => {
    const dates = endDates(withAccelerated(accelerated("ST3", 6)));

    expect(dates[0]).toBe("2026-07-02");
    dates.forEach((date, i) =>
      expect(dayjs(date).isBefore(dayjs(baseline[i]))).toBe(true)
    );
  });

  it("cancels out additional time of the same length on the same grade", () => {
    expect(
      endDates({
        ...withAccelerated(accelerated("ST5", 6)),
        additionalTrainingTime: [additional("ST5", 6)]
      })
    ).toEqual(baseline);
  });

  it("finishes the last grade on the CCT date", () => {
    const programme = withAccelerated(
      accelerated("ST4", 3),
      accelerated("ST7", 4)
    );

    expect(endDates(programme).at(-1)).toBe(
      calculateCct(programme, []).result.cctDate
    );
  });
});

describe("programme training time adjustment limits", () => {
  it("accepts no adjustment and the Excel-aligned maximum additional time", () => {
    expect(validateProgrammeDetails(tripleCctProgramme)).toEqual({ ok: true });
    expect(
      validateAdditionalTrainingTime(
        additional("ST6", 12),
        tripleCctProgramme,
        [additional("ST4", 12)]
      )
    ).toEqual({ ok: true });
  });

  it("rejects a total of additional training time above 24 months", () => {
    const result = validateAdditionalTrainingTime(
      additional("ST6", 12.1),
      tripleCctProgramme,
      [additional("ST4", 12)]
    );

    expect(result).toEqual({
      ok: false,
      message: "Total additional training time cannot be more than 24 months."
    });
  });

  it("excludes the entry being edited from the total", () => {
    const entry = additional("ST4", 20);

    expect(
      validateAdditionalTrainingTime(
        { ...entry, months: 24 },
        tripleCctProgramme,
        [entry]
      )
    ).toEqual({ ok: true });
  });

  it("allows at most 20 entries", () => {
    const twenty = Array.from({ length: 20 }, (_, i) =>
      additional("ST5", 1, `entry-${i}`)
    );

    expect(
      validateAdditionalTrainingTime(
        additional("ST5", 1, "entry-20"),
        tripleCctProgramme,
        twenty.slice(0, 19)
      )
    ).toEqual({ ok: true });
    expect(
      validateAdditionalTrainingTime(
        additional("ST5", 1, "entry-21"),
        tripleCctProgramme,
        twenty
      )
    ).toEqual({
      ok: false,
      message: "You cannot add more than 20 additional training time entries."
    });
    expect(
      validateAdditionalTrainingTime(
        { ...twenty[0], months: 2 },
        tripleCctProgramme,
        twenty
      )
    ).toEqual({ ok: true });
  });

  it("rejects a grade outside the programme's progression", () => {
    expect(
      validateAdditionalTrainingTime(additional("ST2", 6), tripleCctProgramme, [])
    ).toEqual({
      ok: false,
      message: "ST2 is not part of this programme's grade progression."
    });
    expect(
      validateAdditionalTrainingTime(
        additional("ST5", 6),
        {
          ...tripleCctProgramme,
          skippedGrade: "ST5",
          skippedGradeNotes: "Skipped"
        },
        []
      )
    ).toEqual({
      ok: false,
      message: "ST5 is not part of this programme's grade progression."
    });
  });

  it("requires a reason", () => {
    expect(
      validateAdditionalTrainingTime(
        { ...additional("ST5", 6), notes: " " },
        tripleCctProgramme,
        []
      )
    ).toEqual({
      ok: false,
      message: "Please enter a reason for the additional training time."
    });
  });

  it("accepts the prompt-aligned maximum accelerated time across grades", () => {
    expect(
      validateAcceleratedTrainingTime(
        accelerated("ST6", 6),
        tripleCctProgramme,
        [accelerated("ST3", 6)]
      )
    ).toEqual({ ok: true });
  });

  it("rejects a total of accelerated training time above 12 months", () => {
    const result = validateAcceleratedTrainingTime(
      accelerated("ST6", 6.1),
      tripleCctProgramme,
      [accelerated("ST3", 6)]
    );

    expect(result).toEqual({
      ok: false,
      message: "Total accelerated training time cannot be more than 12 months."
    });
  });

  it("requires a reason for accelerated time", () => {
    expect(
      validateAcceleratedTrainingTime(
        { ...accelerated("ST5", 6), notes: " " },
        tripleCctProgramme,
        []
      )
    ).toEqual({
      ok: false,
      message: "Please enter a reason for the accelerated training time."
    });
  });
});

describe("18-month final year", () => {
  it("allocates six existing programme months to the selected final grade", () => {
    const withoutFinalYear = computeGradeProgression(
      tripleCctProgramme,
      [],
      null
    );
    const withFinalYear = {
      ...tripleCctProgramme,
      eighteenMonthFinalGrade: "ST9",
      eighteenMonthFinalGradeNotes: "ICM dual-specialty final year"
    };
    const rows = computeGradeProgression(withFinalYear, [], null);

    expect(withoutFinalYear.at(-1)).toMatchObject({
      grade: beyondKnownGradeLabel("ST9"),
      exceedsKnownTrainingGrade: true
    });
    expect(rows.map(row => row.grade)).toEqual([
      "ST3",
      "ST4",
      "ST5",
      "ST6",
      "ST7",
      "ST8",
      "ST9"
    ]);
    expect(rows.at(-1)?.extendedToEighteenMonths).toBe(true);
    expect(rows.some(row => row.exceedsKnownTrainingGrade)).toBe(false);
    expect(rows.at(-1)?.endDate).toBe(withoutFinalYear.at(-1)?.endDate);
    expect(programmeAdjustedLengthMonths(withFinalYear)).toBe(90);
    expect(programmeAdjustedEndDate(withFinalYear)).toBe(
      programmeAdjustedEndDate(tripleCctProgramme)
    );
  });

  const st1Programme = (lengthMonths: number): ProgrammeDetails => ({
    ...tripleCctProgramme,
    lengthMonths,
    startGrade: "ST1"
  });

  it("takes in the 6-month row so the last full year runs 18 months", () => {
    const months = (programme: ProgrammeDetails) =>
      computeGradeProgression(programme, [], null).map(row => row.gradeMonths);

    expect(months(st1Programme(90))).toEqual([12, 12, 12, 12, 12, 12, 12, 6]);
    expect(
      months({
        ...st1Programme(90),
        eighteenMonthFinalGrade: "ST7",
        eighteenMonthFinalGradeNotes: "Dual CCT"
      })
    ).toEqual([12, 12, 12, 12, 12, 12, 18]);
  });

  it.each([
    ["90 months from ST1", st1Programme(90), "ST7"],
    ["90 months from ST3", tripleCctProgramme, "ST9"],
    [
      "90 months from ST1 with ST3 skipped",
      { ...st1Programme(90), skippedGrade: "ST3", skippedGradeNotes: "Skip" },
      "ST8"
    ],
    ["18 months of DFT", { ...st1Programme(18), startGrade: "DFT" }, "DFT"],
    [
      "66 months with a 24-month grade",
      {
        ...st1Programme(66),
        specialty: "Emergency medicine DRE-EM",
        startGrade: "ST3"
      },
      "ST6"
    ]
  ])("works out the 18-month grade for %s", (_, programme, grade) => {
    expect(eighteenMonthFinalGradeFor(programme)).toBe(grade);
  });

  it.each([
    ["no half year", st1Programme(84)],
    ["only a half year", st1Programme(6)],
    ["a last full year past ST9", { ...st1Programme(90), startGrade: "ST5" }],
    ["30 months of DFT", { ...st1Programme(30), startGrade: "DFT" }]
  ])("has no 18-month grade for %s", (_, programme) => {
    expect(eighteenMonthFinalGradeFor(programme)).toBeNull();
  });

  it("requires a reason when an 18-month final grade is selected", () => {
    const result = validateProgrammeDetails({
      ...tripleCctProgramme,
      eighteenMonthFinalGrade: "ST9"
    });

    expect(result).toEqual({
      ok: false,
      message: "Please enter a reason for the 18-month final year."
    });
  });
});

describe("past the highest known grade", () => {
  it.each([
    ["CT1", 60, ["CT1", "CT2", "CT3", "CT4"], "CT4"],
    ["F1", 36, ["F1", "F2"], "F2"],
    ["DCT1", 48, ["DCT1", "DCT2", "DCT3"], "DCT3"]
  ])(
    "flags a year past the last %s-kind grade",
    (startGrade, lengthMonths, known, highest) => {
      const rows = computeGradeProgression(
        { ...tripleCctProgramme, startGrade, lengthMonths },
        [],
        null
      );

      expect(rows.map(row => row.grade)).toEqual([
        ...known,
        beyondKnownGradeLabel(highest)
      ]);
      expect(rows.at(-1)?.exceedsKnownTrainingGrade).toBe(true);
    }
  );
});

describe("specialty-defined 24-month grade", () => {
  it("extends the named grade and carries its twelve months through progression", () => {
    const rows = computeGradeProgression(
      {
        ...tripleCctProgramme,
        specialty: "Emergency medicine DRE-EM",
        lengthMonths: 60,
        startGrade: "ST3"
      },
      [],
      null
    );

    expect(rows.map(row => row.grade)).toEqual(["ST3", "ST4", "ST5", "ST6"]);
    expect(rows[0]?.extendedToTwentyFourMonths).toBe(true);
    expect(rows[0]?.endDate).toBe("2027-12-31");
    expect(rows.at(-1)?.endDate).toBe("2030-12-30");
  });
});

describe("skipped grade year", () => {
  it("carries a one-grade display offset without changing programme dates", () => {
    const withoutSkip = computeGradeProgression(tripleCctProgramme, [], null);
    const withSkip = {
      ...tripleCctProgramme,
      skippedGrade: "ST5",
      skippedGradeNotes: "Progression after completing core competencies"
    };
    const rows = computeGradeProgression(withSkip, [], null);

    expect(rows.map(row => row.grade)).toEqual([
      "ST3",
      "ST4",
      "ST6",
      "ST7",
      "ST8",
      "ST9",
      beyondKnownGradeLabel("ST9"),
      beyondKnownGradeLabel("ST9")
    ]);
    expect(rows.slice(-2).every(row => row.exceedsKnownTrainingGrade)).toBe(true);
    expect(rows[2]?.skippedGradeBeforeThisRow).toBe("ST5");
    expect(rows.map(row => row.endDate)).toEqual(
      withoutSkip.map(row => row.endDate)
    );
    expect(programmeAdjustedLengthMonths(withSkip)).toBe(
      programmeAdjustedLengthMonths(tripleCctProgramme)
    );
  });

  it("requires a reason when a grade year is skipped", () => {
    const result = validateProgrammeDetails({
      ...tripleCctProgramme,
      skippedGrade: "ST5"
    });

    expect(result).toEqual({
      ok: false,
      message: "Please enter a reason for skipping a grade year."
    });
  });

  it("applies grade-duration rules to the displayed grade after the skip", () => {
    const rows = computeGradeProgression(
      {
        ...tripleCctProgramme,
        eighteenMonthFinalGrade: "ST6",
        eighteenMonthFinalGradeNotes: "Final grade rule",
        skippedGrade: "ST5",
        skippedGradeNotes: "Progression after completing core competencies"
      },
      [],
      null
    );

    expect(rows[2]?.grade).toBe("ST6");
    expect(rows[2]?.extendedToEighteenMonths).toBe(true);
  });
});
