import dayjs from "dayjs";
import { describe, expect, it } from "vitest";
import type {
  PastChange,
  ProgrammeDetails
} from "./calculationTypes";
import {
  acceleratedTrainingTimeIssues,
  EIGHTEEN_MONTH_FINAL_YEAR_MESSAGE,
  gradeProgressionAdjustmentIssues,
  validateAcceleratedTrainingTime,
  validateAdditionalTrainingTime,
  validatePastChange,
  validateProgrammeDetails
} from "./validation";

const programme: ProgrammeDetails = {
  specialty: "Cardiology",
  startDate: "2020-01-01",
  lengthMonths: 120,
  lengthOverrideNotes: "",
  additionalTrainingTime: [],
  acceleratedTrainingTime: [],
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

  it("rejects impossible typed dates", () => {
    expect(
      validatePastChange(
        { ...priorLtft, startDate: "2021-02-31" },
        programme,
        []
      )
    ).toEqual({
      ok: false,
      message: "Start date must be a real date."
    });

    expect(
      validatePastChange({ ...priorLtft, endDate: "2021-02-31" }, programme, [])
    ).toEqual({
      ok: false,
      message: "End date must be a real date."
    });
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

describe("programme detail validation", () => {
  it("rejects an impossible programme start date", () => {
    expect(
      validateProgrammeDetails({ ...programme, startDate: "2020-02-31" })
    ).toEqual({
      ok: false,
      message: "Programme start date must be a real date."
    });
  });

  it("requires a reason when the specialty default start grade is overridden", () => {
    expect(
      validateProgrammeDetails({
        ...programme,
        lengthMonths: 60,
        startGrade: "ST3"
      })
    ).toEqual({
      ok: false,
      message: "Please enter a reason for overriding the default start grade."
    });

    expect(
      validateProgrammeDetails({
        ...programme,
        lengthMonths: 60,
        startGrade: "ST3",
        startGradeOverrideNotes: "Approved entry point"
      })
    ).toEqual({ ok: true });
  });

  it("requires a reason when the specialty default length is overridden", () => {
    expect(
      validateProgrammeDetails({ ...programme, lengthMonths: 60 })
    ).toEqual({ ok: true });

    expect(
      validateProgrammeDetails({ ...programme, lengthMonths: 72 })
    ).toEqual({
      ok: false,
      message: "Please enter a reason for a different programme length."
    });

    expect(
      validateProgrammeDetails({
        ...programme,
        lengthMonths: 72,
        lengthOverrideNotes: "Agreed with my local office"
      })
    ).toEqual({ ok: true });
  });

  it("requires a whole programme length between 1 and 120 months", () => {
    for (const lengthMonths of [0, 121, 60.5, Number.NaN]) {
      expect(
        validateProgrammeDetails({
          ...programme,
          lengthMonths,
          lengthOverrideNotes: "Agreed with my local office"
        })
      ).toEqual({
        ok: false,
        message:
          "Programme length must be a whole number of months between 1 and 120."
      });
    }
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

  it("requires training time to be a whole number of months between 1 and 24", () => {
    for (const months of [0, 25, 1.5, Number.NaN]) {
      expect(
        validateAdditionalTrainingTime(
          { id: "a", grade: "ST4", months, notes: "Recorded adjustment" },
          programme,
          []
        )
      ).toEqual({
        ok: false,
        message: "Enter a whole number of months between 1 and 24."
      });
    }
  });

  it("limits a training time reason to 1000 characters", () => {
    const entry = (notes: string) => ({
      id: "a",
      grade: "ST4",
      months: 1,
      notes
    });

    expect(
      validateAdditionalTrainingTime(entry("x".repeat(1000)), programme, [])
    ).toEqual({ ok: true });
    expect(
      validateAdditionalTrainingTime(entry("x".repeat(1001)), programme, [])
    ).toEqual({
      ok: false,
      message:
        "The reason for the additional training time must be 1000 characters or less."
    });
  });
});

describe("accelerated training time per grade", () => {
  const st1Programme = (lengthMonths: number): ProgrammeDetails => ({
    ...programme,
    startGrade: "ST1",
    lengthMonths
  });
  const entry = (id: string, grade: string, months: number) => ({
    id,
    grade,
    months,
    notes: "Recognised prior learning"
  });

  it.each([
    [84, "ST2", 12],
    [90, "ST8", 6]
  ])(
    "rejects accelerated time that fills the grade (%i months, %s)",
    (lengthMonths, grade, gradeMonths) => {
      expect(
        validateAcceleratedTrainingTime(
          entry("second", grade, 1),
          st1Programme(lengthMonths),
          [entry("first", grade, gradeMonths - 1)]
        )
      ).toEqual({
        ok: false,
        message: `Accelerated training time in ${grade} must be less than ${gradeMonths} months.`
      });
    }
  );

  it("allows accelerated time less than the grade and its additional time", () => {
    expect(
      validateAcceleratedTrainingTime(
        entry("a", "ST2", 12),
        {
          ...st1Programme(84),
          additionalTrainingTime: [entry("b", "ST2", 1)]
        },
        []
      )
    ).toEqual({ ok: true });
  });

  it("flags saved accelerated time when the additional time on its grade is removed", () => {
    const accelerated = entry("a", "ST2", 12);

    expect(
      acceleratedTrainingTimeIssues({
        ...st1Programme(84),
        acceleratedTrainingTime: [accelerated]
      })
    ).toEqual([
      {
        entry: accelerated,
        message: "Accelerated training time in ST2 must be less than 12 months."
      }
    ]);
  });

  it("flags only the first saved accelerated entry on an over-limit grade", () => {
    const first = entry("a", "ST2", 6);

    expect(
      acceleratedTrainingTimeIssues({
        ...st1Programme(84),
        acceleratedTrainingTime: [first, entry("b", "ST2", 6)]
      })
    ).toEqual([
      {
        entry: first,
        message: "Accelerated training time in ST2 must be less than 12 months."
      }
    ]);
  });
});

describe("grade progression adjustment issues", () => {
  const withChoices: ProgrammeDetails = {
    ...programme,
    lengthMonths: 66,
    skippedGrade: "ST5",
    skippedGradeNotes: "Progressed early",
    eighteenMonthFinalGrade: "ST9",
    eighteenMonthFinalGradeNotes: "Dual specialty"
  };

  it("accepts choices within the grade progression", () => {
    expect(gradeProgressionAdjustmentIssues(withChoices)).toEqual([]);
  });

  it("flags choices the progression no longer reaches after the start grade changes", () => {
    expect(
      gradeProgressionAdjustmentIssues({
        ...withChoices,
        startGrade: "CT1",
        lengthMonths: 24
      })
    ).toEqual([
      {
        label: "Skipped grade year",
        grade: "ST5",
        message: "ST5 is not part of this programme's grade progression."
      },
      {
        label: "18-month final year",
        grade: "ST9",
        message: "ST9 is not part of this programme's grade progression."
      }
    ]);
  });

  it.each([
    [90, "ST5"],
    [90, "ST8"],
    [84, "ST7"]
  ])(
    "flags an 18-month final year that isn't the last full year before a half year (%i months, %s)",
    (lengthMonths, grade) => {
      expect(
        gradeProgressionAdjustmentIssues({
          ...programme,
          startGrade: "ST1",
          lengthMonths,
          eighteenMonthFinalGrade: grade,
          eighteenMonthFinalGradeNotes: "Dual CCT"
        })
      ).toEqual([
        {
          label: "18-month final year",
          grade,
          message: EIGHTEEN_MONTH_FINAL_YEAR_MESSAGE
        }
      ]);
    }
  );

  it("accepts an 18-month final year on the last full year before a half year", () => {
    expect(
      gradeProgressionAdjustmentIssues({
        ...programme,
        startGrade: "ST1",
        lengthMonths: 90,
        eighteenMonthFinalGrade: "ST7",
        eighteenMonthFinalGradeNotes: "Dual CCT"
      })
    ).toEqual([]);
  });

  it("flags an 18-month final year on the skipped grade", () => {
    expect(
      gradeProgressionAdjustmentIssues({
        ...withChoices,
        eighteenMonthFinalGrade: "ST5"
      })
    ).toEqual([
      {
        label: "18-month final year",
        grade: "ST5",
        message: "ST5 is not part of this programme's grade progression."
      }
    ]);
  });
});
