import { describe, expect, it } from "vitest";
import type { CalculationChange, DraftCalculation } from "../components/types";
import {
  calculateNewCct,
  calculateDaysAdded,
  calculateInclusiveDaySpan,
  calculateExtensionDays,
  createCompleteCalculationChange,
  extendCctDateByDays,
  removeLastCalculation,
  selectCalculationType
} from "./cctCalcUtils";

const makeChange = (overrides: Partial<CalculationChange>): CalculationChange =>
  ({
    id: "calc-1",
    type: "OOPC",
    notes: "",
    changeDate: "2026-01-01",
    endDate: "2026-01-10",
    untilEndOfProgramme: false,
    daysAdded: 9,
    resultingCctDate: "2027-01-10",
    ...overrides
  }) as CalculationChange;

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

  it("calculateLtftExtensionDays rounds to nearest whole day", () => {
    const result = calculateExtensionDays(11, 80);

    expect(result).toBe(2);
  });

  it("calculateExtensionDays returns full-time days when endWte is missing", () => {
    const result = calculateExtensionDays(11);

    expect(result).toBe(11);
  });

  it("calculateDaysAdded uses full-time days for non-LTFT", () => {
    const result = calculateDaysAdded(
      {
        type: "OOPC"
      },
      11
    );

    expect(result).toBe(11);
  });

  it("calculateDaysAdded uses LTFT formula when type is LTFT", () => {
    const result = calculateDaysAdded(
      {
        type: "LTFT",
        endWte: 80
      },
      11
    );

    expect(result).toBe(2);
  });

  it("extendCctDateByDays adds whole days to date", () => {
    const result = extendCctDateByDays("2027-08-01", 11);

    expect(result).toBe("2027-08-12");
  });

  it("calculateNewCct adds extension days to the base date", () => {
    const result = calculateNewCct("2027-08-01", 2);

    expect(result).toBe("2027-08-03");
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
    const daysAdded = calculateDaysAdded(draft, fullTimeDays);
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

describe("removeLastCalculation", () => {
  it("returns programme end date if there are no calculations", () => {
    const result = removeLastCalculation([], "2027-08-01");

    expect(result).toEqual({
      updatedCalculations: [],
      newCctDate: "2027-08-01"
    });
  });

  it("resets cct date to programme end when removing the only calculation", () => {
    const result = removeLastCalculation(
      [makeChange({ resultingCctDate: "2027-08-15" })],
      "2027-08-01"
    );

    expect(result).toEqual({
      updatedCalculations: [],
      newCctDate: "2027-08-01"
    });
  });

  it("uses previous resulting cct date when removing the last of many", () => {
    const first = makeChange({ id: "calc-1", resultingCctDate: "2027-08-10" });
    const second = makeChange({ id: "calc-2", resultingCctDate: "2027-08-20" });

    const result = removeLastCalculation([first, second], "2027-08-01");

    expect(result.updatedCalculations).toEqual([first]);
    expect(result.newCctDate).toBe("2027-08-10");
  });
});
