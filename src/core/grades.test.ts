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
