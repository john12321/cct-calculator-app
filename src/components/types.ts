import type {
  CalculationChange,
  CalculationType,
  DraftCalculation
} from "../core/calculationTypes";

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
export type {
  BaseCalculationChange,
  CalculationChange,
  CalculationType,
  DraftCalculation,
  OopeCalculationChange,
  OopcCalculationChange,
  OoppCalculationChange,
  ParentalCalculationChange,
  PhasedReturnCalculationChange,
  ShieldingCalculationChange,
  SicknessCalculationChange,
  UnpaidCalculationChange,
  WteCalculationChange
} from "../core/calculationTypes";

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
