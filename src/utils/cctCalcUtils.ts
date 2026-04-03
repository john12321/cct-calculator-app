import dayjs from "dayjs";
import type {
  CalculationChange,
  CalculationType,
  DraftCalculation
} from "../components/types";

export const selectCalculationType = (
  type: CalculationType,
  previousChangeEndDate: string | null,
  programmeStartDate: string
): DraftCalculation => {
  const baseCalculation: DraftCalculation = {
    type,
    changeDate: previousChangeEndDate
      ? dayjs(previousChangeEndDate).add(1, "day").format("YYYY-MM-DD")
      : programmeStartDate
  };
  if (type === "LTFT") {
    return {
      ...baseCalculation,
      startWte: 100,
      endWte: undefined
    };
  }
  return baseCalculation;
};

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

export const calculateDaysAdded = (
  newCalculation: DraftCalculation,
  fullTimeDays: number
): number => {
  if (newCalculation.type === "LTFT") {
    return calculateExtensionDays(fullTimeDays, newCalculation.endWte);
  }

  return fullTimeDays;
};

export const extendCctDateByDays = (
  baseDate: string,
  daysAdded: number
): string => dayjs(baseDate).add(daysAdded, "day").format("YYYY-MM-DD");

export const createCompleteCalculationChange = (
  newCalculation: DraftCalculation,
  id: string,
  daysAdded: number,
  resultingCctDate: string
): CalculationChange => ({
  ...(newCalculation as CalculationChange),
  id,
  daysAdded,
  resultingCctDate
});

export const calculateNewCct = (
  baseDate: string,
  extensionDays: number
): string => dayjs(baseDate).add(extensionDays, "day").format("YYYY-MM-DD");

export const removeLastCalculation = (
  calculationChanges: CalculationChange[],
  programmeEndDate: string
): { updatedCalculations: CalculationChange[]; newCctDate: string } => {
  if (calculationChanges.length === 0) {
    return {
      updatedCalculations: calculationChanges,
      newCctDate: programmeEndDate
    };
  }

  const updatedCalculations = calculationChanges.slice(0, -1);

  if (updatedCalculations.length === 0) {
    return { updatedCalculations, newCctDate: programmeEndDate };
  } else {
    const lastCalculation = updatedCalculations[updatedCalculations.length - 1];
    return {
      updatedCalculations,
      newCctDate: lastCalculation.resultingCctDate
    };
  }
};
