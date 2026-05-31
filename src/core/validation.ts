import dayjs from "dayjs";
import type {
  PastChange,
  ProgrammeDetails,
  ProposedChange,
  TrainingPeriod
} from "./calculationTypes";
import {
  completedPastChanges,
  computeWteAccrual,
  deriveQuickProjection,
  programmeAdjustedEndDate,
  programmeAdjustedLengthMonths,
  projectedCompletionDate
} from "./calculations";
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
  const projection = deriveQuickProjection(programme, priorChanges);
  const accrual = computeWteAccrual(
    programme,
    priorChanges,
    projection.startDate
  );
  return projectedCompletionDate(projection, accrual.monthsRemaining);
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

export const validateProposedChange = (
  proposed: ProposedChange,
  programme: ProgrammeDetails,
  pastChanges: PastChange[]
): ValidationResult => {
  if (!proposed.startDate) {
    return err("Please enter a projection start date.");
  }
  if (!isRealIsoDate(proposed.startDate)) {
    return err("Projection start date must be a real date.");
  }

  if (dayjs(proposed.startDate).isBefore(dayjs(programme.startDate))) {
    return err(
      `Start date cannot be before programme start (${formatDate(programme.startDate)}).`
    );
  }

  const programmeEnd = programmeAdjustedEndDate(programme);
  const programmeEndLabel =
    programme.additionalMonths > 0 || programme.acceleratedMonths > 0
      ? "adjusted programme end"
      : "original programme end";
  if (dayjs(proposed.startDate).isAfter(dayjs(programmeEnd))) {
    return err(
      `Proposed start date cannot be after the ${programmeEndLabel} (${formatDate(programmeEnd)}).`
    );
  }

  const completedChanges = completedPastChanges(pastChanges);
  if (completedChanges.length > 0) {
    const latest = completedChanges.reduce(
      (acc, p) => (dayjs(p.endDate).isAfter(dayjs(acc.endDate)) ? p : acc),
      completedChanges[0]
    );
    if (!dayjs(proposed.startDate).isAfter(dayjs(latest.endDate))) {
      return err(
        `Proposed start date must be after the latest completed change (ends ${formatDate(latest.endDate)}).`
      );
    }
  }

  if (proposed.kind === "LTFT") {
    if (
      proposed.wte == null ||
      proposed.wte < 1 ||
      proposed.wte > 99 ||
      !Number.isInteger(proposed.wte)
    ) {
      return err("LTFT WTE must be a whole number between 1 and 99.");
    }
  }

  return ok;
};

export const validateProgrammeDetails = (
  programme: ProgrammeDetails
): ValidationResult => {
  if (!programme.specialty.trim()) return err("Please choose a specialty.");
  if (!programme.startDate) return err("Please enter a programme start date.");
  if (!isRealIsoDate(programme.startDate)) {
    return err("Programme start date must be a real date.");
  }
  if (!Number.isFinite(programme.lengthMonths) || programme.lengthMonths <= 0) {
    return err("Programme length must be greater than zero.");
  }
  const rounded = Math.round(programme.lengthMonths * 10) / 10;
  if (rounded !== programme.lengthMonths) {
    return err("Programme length can have at most 1 decimal place.");
  }
  if (!Number.isFinite(programme.additionalMonths)) {
    return err("Please enter additional training time in months.");
  }
  if (programme.additionalMonths < 0) {
    return err("Additional training time cannot be less than zero.");
  }
  if (programme.additionalMonths > 24) {
    return err("Additional training time cannot be more than 24 months.");
  }
  const roundedAdditional = Math.round(programme.additionalMonths * 10) / 10;
  if (roundedAdditional !== programme.additionalMonths) {
    return err("Additional training time can have at most 1 decimal place.");
  }
  if (
    programme.additionalMonths > 0 &&
    !programme.additionalMonthsNotes.trim()
  ) {
    return err("Please enter a reason for additional training time.");
  }
  if (!Number.isFinite(programme.acceleratedMonths)) {
    return err("Please enter accelerated training time in months.");
  }
  if (programme.acceleratedMonths < 0) {
    return err("Accelerated training time cannot be less than zero.");
  }
  if (programme.acceleratedMonths > 12) {
    return err("Accelerated training time cannot be more than 12 months.");
  }
  const roundedAccelerated = Math.round(programme.acceleratedMonths * 10) / 10;
  if (roundedAccelerated !== programme.acceleratedMonths) {
    return err("Accelerated training time can have at most 1 decimal place.");
  }
  if (
    programme.acceleratedMonths > 0 &&
    !programme.acceleratedMonthsNotes.trim()
  ) {
    return err("Please enter a reason for accelerated training time.");
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

export const validateTrainingPeriod = (
  candidate: TrainingPeriod,
  programme: ProgrammeDetails,
  priorPeriods: TrainingPeriod[]
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
  const priorEndDate = priorPeriods.at(-1)?.endDate ?? null;
  if (priorPeriods.length > 0 && priorEndDate === null) {
    return err(
      "The previous period projects forward to find the completion date. Edit it to set an end date before adding more."
    );
  }
  if (
    candidate.endDate !== null &&
    dayjs(candidate.endDate).isBefore(dayjs(candidate.startDate))
  ) {
    return err("End date cannot be before start date.");
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
