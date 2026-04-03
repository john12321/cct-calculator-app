import type { CalculationType } from "./calculationTypes";

export type CalculationTypeLabelVariant = "full" | "short";

type CalculationTypeLabelSet = {
  full: string;
  short: string;
};

export const calculationTypeLabels: Record<
  CalculationType,
  CalculationTypeLabelSet
> = {
  LTFT: {
    full: "Less Than Full-time (LTFT)",
    short: "LTFT"
  },
  OOPC: {
    full: "Out of Programme Career Break (OOPC)",
    short: "OOPC"
  },
  OOPP: {
    full: "Out of Programme Pause (OOPP)",
    short: "OOPP"
  },
  OOPE: {
    full: "Out of Programme Experience (OOPE)",
    short: "OOPE"
  },
  PARENTAL: {
    full: "Parental Leave",
    short: "Parental Leave"
  },
  PHASED: {
    full: "Phased Return",
    short: "Phased Return"
  },
  SHIELDING: {
    full: "COVID-19 Shielding",
    short: "COVID-19 Shielding"
  },
  SICKNESS: {
    full: "Sickness (2 weeks minimum)",
    short: "Sickness"
  },
  UNPAID: {
    full: "Unpaid Leave",
    short: "Unpaid Leave"
  }
};

export const getCalculationTypeLabel = (
  type: CalculationType,
  variant: CalculationTypeLabelVariant = "full"
): string => calculationTypeLabels[type][variant];
