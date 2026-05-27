import type {
  CalculationType,
  GradePeriodTag,
  TrainingPeriodType
} from "./calculationTypes";

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
  OOPR: {
    full: "Out of Programme Research (OOPR)",
    short: "OOPR"
  },
  OOPT: {
    full: "Out of Programme Training (OOPT)",
    short: "OOPT"
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
  ACCRUED_LEAVE: {
    full: "Accrued annual leave",
    short: "Accrued AL"
  }
};

export const getCalculationTypeLabel = (
  type: CalculationType,
  variant: CalculationTypeLabelVariant = "full"
): string => calculationTypeLabels[type][variant];

export const trainingPeriodTypeLabels: Record<
  TrainingPeriodType,
  CalculationTypeLabelSet
> = {
  GRADE: { full: "Grade", short: "Grade" },
  OOPC: {
    full: "Out of Programme Career Break (OOPC)",
    short: "OOPC"
  },
  OOPE: {
    full: "Out of Programme Experience (OOPE)",
    short: "OOPE"
  },
  OOPP: {
    full: "Out of Programme Pause (OOPP)",
    short: "OOPP"
  },
  OOPR: {
    full: "Out of Programme Research (OOPR)",
    short: "OOPR"
  },
  OOPT: {
    full: "Out of Programme Training (OOPT)",
    short: "OOPT"
  },
  PARENTAL: { full: "Parental Leave", short: "Parental Leave" },
  SICK: { full: "Sick leave", short: "Sick leave" },
  ACCRUED_LEAVE: {
    full: "Accrued annual leave",
    short: "Accrued AL"
  }
};

export const getTrainingPeriodTypeLabel = (
  type: TrainingPeriodType,
  variant: CalculationTypeLabelVariant = "full"
): string => trainingPeriodTypeLabels[type][variant];

export const gradePeriodTagLabels: Record<GradePeriodTag, string> = {
  REGULAR: "Standard",
  ACF: "ACF (Academic Clinical Fellow)",
  ACL: "ACL (Academic Clinical Lecturer)",
  ADDITIONAL_TRAINING_TIME: "Additional training time"
};

export const getGradePeriodTagLabel = (tag: GradePeriodTag): string =>
  gradePeriodTagLabels[tag];
