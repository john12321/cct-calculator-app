import { describe, expect, it } from "vitest";
import type {
  ProgrammeDetails,
  TrainingPeriod
} from "./calculationTypes";
import { validateTrainingPeriod } from "./validation";

const programme: ProgrammeDetails = {
  specialty: "Cardiology",
  startDate: "2020-01-01",
  lengthMonths: 120,
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
  id: "p1",
  type: "GRADE",
  grade: "ST4",
  gradeTag: "REGULAR",
  wte: 100,
  startDate: "2020-01-01",
  endDate: "2020-12-31",
  countedAsTraining: true,
  notes: "",
  ...overrides
});

describe("training period validation", () => {
  it("accepts a valid first grade period starting at programme start", () => {
    expect(validateTrainingPeriod(grade({}), programme, [])).toEqual({
      ok: true
    });
  });

  it("rejects a first period that does not start at programme start", () => {
    const candidate = grade({ startDate: "2020-01-02" });
    const result = validateTrainingPeriod(candidate, programme, []);
    expect(result.ok).toBe(false);
  });

  it("accepts a follow-on period starting the day after the prior end", () => {
    const prior = grade({ id: "p0", endDate: "2020-12-31" });
    const candidate = grade({
      id: "p1",
      startDate: "2021-01-01",
      endDate: "2021-12-31"
    });
    expect(validateTrainingPeriod(candidate, programme, [prior])).toEqual({
      ok: true
    });
  });

  it("rejects a gap between periods", () => {
    const prior = grade({ id: "p0", endDate: "2020-12-31" });
    const candidate = grade({
      id: "p1",
      startDate: "2021-01-03",
      endDate: "2021-12-31"
    });
    const result = validateTrainingPeriod(candidate, programme, [prior]);
    expect(result.ok).toBe(false);
  });

  it("rejects impossible typed dates", () => {
    expect(
      validateTrainingPeriod(grade({ startDate: "2020-02-31" }), programme, [])
    ).toEqual({
      ok: false,
      message: "Start date must be a real date."
    });

    expect(
      validateTrainingPeriod(grade({ endDate: "2020-02-31" }), programme, [])
    ).toEqual({
      ok: false,
      message: "End date must be a real date."
    });
  });

  it("rejects an overlap with the prior period", () => {
    const prior = grade({ id: "p0", endDate: "2020-12-31" });
    const candidate = grade({
      id: "p1",
      startDate: "2020-12-15",
      endDate: "2021-06-30"
    });
    const result = validateTrainingPeriod(candidate, programme, [prior]);
    expect(result.ok).toBe(false);
  });

  it("rejects end-before-start", () => {
    const candidate = grade({
      startDate: "2020-06-01",
      endDate: "2020-01-01"
    });
    expect(
      validateTrainingPeriod(candidate, programme, []).ok
    ).toBe(false);
  });

  it("rejects a GRADE row missing a grade", () => {
    const candidate = grade({ grade: "" });
    expect(
      validateTrainingPeriod(candidate, programme, []).ok
    ).toBe(false);
  });

  it("rejects an invalid grade value", () => {
    const candidate = grade({ grade: "ST99" });
    expect(
      validateTrainingPeriod(candidate, programme, []).ok
    ).toBe(false);
  });

  it("rejects grade WTE outside 1-100", () => {
    expect(
      validateTrainingPeriod(grade({ wte: 0 }), programme, []).ok
    ).toBe(false);
    expect(
      validateTrainingPeriod(grade({ wte: 101 }), programme, []).ok
    ).toBe(false);
    expect(
      validateTrainingPeriod(grade({ wte: null }), programme, []).ok
    ).toBe(false);
  });

  it("rejects non-integer WTE", () => {
    const candidate = grade({ wte: 50.5 });
    expect(
      validateTrainingPeriod(candidate, programme, []).ok
    ).toBe(false);
  });

  it("accepts a project-forward period with null endDate", () => {
    const candidate = grade({ endDate: null });
    expect(validateTrainingPeriod(candidate, programme, [])).toEqual({
      ok: true
    });
  });

  it("rejects adding after a project-forward period", () => {
    const prior = grade({ id: "p0", endDate: null });
    const candidate = grade({ id: "p1", startDate: "2021-01-01" });
    const result = validateTrainingPeriod(candidate, programme, [prior]);
    expect(result.ok).toBe(false);
  });

  it("records ordinary absences with no WTE and not counted as training", () => {
    const candidate: TrainingPeriod = {
      id: "p1",
      type: "SICK",
      grade: "",
      gradeTag: "REGULAR",
      wte: null,
      startDate: "2020-01-01",
      endDate: "2020-01-31",
      countedAsTraining: false,
      notes: ""
    };
    expect(validateTrainingPeriod(candidate, programme, [])).toEqual({
      ok: true
    });
    expect(
      validateTrainingPeriod({ ...candidate, countedAsTraining: true }, programme, [])
    ).toEqual({
      ok: false,
      message:
        "Only a grade period, OOPT or approved OOPR can be counted as training."
    });
  });

  it("credits OOPT without an editable WTE and limits counted time to 12 months", () => {
    const oopt: TrainingPeriod = {
      ...grade({
        type: "OOPT",
        grade: "",
        wte: null,
        endDate: "2020-12-31",
        countedAsTraining: true
      })
    };

    expect(validateTrainingPeriod(oopt, programme, [])).toEqual({ ok: true });
    expect(
      validateTrainingPeriod({ ...oopt, endDate: "2021-01-01" }, programme, [])
    ).toEqual({
      ok: false,
      message: "OOPT counted as training cannot be more than 12 months."
    });
  });

  it("requires a completed date range for OOPT counted as training", () => {
    const oopt = grade({
      type: "OOPT",
      grade: "",
      wte: null,
      endDate: null,
      countedAsTraining: true
    });

    expect(validateTrainingPeriod(oopt, programme, [])).toEqual({
      ok: false,
      message:
        "OOPT counted as training must have an end date so the 12-month limit can be checked."
    });
  });

  it("requires a CCT credit percentage for approved counted OOPR", () => {
    const oopr = grade({
      type: "OOPR",
      grade: "",
      wte: 80,
      countedAsTraining: true
    });

    expect(validateTrainingPeriod(oopr, programme, [])).toEqual({ ok: true });
    expect(
      validateTrainingPeriod({ ...oopr, wte: null }, programme, []).ok
    ).toBe(false);
  });

  it("allows an approved LTFT OOPR period beyond four calendar years", () => {
    const oopr = grade({
      type: "OOPR",
      grade: "",
      wte: 60,
      endDate: "2025-12-31",
      countedAsTraining: true
    });

    expect(validateTrainingPeriod(oopr, programme, [])).toEqual({ ok: true });
  });

  it("requires an end date for approved counted OOPR", () => {
    const oopr = grade({
      type: "OOPR",
      grade: "",
      wte: 60,
      endDate: null,
      countedAsTraining: true
    });

    expect(
      validateTrainingPeriod(oopr, programme, [])
    ).toEqual({
      ok: false,
      message:
        "OOPR counted as training must have an end date so approved credit can be calculated."
    });
  });
});
