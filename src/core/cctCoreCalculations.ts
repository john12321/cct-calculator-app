import dayjs from "dayjs";

/**
 * Calculates the inclusive number of days between two dates.
 *
 * @param startDate - Start date in YYYY-MM-DD format. Must be a valid date.
 * @param endDate - End date in YYYY-MM-DD format. Must be a valid date on or after startDate.
 * @returns Inclusive day count (e.g. same day = 1).
 * @throws {RangeError} If either date is invalid or endDate is before startDate.
 */
export const calculateInclusiveDaySpan = (
  startDate: string,
  endDate: string
): number => {
  const start = dayjs(startDate);
  const end = dayjs(endDate);
  if (!start.isValid()) {
    throw new RangeError(`Invalid startDate: ${startDate}.`);
  }
  if (!end.isValid()) {
    throw new RangeError(`Invalid endDate: ${endDate}.`);
  }
  if (end.isBefore(start)) {
    throw new RangeError(
      `endDate (${endDate}) must not be before startDate (${startDate}).`
    );
  }
  return end.diff(start, "days") + 1;
};

/**
 * Calculates the number of extension days for an absence period.
 *
 * @param fullTimeDays - Total full-time days in the period. Must be > 0.
 * @param trainingDaysRebate - Days rebated for training (0–fullTimeDays). Defaults to 0.
 * @returns Extension days (rounded to nearest integer).
 * @throws {RangeError} If any argument is out of its valid range.
 */
export const calculateAbsenceExtensionDays = (
  fullTimeDays: number,
  trainingDaysRebate: number = 0
): number => {
  if (fullTimeDays <= 0) {
    throw new RangeError(`Invalid fullTimeDays: ${fullTimeDays}. Must be > 0.`);
  }
  if (trainingDaysRebate < 0 || trainingDaysRebate > fullTimeDays) {
    throw new RangeError(
      `Invalid training days rebate: ${trainingDaysRebate}. Must be between 0 and fullTimeDays (${fullTimeDays}).`
    );
  }
  return fullTimeDays - Math.round(trainingDaysRebate);
};

/**
 * Calculates the number of extension days for a Less than full-time training (LTFT) period.
 *
 * @param fullTimeDays - Total full-time days in the period. Must be > 0.
 * @param ltftWte - LTFT Whole Time Equivalent (0.1–1).
 * @param currentWte - Current WTE baseline (0.1–1). Defaults to 1.
 * @returns Extension days (rounded to nearest integer).
 * @throws {RangeError} If any argument is out of its valid range.
 */
export const calculateLtftExtensionDays = (
  fullTimeDays: number,
  ltftWte: number,
  currentWte: number = 1
): number => {
  if (fullTimeDays <= 0) {
    throw new RangeError(`Invalid fullTimeDays: ${fullTimeDays}. Must be > 0.`);
  }
  if (ltftWte < 0.1 || ltftWte > 1) {
    throw new RangeError(
      `Invalid ltftWte: ${ltftWte}. Must be between 0.1 and 1.`
    );
  }
  if (currentWte < 0.1 || currentWte > 1) {
    throw new RangeError(
      `Invalid currentWte: ${currentWte}. Must be between 0.1 and 1.`
    );
  }
  const wteDays = fullTimeDays * (ltftWte / currentWte);
  return Math.round(fullTimeDays - wteDays);
};

/**
 * Calculates a new CCT date by adding extension days to a base date.
 *
 * @param baseDate - Base date in YYYY-MM-DD format. Must be a valid date.
 * @param extensionDays - Number of days to add (can be negative to bring the date forward).
 * @returns New CCT date in YYYY-MM-DD format.
 * @throws {RangeError} If baseDate is invalid.
 */
export const calculateNewCct = (
  baseDate: string,
  extensionDays: number
): string => {
  const base = dayjs(baseDate);
  if (!base.isValid()) {
    throw new RangeError(`Invalid baseDate: ${baseDate}.`);
  }
  return base.add(extensionDays, "day").format("YYYY-MM-DD");
};

/**
 * Determines the base date for a new or edited CCT calculation.
 *
 * When editing, uses the resulting CCT date of the previous calculation
 * (or the programme end date if editing the first one).
 * When adding, uses the resulting CCT date of the last calculation
 * (or the programme end date if there are none).
 *
 * @param programmeEndDate - The original programme end date in YYYY-MM-DD format.
 * @param calculationChanges - The list of existing calculation changes.
 * @param editingIndex - The index being edited, or null if adding a new calculation.
 * @returns The base date to use for the calculation.
 */
export const getCalculationBaseDate = (
  programmeEndDate: string,
  calculationChanges: { resultingCctDate: string }[],
  editingIndex: number | null
): string => {
  if (editingIndex !== null) {
    return editingIndex > 0
      ? calculationChanges[editingIndex - 1].resultingCctDate
      : programmeEndDate;
  }
  return calculationChanges.length > 0
    ? calculationChanges[calculationChanges.length - 1].resultingCctDate
    : programmeEndDate;
};
