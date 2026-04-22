import { describe, expect, it } from "vitest";
import type { DraftCalculation } from "../components/types";
import {
  calculateNewCct,
  calculateInclusiveDaySpan,
  calculateAbsenceExtensionDays,
  calculateLtftExtensionDays,
  createCompleteCalculationChange,
  selectCalculationType
} from "./cctCalcUtils";

describe("selectCalculationType", () => {
  it("uses programme start date when this is the first calculation", () => {
    const result = selectCalculationType("OOPC", null, "2026-08-01");

    expect(result).toMatchObject({
      type: "OOPC",
      changeDate: "2026-08-01"
    });
  });

  it("starts from the day after the previous end date", () => {
    const result = selectCalculationType("OOPC", "2026-08-10", "2026-01-01");

    expect(result.changeDate).toBe("2026-08-11");
  });

  it("initialises OOPP like other non-LTFT OOP types", () => {
    const result = selectCalculationType("OOPP", null, "2026-08-01");

    expect(result).toMatchObject({
      type: "OOPP",
      changeDate: "2026-08-01"
    });
  });

  it("initialises LTFT with a default startWte", () => {
    const result = selectCalculationType("LTFT", null, "2026-08-01");

    expect(result).toMatchObject({
      type: "LTFT",
      changeDate: "2026-08-01",
      startWte: 100
    });
    expect(result.endWte).toBeUndefined();
  });
});

describe("pure calculation helpers", () => {
  it("calculateInclusiveDaySpan counts both start and end dates", () => {
    const result = calculateInclusiveDaySpan("2026-01-01", "2026-01-11");

    expect(result).toBe(11);
  });

  it("calculateInclusiveDaySpan returns one day when start and end are the same", () => {
    const result = calculateInclusiveDaySpan("2026-01-01", "2026-01-01");

    expect(result).toBe(1);
  });

  it("calculateInclusiveDaySpan throws RangeError for invalid startDate", () => {
    expect(() => calculateInclusiveDaySpan("not-a-date", "2026-01-11")).toThrow(
      RangeError
    );
  });

  it("calculateInclusiveDaySpan throws RangeError for invalid endDate", () => {
    expect(() => calculateInclusiveDaySpan("2026-01-01", "not-a-date")).toThrow(
      RangeError
    );
  });

  it("calculateInclusiveDaySpan throws RangeError when endDate is before startDate", () => {
    expect(() => calculateInclusiveDaySpan("2026-01-11", "2026-01-01")).toThrow(
      RangeError
    );
  });

  it("calculateAbsenceExtensionDays applies a rounded training rebate", () => {
    const result = calculateAbsenceExtensionDays(11, 2.2);

    expect(result).toBe(9);
  });

  it("calculateAbsenceExtensionDays returns full-time days when rebate is omitted", () => {
    const result = calculateAbsenceExtensionDays(11);

    expect(result).toBe(11);
  });

  it("calculateAbsenceExtensionDays throws RangeError for invalid rebate", () => {
    expect(() => calculateAbsenceExtensionDays(11, -1)).toThrow(RangeError);
    expect(() => calculateAbsenceExtensionDays(11, 12)).toThrow(RangeError);
  });

  it("calculateAbsenceExtensionDays throws RangeError when fullTimeDays is zero", () => {
    expect(() => calculateAbsenceExtensionDays(0)).toThrow(RangeError);
  });

  it("calculateAbsenceExtensionDays throws RangeError when fullTimeDays is negative", () => {
    expect(() => calculateAbsenceExtensionDays(-5)).toThrow(RangeError);
  });

  it("calculateLtftExtensionDays rounds to nearest whole day", () => {
    const result = calculateLtftExtensionDays(11, 0.8);

    expect(result).toBe(2);
  });

  it("calculateLtftExtensionDays supports non-default currentWte", () => {
    const result = calculateLtftExtensionDays(11, 0.6, 0.8);

    expect(result).toBe(3);
  });

  it("calculateLtftExtensionDays throws RangeError when fullTimeDays is zero or negative", () => {
    expect(() => calculateLtftExtensionDays(0, 0.8)).toThrow(RangeError);
    expect(() => calculateLtftExtensionDays(-5, 0.8)).toThrow(RangeError);
  });

  it("calculateLtftExtensionDays throws RangeError when ltftWte is out of range", () => {
    expect(() => calculateLtftExtensionDays(11, 0)).toThrow(RangeError);
    expect(() => calculateLtftExtensionDays(11, 1.1)).toThrow(RangeError);
  });

  it("calculateLtftExtensionDays throws RangeError when currentWte is out of range", () => {
    expect(() => calculateLtftExtensionDays(11, 0.8, 0)).toThrow(RangeError);
    expect(() => calculateLtftExtensionDays(11, 0.8, 1.1)).toThrow(RangeError);
  });

  it("calculateNewCct adds whole days to date", () => {
    const result = calculateNewCct("2027-08-01", 11);

    expect(result).toBe("2027-08-12");
  });

  it("calculateNewCct adds extension days to the base date", () => {
    const result = calculateNewCct("2027-08-01", 2);

    expect(result).toBe("2027-08-03");
  });

  it("calculateNewCct supports negative extension days", () => {
    const result = calculateNewCct("2027-08-12", -2);

    expect(result).toBe("2027-08-10");
  });

  it("calculateNewCct throws RangeError for invalid baseDate", () => {
    expect(() => calculateNewCct("not-a-date", 5)).toThrow(RangeError);
  });

  it("createCompleteCalculationChange is deterministic for fixed inputs", () => {
    const result = createCompleteCalculationChange(
      {
        type: "OOPC",
        changeDate: "2026-01-01",
        endDate: "2026-01-11"
      },
      "calc-fixed",
      11,
      "2027-08-12"
    );

    expect(result).toMatchObject({
      id: "calc-fixed",
      type: "OOPC",
      daysAdded: 11,
      resultingCctDate: "2027-08-12"
    });
  });
  it("composes pure helper functions for an LTFT calculation", () => {
    const draft: DraftCalculation = {
      type: "LTFT",
      changeDate: "2026-01-01",
      endDate: "2026-01-11",
      startWte: 100,
      endWte: 80
    };

    const fullTimeDays = calculateInclusiveDaySpan(
      draft.changeDate as string,
      draft.endDate as string
    );
    const endWteDecimal = (draft.endWte as number) / 100;
    const daysAdded = calculateLtftExtensionDays(fullTimeDays, endWteDecimal);
    const newCctDate = calculateNewCct("2027-08-01", daysAdded);
    const result = createCompleteCalculationChange(
      draft,
      "calc-fixed",
      daysAdded,
      newCctDate
    );

    expect(result.id).toBe("calc-fixed");
    expect(result.daysAdded).toBe(2);
    expect(result.resultingCctDate).toBe("2027-08-03");
  });
});
