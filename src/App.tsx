import { useState } from "react";
import { ModePicker } from "./components/ModePicker";
import { StepIndicator } from "./components/StepIndicator";
import { BackLink } from "./components/BackLink";
import { CompletionDateWarning } from "./components/CompletionDateWarning";
import { GradeProgressionAdjustmentsSection } from "./components/GradeProgressionAdjustmentsSection";
import { GradeProgressionPanel } from "./components/GradeProgressionPanel";
import { ProgrammeDetailsSection } from "./components/ProgrammeDetailsSection";
import { TrainingTimeAdjustmentsSection } from "./components/TrainingTimeAdjustmentsSection";
import { ChangesPage } from "./pages/ChangesPage";
import { TrainingTimelinePage } from "./pages/TrainingTimelinePage";
import { SummaryPage } from "./pages/SummaryPage";
import { FullModeSummaryPage } from "./pages/FullModeSummaryPage";
import packageJson from "../package.json";
import type {
  CalculationMode,
  PastChange,
  ProgrammeDetails,
  TrainingPeriod
} from "./core";
import {
  acceleratedTrainingTimeIssues,
  additionalTrainingTimeIssues,
  deriveQuickProjection,
  gradeProgressionAdjustmentIssues,
  validatePastChange,
  validateTimeline
} from "./core";
import { scrollTo } from "./utils/scroll";

const stepsFor = (mode: CalculationMode | null) => [
  { title: "Programme details" },
  { title: "Training time adjustments" },
  { title: "Grade progression adjustments" },
  { title: mode === "FULL" ? "Training timeline" : "Changes" },
  { title: "Summary" }
];

