import { describe, expect, it } from "vitest";
import type { ProgrammeDetails } from "./calculationTypes";
import {
  programmeAdjustedEndDate,
  programmeAdjustedLengthMonths
} from "./calculations";
import { computeGradeProgression } from "./grades";
import { validateProgrammeDetails } from "./validation";

const tripleCctProgramme: ProgrammeDetails = {
  specialty: "Intensive care with Acute internal medicine, and GIM",
  startDate: "2026-01-01",
  lengthMonths: 90,
  additionalMonths: 0,
  additionalMonthsNotes: "",
  acceleratedMonths: 0,
  acceleratedMonthsNotes: "",
  eighteenMonthFinalGrade: "",
  eighteenMonthFinalGradeNotes: "",
  skippedGrade: "",
  skippedGradeNotes: "",
  startGrade: "ST3",
  startGradeOverrideNotes: ""
};

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

    expect(withoutFinalYear.at(-1)?.grade).toBe("ST10");
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
    expect(rows.at(-1)?.endDate).toBe(withoutFinalYear.at(-1)?.endDate);
    expect(programmeAdjustedLengthMonths(withFinalYear)).toBe(90);
    expect(programmeAdjustedEndDate(withFinalYear)).toBe(
      programmeAdjustedEndDate(tripleCctProgramme)
    );
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
      "ST10",
      "ST11"
    ]);
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
