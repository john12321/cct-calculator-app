import dayjs from "dayjs";
import type {
  AcceleratedTrainingTime,
  AdditionalTrainingTime,
  PastChange,
  ProgrammeDetails,
  TrainingPeriod
} from "./calculationTypes";
import {
  completedPastChanges,
  programmeAdjustedLengthMonths
} from "./calculations";
import { calculateCct } from "./cctEngine";
import {
  computeGradeProgressionForSegments,
  endsInEighteenMonthYear,
  programmeGrades
} from "./grades";
import { TRAINING_GRADES, findSpecialty } from "./specialties";

export type ValidationResult = { ok: true } | { ok: false; message: string };

const ok: ValidationResult = { ok: true };
const err = (message: string): ValidationResult => ({ ok: false, message });

const formatDate = (date: string) => dayjs(date).format("DD/MM/YYYY");
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const isRealIsoDate = (date: string): boolean =>
  ISO_DATE_RE.test(date) &&
  dayjs(date).isValid() &&
  dayjs(date).format("YYYY-MM-DD") === date;

const currentCompletionDateBeforeChange = (
  candidate: PastChange,
  programme: ProgrammeDetails,
  existing: PastChange[]
): string => {
  const priorChanges = completedPastChanges(existing).filter(
    change =>
      change.id !== candidate.id &&
      dayjs(change.endDate).isBefore(dayjs(candidate.startDate))
  );
  return calculateCct(programme, priorChanges).result.cctDate;
};

export const validatePastChange = (
  candidate: PastChange,
  programme: ProgrammeDetails,
  existing: PastChange[]
): ValidationResult => {
  const projectsRemainingTraining =
    candidate.projectsRemainingTraining === true;
  if (
    !candidate.startDate ||
    (!projectsRemainingTraining && !candidate.endDate)
  ) {
    return err("Please enter both a start date and an end date.");
  }
  if (!isRealIsoDate(candidate.startDate)) {
    return err("Start date must be a real date.");
  }
  if (candidate.endDate && !isRealIsoDate(candidate.endDate)) {
    return err("End date must be a real date.");
  }

  if (
    candidate.endDate &&
    dayjs(candidate.startDate).isAfter(dayjs(candidate.endDate))
  ) {
    return err("Start date cannot be after end date.");
  }

  if (dayjs(candidate.startDate).isBefore(dayjs(programme.startDate))) {
    return err(
      `Start date cannot be before programme start (${formatDate(programme.startDate)}).`
    );
  }

  const currentCompletionDate = currentCompletionDateBeforeChange(
    candidate,
    programme,
    existing
  );

  if (dayjs(candidate.startDate).isAfter(dayjs(currentCompletionDate))) {
    return err(
      `Start date cannot be after the current projected Completion of Training Date (${formatDate(currentCompletionDate)}).`
    );
  }

  if (
    candidate.endDate &&
    dayjs(candidate.endDate).isAfter(dayjs(currentCompletionDate))
  ) {
    return err(
      `End date cannot be after the current projected Completion of Training Date (${formatDate(currentCompletionDate)}).`
    );
  }

  if (candidate.type === "LTFT") {
    if (
      candidate.wte == null ||
      candidate.wte < 1 ||
      candidate.wte > 99 ||
      !Number.isInteger(candidate.wte)
    ) {
      return err("LTFT WTE must be a whole number between 1 and 99.");
    }
    if (!candidate.countedAsTraining) {
      return err("LTFT periods must be counted as training.");
    }
  } else if (candidate.type === "OOPR" && candidate.countedAsTraining) {
    if (
      candidate.wte == null ||
      candidate.wte < 1 ||
      candidate.wte > 100 ||
      !Number.isInteger(candidate.wte)
    ) {
      return err(
        "Approved OOPR credit must be a whole number between 1 and 100."
      );
    }
  } else if (candidate.wte !== null) {
    return err(
      "WTE can only be entered for LTFT or approved OOPR counted as training."
    );
  }

  if (projectsRemainingTraining && candidate.type !== "LTFT") {
    return err("Only LTFT changes can be used to project remaining training.");
  }

  if (
    candidate.type !== "LTFT" &&
    candidate.type !== "OOPT" &&
    candidate.type !== "OOPR" &&
    candidate.countedAsTraining
  ) {
    return err("Only LTFT, OOPT or approved OOPR can be counted as training.");
  }

  if (candidate.type === "OOPT" && candidate.countedAsTraining) {
    const maximumEndDate = dayjs(candidate.startDate)
      .add(12, "month")
      .subtract(1, "day");
    if (dayjs(candidate.endDate).isAfter(maximumEndDate)) {
      return err("OOPT counted as training cannot be more than 12 months.");
    }
  }

  for (const other of existing) {
    if (other.id === candidate.id) continue;
    if (projectsRemainingTraining && other.projectsRemainingTraining) {
      return err(
        "Only one LTFT change can project the remaining training time."
      );
    }
    if (projectsRemainingTraining) {
      if (!dayjs(candidate.startDate).isAfter(dayjs(other.endDate))) {
        return err(
          "Projected change not added as it must begin after all other completed changes."
        );
      }
      continue;
    }
    if (other.projectsRemainingTraining) {
      if (!dayjs(candidate.endDate).isBefore(dayjs(other.startDate))) {
        return err(
          "Change not added as you already have a projected change that covers the remainder of your training."
        );
      }
      continue;
    }
    const overlaps =
      !dayjs(candidate.endDate).isBefore(dayjs(other.startDate)) &&
      !dayjs(candidate.startDate).isAfter(dayjs(other.endDate));
    if (overlaps) {
      return err(
        `This change overlaps an existing change (${formatDate(other.startDate)} – ${formatDate(other.endDate)}).`
      );
    }
  }

  return ok;
};

