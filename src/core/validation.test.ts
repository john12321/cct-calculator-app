import { describe, expect, it } from "vitest";
import type {
  PastChange,
  ProgrammeDetails,
  ProposedChange
} from "./calculationTypes";
import {
  validatePastChange,
  validateProgrammeDetails,
  validateProposedChange
} from "./validation";

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

const priorLtft: PastChange = {
  id: "earlier-ltft",
  type: "LTFT",
  startDate: "2021-01-01",
  endDate: "2021-06-30",
  wte: 60,
  countedAsTraining: true,
  notes: ""
};

describe("past change validation", () => {
  it("accepts adjacent non-overlapping historical changes", () => {
    const candidate: PastChange = {
      ...priorLtft,
      id: "later-ltft",
      startDate: "2021-07-01",
      endDate: "2021-12-31"
    };

    expect(validatePastChange(candidate, programme, [priorLtft])).toEqual({
      ok: true
    });
  });

  it("treats a shared boundary date as an overlap", () => {
    const candidate: PastChange = {
      ...priorLtft,
      id: "overlapping-ltft",
      startDate: priorLtft.endDate,
      endDate: "2021-12-31"
    };

    expect(validatePastChange(candidate, programme, [priorLtft])).toEqual({
      ok: false,
      message:
        "This change overlaps an existing change (01/01/2021 – 30/06/2021)."
    });
  });

  it.each([null, 0, 99.5, 100])("rejects an invalid LTFT WTE of %s", wte => {
    expect(validatePastChange({ ...priorLtft, wte }, programme, [])).toEqual({
      ok: false,
      message: "LTFT WTE must be a whole number between 1 and 99."
    });
  });

  it("allows an absence to omit a WTE value", () => {
    expect(
      validatePastChange(
        { ...priorLtft, type: "OOPC", wte: null, countedAsTraining: false },
        programme,
        []
      )
    ).toEqual({ ok: true });
  });

  it("credits OOPT only with fixed credit and enforces the 12-month maximum", () => {
    const oopt: PastChange = {
      ...priorLtft,
      type: "OOPT",
      startDate: "2020-01-01",
      endDate: "2020-12-31",
      wte: null,
      countedAsTraining: true
    };

    expect(validatePastChange(oopt, programme, [])).toEqual({ ok: true });
    expect(
      validatePastChange({ ...oopt, endDate: "2021-01-01" }, programme, [])
    ).toEqual({
      ok: false,
      message: "OOPT counted as training cannot be more than 12 months."
    });
  });

  it("requires a percentage for OOPR approved to count towards CCT", () => {
    const oopr: PastChange = {
      ...priorLtft,
      type: "OOPR",
      wte: 80,
      countedAsTraining: true
    };

    expect(validatePastChange(oopr, programme, [])).toEqual({ ok: true });
    expect(
      validatePastChange({ ...oopr, wte: null }, programme, [])
    ).toEqual({
      ok: false,
      message: "Approved OOPR credit must be a whole number between 1 and 100."
    });
  });

  it("does not allow other absence types to be counted as training", () => {
    expect(
      validatePastChange(
        { ...priorLtft, type: "OOPE", wte: null, countedAsTraining: true },
        programme,
        []
      )
    ).toEqual({
      ok: false,
      message: "Only LTFT, OOPT or approved OOPR can be counted as training."
    });
  });
});

describe("next post validation", () => {
  const laterAbsence: PastChange = {
    id: "later-absence",
    type: "OOPC",
    startDate: "2022-01-01",
    endDate: "2022-03-31",
    wte: null,
    countedAsTraining: false,
    notes: ""
  };

  it("requires the proposed next post to start after the latest past change", () => {
    const proposed: ProposedChange = {
      kind: "FULL_TIME",
      startDate: laterAbsence.endDate,
      wte: null
    };

    expect(
      validateProposedChange(proposed, programme, [laterAbsence, priorLtft])
    ).toEqual({
      ok: false,
      message:
        "Proposed start date must be after the latest past change (ends 31/03/2022)."
    });
  });

  it("accepts the day after the latest past change even when entries are unordered", () => {
    const proposed: ProposedChange = {
      kind: "LTFT",
      startDate: "2022-04-01",
      wte: 80
    };

    expect(
      validateProposedChange(proposed, programme, [laterAbsence, priorLtft])
    ).toEqual({ ok: true });
  });

  it("validates LTFT WTE for the proposed post", () => {
    expect(
      validateProposedChange(
        { kind: "LTFT", startDate: "2022-04-01", wte: 100 },
        programme,
        []
      )
    ).toEqual({
      ok: false,
      message: "LTFT WTE must be a whole number between 1 and 99."
    });
  });
});

describe("programme detail validation", () => {
  it("requires a reason when the specialty default start grade is overridden", () => {
    expect(
      validateProgrammeDetails({ ...programme, startGrade: "ST3" })
    ).toEqual({
      ok: false,
      message: "Please enter a reason for overriding the default start grade."
    });

    expect(
      validateProgrammeDetails({
        ...programme,
        startGrade: "ST3",
        startGradeOverrideNotes: "Approved entry point"
      })
    ).toEqual({ ok: true });
  });

  it("rejects unsupported selected special grade values", () => {
    expect(
      validateProgrammeDetails({
        ...programme,
        skippedGrade: "ST99",
        skippedGradeNotes: "Not in the grade list"
      })
    ).toEqual({
      ok: false,
      message: "Please choose the grade year to skip."
    });
  });

  it("restricts training-time adjustments to one decimal place", () => {
    expect(
      validateProgrammeDetails({
        ...programme,
        additionalMonths: 1.25,
        additionalMonthsNotes: "Recorded adjustment"
      })
    ).toEqual({
      ok: false,
      message: "Additional training time can have at most 1 decimal place."
    });
  });
});
