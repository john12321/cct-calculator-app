import type {
  CalculationType,
  GradePeriodTag,
  TrainingPeriod,
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
    full: "LTFT (Less than full-time) training",
    short: "LTFT"
  },
  OOPC: {
    full: "OOPC (Career break)",
    short: "OOPC"
  },
  OOPP: {
    full: "OOPP (Pause)",
    short: "OOPP"
  },
  OOPE: {
    full: "OOPE (Experience)",
    short: "OOPE"
  },
  OOPR: {
    full: "OOPR (Research)",
    short: "OOPR"
  },
  OOPT: {
    full: "OOPT (Training)",
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
    full: "OOPC (Career break)",
    short: "OOPC"
  },
  OOPE: {
    full: "OOPE (Experience)",
    short: "OOPE"
  },
  OOPP: {
    full: "OOPP (Pause)",
    short: "OOPP"
  },
  OOPR: {
    full: "OOPR (Research)",
    short: "OOPR"
  },
  OOPT: {
    full: "OOPT (Training)",
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

export const describeTrainingPeriod = (period: TrainingPeriod): string => {
  if (period.type !== "GRADE") {
    return getTrainingPeriodTypeLabel(period.type, "short");
  }
  if (period.gradeTag === "REGULAR") return period.grade;
  return `${period.grade} (${getGradePeriodTagLabel(period.gradeTag)})`;
};
