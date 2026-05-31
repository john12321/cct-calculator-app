export const INVALID_DATE_VALUE = "invalid-date";

const pad2 = (value: number) => String(value).padStart(2, "0");

export const toIsoDate = (day: string, month: string, year: string): string => {
  const trimmedDay = day.trim();
  const trimmedMonth = month.trim();
  const trimmedYear = year.trim();

  if (!trimmedDay && !trimmedMonth && !trimmedYear) return "";
  if (!trimmedDay || !trimmedMonth || !trimmedYear) return "";

  // Expand a 2-digit year to a 20xx year before validating (e.g. "22" -> "2022").
  const fullYear = /^\d{2}$/.test(trimmedYear) ? `20${trimmedYear}` : trimmedYear;

  if (!/^\d{4}$/.test(fullYear) || !/^\d+$/.test(trimmedDay)) {
    return INVALID_DATE_VALUE;
  }

  const dayNumber = Number(trimmedDay);
  const monthNumber = Number(trimmedMonth);

  return `${fullYear}-${pad2(monthNumber)}-${pad2(dayNumber)}`;
};
