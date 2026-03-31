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

export const resolveCalculationBaseDate = (
  editingIndex: number | null,
  calculationChanges: CalculationChange[],
  programmeEndDate: string,
  cctDate: string
): string => {
  if (editingIndex === null) {
    return cctDate;
  }

  if (editingIndex === 0) {
    return programmeEndDate;
  }

  return (
    calculationChanges[editingIndex - 1]?.resultingCctDate || programmeEndDate
  );
};

export const performCalculation = (
  newCalculation: DraftCalculation,
  programmeEndDate: string,
  cctDate: string
): {
  newCctDate: string;
  completeCalculation: CalculationChange;
} => {
  // first calc check
  const originalCctDate = dayjs(cctDate).isValid() ? cctDate : programmeEndDate;

  const endDateForCalc = newCalculation.untilEndOfProgramme
    ? programmeEndDate
    : newCalculation.endDate;

  const ftDays =
    dayjs(endDateForCalc).diff(newCalculation.changeDate, "days") + 1; // inclusive of change date
  let daysAdded = ftDays;

  if (newCalculation.type === "LTFT" && newCalculation.endWte) {
    const wteDays = ftDays * (newCalculation.endWte / 100);
    daysAdded = Math.round(ftDays - wteDays);
  }

  const newCctDate = dayjs(originalCctDate)
    .add(daysAdded, "day")
    .format("YYYY-MM-DD");

  const completeCalculation: CalculationChange = {
    ...(newCalculation as CalculationChange),
    id: `calc-${Date.now()}`,
    daysAdded: daysAdded,
    resultingCctDate: newCctDate
  };

  return { newCctDate, completeCalculation };
};

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