export const MAX_TOTAL_ADDITIONAL_MONTHS = 24;
export const MAX_ADDITIONAL_TRAINING_TIME_ENTRIES = 20;
// Note: 12 follows Excel's on-screen prompt for I11.
export const MAX_TOTAL_ACCELERATED_MONTHS = 12;
export const MAX_ACCELERATED_TRAINING_TIME_ENTRIES = 20;
export const MAX_TRAINING_TIME_NOTES_LENGTH = 1000;

type TrainingTimeEntryRules = {
  label: "additional" | "accelerated";
  maxTotalMonths: number;
  maxEntries: number;
};

const validateTrainingTimeEntry = (
  candidate: AdditionalTrainingTime | AcceleratedTrainingTime,
  programme: ProgrammeDetails,
  existing: (AdditionalTrainingTime | AcceleratedTrainingTime)[],
  { label, maxTotalMonths, maxEntries }: TrainingTimeEntryRules
): ValidationResult => {
  if (!candidate.grade) {
    return err(`Please choose the grade the ${label} time applies to.`);
  }
  if (!programmeGrades(programme).includes(candidate.grade)) {
    return err(
      `${candidate.grade} is not part of this programme's grade progression.`
    );
  }
  if (
    !Number.isInteger(candidate.months) ||
    candidate.months < 1 ||
    candidate.months > 24
  ) {
    return err("Enter a whole number of months between 1 and 24.");
  }
  if (!candidate.notes.trim()) {
    return err(`Please enter a reason for the ${label} training time.`);
  }
  if (candidate.notes.trim().length > MAX_TRAINING_TIME_NOTES_LENGTH) {
    return err(
      `The reason for the ${label} training time must be ${MAX_TRAINING_TIME_NOTES_LENGTH} characters or less.`
    );
  }
  const others = existing.filter(entry => entry.id !== candidate.id);
  if (others.length + 1 > maxEntries) {
    return err(
      `You cannot add more than ${maxEntries} ${label} training time entries.`
    );
  }
  const total = others.reduce(
    (sum, entry) => sum + entry.months,
    candidate.months
  );
  if (total > maxTotalMonths) {
    return err(
      `Total ${label} training time cannot be more than ${maxTotalMonths} months.`
    );
  }
  return ok;
};

const ADDITIONAL_RULES: TrainingTimeEntryRules = {
  label: "additional",
  maxTotalMonths: MAX_TOTAL_ADDITIONAL_MONTHS,
  maxEntries: MAX_ADDITIONAL_TRAINING_TIME_ENTRIES
};

