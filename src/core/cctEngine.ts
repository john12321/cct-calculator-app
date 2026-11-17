import dayjs from "dayjs";
import type {
  PastChange,
  ProgrammeDetails,
  ProposedChange
} from "./calculationTypes";
import {
  COMPLETED_PERIOD_DAYS_PER_MONTH,
  dateAfterMonths,
  inclusiveDays,
  isOpenProjectedLtftChange,
  programmeAdjustedEndDate,
  programmeAdjustedLengthMonths,
  programmeOriginalEndDate,
  wteFractionFor
} from "./calculations";

// Note: a 1:1 port of CctEngine.java in tis-trainee-details (see its README-CCT-CALCULATOR.md).
// Keep the two in step: same steps, same names, same rounding.

export type CctCalculatedChange = {
  change: PastChange;
  // Note: null for an open-ended LTFT change, which is projected rather than recorded.
  calendarMonths: number | null;
  wteMonths: number | null;
};

export type CctAssumedFullTimePeriod = {
  startDate: string;
  endDate: string;
  months: number;
};

export type CctProjection = {
  startDate: string;
  // Note: a fraction (0.6), as in the BE, not a percentage.
  wte: number;
  calendarMonths: number;
  wteMonths: number;
};

export type CctResult = {
  cctDate: string;
  originalProgrammeEndDate: string;
  adjustedProgrammeEndDate: string;
  totalCalendarMonthsCompleted: number;
  totalWteMonthsCompleted: number;
  monthsRemaining: number;
  assumedFullTimePeriods: CctAssumedFullTimePeriod[];
  projection: CctProjection;
};

export type CctCalculation = {
  changes: CctCalculatedChange[];
  result: CctResult;
};

type TrainingPeriod = { startDate: string; endDate: string; wteMonths: number };

const ISO = "YYYY-MM-DD";
const dayAfter = (date: string): string => dayjs(date).add(1, "day").format(ISO);
const dayBefore = (date: string): string =>
  dayjs(date).subtract(1, "day").format(ISO);
const isBefore = (a: string, b: string): boolean => dayjs(a).isBefore(dayjs(b));
const isAfter = (a: string, b: string): boolean => dayjs(a).isAfter(dayjs(b));
const byStartDate = <T extends { startDate: string }>(a: T, b: T): number =>
  dayjs(a.startDate).valueOf() - dayjs(b.startDate).valueOf();

const roundToTwoDecimals = (months: number): number =>
  Math.round(months * 100) / 100;

const recordedMonths = (startDate: string, endDate: string): number =>
  inclusiveDays(startDate, endDate) / COMPLETED_PERIOD_DAYS_PER_MONTH;

const calendarMonths = (change: PastChange): number =>
  recordedMonths(change.startDate, change.endDate);

const wteMonths = (change: PastChange): number =>
  calendarMonths(change) * wteFractionFor(change);

// Note: only time in the programme counts; a change ending before it counts for nothing.
export const countedChange = (
  change: PastChange,
  programmeStartDate: string
): PastChange | null => {
  if (!isBefore(change.startDate, programmeStartDate)) return change;
  if (change.endDate && isBefore(change.endDate, programmeStartDate)) return null;
  return { ...change, startDate: programmeStartDate };
};

const deriveProjection = (
  programmeStartDate: string,
  changes: PastChange[],
  datedChanges: PastChange[]
): { startDate: string; wte: number } => {
  const openLtftChange = changes.find(isOpenProjectedLtftChange);
  if (openLtftChange) {
    return {
      startDate: openLtftChange.startDate,
      wte: (openLtftChange.wte ?? 100) / 100
    };
  }

  const latestEndDate = datedChanges.reduce<string | null>(
    (latest, change) =>
      latest === null || isAfter(change.endDate, latest) ? change.endDate : latest,
    null
  );
  return {
    startDate: latestEndDate ? dayAfter(latestEndDate) : programmeStartDate,
    wte: 1
  };
};

const assumedPeriod = (
  startDate: string,
  endDate: string
): CctAssumedFullTimePeriod => ({
  startDate,
  endDate,
  months: recordedMonths(startDate, endDate)
});

const deriveAssumedPeriods = (
  programmeStartDate: string,
  datedChanges: PastChange[],
  projectionStartDate: string
): CctAssumedFullTimePeriod[] => {
  const periods: CctAssumedFullTimePeriod[] = [];
  let cursor = programmeStartDate;

  for (const change of [...datedChanges].sort(byStartDate)) {
    if (isAfter(change.startDate, cursor)) {
      periods.push(assumedPeriod(cursor, dayBefore(change.startDate)));
    }
    const dayAfterChange = dayAfter(change.endDate);
    if (isAfter(dayAfterChange, cursor)) {
      cursor = dayAfterChange;
    }
  }

  if (isBefore(cursor, projectionStartDate)) {
    periods.push(assumedPeriod(cursor, dayBefore(projectionStartDate)));
  }
  return periods;
};

