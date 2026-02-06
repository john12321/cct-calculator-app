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
  let daysAdded = 0;

  if (newCalculation.type === "LTFT") {
    if (
      newCalculation.changeDate &&
      newCalculation.startWte &&
      newCalculation.endWte
    ) {
      const endDateForCalc =
        newCalculation.endDate ||
        (newCalculation.untilEndOfProgramme ? programmeEndDate : null);

      if (endDateForCalc) {
        const chunkDays = dayjs(endDateForCalc).diff(
          newCalculation.changeDate,
          "days"
        );

        const chunkDaysWTE =
          (chunkDays * newCalculation.startWte) / newCalculation.endWte;

        daysAdded = Math.ceil(chunkDaysWTE - chunkDays);
      }
    }
  } else {
    // For all other types (OOP, MATERNITY, etc.), simply calculate the date difference
    const startDate = dayjs(newCalculation.changeDate);
    const endDate = newCalculation.endDate
      ? dayjs(newCalculation.endDate)
      : newCalculation.untilEndOfProgramme
        ? dayjs(programmeEndDate)
        : null;

    if (endDate) {
      daysAdded = endDate.diff(startDate, "day");
    }
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
