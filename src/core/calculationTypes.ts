export type CalculationType =
  | "LTFT"
  | "OOPC"
  | "OOPP"
  | "OOPE"
  | "PARENTAL"
  | "PHASED"
  | "SHIELDING"
  | "SICKNESS"
  | "UNPAID";

export type PastChange = {
  id: string;
  type: CalculationType;
  startDate: string;
  endDate: string;
  wte: number | null;
  notes: string;
};

export type ProposedChangeKind = "FULL_TIME" | "LTFT";

export type ProposedChange = {
  kind: ProposedChangeKind;
  startDate: string;
  wte: number | null;
};

export type CalculationMode = "QUICK" | "FULL";

export type TrainingPeriodType =
  | "GRADE"
  | "OOPC"
  | "OOPE"
  | "OOPP"
  | "OOPR"
  | "OOPT"
  | "PARENTAL"
  | "SICK"
  | "ACCRUED_LEAVE";

export type GradePeriodTag =
  | "REGULAR"
  | "ACF"
  | "ACL"
  | "ADDITIONAL_TRAINING_TIME";

export type TrainingPeriod = {
  id: string;
  type: TrainingPeriodType;
  grade: string;
  gradeTag: GradePeriodTag;
  wte: number | null;
  startDate: string;
  endDate: string | null;
  countedAsTraining: boolean;
  notes: string;
};

export type ProgrammeDetails = {
  specialty: string;
  startDate: string;
  lengthMonths: number;
  additionalMonths: number;
  additionalMonthsNotes: string;
  acceleratedMonths: number;
  acceleratedMonthsNotes: string;
  eighteenMonthFinalGrade: string;
  eighteenMonthFinalGradeNotes: string;
  skippedGrade: string;
  skippedGradeNotes: string;
  startGrade: string;
  startGradeOverrideNotes: string;
};