export const App = () => {
  const [mode, setMode] = useState<CalculationMode | null>(null);
  const [step, setStep] = useState(0);
  const [maxReachedStep, setMaxReachedStep] = useState(0);
  const [programme, setProgramme] = useState<ProgrammeDetails | null>(null);
  const [pastChanges, setPastChanges] = useState<PastChange[]>([]);
  const [timeline, setTimeline] = useState<TrainingPeriod[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const steps = stepsFor(mode);
  const quickProjection =
    programme === null ? null : deriveQuickProjection(programme, pastChanges);

  const stepIssue = (index: number): string | null => {
    if (programme === null) return null;
    if (
      index === 1 &&
      (additionalTrainingTimeIssues(programme).length > 0 ||
        acceleratedTrainingTimeIssues(programme).length > 0)
    ) {
      return "Fix the training time adjustment errors above to continue.";
    }
    if (index === 2 && gradeProgressionAdjustmentIssues(programme).length > 0) {
      return "Fix the grade progression adjustment errors above to continue.";
    }
    if (
      index === 3 &&
      mode === "QUICK" &&
      pastChanges.some(
        change => !validatePastChange(change, programme, pastChanges).ok
      )
    ) {
      return "Fix the change errors above before continuing to summary.";
    }
    if (
      index === 3 &&
      mode === "FULL" &&
      validateTimeline(programme, timeline).issues.length > 0
    ) {
      return "Resolve the timeline issues above to see the grade progression and continue to the summary.";
    }
    return null;
  };

  const isStepComplete = (index: number) =>
    programme !== null &&
    !(index === step && formOpen) &&
    !(index === 3 && mode === "FULL" && timeline.length === 0) &&
    stepIssue(index) === null;

  const canOpenStep = (index: number) =>
    index <= maxReachedStep &&
    steps.slice(0, index).every((_, earlier) => isStepComplete(earlier));

  const goTo = (next: number) => {
    setStep(next);
    setMaxReachedStep(prev => Math.max(prev, next));
    setFormOpen(false);
    scrollTo({ top: 0 });
  };

  const handleStartOver = () => {
    if (!globalThis.confirm("Start over? This will clear all entered data."))
      return;
    setMode(null);
    setProgramme(null);
    setPastChanges([]);
    setTimeline([]);
    setFormOpen(false);
    setStep(0);
    setMaxReachedStep(0);
  };

  return (
    <div className="nhsuk-width-container">
      <main className="nhsuk-main-wrapper" id="main-content">
        <header className="nhsuk-u-margin-bottom-4">
          <h1 className="nhsuk-heading-xl nhsuk-u-color-blue app-heading">
            NHS Completion of Training Date Calculator
            <span className="app-heading__version">
              Version {packageJson.version}
            </span>
          </h1>
        </header>

        {mode === null && <ModePicker onSelect={setMode} />}

        {mode !== null && (
          <div className="app-step-layout">
            <div className="app-step-layout__nav no-print">
              <StepIndicator
                steps={steps}
                currentStep={step}
                maxReachedStep={
                  steps.filter((_, index) => canOpenStep(index)).length - 1
                }
                onStepClick={index => {
                  if (canOpenStep(index)) goTo(index);
                }}
              />
            </div>

            <div className="app-step-layout__content">
              <div className="nhsuk-card">
                <div className="nhsuk-card__content">
                  {step === 0 && (
                    <>
                      <CompletionDateWarning />
                      <ProgrammeDetailsSection
                        programme={programme}
                        onChange={setProgramme}
                        onEditingChange={setFormOpen}
                      />
                    </>
                  )}

                  {step === 1 && programme && (
                    <TrainingTimeAdjustmentsSection
                      programme={programme}
                      onChange={setProgramme}
                      onFormOpenChange={setFormOpen}
                    />
                  )}

                  {step === 2 && programme && (
                    <GradeProgressionAdjustmentsSection
                      programme={programme}
                      onChange={setProgramme}
                      onFormOpenChange={setFormOpen}
                    />
                  )}

                  {step <= 2 && programme && (
                    <GradeProgressionPanel
                      mode={mode}
                      programme={programme}
                      pastChanges={pastChanges}
                      timeline={timeline}
                    />
                  )}

                  {step === 3 && mode === "QUICK" && programme && (
                    <ChangesPage
                      programme={programme}
                      pastChanges={pastChanges}
                      onPastChangesChange={setPastChanges}
                      onFormOpenChange={setFormOpen}
                    />
                  )}

                  {step === 3 && mode === "FULL" && programme && (
                    <TrainingTimelinePage
                      programme={programme}
                      timeline={timeline}
                      onTimelineChange={setTimeline}
                      onFormOpenChange={setFormOpen}
                    />
                  )}

                  {step < 4 && stepIssue(step) !== null && (
                    <p className="nhsuk-hint nhsuk-u-margin-top-4">
                      {stepIssue(step)}
                    </p>
                  )}

                  {step < 4 && isStepComplete(step) && (
                    <button
                      type="button"
                      className="nhsuk-button nhsuk-u-margin-top-4"
                      onClick={() => goTo(step + 1)}
                    >
                      {step === 3 ? "Show summary" : "Continue"}
                    </button>
                  )}

                  {step === 4 &&
                    mode === "QUICK" &&
                    programme &&
                    quickProjection && (
                      <SummaryPage
                        programme={programme}
                        pastChanges={pastChanges}
                        proposed={quickProjection}
                      />
                    )}

                  {step === 4 && mode === "FULL" && programme && (
                    <FullModeSummaryPage
                      programme={programme}
                      timeline={timeline}
                    />
                  )}
                </div>
              </div>

              {step > 0 && (
                <div className="nhsuk-u-margin-top-4 no-print">
                  <BackLink onClick={() => goTo(step - 1)}>
                    Back to {steps[step - 1].title}
                  </BackLink>
                </div>
              )}
              <div className="nhsuk-u-margin-top-3 no-print">
                <button
                  type="button"
                  className="nhsuk-button nhsuk-button--secondary"
                  onClick={handleStartOver}
                >
                  Start over
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
