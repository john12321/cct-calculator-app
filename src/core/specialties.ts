export type DualCct = "Dual-CCT" | "Triple CCT";

export type TrainingGrade =
  | "FY1"
  | "FY2"
  | "CT1"
  | "CT2"
  | "CT3"
  | "CT4"
  | "ST1"
  | "ST2"
  | "ST3"
  | "ST4"
  | "ST5"
  | "ST6"
  | "ST7"
  | "ST8"
  | "ST9"
  | "DFT";

export const TRAINING_GRADES: ReadonlyArray<TrainingGrade> = [
  "FY1",
  "FY2",
  "CT1",
  "CT2",
  "CT3",
  "CT4",
  "ST1",
  "ST2",
  "ST3",
  "ST4",
  "ST5",
  "ST6",
  "ST7",
  "ST8",
  "ST9",
  "DFT"
];

export type Specialty = {
  name: string;
  school: string;
  dual: DualCct | null;
  lengthMonths: number;
  entryGrade: string;
  info: string;
};

export const SPECIALTIES: ReadonlyArray<Specialty> = [
  { name: "ACCS anaesthetics", school: "ACCS", dual: null, lengthMonths: 48, entryGrade: "CT1", info: "" },
  { name: "ACCS emergency medicine", school: "ACCS", dual: null, lengthMonths: 36, entryGrade: "CT1", info: "" },
  { name: "ACCS internal medicine", school: "ACCS", dual: null, lengthMonths: 48, entryGrade: "CT1", info: "" },
  { name: "Acute internal medicine", school: "Medicine", dual: null, lengthMonths: 48, entryGrade: "ST4", info: "" },
  { name: "Acute internal medicine with General Internal Medicine", school: "Medicine", dual: "Dual-CCT", lengthMonths: 48, entryGrade: "ST4", info: "" },
  { name: "Acute internal medicine with Intensive Care and GIM", school: "Medicine", dual: "Triple CCT", lengthMonths: 90, entryGrade: "ST3", info: "Usual length of training is 90 months, but can be 12 months shorter" },
  { name: "Acute internal medicine with Intensive Care and GIM (ST4 start)", school: "Medicine", dual: "Triple CCT", lengthMonths: 78, entryGrade: "ST4", info: "Usual length of training is 78 months, but can be 12 months shorter" },
  { name: "Acute internal medicine with Intensive Care (old curriculum, following ACCS)", school: "Medicine", dual: "Dual-CCT", lengthMonths: 66, entryGrade: "ST3", info: "" },
  { name: "Acute internal medicine with Intensive Care (old curriculum, following CMT)", school: "Medicine", dual: "Dual-CCT", lengthMonths: 78, entryGrade: "ST3", info: "" },
  { name: "Allergy", school: "Medicine", dual: null, lengthMonths: 60, entryGrade: "ST3", info: "" },
  { name: "Allergy and clinical immunology", school: "Medicine", dual: null, lengthMonths: 48, entryGrade: "ST3", info: "" },
  { name: "Allergy, clinical and laboratory immunology", school: "Medicine", dual: null, lengthMonths: 60, entryGrade: "ST3", info: "" },
  { name: "Anaesthetics (higher)", school: "Anaesthesia", dual: null, lengthMonths: 48, entryGrade: "ST4", info: "" },
  { name: "Anaesthetics with Intensive care medicine", school: "Anaesthesia", dual: "Dual-CCT", lengthMonths: 78, entryGrade: "ST3", info: "" },
  { name: "Audio vestibular medicine", school: "Medicine", dual: null, lengthMonths: 48, entryGrade: "ST3", info: "" },
  { name: "Aviation and space medicine", school: "Medicine", dual: null, lengthMonths: 48, entryGrade: "ST3", info: "" },
  { name: "Cardiology", school: "Medicine", dual: null, lengthMonths: 60, entryGrade: "ST4", info: "" },
  { name: "Cardiology with General Internal Medicine", school: "Medicine", dual: "Dual-CCT", lengthMonths: 60, entryGrade: "ST4", info: "" },
  { name: "Cardio-thoracic surgery", school: "Surgery", dual: null, lengthMonths: 72, entryGrade: "ST3", info: "" },
  { name: "Cardio-thoracic surgery (run-through)", school: "Surgery", dual: null, lengthMonths: 84, entryGrade: "ST1", info: "" },
  { name: "Chemical pathology", school: "Pathology", dual: null, lengthMonths: 60, entryGrade: "ST3", info: "" },
  { name: "Child and adolescent psychiatry", school: "Psychiatry", dual: null, lengthMonths: 36, entryGrade: "ST4", info: "" },
  { name: "Child and adolescent psychiatry (run-through)", school: "Psychiatry", dual: null, lengthMonths: 72, entryGrade: "ST1", info: "" },
  { name: "Child and adolescent psychiatry with Medical Psychotherapy", school: "Psychiatry", dual: "Dual-CCT", lengthMonths: 60, entryGrade: "ST4", info: "" },
  { name: "Child and adolescent psychiatry with Forensic psychiatry", school: "Psychiatry", dual: "Dual-CCT", lengthMonths: 60, entryGrade: "ST4", info: "" },
  { name: "Child and adolescent psychiatry with Psychiatry of learning disability", school: "Psychiatry", dual: "Dual-CCT", lengthMonths: 60, entryGrade: "ST4", info: "" },
  { name: "Clinical genetics", school: "Medicine", dual: null, lengthMonths: 48, entryGrade: "ST3", info: "" },
  { name: "Clinical neurophysiology", school: "Medicine", dual: null, lengthMonths: 48, entryGrade: "ST3", info: "" },
  { name: "Clinical oncology", school: "Medicine", dual: null, lengthMonths: 60, entryGrade: "ST3", info: "" },
  { name: "Clinical pharmacology and therapeutics", school: "Medicine", dual: null, lengthMonths: 48, entryGrade: "ST4", info: "" },
  { name: "Clinical pharmacology and therapeutics with General Internal Medicine", school: "Medicine", dual: "Dual-CCT", lengthMonths: 48, entryGrade: "ST4", info: "" },
  { name: "Clinical radiology", school: "Radiology", dual: null, lengthMonths: 60, entryGrade: "ST1", info: "" },
  { name: "Clinical radiology with Nuclear medicine", school: "Radiology", dual: "Dual-CCT", lengthMonths: 72, entryGrade: "ST3", info: "" },
  { name: "Community sexual and reproductive health", school: "Obstetrics and gynaecology", dual: null, lengthMonths: 72, entryGrade: "ST1", info: "" },
  { name: "Core anaesthetics training", school: "Anaesthesia", dual: null, lengthMonths: 36, entryGrade: "CT1", info: "" },
  { name: "Core medical training", school: "Medicine", dual: null, lengthMonths: 24, entryGrade: "CT1", info: "" },
  { name: "Core psychiatry training", school: "Psychiatry", dual: null, lengthMonths: 36, entryGrade: "CT1", info: "" },
  { name: "Core surgical training", school: "Surgery", dual: null, lengthMonths: 24, entryGrade: "CT1", info: "" },
  { name: "Dental and maxillo-facial radiology", school: "Dental", dual: null, lengthMonths: 48, entryGrade: "ST1", info: "" },
  { name: "Dental core training", school: "Dental", dual: null, lengthMonths: 12, entryGrade: "CT1", info: "" },
  { name: "Dental foundation training", school: "Dental", dual: null, lengthMonths: 12, entryGrade: "DFT", info: "" },
  { name: "Dental public health", school: "Dental", dual: null, lengthMonths: 48, entryGrade: "ST1", info: "" },
  { name: "Dermatology", school: "Medicine", dual: null, lengthMonths: 48, entryGrade: "ST3", info: "" },
  { name: "Diagnostic neuropathology", school: "Pathology", dual: null, lengthMonths: 66, entryGrade: "ST3", info: "" },
  { name: "Emergency medicine", school: "Emergency medicine", dual: null, lengthMonths: 36, entryGrade: "ST4", info: "" },
  { name: "Emergency medicine with Intensive care medicine", school: "Emergency medicine", dual: null, lengthMonths: 78, entryGrade: "ST3", info: "" },
  { name: "Emergency medicine (run-through)", school: "Emergency medicine", dual: null, lengthMonths: 72, entryGrade: "ST1", info: "" },
  { name: "Emergency medicine DRE-EM", school: "Emergency medicine", dual: null, lengthMonths: 60, entryGrade: "ST3", info: "" },
  { name: "Emergency medicine DRE-EM with Intensive Care Medicine", school: "Emergency medicine", dual: "Dual-CCT", lengthMonths: 90, entryGrade: "ST3", info: "" },
  { name: "Emergency medicine DRE-EM with Paediatric Emergency Medicine", school: "Emergency medicine", dual: null, lengthMonths: 72, entryGrade: "ST3", info: "" },
  { name: "Emergency medicine with Paediatric Emergency Medicine", school: "Emergency medicine", dual: null, lengthMonths: 48, entryGrade: "ST4", info: "" },
  { name: "Emergency medicine (run-through) with Intensive Care Medicine", school: "Emergency medicine", dual: "Dual-CCT", lengthMonths: 102, entryGrade: "ST1", info: "" },
  { name: "Emergency medicine (run-through) with Paediatric Emergency Medicine", school: "Emergency medicine", dual: null, lengthMonths: 84, entryGrade: "ST1", info: "" },
  { name: "Endocrinology and diabetes mellitus", school: "Medicine", dual: null, lengthMonths: 48, entryGrade: "ST4", info: "" },
  { name: "Endocrinology and diabetes mellitus with General Internal Medicine", school: "Medicine", dual: "Dual-CCT", lengthMonths: 48, entryGrade: "ST4", info: "" },
  { name: "Endodontics", school: "Dental", dual: null, lengthMonths: 36, entryGrade: "ST1", info: "" },
  { name: "Forensic histopathology", school: "Pathology", dual: null, lengthMonths: 60, entryGrade: "ST3", info: "" },
  { name: "Forensic psychiatry", school: "Psychiatry", dual: null, lengthMonths: 36, entryGrade: "ST4", info: "" },
  { name: "Forensic psychiatry with Child and adolescent psychiatry", school: "Psychiatry", dual: "Dual-CCT", lengthMonths: 60, entryGrade: "ST4", info: "" },
  { name: "Forensic psychiatry with General psychiatry", school: "Psychiatry", dual: "Dual-CCT", lengthMonths: 60, entryGrade: "ST4", info: "" },
  { name: "Forensic psychiatry with Medical psychotherapy", school: "Psychiatry", dual: "Dual-CCT", lengthMonths: 60, entryGrade: "ST4", info: "" },
  { name: "Forensic psychiatry with Psychiatry of learning disability", school: "Psychiatry", dual: "Dual-CCT", lengthMonths: 60, entryGrade: "ST4", info: "" },
  { name: "Foundation", school: "Foundation", dual: null, lengthMonths: 24, entryGrade: "FY1", info: "" },
  { name: "Gastroenterology", school: "Medicine", dual: null, lengthMonths: 48, entryGrade: "ST4", info: "" },
  { name: "Gastroenterology with General Internal Medicine", school: "Medicine", dual: "Dual-CCT", lengthMonths: 48, entryGrade: "ST4", info: "" },
  { name: "General (internal) medicine / Internal medicine stage 2", school: "Medicine", dual: null, lengthMonths: 48, entryGrade: "ST4", info: "" },
  { name: "General practice", school: "General practice", dual: null, lengthMonths: 36, entryGrade: "ST1", info: "" },
  { name: "General practice with Public health medicine", school: "General practice", dual: "Dual-CCT", lengthMonths: 84, entryGrade: "ST1", info: "" },
  { name: "General psychiatry", school: "Psychiatry", dual: null, lengthMonths: 36, entryGrade: "ST4", info: "" },
  { name: "General psychiatry with Forensic psychiatry", school: "Psychiatry", dual: "Dual-CCT", lengthMonths: 60, entryGrade: "ST4", info: "" },
  { name: "General psychiatry with Medical psychotherapy", school: "Psychiatry", dual: "Dual-CCT", lengthMonths: 60, entryGrade: "ST4", info: "" },
  { name: "General psychiatry with Old age psychiatry", school: "Psychiatry", dual: "Dual-CCT", lengthMonths: 48, entryGrade: "ST4", info: "" },
  { name: "General surgery", school: "Surgery", dual: null, lengthMonths: 72, entryGrade: "ST3", info: "" },
  { name: "General surgery (run-through)", school: "Surgery", dual: null, lengthMonths: 96, entryGrade: "ST1", info: "" },
  { name: "Genito-urinary medicine", school: "Medicine", dual: null, lengthMonths: 48, entryGrade: "ST4", info: "" },
  { name: "Genito-urinary medicine with General Internal Medicine", school: "Medicine", dual: "Dual-CCT", lengthMonths: 48, entryGrade: "ST4", info: "" },
  { name: "Geriatric medicine", school: "Medicine", dual: null, lengthMonths: 48, entryGrade: "ST4", info: "" },
  { name: "Geriatric medicine with General Internal Medicine", school: "Medicine", dual: "Dual-CCT", lengthMonths: 48, entryGrade: "ST4", info: "" },
  { name: "Haematology", school: "Medicine", dual: null, lengthMonths: 60, entryGrade: "ST3", info: "" },
  { name: "Histopathology", school: "Pathology", dual: null, lengthMonths: 60, entryGrade: "ST3", info: "" },
  { name: "Immunology", school: "Medicine", dual: null, lengthMonths: 60, entryGrade: "ST3", info: "" },
  { name: "Infectious diseases", school: "Medicine", dual: null, lengthMonths: 48, entryGrade: "ST4", info: "" },
  { name: "Infectious diseases with General Internal Medicine", school: "Medicine", dual: "Dual-CCT", lengthMonths: 48, entryGrade: "ST4", info: "" },
  { name: "Infectious diseases with Medical microbiology", school: "Medicine", dual: "Dual-CCT", lengthMonths: 60, entryGrade: "ST3", info: "" },
  { name: "Infectious diseases with Medical virology", school: "Pathology", dual: "Dual-CCT", lengthMonths: 60, entryGrade: "ST3", info: "" },
  { name: "Intensive care medicine", school: "Intensive care", dual: null, lengthMonths: 60, entryGrade: "ST3", info: "" },
  { name: "Intensive care medicine (ST4 start)", school: "Intensive care", dual: null, lengthMonths: 48, entryGrade: "ST4", info: "" },
  { name: "Intensive care with Acute internal medicine, and GIM", school: "Intensive care", dual: "Triple CCT", lengthMonths: 90, entryGrade: "ST3", info: "Usual length of training is 90 months, but can be 12 months shorter" },
  { name: "Intensive care with Acute internal medicine, and GIM (ST4 start)", school: "Intensive care", dual: "Triple CCT", lengthMonths: 78, entryGrade: "ST4", info: "Usual length of training is 78 months, but can be 12 months shorter" },
  { name: "Intensive care with Acute internal medicine (old curriculum, following ACCS)", school: "Intensive care", dual: "Dual-CCT", lengthMonths: 66, entryGrade: "ST3", info: "" },
  { name: "Intensive care with Acute internal medicine (old curriculum, following CMT)", school: "Intensive care", dual: "Dual-CCT", lengthMonths: 78, entryGrade: "ST3", info: "" },
  { name: "Intensive care with Anaesthetics", school: "Intensive care", dual: "Dual-CCT", lengthMonths: 78, entryGrade: "ST3", info: "" },
  { name: "Intensive care with Anaesthetics (ST4 Start)", school: "Intensive care", dual: "Dual-CCT", lengthMonths: 66, entryGrade: "ST4", info: "" },
  { name: "Intensive care with Emergency medicine", school: "Intensive care", dual: "Dual-CCT", lengthMonths: 78, entryGrade: "ST3", info: "" },
  { name: "Intensive care with Emergency medicine (ST4 start)", school: "Intensive care", dual: "Dual-CCT", lengthMonths: 66, entryGrade: "ST4", info: "" },
  { name: "Intensive care with Renal medicine, and GIM", school: "Intensive care", dual: "Triple CCT", lengthMonths: 90, entryGrade: "ST3", info: "Usual length of training is 90 months, but can be 12 months shorter" },
  { name: "Intensive care with Renal medicine, and GIM (ST4 start)", school: "Intensive care", dual: "Triple CCT", lengthMonths: 78, entryGrade: "ST4", info: "Usual length of training is 78 months, but can be 12 months shorter" },
  { name: "Intensive care with Respiratory medicine, and GIM", school: "Intensive care", dual: "Triple CCT", lengthMonths: 90, entryGrade: "ST3", info: "Usual length of training is 90 months, but can be 12 months shorter" },
  { name: "Intensive care with Respiratory medicine, and GIM (ST4 start)", school: "Intensive care", dual: "Triple CCT", lengthMonths: 78, entryGrade: "ST4", info: "Usual length of training is 78 months, but can be 12 months shorter" },
  { name: "Internal medicine training - stage 1 (Group 1)", school: "Medicine", dual: null, lengthMonths: 36, entryGrade: "CT1", info: "" },
  { name: "Internal medicine training - stage 1 (Group 2)", school: "Medicine", dual: null, lengthMonths: 24, entryGrade: "CT1", info: "" },
  { name: "Medical microbiology", school: "Pathology", dual: null, lengthMonths: 48, entryGrade: "ST3", info: "" },
  { name: "Medical microbiology with Infectious diseases", school: "Pathology", dual: "Dual-CCT", lengthMonths: 60, entryGrade: "ST3", info: "" },
  { name: "Medical microbiology with Tropical medicine", school: "Pathology", dual: "Dual-CCT", lengthMonths: 72, entryGrade: "ST4", info: "" },
  { name: "Medical oncology", school: "Medicine", dual: null, lengthMonths: 48, entryGrade: "ST3", info: "" },
  { name: "Medical ophthalmology", school: "Medicine", dual: null, lengthMonths: 60, entryGrade: "ST3", info: "" },
  { name: "Medical psychotherapy", school: "Psychiatry", dual: null, lengthMonths: 36, entryGrade: "ST4", info: "" },
  { name: "Medical psychotherapy with Child and adolescent psychiatry", school: "Psychiatry", dual: "Dual-CCT", lengthMonths: 60, entryGrade: "ST4", info: "" },
  { name: "Medical psychotherapy with Forensic psychiatry", school: "Psychiatry", dual: "Dual-CCT", lengthMonths: 60, entryGrade: "ST4", info: "" },
  { name: "Medical psychotherapy with General psychiatry", school: "Psychiatry", dual: "Dual-CCT", lengthMonths: 60, entryGrade: "ST4", info: "" },
  { name: "Medical virology", school: "Pathology", dual: null, lengthMonths: 48, entryGrade: "ST3", info: "" },
  { name: "Medical virology with Infectious diseases", school: "Pathology", dual: "Dual-CCT", lengthMonths: 60, entryGrade: "ST3", info: "" },
  { name: "Medical virology with Tropical medicine", school: "Pathology", dual: "Dual-CCT", lengthMonths: 72, entryGrade: "ST4", info: "" },
  { name: "Neurology", school: "Medicine", dual: null, lengthMonths: 60, entryGrade: "ST4", info: "" },
  { name: "Neurology with General Internal Medicine", school: "Medicine", dual: "Dual-CCT", lengthMonths: 60, entryGrade: "ST4", info: "" },
  { name: "Neurosurgery", school: "Surgery", dual: null, lengthMonths: 96, entryGrade: "ST1", info: "" },
  { name: "Nuclear medicine", school: "Medicine", dual: null, lengthMonths: 72, entryGrade: "ST3", info: "" },
  { name: "Nuclear medicine with Clinical radiology", school: "Radiology", dual: "Dual-CCT", lengthMonths: 72, entryGrade: "ST3", info: "" },
  { name: "Obstetrics and gynaecology", school: "Obstetrics and gynaecology", dual: null, lengthMonths: 84, entryGrade: "ST1", info: "" },
  { name: "Occupational medicine", school: "Medicine", dual: null, lengthMonths: 48, entryGrade: "ST3", info: "" },
  { name: "Old age psychiatry", school: "Psychiatry", dual: null, lengthMonths: 36, entryGrade: "ST4", info: "" },
  { name: "Old age psychiatry with General psychiatry", school: "Psychiatry", dual: "Dual-CCT", lengthMonths: 48, entryGrade: "ST4", info: "" },
  { name: "Ophthalmology", school: "Ophthalmology", dual: null, lengthMonths: 84, entryGrade: "ST1", info: "" },
  { name: "Oral and maxillo-facial pathology", school: "Dental", dual: null, lengthMonths: 60, entryGrade: "ST1", info: "" },
  { name: "Oral and maxillo-facial surgery", school: "Surgery", dual: null, lengthMonths: 60, entryGrade: "ST3", info: "" },
  { name: "Oral and maxillo-facial surgery (run-through)", school: "Surgery", dual: null, lengthMonths: 84, entryGrade: "ST1", info: "" },
  { name: "Oral medicine", school: "Dental", dual: null, lengthMonths: 60, entryGrade: "ST1", info: "" },
  { name: "Oral microbiology", school: "Dental", dual: null, lengthMonths: 48, entryGrade: "ST1", info: "" },
  { name: "Oral surgery", school: "Dental", dual: null, lengthMonths: 36, entryGrade: "ST1", info: "" },
  { name: "Orthodontics", school: "Dental", dual: null, lengthMonths: 36, entryGrade: "ST1", info: "" },
  { name: "Otolaryngology", school: "Surgery", dual: null, lengthMonths: 72, entryGrade: "ST3", info: "" },
  { name: "Otolaryngology (run-through)", school: "Surgery", dual: null, lengthMonths: 96, entryGrade: "ST1", info: "" },
  { name: "Paediatric and perinatal pathology", school: "Pathology", dual: null, lengthMonths: 36, entryGrade: "ST3", info: "" },
  { name: "Paediatric cardiology", school: "Medicine", dual: null, lengthMonths: 60, entryGrade: "ST4", info: "" },
  { name: "Paediatric dentistry", school: "Dental", dual: null, lengthMonths: 36, entryGrade: "ST1", info: "" },
  { name: "Paediatric surgery", school: "Surgery", dual: null, lengthMonths: 72, entryGrade: "ST3", info: "" },
  { name: "Paediatric surgery (run-through)", school: "Surgery", dual: null, lengthMonths: 96, entryGrade: "ST1", info: "" },
  { name: "Paediatrics", school: "Paediatrics", dual: null, lengthMonths: 84, entryGrade: "ST1", info: "" },
  { name: "Palliative medicine", school: "Medicine", dual: null, lengthMonths: 48, entryGrade: "ST4", info: "" },
  { name: "Palliative medicine with General Internal Medicine", school: "Medicine", dual: "Dual-CCT", lengthMonths: 48, entryGrade: "ST4", info: "" },
  { name: "Periodontics", school: "Dental", dual: null, lengthMonths: 36, entryGrade: "ST1", info: "" },
  { name: "Pharmaceutical medicine", school: "Medicine", dual: null, lengthMonths: 48, entryGrade: "ST3", info: "" },
  { name: "Plastic surgery", school: "Surgery", dual: null, lengthMonths: 72, entryGrade: "ST3", info: "" },
  { name: "Prosthodontics", school: "Dental", dual: null, lengthMonths: 36, entryGrade: "ST1", info: "" },
  { name: "Psychiatry of learning disability", school: "Psychiatry", dual: null, lengthMonths: 36, entryGrade: "ST4", info: "" },
  { name: "Psychiatry of learning disability with Child and adolescent psychiatry", school: "Psychiatry", dual: "Dual-CCT", lengthMonths: 60, entryGrade: "ST4", info: "" },
  { name: "Psychiatry of learning disability with Forensic psychiatry", school: "Psychiatry", dual: "Dual-CCT", lengthMonths: 60, entryGrade: "ST4", info: "" },
  { name: "Public health medicine", school: "Public Health", dual: null, lengthMonths: 60, entryGrade: "ST1", info: "" },
  { name: "Public health medicine with General Practice", school: "Public Health", dual: "Dual-CCT", lengthMonths: 84, entryGrade: "ST1", info: "" },
  { name: "Rehabilitation medicine", school: "Medicine", dual: null, lengthMonths: 48, entryGrade: "ST4", info: "" },
  { name: "Renal medicine", school: "Medicine", dual: null, lengthMonths: 48, entryGrade: "ST4", info: "" },
  { name: "Renal medicine with General Internal Medicine", school: "Medicine", dual: "Dual-CCT", lengthMonths: 48, entryGrade: "ST4", info: "" },
  { name: "Renal medicine with GIM and Intensive care medicine", school: "Medicine", dual: "Triple CCT", lengthMonths: 90, entryGrade: "ST3", info: "Usual length of training is 90 months, but can be 12 months shorter" },
  { name: "Renal medicine with GIM and Intensive care medicine (ST4 start)", school: "Medicine", dual: "Triple CCT", lengthMonths: 78, entryGrade: "ST4", info: "Usual length of training is 78 months, but can be 12 months shorter" },
  { name: "Respiratory medicine", school: "Medicine", dual: null, lengthMonths: 48, entryGrade: "ST4", info: "" },
  { name: "Respiratory medicine with General Internal Medicine", school: "Medicine", dual: "Dual-CCT", lengthMonths: 48, entryGrade: "ST4", info: "" },
  { name: "Respiratory medicine with GIM and Intensive care medicine", school: "Medicine", dual: "Triple CCT", lengthMonths: 90, entryGrade: "ST3", info: "Usual length of training is 90 months, but can be 12 months shorter" },
  { name: "Respiratory medicine with GIM and Intensive care medicine (ST4 start)", school: "Medicine", dual: "Triple CCT", lengthMonths: 78, entryGrade: "ST4", info: "Usual length of training is 78 months, but can be 12 months shorter" },
  { name: "Restorative dentistry", school: "Dental", dual: null, lengthMonths: 60, entryGrade: "ST1", info: "" },
  { name: "Rheumatology", school: "Medicine", dual: null, lengthMonths: 48, entryGrade: "ST4", info: "" },
  { name: "Rheumatology with General Internal Medicine", school: "Medicine", dual: "Dual-CCT", lengthMonths: 48, entryGrade: "ST4", info: "" },
  { name: "Special care dentistry", school: "Dental", dual: null, lengthMonths: 48, entryGrade: "ST1", info: "" },
  { name: "Sport and exercise medicine", school: "Medicine", dual: null, lengthMonths: 48, entryGrade: "ST3", info: "" },
  { name: "Trauma and orthopaedic surgery", school: "Surgery", dual: null, lengthMonths: 72, entryGrade: "ST3", info: "" },
  { name: "Trauma and orthopaedic surgery (run-through)", school: "Surgery", dual: null, lengthMonths: 96, entryGrade: "ST1", info: "" },
  { name: "Tropical medicine", school: "Medicine", dual: null, lengthMonths: 72, entryGrade: "ST3", info: "" },
  { name: "Tropical medicine with General Internal Medicine", school: "Medicine", dual: "Dual-CCT", lengthMonths: 72, entryGrade: "ST3", info: "" },
  { name: "Tropical medicine with Medical microbiology", school: "Pathology", dual: "Dual-CCT", lengthMonths: 72, entryGrade: "ST4", info: "" },
  { name: "Tropical medicine with Medical virology", school: "Pathology", dual: "Dual-CCT", lengthMonths: 72, entryGrade: "ST4", info: "" },
  { name: "Urology", school: "Surgery", dual: null, lengthMonths: 60, entryGrade: "ST3", info: "" },
  { name: "Urology (run-through)", school: "Surgery", dual: null, lengthMonths: 84, entryGrade: "ST1", info: "" },
  { name: "Vascular surgery", school: "Surgery", dual: null, lengthMonths: 72, entryGrade: "ST3", info: "" },
  { name: "Vascular surgery (run-through)", school: "Surgery", dual: null, lengthMonths: 96, entryGrade: "ST1", info: "" },];

export const findSpecialty = (name: string): Specialty | undefined =>
  SPECIALTIES.find(s => s.name === name);

export type SpecialtyGroup = {
  school: string;
  items: Specialty[];
};

export const specialtiesGroupedBySchool = (): SpecialtyGroup[] => {
  const bySchool = new Map<string, Specialty[]>();
  for (const s of SPECIALTIES) {
    const list = bySchool.get(s.school) ?? [];
    list.push(s);
    bySchool.set(s.school, list);
  }
  return [...bySchool.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([school, items]) => ({
      school,
      items: [...items].sort((a, b) => a.name.localeCompare(b.name))
    }));
};
