import dayjs from "dayjs";

export const calculateInclusiveDaySpan = (
  startDate: string,
  endDate: string
): number => dayjs(endDate).diff(startDate, "days") + 1;

export const calculateExtensionDays = (
  fullTimeDays: number,
  endWte?: number // endWte is always a decimal (e.g., 0.8 for 80%)
): number => {
  if (!endWte) {
    return fullTimeDays;
  }

  const wteDays = fullTimeDays * endWte;
  return Math.round(fullTimeDays - wteDays);
};

export const calculateNewCct = (
  baseDate: string,
  extensionDays: number
): string => dayjs(baseDate).add(extensionDays, "day").format("YYYY-MM-DD");
