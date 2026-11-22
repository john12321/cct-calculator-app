import {
  acceleratedTrainingTimeIssues,
  additionalTrainingTimeIssues,
  MAX_ACCELERATED_TRAINING_TIME_ENTRIES,
  MAX_ADDITIONAL_TRAINING_TIME_ENTRIES,
  MAX_TOTAL_ACCELERATED_MONTHS,
  MAX_TOTAL_ADDITIONAL_MONTHS,
  totalAcceleratedMonths,
  totalAdditionalMonths,
  validateAcceleratedTrainingTime,
  validateAdditionalTrainingTime,
  type AdditionalTrainingTime,
  type ProgrammeDetails,
  type ValidationResult
} from "../core";

// Note: what differs between the additional and accelerated time sections.
export type GradeTrainingTimeKind = {
  field: "additionalTrainingTime" | "acceleratedTrainingTime";
  label: "additional" | "accelerated";
  title: string;
  maxTotalMonths: number;
  maxEntries: number;
  intro: string;
  gradeHint: string;
  reasonPlaceholder: string;
  total: (programme: ProgrammeDetails) => number;
  validate: (
    candidate: AdditionalTrainingTime,
    programme: ProgrammeDetails,
    existing: AdditionalTrainingTime[]
  ) => ValidationResult;
  issues: (
    programme: ProgrammeDetails
  ) => { entry: AdditionalTrainingTime; message: string }[];
};

export const ADDITIONAL_TIME: GradeTrainingTimeKind = {
  field: "additionalTrainingTime",
  label: "additional",
  title: "Additional training time",
  maxTotalMonths: MAX_TOTAL_ADDITIONAL_MONTHS,
  maxEntries: MAX_ADDITIONAL_TRAINING_TIME_ENTRIES,
  intro:
    "Record any extra training time you have been given, for example after an ARCP outcome 3, against the grade it applies to. It moves that grade's end date and every later grade on. You can add time to as many grades as you need, up to 24 months in total.",
  gradeHint: "The grade the additional time was given in.",
  reasonPlaceholder: "e.g. Outcome 3 following ARCP",
  total: totalAdditionalMonths,
  validate: validateAdditionalTrainingTime,
  issues: additionalTrainingTimeIssues
};

export const ACCELERATED_TIME: GradeTrainingTimeKind = {
  field: "acceleratedTrainingTime",
  label: "accelerated",
  title: "Accelerated training time",
  maxTotalMonths: MAX_TOTAL_ACCELERATED_MONTHS,
  maxEntries: MAX_ACCELERATED_TRAINING_TIME_ENTRIES,
  intro:
    "Record any approved reduction in training time, for example for recognised prior learning, against the grade it applies to. It brings that grade's end date and every later grade forward. You can take time off as many grades as you need, up to 12 months in total.",
  gradeHint: "The grade the time is taken off.",
  reasonPlaceholder: "e.g. Recognised prior learning",
  total: totalAcceleratedMonths,
  validate: validateAcceleratedTrainingTime,
  issues: acceleratedTrainingTimeIssues
};