// Note: only finds a date when recorded time alone completes training (months remaining <= 0).
const findCompletionDate = (
  lengthMonths: number,
  datedChanges: PastChange[],
  assumedPeriods: CctAssumedFullTimePeriod[]
): string | null => {
  const sortedPeriods: TrainingPeriod[] = [
    ...datedChanges.map(change => ({
      startDate: change.startDate,
      endDate: change.endDate,
      wteMonths: wteMonths(change)
    })),
    ...assumedPeriods.map(period => ({
      startDate: period.startDate,
      endDate: period.endDate,
      wteMonths: period.months
    }))
  ].sort(byStartDate);
  let monthsCompleted = 0;

  for (const period of sortedPeriods) {
    if (period.wteMonths === 0) continue;

    const days = inclusiveDays(period.startDate, period.endDate);
    for (let daysIn = 1; daysIn <= days; daysIn++) {
      const remaining =
        lengthMonths - monthsCompleted - (period.wteMonths * daysIn) / days;
      if (roundToTwoDecimals(remaining) <= 0) {
        return dayjs(period.startDate)
          .add(daysIn - 1, "day")
          .format(ISO);
      }
    }
    monthsCompleted += period.wteMonths;
  }
  return null;
};

const calculatedChange = (
  change: PastChange,
  programmeStartDate: string
): CctCalculatedChange => {
  if (isOpenProjectedLtftChange(change)) {
    return { change, calendarMonths: null, wteMonths: null };
  }
  const counted = countedChange(change, programmeStartDate);
  return {
    change,
    calendarMonths: counted ? calendarMonths(counted) : 0,
    wteMonths: counted ? wteMonths(counted) : 0
  };
};

export const calculateCct = (
  programme: ProgrammeDetails,
  changes: PastChange[]
): CctCalculation => {
  const programmeStartDate = programme.startDate;
  const countedChanges = changes.flatMap(change => {
    const counted = countedChange(change, programmeStartDate);
    return counted ? [counted] : [];
  });
  const datedChanges = countedChanges.filter(
    change => !isOpenProjectedLtftChange(change)
  );
  const projection = deriveProjection(
    programmeStartDate,
    countedChanges,
    datedChanges
  );
  const assumedPeriods = deriveAssumedPeriods(
    programmeStartDate,
    datedChanges,
    projection.startDate
  );

  let totalCalendarMonthsCompleted = 0;
  let totalWteMonthsCompleted = 0;
  for (const change of datedChanges) {
    totalCalendarMonthsCompleted += calendarMonths(change);
    totalWteMonthsCompleted += wteMonths(change);
  }
  for (const period of assumedPeriods) {
    totalCalendarMonthsCompleted += period.months;
    totalWteMonthsCompleted += period.months;
  }

  const adjustedLengthMonths = programmeAdjustedLengthMonths(programme);
  const monthsRemaining = roundToTwoDecimals(
    adjustedLengthMonths - totalWteMonthsCompleted
  );

  const calendarMonthsToCompletion = monthsRemaining / projection.wte;
  const cctDate =
    findCompletionDate(adjustedLengthMonths, datedChanges, assumedPeriods) ??
    dateAfterMonths(projection.startDate, calendarMonthsToCompletion);

  return {
    changes: changes.map(change => calculatedChange(change, programmeStartDate)),
    result: {
      cctDate,
      originalProgrammeEndDate: programmeOriginalEndDate(programme),
      adjustedProgrammeEndDate: programmeAdjustedEndDate(programme),
      totalCalendarMonthsCompleted,
      totalWteMonthsCompleted,
      monthsRemaining,
      assumedFullTimePeriods: assumedPeriods,
      projection: {
        startDate: projection.startDate,
        wte: projection.wte,
        calendarMonths: calendarMonthsToCompletion,
        wteMonths: monthsRemaining
      }
    }
  };
};

// Note: the engine's projection in the shape grade progression takes.
export const deriveQuickProjection = (
  programme: ProgrammeDetails,
  changes: PastChange[]
): ProposedChange => {
  const { startDate, wte } = calculateCct(programme, changes).result.projection;
  return wte === 1
    ? { kind: "FULL_TIME", startDate, wte: null }
    : { kind: "LTFT", startDate, wte: Math.round(wte * 100) };
};
