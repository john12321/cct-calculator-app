import dayjs from "dayjs";
import { DAYS_PER_MONTH, calendarMonthsFor, wteFractionFor } from "./calculations";
import type {
  PastChange,
  ProgrammeDetails,
  ProposedChange
} from "./calculationTypes";

export type GradeYear = {
  yearNumber: number;
  grade: string;
  endDate: string | null;
};

type ParsedGrade = { prefix: string; year: number };

export const parseGrade = (grade: string): ParsedGrade | null => {
  const match = /^([A-Za-z]+)(\d+)$/.exec(grade.trim());
  if (!match) return null;
  return { prefix: match[1], year: Number.parseInt(match[2], 10) };
};

export const gradeForYearOffset = (
  startGrade: string,
  offset: number
): string => {
  const parsed = parseGrade(startGrade);
  if (!parsed) return startGrade;
  return `${parsed.prefix}${parsed.year + offset}`;
};

type Segment = {
  startDate: string;
  endDate: string;
  wteFraction: number;
};

const buildSegments = (
  programme: ProgrammeDetails,
  pastChanges: PastChange[],
  proposed: ProposedChange | null
): Segment[] => {
  const sorted = [...pastChanges].sort((a, b) =>
    dayjs(a.startDate).valueOf() - dayjs(b.startDate).valueOf()
  );

  const segments: Segment[] = [];
  let cursor = dayjs(programme.startDate);

  for (const change of sorted) {
    const changeStart = dayjs(change.startDate);
    if (changeStart.isAfter(cursor)) {
      segments.push({
        startDate: cursor.format("YYYY-MM-DD"),
        endDate: changeStart.subtract(1, "day").format("YYYY-MM-DD"),
        wteFraction: 1
      });
    }
    segments.push({
      startDate: change.startDate,
      endDate: change.endDate,
      wteFraction: wteFractionFor(change)
    });
    cursor = dayjs(change.endDate).add(1, "day");
  }

  if (proposed) {
    const proposedStart = dayjs(proposed.startDate);
    if (proposedStart.isAfter(cursor)) {
      segments.push({
        startDate: cursor.format("YYYY-MM-DD"),
        endDate: proposedStart.subtract(1, "day").format("YYYY-MM-DD"),
        wteFraction: 1
      });
    }
    const proposedWte =
      proposed.kind === "LTFT" && proposed.wte != null ? proposed.wte / 100 : 1;
    segments.push({
      startDate: proposed.startDate,
      endDate: dayjs(proposed.startDate).add(50 * 365, "day").format("YYYY-MM-DD"),
      wteFraction: proposedWte
    });
  } else {
    segments.push({
      startDate: cursor.format("YYYY-MM-DD"),
      endDate: cursor.add(50 * 365, "day").format("YYYY-MM-DD"),
      wteFraction: 1
    });
  }

  return segments;
};

const dateAtCumulativeWteMonths = (
  segments: Segment[],
  targetMonths: number
): string | null => {
  let accumulated = 0;
  for (const seg of segments) {
    const segCalMonths =
      calendarMonthsFor({
        startDate: seg.startDate,
        endDate: seg.endDate
      } as PastChange);
    const segWteMonths = segCalMonths * seg.wteFraction;

    if (accumulated + segWteMonths >= targetMonths) {
      if (seg.wteFraction === 0) continue;
      const wteDeficit = targetMonths - accumulated;
      const calendarDaysIntoSegment = Math.round(
        (wteDeficit / seg.wteFraction) * DAYS_PER_MONTH
      );
      const date = dayjs(seg.startDate)
        .add(calendarDaysIntoSegment - 1, "day")
        .format("YYYY-MM-DD");
      return date;
    }
    accumulated += segWteMonths;
  }
  return null;
};

export const computeGradeProgression = (
  programme: ProgrammeDetails,
  pastChanges: PastChange[],
  proposed: ProposedChange | null
): GradeYear[] => {
  const parsed = parseGrade(programme.startGrade);
  const yearsTotal = Math.ceil(programme.lengthMonths / 12);
  if (yearsTotal <= 0) return [];

  const segments = buildSegments(programme, pastChanges, proposed);

  const rows: GradeYear[] = [];
  for (let i = 0; i < yearsTotal; i += 1) {
    const yearNumber = i + 1;
    const targetMonths = Math.min(yearNumber * 12, programme.lengthMonths);
    const grade = parsed
      ? `${parsed.prefix}${parsed.year + i}`
      : programme.startGrade;
    const endDate = dateAtCumulativeWteMonths(segments, targetMonths);
    rows.push({ yearNumber, grade, endDate });
  }
  return rows;
};