const ACCELERATED_RULES: TrainingTimeEntryRules = {
  label: "accelerated",
  maxTotalMonths: MAX_TOTAL_ACCELERATED_MONTHS,
  maxEntries: MAX_ACCELERATED_TRAINING_TIME_ENTRIES
};

export const validateAdditionalTrainingTime = (
  candidate: AdditionalTrainingTime,
  programme: ProgrammeDetails,
  existing: AdditionalTrainingTime[]
): ValidationResult =>
  validateTrainingTimeEntry(candidate, programme, existing, ADDITIONAL_RULES);

const monthsOnGrade = (
  entries: (AdditionalTrainingTime | AcceleratedTrainingTime)[],
  grade: string
) =>
  entries
    .filter(entry => entry.grade === grade)
    .reduce((total, entry) => total + entry.months, 0);

export const validateAcceleratedTrainingTime = (
  candidate: AcceleratedTrainingTime,
  programme: ProgrammeDetails,
  existing: AcceleratedTrainingTime[]
): ValidationResult => {
  const result = validateTrainingTimeEntry(
    candidate,
    programme,
    existing,
    ACCELERATED_RULES
  );
  if (!result.ok) return result;
  const gradeMonths = computeGradeProgressionForSegments(programme, [])
    .filter(row => row.grade === candidate.grade)
    .reduce((total, row) => total + row.gradeMonths, 0);
  const limit =
    Math.round(
      (gradeMonths +
        monthsOnGrade(programme.additionalTrainingTime, candidate.grade)) *
        10
    ) / 10;
  const accelerated = monthsOnGrade(
    [...existing.filter(entry => entry.id !== candidate.id), candidate],
    candidate.grade
  );
  if (Math.round(accelerated * 10) / 10 >= limit) {
    return err(
      `Accelerated training time in ${candidate.grade} must be less than ${limit} months.`
    );
  }
  return ok;
};

// Note: entries can become invalid when the programme details change after they were added.
export const additionalTrainingTimeIssues = (
  programme: ProgrammeDetails
): { entry: AdditionalTrainingTime; message: string }[] =>
  programme.additionalTrainingTime.flatMap(entry => {
    const result = validateAdditionalTrainingTime(
      entry,
      programme,
      programme.additionalTrainingTime
    );
    return result.ok ? [] : [{ entry, message: result.message }];
  });

export const acceleratedTrainingTimeIssues = (
  programme: ProgrammeDetails
): { entry: AcceleratedTrainingTime; message: string }[] =>
  programme.acceleratedTrainingTime.flatMap(entry => {
    const result = validateAcceleratedTrainingTime(
      entry,
      programme,
      programme.acceleratedTrainingTime
    );
    return result.ok ? [] : [{ entry, message: result.message }];
  });

// Note: the grades a skipped year can be set on.
export const skippableGrades = (programme: ProgrammeDetails): string[] =>
  programmeGrades({
    ...programme,
    skippedGrade: "",
    eighteenMonthFinalGrade: ""
  });

export const EIGHTEEN_MONTH_FINAL_YEAR_MESSAGE =
  "An 18-month final year must be the last full year of a programme length that includes a half year, such as 66 months.";

// Note: choices can become invalid when the programme details change after they were made.
export const gradeProgressionAdjustmentIssues = (
  programme: ProgrammeDetails
): { label: string; grade: string; message: string }[] => {
  const issues: { label: string; grade: string; message: string }[] = [];
  if (
    programme.skippedGrade &&
    !skippableGrades(programme).includes(programme.skippedGrade)
  ) {
    issues.push({
      label: "Skipped grade year",
      grade: programme.skippedGrade,
      message: `${programme.skippedGrade} is not part of this programme's grade progression.`
    });
  }
  if (
    programme.eighteenMonthFinalGrade &&
    !programmeGrades({ ...programme, eighteenMonthFinalGrade: "" }).includes(
      programme.eighteenMonthFinalGrade
    )
  ) {
    issues.push({
      label: "18-month final year",
      grade: programme.eighteenMonthFinalGrade,
      message: `${programme.eighteenMonthFinalGrade} is not part of this programme's grade progression.`
    });
  } else if (
    programme.eighteenMonthFinalGrade &&
    !endsInEighteenMonthYear(programme)
  ) {
    issues.push({
      label: "18-month final year",
      grade: programme.eighteenMonthFinalGrade,
      message: EIGHTEEN_MONTH_FINAL_YEAR_MESSAGE
    });
  }
  return issues;
};

