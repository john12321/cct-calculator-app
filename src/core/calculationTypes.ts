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
  type: "OOPC";
};

export type OoppCalculationChange = BaseCalculationChange & {
  type: "OOPP";
};

export type OopeCalculationChange = BaseCalculationChange & {
  type: "OOPE";
};

export type ParentalCalculationChange = BaseCalculationChange & {
  type: "PARENTAL";
};

export type PhasedReturnCalculationChange = BaseCalculationChange & {
  type: "PHASED";
};

export type ShieldingCalculationChange = BaseCalculationChange & {
  type: "SHIELDING";
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
  | OoppCalculationChange
  | OopeCalculationChange
  | ParentalCalculationChange
  | PhasedReturnCalculationChange
  | ShieldingCalculationChange
  | SicknessCalculationChange
  | UnpaidCalculationChange;

export type DraftCalculation = Partial<BaseCalculationChange> & {
  startWte?: number;
  endWte?: number;
};
