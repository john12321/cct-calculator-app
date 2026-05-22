import dayjs from "dayjs";

export const formatDate = (date: string | null | undefined): string =>
  date ? dayjs(date).format("DD/MM/YYYY") : "—";

export const formatMonths = (value: number): string =>
  `${value.toFixed(1)} months`;

export const formatPercent = (value: number | null | undefined): string =>
  value == null ? "—" : `${value}%`;