export const validateProgrammeDetails = (
  programme: ProgrammeDetails
): ValidationResult => {
  if (!programme.specialty.trim()) return err("Please choose a specialty.");
  if (!programme.startDate) return err("Please enter a programme start date.");
  if (!isRealIsoDate(programme.startDate)) {
    return err("Programme start date must be a real date.");
  }
  if (
    !Number.isInteger(programme.lengthMonths) ||
    programme.lengthMonths < 1 ||
    programme.lengthMonths > 120
  ) {
    return err(
      "Programme length must be a whole number of months between 1 and 120."
    );
  }
  if (programmeAdjustedLengthMonths(programme) <= 0) {
    return err("Adjusted training duration must be greater than zero.");
  }
  if (
    programme.eighteenMonthFinalGrade &&
    !TRAINING_GRADES.includes(
      programme.eighteenMonthFinalGrade as (typeof TRAINING_GRADES)[number]
    )
  ) {
    return err("Please choose the grade with an 18-month final year.");
  }
  if (
    programme.eighteenMonthFinalGrade &&
    !programme.eighteenMonthFinalGradeNotes.trim()
  ) {
    return err("Please enter a reason for the 18-month final year.");
  }
  if (
    programme.skippedGrade &&
    !TRAINING_GRADES.includes(
      programme.skippedGrade as (typeof TRAINING_GRADES)[number]
    )
  ) {
    return err("Please choose the grade year to skip.");
  }
  if (programme.skippedGrade && !programme.skippedGradeNotes.trim()) {
    return err("Please enter a reason for skipping a grade year.");
  }
  if (!programme.startGrade.trim()) return err("Please choose a start grade.");
  const specialty = findSpecialty(programme.specialty);
  if (
    specialty !== undefined &&
    programme.lengthMonths !== specialty.lengthMonths &&
    !programme.lengthOverrideNotes.trim()
  ) {
    return err("Please enter a reason for a different programme length.");
  }
  if (
    specialty !== undefined &&
    programme.startGrade !== specialty.entryGrade &&
    !programme.startGradeOverrideNotes.trim()
  ) {
    return err("Please enter a reason for overriding the default start grade.");
  }
  return ok;
};

const validateGradeFields = (candidate: TrainingPeriod): ValidationResult => {
  if (!candidate.grade.trim()) {
    return err("Please choose a grade.");
  }
  if (
    !TRAINING_GRADES.includes(
      candidate.grade as (typeof TRAINING_GRADES)[number]
    )
  ) {
    return err("Please choose a valid grade.");
  }
  return ok;
};

const validateWte = (wte: number | null): ValidationResult => {
  if (wte == null || !Number.isInteger(wte) || wte < 1 || wte > 100) {
    return err("WTE must be a whole number between 1 and 100.");
  }
  return ok;
};

