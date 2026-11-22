import dayjs from "dayjs";
import {
  COMPLETED_PERIOD_DAYS_PER_MONTH,
  DAYS_PER_MONTH,
  completedPastChanges,
  floorDays,
  inclusiveDays,
  programmeAdjustedLengthMonths,
  wteFractionFor
} from "./calculations";
import type {
  PastChange,
  ProgrammeDetails,
  ProposedChange
} from "./calculationTypes";
import { countedChange } from "./cctEngine";
import {
  TRAINING_GRADES,
  findSpecialty,
  type TrainingGrade
} from "./specialties";

export type GradeYear = {
  yearNumber: number;
  grade: string;
  endDate: string | null;
  skippedGradeBeforeThisRow: string | null;
  extendedToEighteenMonths: boolean;
  extendedToTwentyFourMonths: boolean;
  exceedsKnownTrainingGrade: boolean;
  additionalMonths: number;
  acceleratedMonths: number;
  gradeMonths: number;
};

type ParsedGrade = { prefix: string; year: number };

export const beyondKnownGradeLabel = (highestGrade: string) =>
  `Additional training after ${highestGrade}`;

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
  return gradeLabelForParsedGrade(parsed, offset).grade;
};

export const highestKnownGrade = (grade: string): string | undefined => {
  const prefix = parseGrade(grade)?.prefix.toUpperCase();
  return prefix === undefined
    ? undefined
    : TRAINING_GRADES.filter(known => parseGrade(known)?.prefix === prefix).at(
        -1
      );
};

const gradeLabelForParsedGrade = (
  parsed: ParsedGrade,
  offset: number
): { grade: string; exceedsKnownTrainingGrade: boolean } => {
  const grade = `${parsed.prefix}${parsed.year + offset}`;
  const highestGrade = highestKnownGrade(grade);
  if (
    highestGrade !== undefined &&
    !TRAINING_GRADES.includes(grade.toUpperCase() as TrainingGrade)
  ) {
    return {
      grade: beyondKnownGradeLabel(highestGrade),
      exceedsKnownTrainingGrade: true
    };
  }
  return { grade, exceedsKnownTrainingGrade: false };
};

export type Segment = {
  startDate: string;
  endDate: string;
  wteFraction: number;
  daysPerMonth: number;
};

const buildSegments = (
  programme: ProgrammeDetails,
  pastChanges: PastChange[],
  proposed: ProposedChange | null
): Segment[] => {
  const sorted = completedPastChanges(pastChanges)
    .flatMap(change => {
      const counted = countedChange(change, programme.startDate);
      return counted ? [counted] : [];
    })
    .sort((a, b) => dayjs(a.startDate).valueOf() - dayjs(b.startDate).valueOf());

  const segments: Segment[] = [];
  let cursor = dayjs(programme.startDate);

  for (const change of sorted) {
    const changeStart = dayjs(change.startDate);
    if (changeStart.isAfter(cursor)) {
      segments.push({
        startDate: cursor.format("YYYY-MM-DD"),
        endDate: changeStart.subtract(1, "day").format("YYYY-MM-DD"),
        wteFraction: 1,
        daysPerMonth: COMPLETED_PERIOD_DAYS_PER_MONTH
      });
    }
    segments.push({
      startDate: change.startDate,
      endDate: change.endDate,
      wteFraction: wteFractionFor(change),
      daysPerMonth: COMPLETED_PERIOD_DAYS_PER_MONTH
    });
    const dayAfterChange = dayjs(change.endDate).add(1, "day");
    if (dayAfterChange.isAfter(cursor)) cursor = dayAfterChange;
  }

  if (proposed) {
    const proposedStart = dayjs(proposed.startDate);
    if (proposedStart.isAfter(cursor)) {
      segments.push({
        startDate: cursor.format("YYYY-MM-DD"),
        endDate: proposedStart.subtract(1, "day").format("YYYY-MM-DD"),
        wteFraction: 1,
        daysPerMonth: COMPLETED_PERIOD_DAYS_PER_MONTH
      });
    }
    const proposedWte =
      proposed.kind === "LTFT" && proposed.wte != null ? proposed.wte / 100 : 1;
    segments.push({
      startDate: proposed.startDate,
      endDate: dayjs(proposed.startDate).add(50 * 365, "day").format("YYYY-MM-DD"),
      wteFraction: proposedWte,
      daysPerMonth: DAYS_PER_MONTH
    });
  } else {
    segments.push({
      startDate: cursor.format("YYYY-MM-DD"),
      endDate: cursor.add(50 * 365, "day").format("YYYY-MM-DD"),
      wteFraction: 1,
      daysPerMonth: DAYS_PER_MONTH
    });
  }

  return segments;
};

export const dateAtCumulativeWteMonths = (
  segments: Segment[],
  targetMonths: number
): string | null => {
  let accumulated = 0;
  for (const seg of segments) {
    const segCalMonths =
      inclusiveDays(seg.startDate, seg.endDate) / seg.daysPerMonth;
    const segWteMonths = segCalMonths * seg.wteFraction;

    if (accumulated + segWteMonths >= targetMonths) {
      if (seg.wteFraction === 0) continue;
      const wteDeficit = targetMonths - accumulated;
      const calendarDaysIntoSegment = floorDays(
        (wteDeficit / seg.wteFraction) * seg.daysPerMonth
      );
      const date = dayjs(seg.startDate)
        .add(calendarDaysIntoSegment, "day")
        .format("YYYY-MM-DD");
      return date;
    }
    accumulated += segWteMonths;
  }
  return null;
};

