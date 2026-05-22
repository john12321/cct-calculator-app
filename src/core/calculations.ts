import dayjs from "dayjs";
import type {
  PastChange,
  ProgrammeDetails,
  ProposedChange
} from "./calculationTypes";

export const DAYS_PER_MONTH = 30.4;

export const inclusiveDays = (start: string, end: string): number =>
  dayjs(end).diff(dayjs(start), "day") + 1;

export const wteFractionFor = (change: PastChange): number => {
  if (change.type === "LTFT" && change.wte != null) {
    return change.wte / 100;
  }
  return 0;
};

export const calendarMonthsFor = (change: PastChange): number =>
  inclusiveDays(change.startDate, change.endDate) / DAYS_PER_MONTH;

export const wteMonthsFor = (change: PastChange): number =>
  calendarMonthsFor(change) * wteFractionFor(change);

export const programmeOriginalEndDate = (
  programme: ProgrammeDetails
): string => {
  const days = Math.round(programme.lengthMonths * DAYS_PER_MONTH);
  return dayjs(programme.startDate).add(days, "day").format("YYYY-MM-DD");
};

export type WteAccrualBreakdown = {
  totalCalendarMonthsBeforeProposed: number;
  pastChangesCalendarMonths: number;
  gapCalendarMonths: number;
  wteMonthsFromPastChanges: number;
  wteMonthsFromGaps: number;
  totalWteMonthsCompleted: number;
  monthsRemaining: number;
};

export const computeWteAccrual = (
  programme: ProgrammeDetails,
  pastChanges: PastChange[],
  proposedStartDate: string
): WteAccrualBreakdown => {
  const totalDaysBeforeProposed = dayjs(proposedStartDate).diff(
    dayjs(programme.startDate),
    "day"
  );
  const totalCalendarMonthsBeforeProposed =
    totalDaysBeforeProposed / DAYS_PER_MONTH;

  const pastChangesCalendarMonths = pastChanges.reduce(
    (sum, change) => sum + calendarMonthsFor(change),
    0
  );

  const wteMonthsFromPastChanges = pastChanges.reduce(
    (sum, change) => sum + wteMonthsFor(change),
    0
  );

  const gapCalendarMonths = Math.max(
    0,
    totalCalendarMonthsBeforeProposed - pastChangesCalendarMonths
  );
  const wteMonthsFromGaps = gapCalendarMonths;

  const totalWteMonthsCompleted = wteMonthsFromPastChanges + wteMonthsFromGaps;
  const monthsRemaining = programme.lengthMonths - totalWteMonthsCompleted;

  return {
    totalCalendarMonthsBeforeProposed,
    pastChangesCalendarMonths,
    gapCalendarMonths,
    wteMonthsFromPastChanges,
    wteMonthsFromGaps,
    totalWteMonthsCompleted,
    monthsRemaining
  };
};

export const projectedCompletionDate = (
  proposed: ProposedChange,
  monthsRemaining: number
): string => {
  const wte =
    proposed.kind === "LTFT" && proposed.wte != null ? proposed.wte / 100 : 1;
  const daysToAdd = Math.round((monthsRemaining / wte) * DAYS_PER_MONTH);
  return dayjs(proposed.startDate).add(daysToAdd, "day").format("YYYY-MM-DD");
};
