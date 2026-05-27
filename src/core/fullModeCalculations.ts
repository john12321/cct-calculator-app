import dayjs from "dayjs";
import {
  COMPLETED_PERIOD_DAYS_PER_MONTH,
  DAYS_PER_MONTH,
  inclusiveDays,
  programmeAdjustedLengthMonths
} from "./calculations";
import type {
  ProgrammeDetails,
  TrainingPeriod
} from "./calculationTypes";
import {
  computeGradeProgressionForSegments,
  dateAtCumulativeWteMonths,
  type GradeYear,
  type Segment
} from "./grades";

const FORWARD_EXTENSION_YEARS = 50;

const wteFractionFor = (period: TrainingPeriod): number => {
  if (
    period.type !== "GRADE" ||
    !period.countedAsTraining ||
    period.wte === null
  ) {
    return 0;
  }
  return period.wte / 100;
};

export const calendarMonthsForPeriod = (period: TrainingPeriod): number | null => {
  if (period.endDate === null) return null;
  return (
    inclusiveDays(period.startDate, period.endDate) /
    COMPLETED_PERIOD_DAYS_PER_MONTH
  );
};

export const wteMonthsForPeriod = (period: TrainingPeriod): number | null => {
  const cal = calendarMonthsForPeriod(period);
  if (cal === null) return null;
  return cal * wteFractionFor(period);
};

const lastGradeWteFraction = (timeline: TrainingPeriod[]): number => {
  for (let i = timeline.length - 1; i >= 0; i -= 1) {
    const period = timeline[i];
    if (period.type === "GRADE" && period.wte !== null) {
      return period.wte / 100;
    }
  }
  return 1;
};

export const buildSegmentsFromTimeline = (
  programme: ProgrammeDetails,
  timeline: TrainingPeriod[]
): Segment[] => {
  const segments: Segment[] = [];

  for (const period of timeline) {
    const wte = wteFractionFor(period);
    if (period.endDate === null) {
      segments.push({
        startDate: period.startDate,
        endDate: dayjs(period.startDate)
          .add(FORWARD_EXTENSION_YEARS * 365, "day")
          .format("YYYY-MM-DD"),
        wteFraction: wte,
        daysPerMonth: DAYS_PER_MONTH
      });
    } else {
      segments.push({
        startDate: period.startDate,
        endDate: period.endDate,
        wteFraction: wte,
        daysPerMonth: COMPLETED_PERIOD_DAYS_PER_MONTH
      });
    }
  }

  const last = timeline.at(-1);
  if (last && last.endDate !== null) {
    const forwardStart = dayjs(last.endDate).add(1, "day");
    segments.push({
      startDate: forwardStart.format("YYYY-MM-DD"),
      endDate: forwardStart
        .add(FORWARD_EXTENSION_YEARS * 365, "day")
        .format("YYYY-MM-DD"),
      wteFraction: lastGradeWteFraction(timeline),
      daysPerMonth: DAYS_PER_MONTH
    });
  }

  if (segments.length === 0) {
    segments.push({
      startDate: programme.startDate,
      endDate: dayjs(programme.startDate)
        .add(FORWARD_EXTENSION_YEARS * 365, "day")
        .format("YYYY-MM-DD"),
      wteFraction: 1,
      daysPerMonth: DAYS_PER_MONTH
    });
  }

  return segments;
};

export type TimelineAccrual = {
  totalCalendarMonthsCompleted: number;
  totalWteMonthsCompleted: number;
  monthsRemaining: number;
};

export const computeTimelineAccrual = (
  programme: ProgrammeDetails,
  timeline: TrainingPeriod[]
): TimelineAccrual => {
  let totalCalendarMonthsCompleted = 0;
  let totalWteMonthsCompleted = 0;
  for (const period of timeline) {
    if (period.endDate === null) continue;
    const calMonths =
      inclusiveDays(period.startDate, period.endDate) /
      COMPLETED_PERIOD_DAYS_PER_MONTH;
    totalCalendarMonthsCompleted += calMonths;
    totalWteMonthsCompleted += calMonths * wteFractionFor(period);
  }
  const monthsRemaining =
    programmeAdjustedLengthMonths(programme) - totalWteMonthsCompleted;
  return {
    totalCalendarMonthsCompleted,
    totalWteMonthsCompleted,
    monthsRemaining
  };
};

export const projectedCompletionDateForTimeline = (
  programme: ProgrammeDetails,
  timeline: TrainingPeriod[]
): string | null => {
  if (timeline.length === 0) return null;

  const last = timeline.at(-1);
  if (!last) return null;

  const accrual = computeTimelineAccrual(programme, timeline);
  const required = programmeAdjustedLengthMonths(programme);
  const isOpenEnded = last.endDate === null;

  if (!isOpenEnded && accrual.totalWteMonthsCompleted >= required - 0.009) {
    return last.endDate;
  }

  const segments = buildSegmentsFromTimeline(programme, timeline);
  return dateAtCumulativeWteMonths(segments, required);
};

const isClosedAndOverPlanned = (
  programme: ProgrammeDetails,
  timeline: TrainingPeriod[]
): boolean => {
  if ((timeline.at(-1)?.endDate ?? null) === null) return false;
  const accrual = computeTimelineAccrual(programme, timeline);
  return (
    accrual.totalWteMonthsCompleted >=
    programmeAdjustedLengthMonths(programme) - 0.009
  );
};

const findLastEndDateForGrade = (
  timeline: TrainingPeriod[],
  targetGrade: string
): string | null => {
  for (let i = timeline.length - 1; i >= 0; i -= 1) {
    const period = timeline[i];
    if (
      period.type === "GRADE" &&
      period.grade === targetGrade &&
      period.endDate !== null
    ) {
      return period.endDate;
    }
  }
  return null;
};

export const computeGradeProgressionForTimeline = (
  programme: ProgrammeDetails,
  timeline: TrainingPeriod[]
): GradeYear[] => {
  const baseRows = computeGradeProgressionForSegments(
    programme,
    buildSegmentsFromTimeline(programme, timeline)
  );

  if (!isClosedAndOverPlanned(programme, timeline)) {
    return baseRows;
  }

  return baseRows.map(row => ({
    ...row,
    endDate: findLastEndDateForGrade(timeline, row.grade)
  }));
};
