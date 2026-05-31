import { describe, expect, it } from "vitest";
import { INVALID_DATE_VALUE, toIsoDate } from "./dateInputUtils";

describe("toIsoDate", () => {
  it("builds an ISO date from a full 4-digit year", () => {
    expect(toIsoDate("5", "3", "2022")).toBe("2022-03-05");
  });

  it("expands a 2-digit year to a 20xx year", () => {
    expect(toIsoDate("5", "3", "22")).toBe("2022-03-05");
  });

  it("treats a 2-digit year and its expanded form identically", () => {
    expect(toIsoDate("5", "3", "22")).toBe(toIsoDate("5", "3", "2022"));
  });

  it("rejects a 1- or 3-digit year as invalid", () => {
    expect(toIsoDate("5", "3", "2")).toBe(INVALID_DATE_VALUE);
    expect(toIsoDate("5", "3", "202")).toBe(INVALID_DATE_VALUE);
  });

  it("returns an empty string when all parts are empty", () => {
    expect(toIsoDate("", "", "")).toBe("");
  });

  it("returns an empty string when only some parts are filled", () => {
    expect(toIsoDate("5", "", "22")).toBe("");
  });
});
