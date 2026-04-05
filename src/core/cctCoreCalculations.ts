import dayjs from "dayjs";

export const calculateInclusiveDaySpan = (
  startDate: string,
  endDate: string
): number => dayjs(endDate).diff(startDate, "days") + 1;

const VALID_WTE = new Set([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]);

export const calculateExtensionDays = (
  fullTimeDays: number,
  endWte?: number
): number => {
  if (!endWte) {
    return fullTimeDays;
  }

  if (!VALID_WTE.has(endWte)) {
    throw new RangeError(
      `Invalid LTFT value: ${endWte}. Must be 0.1–0.9 in 0.1 increments.`
    );
  }

  const wteDays = fullTimeDays * endWte;
  return Math.round(fullTimeDays - wteDays);
};

export const calculateNewCct = (
  baseDate: string,
  extensionDays: number
): string => dayjs(baseDate).add(extensionDays, "day").format("YYYY-MM-DD");
