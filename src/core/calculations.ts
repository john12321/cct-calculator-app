import dayjs from "dayjs";
import type {
  PastChange,
  ProgrammeDetails,
  ProposedChange
} from "./calculationTypes";

export const DAYS_PER_MONTH = 30.4;
export const COMPLETED_PERIOD_DAYS_PER_MONTH = 365 / 12;

export const inclusiveDays = (start: string, end: string): number =>
  dayjs(end).diff(dayjs(start), "day") + 1;

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

export const calendarMonthsFor = (change: PastChange): number =>
  isOpenProjectedLtftChange(change)
    ? 0
    : inclusiveDays(change.startDate, change.endDate) /
      COMPLETED_PERIOD_DAYS_PER_MONTH;

export const wteMonthsFor = (change: PastChange): number =>
  calendarMonthsFor(change) * wteFractionFor(change);

export const projectedLtftChange = (
  pastChanges: PastChange[]
): PastChange | null =>
  pastChanges.find(
    change => change.type === "LTFT" && change.projectsRemainingTraining
  ) ?? null;

export const deriveQuickProjection = (
  programme: ProgrammeDetails,
  pastChanges: PastChange[]
): ProposedChange => {
  const projectedLtft = projectedLtftChange(pastChanges);
  if (projectedLtft?.wte != null) {
    return {
      kind: "LTFT",
      startDate: projectedLtft.endDate
        ? dayjs(projectedLtft.endDate).add(1, "day").format("YYYY-MM-DD")
        : projectedLtft.startDate,
      wte: projectedLtft.wte
    };
  }

  const latestChange = completedPastChanges(
    pastChanges
  ).reduce<PastChange | null>(
    (latest, change) =>
      latest === null || dayjs(change.endDate).isAfter(dayjs(latest.endDate))
        ? change
        : latest,
    null
  );
  const startDate = latestChange
    ? dayjs(latestChange.endDate).add(1, "day").format("YYYY-MM-DD")
    : programme.startDate;

  return {
    kind: "FULL_TIME",
    startDate,
    wte: null
  };
};

export const programmeOriginalEndDate = (
  programme: ProgrammeDetails
): string => {
  const days = Math.round(programme.lengthMonths * DAYS_PER_MONTH);
  return dayjs(programme.startDate).add(days, "day").format("YYYY-MM-DD");
};

export const programmeAdjustedLengthMonths = (
  programme: ProgrammeDetails
): number =>
  programme.lengthMonths +
  programme.additionalMonths -
  programme.acceleratedMonths;

export const programmeAdjustedEndDate = (
  programme: ProgrammeDetails
): string => {
  const days = Math.round(programmeAdjustedLengthMonths(programme) * DAYS_PER_MONTH);
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

export type InferredFullTimePeriod = {
  id: string;
  startDate: string;
  endDate: string;
};

const maxDayjs = (a: dayjs.Dayjs, b: dayjs.Dayjs): dayjs.Dayjs =>
  a.isAfter(b) ? a : b;

export const inferredFullTimePeriods = (
  programme: ProgrammeDetails,
  pastChanges: PastChange[],
  projectionStartDate: string
): InferredFullTimePeriod[] => {
  const projectionStart = dayjs(projectionStartDate);
  const sorted = completedPastChanges(pastChanges).sort(
    (a, b) => dayjs(a.startDate).valueOf() - dayjs(b.startDate).valueOf()
  );
  const periods: InferredFullTimePeriod[] = [];
  let cursor = dayjs(programme.startDate);

  for (const change of sorted) {
    if (!cursor.isBefore(projectionStart)) break;

    const changeStart = dayjs(change.startDate);
    if (changeStart.isAfter(cursor)) {
      const gapEnd = changeStart
        .subtract(1, "day")
        .isBefore(projectionStart)
        ? changeStart.subtract(1, "day")
        : projectionStart.subtract(1, "day");
      if (!gapEnd.isBefore(cursor)) {
        periods.push({
          id: `assumed-${cursor.format("YYYY-MM-DD")}-${gapEnd.format("YYYY-MM-DD")}`,
          startDate: cursor.format("YYYY-MM-DD"),
          endDate: gapEnd.format("YYYY-MM-DD")
        });
      }
    }

    cursor = maxDayjs(cursor, dayjs(change.endDate).add(1, "day"));
  }

  const finalGapEnd = projectionStart.subtract(1, "day");
  if (cursor.isBefore(projectionStart) && !finalGapEnd.isBefore(cursor)) {
    periods.push({
      id: `assumed-${cursor.format("YYYY-MM-DD")}-${finalGapEnd.format("YYYY-MM-DD")}`,
      startDate: cursor.format("YYYY-MM-DD"),
      endDate: finalGapEnd.format("YYYY-MM-DD")
    });
  }

  return periods;
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
    totalDaysBeforeProposed / COMPLETED_PERIOD_DAYS_PER_MONTH;

  const completedChanges = completedPastChanges(pastChanges);

  const pastChangesCalendarMonths = completedChanges.reduce(
    (sum, change) => sum + calendarMonthsFor(change),
    0
  );

  const wteMonthsFromPastChanges = completedChanges.reduce(
    (sum, change) => sum + wteMonthsFor(change),
    0
  );

  const gapCalendarMonths = Math.max(
    0,
    totalCalendarMonthsBeforeProposed - pastChangesCalendarMonths
  );
  const wteMonthsFromGaps = gapCalendarMonths;

  const totalWteMonthsCompleted = wteMonthsFromPastChanges + wteMonthsFromGaps;
  const monthsRemaining =
    programmeAdjustedLengthMonths(programme) - totalWteMonthsCompleted;

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
