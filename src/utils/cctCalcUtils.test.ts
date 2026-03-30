import { describe, expect, it } from "vitest";
import type { CalculationChange, DraftCalculation } from "../components/types";
import {
  performCalculation,
  removeLastCalculation,
  resolveCalculationBaseDate,
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

describe("resolveCalculationBaseDate", () => {
  const programmeEndDate = "2027-08-01";

  it("uses current cctDate for newly appended calculations", () => {
    const result = resolveCalculationBaseDate(
      null,
      [makeChange({ resultingCctDate: "2027-08-10" })],
      programmeEndDate,
      "2027-08-10"
    );

    expect(result).toBe("2027-08-10");
  });

  it("uses programme end date when editing the first calculation", () => {
    const result = resolveCalculationBaseDate(
      0,
      [makeChange({ resultingCctDate: "2027-08-10" })],
      programmeEndDate,
      "2027-08-10"
    );

    expect(result).toBe(programmeEndDate);
  });

  it("uses previous resultingCctDate when editing later calculations", () => {
    const changes = [
      makeChange({ id: "calc-1", resultingCctDate: "2027-08-10" }),
      makeChange({ id: "calc-2", resultingCctDate: "2027-08-20" })
    ];

    const result = resolveCalculationBaseDate(
      1,
      changes,
      programmeEndDate,
      "2027-08-20"
    );

    expect(result).toBe("2027-08-10");
  });

  it("falls back to programme end date if previous index is unavailable", () => {
    const result = resolveCalculationBaseDate(
      2,
      [makeChange({ resultingCctDate: "2027-08-10" })],
      programmeEndDate,
      "2027-08-20"
    );

    expect(result).toBe(programmeEndDate);
  });
});

describe("performCalculation", () => {
  it("calculates non-LTFT day difference and extends cct date", () => {
    const draft: DraftCalculation = {
      type: "OOPC",
      changeDate: "2026-01-01",
      endDate: "2026-01-11",
      untilEndOfProgramme: false
    };

    const result = performCalculation(draft, "2028-01-01", "2027-08-01");

    expect(result.completeCalculation.daysAdded).toBe(10);
    expect(result.newCctDate).toBe("2027-08-11");
    expect(result.completeCalculation.resultingCctDate).toBe("2027-08-11");
  });

  it("uses programme end date when untilEndOfProgramme is true", () => {
    const draft: DraftCalculation = {
      type: "OOPC",
      changeDate: "2026-01-01",
      untilEndOfProgramme: true
    };

    const result = performCalculation(draft, "2026-01-11", "2027-08-01");

    expect(result.completeCalculation.daysAdded).toBe(10);
    expect(result.newCctDate).toBe("2027-08-11");
  });

  it("falls back to programme end date if input cctDate is invalid", () => {
    const draft: DraftCalculation = {
      type: "OOPC",
      changeDate: "2026-01-01",
      endDate: "2026-01-11"
    };

    const result = performCalculation(draft, "2027-08-01", "");

    expect(result.newCctDate).toBe("2027-08-11");
  });

  it("applies LTFT WTE formula and rounds up added days", () => {
    const draft: DraftCalculation = {
      type: "LTFT",
      changeDate: "2026-01-01",
      endDate: "2026-01-11",
      startWte: 100,
      endWte: 80
    };

    const result = performCalculation(draft, "2028-01-01", "2027-08-01");

    expect(result.completeCalculation.daysAdded).toBe(3);
    expect(result.newCctDate).toBe("2027-08-04");
  });

  it("adds zero days when LTFT inputs are incomplete", () => {
    const draft: DraftCalculation = {
      type: "LTFT",
      changeDate: "2026-01-01",
      endDate: "2026-01-11",
      startWte: 100
    };

    const result = performCalculation(draft, "2028-01-01", "2027-08-01");

    expect(result.completeCalculation.daysAdded).toBe(0);
    expect(result.newCctDate).toBe("2027-08-01");
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