export const computeGradeProgressionForSegments = (
  programme: ProgrammeDetails,
  segments: Segment[]
): GradeYear[] => {
  if (programme.lengthMonths <= 0) return [];

  const parsed = parseGrade(programme.startGrade);
  const twentyFourMonthGrade =
    findSpecialty(programme.specialty)?.twentyFourMonthGrade ?? null;
  const adjustedLengthMonths = programmeAdjustedLengthMonths(programme);

  const rows: GradeYear[] = [];
  let previousEighteenMonthExtension = 0;
  let carriedExtension = 0;
  let carriedAdditionalMonths = 0;
  let carriedAcceleratedMonths = 0;
  let previousBaseMonths = 0;
  let skippedGradeOffset = 0;
  const maxYears = 50;

  for (let yearNumber = 1; yearNumber <= maxYears; yearNumber += 1) {
    const gate =
      (yearNumber - 1) * 12 +
      1 +
      previousEighteenMonthExtension +
      carriedExtension;
    if (gate > programme.lengthMonths) {
      // Excel's P (+6) column is not carried; a later formula row can reappear.
      previousEighteenMonthExtension = 0;
      continue;
    }

    const ordinaryGrade = parsed
      ? gradeLabelForParsedGrade(parsed, yearNumber - 1).grade
      : programme.startGrade;
    const beginsAfterSkippedGrade =
      parsed !== null &&
      programme.skippedGrade !== "" &&
      ordinaryGrade === programme.skippedGrade;
    if (beginsAfterSkippedGrade) {
      skippedGradeOffset = 1;
    }
    const gradeResult = parsed
      ? gradeLabelForParsedGrade(
          parsed,
          yearNumber - 1 + skippedGradeOffset
        )
      : {
          grade: programme.startGrade,
          exceedsKnownTrainingGrade: false
        };
    const { grade, exceedsKnownTrainingGrade } = gradeResult;

    const isEighteenMonthFinalYear =
      programme.eighteenMonthFinalGrade !== "" &&
      grade === programme.eighteenMonthFinalGrade;
    const finalYearExtension = isEighteenMonthFinalYear ? 6 : 0;
    const isTwentyFourMonth =
      twentyFourMonthGrade !== null && grade === twentyFourMonthGrade;
    const thisYearExtension = isTwentyFourMonth ? 12 : 0;
    // Note: additional time lengthens its own grade and moves every later grade on.
    const additionalMonths = programme.additionalTrainingTime
      .filter(entry => entry.grade === grade)
      .reduce((total, entry) => total + entry.months, 0);
    carriedAdditionalMonths += additionalMonths;
    // Note: accelerated time shortens its own grade and moves every later grade earlier.
    const acceleratedMonths = programme.acceleratedTrainingTime
      .filter(entry => entry.grade === grade)
      .reduce((total, entry) => total + entry.months, 0);
    carriedAcceleratedMonths += acceleratedMonths;

    const baseMonths =
      yearNumber * 12 +
      carriedExtension +
      thisYearExtension +
      finalYearExtension;
    const targetMonths = Math.min(
      baseMonths + carriedAdditionalMonths - carriedAcceleratedMonths,
      adjustedLengthMonths
    );
    const endDate = dateAtCumulativeWteMonths(segments, targetMonths);
    const gradeMonths =
      Math.min(baseMonths, programme.lengthMonths) - previousBaseMonths;

    rows.push({
      yearNumber,
      grade,
      endDate,
      skippedGradeBeforeThisRow: beginsAfterSkippedGrade
        ? programme.skippedGrade
        : null,
      extendedToEighteenMonths: isEighteenMonthFinalYear,
      extendedToTwentyFourMonths: isTwentyFourMonth,
      exceedsKnownTrainingGrade,
      additionalMonths,
      acceleratedMonths,
      gradeMonths
    });

    previousEighteenMonthExtension = finalYearExtension;
    carriedExtension += thisYearExtension;
    previousBaseMonths = Math.min(baseMonths, programme.lengthMonths);
  }

  return rows;
};

// Note: the grades additional or accelerated training time can be recorded against.
export const programmeGrades = (programme: ProgrammeDetails): string[] =>
  computeGradeProgressionForSegments(programme, [])
    .filter(row => !row.exceedsKnownTrainingGrade)
    .map(row => row.grade);

export const endsInEighteenMonthYear = (programme: ProgrammeDetails): boolean => {
  const lastYear = computeGradeProgressionForSegments(programme, []).at(-1);
  return lastYear?.extendedToEighteenMonths === true && lastYear.gradeMonths === 18;
};

export const eighteenMonthFinalGradeFor = (
  programme: ProgrammeDetails
): string | null => {
  const lastFullYear = computeGradeProgressionForSegments(
    { ...programme, eighteenMonthFinalGrade: "" },
    []
  ).at(-2);
  if (!lastFullYear || lastFullYear.exceedsKnownTrainingGrade) return null;
  return endsInEighteenMonthYear({
    ...programme,
    eighteenMonthFinalGrade: lastFullYear.grade
  })
    ? lastFullYear.grade
    : null;
};

export const computeGradeProgression = (
  programme: ProgrammeDetails,
  pastChanges: PastChange[],
  proposed: ProposedChange | null
): GradeYear[] =>
  computeGradeProgressionForSegments(
    programme,
    buildSegments(programme, pastChanges, proposed)
  );
