import dayjs from "dayjs";
import type { PastChange, ProgrammeDetails } from "./calculationTypes";

export const DAYS_PER_MONTH = 30.4;
export const COMPLETED_PERIOD_DAYS_PER_MONTH = 365 / 12;
// Note: stops float noise (4559.999...) losing a day when flooring, as in CctEngine.java.
export const FLOOR_TOLERANCE_DAYS = 1e-9;

export const inclusiveDays = (start: string, end: string): number =>
  dayjs(end).diff(dayjs(start), "day") + 1;

export const floorDays = (days: number): number =>
  Math.floor(days + FLOOR_TOLERANCE_DAYS);

export const dateAfterMonths = (startDate: string, months: number): string =>
  dayjs(startDate)
    .add(floorDays(months * DAYS_PER_MONTH), "day")
    .format("YYYY-MM-DD");

export const wtePercentForPastChange = (
  change: PastChange
): number | null => {
  if (change.type === "LTFT" && change.countedAsTraining) return change.wte;
  if (change.type === "OOPT" && change.countedAsTraining) return 100;
  if (change.type === "OOPR" && change.countedAsTraining) return change.wte;
  return null;
};

export const wteFractionFor = (change: PastChange): number => {
  const wte = wtePercentForPastChange(change);
  return wte === null ? 0 : wte / 100;
};

export const isOpenProjectedLtftChange = (change: PastChange): boolean =>
  change.type === "LTFT" &&
  change.projectsRemainingTraining === true &&
  change.endDate === "";

export const completedPastChanges = (
  pastChanges: PastChange[]
): PastChange[] =>
  pastChanges.filter(change => !isOpenProjectedLtftChange(change));

export const programmeOriginalEndDate = (
  programme: ProgrammeDetails
): string => dateAfterMonths(programme.startDate, programme.lengthMonths);

export const totalAdditionalMonths = (programme: ProgrammeDetails): number =>
  programme.additionalTrainingTime.reduce(
    (total, entry) => total + entry.months,
    0
  );

export const programmeAdjustedLengthMonths = (
  programme: ProgrammeDetails
): number =>
  programme.lengthMonths +
  totalAdditionalMonths(programme) -
  programme.acceleratedMonths;

export const programmeAdjustedEndDate = (
  programme: ProgrammeDetails
): string =>
  dateAfterMonths(programme.startDate, programmeAdjustedLengthMonths(programme));
