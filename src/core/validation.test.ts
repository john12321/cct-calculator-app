import dayjs from "dayjs";
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

  it("accepts a completed change with future dates for what-if scenarios", () => {
    const futureProgramme: ProgrammeDetails = {
      ...programme,
      lengthMonths: 360
    };
    const candidate: PastChange = {
      ...priorLtft,
      id: "future-ltft",
      startDate: dayjs().add(30, "day").format("YYYY-MM-DD"),
      endDate: dayjs().add(90, "day").format("YYYY-MM-DD")
    };

    expect(validatePastChange(candidate, futureProgramme, [])).toEqual({
      ok: true
    });
  });

  it("allows later changes up to the current projected completion date", () => {
    const shorterProgramme: ProgrammeDetails = {
      ...programme,
      startDate: "2020-01-01",
      lengthMonths: 96
    };
    const parentalLeave: PastChange = {
      id: "parental-leave",
      type: "PARENTAL",
      startDate: "2026-01-01",
      endDate: "2026-12-31",
      wte: null,
      countedAsTraining: false,
      notes: ""
    };
    const laterChange: PastChange = {
      id: "later-change",
      type: "SICKNESS",
      startDate: "2028-01-01",
      endDate: "2028-06-30",
      wte: null,
      countedAsTraining: false,
      notes: ""
    };

    expect(validatePastChange(parentalLeave, shorterProgramme, [])).toEqual({
      ok: true
    });
    expect(
      validatePastChange(laterChange, shorterProgramme, [parentalLeave])
    ).toEqual({ ok: true });
  });

  it("does not let a change extend its own allowable date range", () => {
    const shorterProgramme: ProgrammeDetails = {
      ...programme,
      startDate: "2020-01-01",
      lengthMonths: 96
    };
    const tooLateAbsence: PastChange = {
      id: "too-late",
      type: "PARENTAL",
      startDate: "2028-01-01",
      endDate: "2028-12-31",
      wte: null,
      countedAsTraining: false,
      notes: ""
    };

    expect(validatePastChange(tooLateAbsence, shorterProgramme, [])).toEqual({
      ok: false,
      message:
        "Start date cannot be after the current projected Completion of Training Date (28/12/2027)."
    });
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

  it("allows only one latest LTFT change to project remaining training", () => {
    const projectedLtft: PastChange = {
      ...priorLtft,
      endDate: "",
      projectsRemainingTraining: true
    };

    expect(validatePastChange(projectedLtft, programme, [])).toEqual({
      ok: true
    });
    expect(
      validatePastChange(
        {
          ...projectedLtft,
          id: "other-ltft",
          startDate: "2021-07-01",
          endDate: ""
        },
        programme,
        [projectedLtft]
      )
    ).toEqual({
      ok: false,
      message: "Only one LTFT change can project the remaining training time."
    });
    expect(
      validatePastChange(projectedLtft, programme, [
        {
          ...priorLtft,
          id: "later-ltft",
          startDate: "2021-07-01",
          endDate: "2021-12-31"
        }
      ])
    ).toEqual({
      ok: false,
      message:
        "Projected change not added as it must begin after all other completed changes."
    });
  });

  it("explains when a dated change conflicts with an existing remainder projection", () => {
    const projectedLtft: PastChange = {
      ...priorLtft,
      startDate: "2026-08-25",
      endDate: "",
      projectsRemainingTraining: true
    };
    const datedChange: PastChange = {
      id: "dated-change",
      type: "PARENTAL",
      startDate: "2027-02-02",
      endDate: "2027-06-09",
      wte: null,
      countedAsTraining: false,
      notes: ""
    };

    expect(validatePastChange(datedChange, programme, [projectedLtft])).toEqual(
      {
        ok: false,
        message:
          "Change not added as you already have a projected change that covers the remainder of your training."
      }
    );
  });

  it("requires an end date for LTFT only when it is not projecting remaining training", () => {
    expect(
      validatePastChange({ ...priorLtft, endDate: "" }, programme, [])
    ).toEqual({
      ok: false,
      message: "Please enter both a start date and an end date."
    });
    expect(
      validatePastChange(
        {
          ...priorLtft,
          endDate: "",
          projectsRemainingTraining: true
        },
        programme,
        []
      )
    ).toEqual({ ok: true });
  });
});

describe("derived projection validation", () => {
  const laterAbsence: PastChange = {
    id: "later-absence",
    type: "OOPC",
    startDate: "2022-01-01",
    endDate: "2022-03-31",
    wte: null,
    countedAsTraining: false,
    notes: ""
  };

  it("requires the projection to start after the latest completed change", () => {
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
        "Proposed start date must be after the latest completed change (ends 31/03/2022)."
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
