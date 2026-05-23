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

export type ProgrammeDetails = {
  specialty: string;
  startDate: string;
  lengthMonths: number;
  startGrade: string;
};