// Note: a period's own checks, independent of position; contiguity is separate.
export const validateTrainingPeriodFields = (
  candidate: TrainingPeriod
): ValidationResult => {
  if (!candidate.startDate) {
    return err("Please enter a start date.");
  }
  if (!isRealIsoDate(candidate.startDate)) {
    return err("Start date must be a real date.");
  }
  if (candidate.endDate !== null && !isRealIsoDate(candidate.endDate)) {
    return err("End date must be a real date.");
  }
  if (
    candidate.endDate !== null &&
    dayjs(candidate.endDate).isBefore(dayjs(candidate.startDate))
  ) {
    return err("End date cannot be before start date.");
  }

  if (
    candidate.type === "GRADE" ||
    (candidate.type === "OOPR" && candidate.countedAsTraining)
  ) {
    if (candidate.type === "GRADE") {
      const gradeResult = validateGradeFields(candidate);
      if (!gradeResult.ok) return gradeResult;
    }
    const wteResult = validateWte(candidate.wte);
    if (!wteResult.ok) return wteResult;
  } else if (candidate.wte !== null) {
    return err(
      "WTE can only be entered for a grade period or approved OOPR counted as training."
    );
  }

  if (
    candidate.type !== "GRADE" &&
    candidate.type !== "OOPT" &&
    candidate.type !== "OOPR" &&
    candidate.countedAsTraining
  ) {
    return err(
      "Only a grade period, OOPT or approved OOPR can be counted as training."
    );
  }

  if (candidate.type === "OOPT" && candidate.countedAsTraining) {
    if (candidate.endDate === null) {
      return err(
        "OOPT counted as training must have an end date so the 12-month limit can be checked."
      );
    }
    const maximumEndDate = dayjs(candidate.startDate)
      .add(12, "month")
      .subtract(1, "day");
    if (dayjs(candidate.endDate).isAfter(maximumEndDate)) {
      return err("OOPT counted as training cannot be more than 12 months.");
    }
  }

  if (candidate.type === "OOPR" && candidate.countedAsTraining) {
    if (candidate.endDate === null) {
      return err(
        "OOPR counted as training must have an end date so approved credit can be calculated."
      );
    }
  }

  return ok;
};

// Note: checks the period starts the day after the prior one (programme start if first).
const validateTrainingPeriodContiguity = (
  candidate: TrainingPeriod,
  programme: ProgrammeDetails,
  priorPeriods: TrainingPeriod[]
): ValidationResult => {
  const priorEndDate = priorPeriods.at(-1)?.endDate ?? null;
  if (priorPeriods.length > 0 && priorEndDate === null) {
    return err(
      "The previous period projects forward to find the completion date. Edit it to set an end date before adding more."
    );
  }

  const expectedStart =
    priorPeriods.length === 0
      ? programme.startDate
      : dayjs(priorEndDate).add(1, "day").format("YYYY-MM-DD");

  if (!dayjs(candidate.startDate).isSame(dayjs(expectedStart), "day")) {
    return err(
      `Start date must be ${formatDate(expectedStart)} to keep the training record contiguous.`
    );
  }

  return ok;
};

export const validateTrainingPeriod = (
  candidate: TrainingPeriod,
  programme: ProgrammeDetails,
  priorPeriods: TrainingPeriod[]
): ValidationResult => {
  const fieldsResult = validateTrainingPeriodFields(candidate);
  if (!fieldsResult.ok) return fieldsResult;
  return validateTrainingPeriodContiguity(candidate, programme, priorPeriods);
};

export type TimelineIssue = {
  id: string;
  index: number;
  message: string;
};

export type TimelineValidation = {
  // Note: period id -> first error, for per-row styling.
  rowErrors: Record<string, string>;
  // Note: issues in timeline order, for the summary box.
  issues: TimelineIssue[];
};

// Note: validates each row against the rows before it, so every gap/overlap is flagged.
export const validateTimeline = (
  programme: ProgrammeDetails,
  timeline: TrainingPeriod[]
): TimelineValidation => {
  const rowErrors: Record<string, string> = {};
  const issues: TimelineIssue[] = [];

  timeline.forEach((period, index) => {
    const result = validateTrainingPeriod(
      period,
      programme,
      timeline.slice(0, index)
    );
    if (!result.ok) {
      rowErrors[period.id] = result.message;
      issues.push({ id: period.id, index, message: result.message });
    }
  });

  return { rowErrors, issues };
};

// Note: start date an inserted period needs to close the earliest gap; null if none to fill.
export const firstContiguityGapStart = (
  programme: ProgrammeDetails,
  timeline: TrainingPeriod[]
): string | null => {
  for (let i = 0; i < timeline.length; i++) {
    const priorEnd = i === 0 ? null : timeline[i - 1].endDate;
    if (i > 0 && priorEnd === null) return null;
    const expected =
      i === 0
        ? programme.startDate
        : dayjs(priorEnd).add(1, "day").format("YYYY-MM-DD");
    if (!dayjs(timeline[i].startDate).isSame(dayjs(expected), "day")) {
      return expected;
    }
  }
  return null;
};
