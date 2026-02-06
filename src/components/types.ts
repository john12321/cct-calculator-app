export type BaseStepProps = {
  onNext?: () => void;
  canNavigateNext?: boolean;
  isLocked?: boolean;
};

export type StepState = {
  isCompleted: boolean;
  continueToText: string;
};

export type FormState = StepState[];

export type CalculationType =
  | "LTFT"
  | "OOPC"
  | "OOPE"
  | "MATERNITY"
  | "PATERNITY"
  | "PARENTAL"
  | "PHASED"
  | "SHIELDING"
  | "SICKNESS"
  | "UNPAID";

export type BaseCalculationChange = {
  id: string;
  type: CalculationType;
  notes: string;
  changeDate: string;
  endDate: string;
  untilEndOfProgramme: boolean;
  daysAdded: number;
  resultingCctDate: string;
};

export type WteCalculationChange = BaseCalculationChange & {
  type: "LTFT";
  startWte: number;
  endWte: number;
};

export type OopcCalculationChange = BaseCalculationChange & {
  type: "OOPC"; //career break
};

export type OopeCalculationChange = BaseCalculationChange & {
  type: "OOPE"; // clinical experience
};

export type MaternityCalculationChange = BaseCalculationChange & {
  type: "MATERNITY";
};

export type PaternityCalculationChange = BaseCalculationChange & {
  type: "PATERNITY";
};

export type SharedParentalCalculationChange = BaseCalculationChange & {
  type: "PARENTAL"; // Shared parental leave
};

export type PhasedReturnCalculationChange = BaseCalculationChange & {
  type: "PHASED"; // Phased return
};

export type ShieldingCalculationChange = BaseCalculationChange & {
  type: "SHIELDING"; // COVID-19 shielding
};

export type SicknessCalculationChange = BaseCalculationChange & {
  type: "SICKNESS";
};

export type UnpaidCalculationChange = BaseCalculationChange & {
  type: "UNPAID";
};
export type CalculationChange =
  | WteCalculationChange
  | OopcCalculationChange
  | OopeCalculationChange
  | MaternityCalculationChange
  | PaternityCalculationChange
  | SharedParentalCalculationChange
  | PhasedReturnCalculationChange
  | ShieldingCalculationChange
  | SicknessCalculationChange
  | UnpaidCalculationChange;

export type DraftCalculation = Partial<BaseCalculationChange> & {
  startWte?: number;
  endWte?: number;
};

export type CctFormValues = {
  programmeName: string;
  programmeStartDate: string;
  programmeEndDate: string;
  cctDate: string;
  calculationPerformed: boolean;
  calculationChanges: CalculationChange[];
  editingIndex: number | null;
  draftCalculation: DraftCalculation;
  draftType: CalculationType | null;
};
