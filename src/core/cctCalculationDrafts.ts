import dayjs from "dayjs";
import type {
  CalculationChange,
  CalculationType,
  DraftCalculation
} from "./calculationTypes";

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
