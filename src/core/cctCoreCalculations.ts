import dayjs from "dayjs";

export const calculateInclusiveDaySpan = (
  startDate: string,
  endDate: string
): number => dayjs(endDate).diff(startDate, "days") + 1;

export const calculateExtensionDays = (
  fullTimeDays: number,
  endWte?: number
): number => {
  if (!endWte) {
    return fullTimeDays;
  }

  const wteDays = fullTimeDays * (endWte / 100);
  return Math.round(fullTimeDays - wteDays);
};

export const extendCctDateByDays = (
  baseDate: string,
  daysAdded: number
): string => dayjs(baseDate).add(daysAdded, "day").format("YYYY-MM-DD");

export const calculateNewCct = (
  baseDate: string,
  extensionDays: number
): string => dayjs(baseDate).add(extensionDays, "day").format("YYYY-MM-DD");
