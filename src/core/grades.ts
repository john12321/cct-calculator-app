import dayjs from "dayjs";
import {
  DAYS_PER_MONTH,
  calendarMonthsFor,
  programmeAdjustedLengthMonths,
  wteFractionFor
} from "./calculations";
import type {
  PastChange,
  ProgrammeDetails,
  ProposedChange
} from "./calculationTypes";
import { findSpecialty } from "./specialties";

export type GradeYear = {
  yearNumber: number;
  grade: string;
  endDate: string | null;
  extendedToTwentyFourMonths: boolean;
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
  if (programme.lengthMonths <= 0) return [];

  const parsed = parseGrade(programme.startGrade);
  const segments = buildSegments(programme, pastChanges, proposed);
  const twentyFourMonthGrade =
    findSpecialty(programme.specialty)?.twentyFourMonthGrade ?? null;
  const adjustedLengthMonths = programmeAdjustedLengthMonths(programme);

  const rows: GradeYear[] = [];
  let carriedExtension = 0;
  const maxYears = 50;

  for (let yearNumber = 1; yearNumber <= maxYears; yearNumber += 1) {
    const gate = (yearNumber - 1) * 12 + 1 + carriedExtension;
    if (gate > programme.lengthMonths) break;

    const grade = parsed
      ? `${parsed.prefix}${parsed.year + yearNumber - 1}`
      : programme.startGrade;

    const isTwentyFourMonth =
      twentyFourMonthGrade !== null && grade === twentyFourMonthGrade;
    const thisYearExtension = isTwentyFourMonth ? 12 : 0;

    const targetMonths = Math.min(
      yearNumber * 12 +
        carriedExtension +
        thisYearExtension +
        programme.additionalMonths -
        programme.acceleratedMonths,
      adjustedLengthMonths
    );
    const endDate = dateAtCumulativeWteMonths(segments, targetMonths);

    rows.push({
      yearNumber,
      grade,
      endDate,
      extendedToTwentyFourMonths: isTwentyFourMonth
    });

    carriedExtension += thisYearExtension;
  }

  return rows;
};
