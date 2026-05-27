import { useState } from "react";
import { ModePicker } from "./components/ModePicker";
import { StepIndicator } from "./components/StepIndicator";
import { BackLink } from "./components/BackLink";
import { SetupPage } from "./pages/SetupPage";
import { SetupFullPage } from "./pages/SetupFullPage";
import { SummaryPage } from "./pages/SummaryPage";
import { FullModeSummaryPage } from "./pages/FullModeSummaryPage";
import type {
  CalculationMode,
  PastChange,
  ProgrammeDetails,
  ProposedChange,
  TrainingPeriod
} from "./core";

const STEPS = [{ title: "Setup" }, { title: "Summary" }];

export const App = () => {
  const [mode, setMode] = useState<CalculationMode | null>(null);
  const [step, setStep] = useState(0);
  const [maxReachedStep, setMaxReachedStep] = useState(0);
  const [programme, setProgramme] = useState<ProgrammeDetails | null>(null);
  const [pastChanges, setPastChanges] = useState<PastChange[]>([]);
  const [proposed, setProposed] = useState<ProposedChange | null>(null);
  const [timeline, setTimeline] = useState<TrainingPeriod[]>([]);

  const goTo = (next: number) => {
    setStep(next);
    setMaxReachedStep(prev => Math.max(prev, next));
  };

  const handleStartOver = () => {
    if (!globalThis.confirm("Start over? This will clear all entered data."))
      return;
    setMode(null);
    setProgramme(null);
    setPastChanges([]);
    setProposed(null);
    setTimeline([]);
    setStep(0);
    setMaxReachedStep(0);
  };

  return (
    <div className="nhsuk-width-container">
      <main className="nhsuk-main-wrapper" id="main-content">
        <header className="nhsuk-u-margin-bottom-4">
          <h1 className="nhsuk-heading-xl nhsuk-u-color-blue">
            NHS Completion of Training Date Calculator
          </h1>
          <p className="nhsuk-lede-text nhsuk-u-margin-bottom-1">
            Calculate a projected Completion of Training Date by recording
            past changes and your proposed next post.
          </p>
        </header>

        {mode === null && <ModePicker onSelect={setMode} />}

        {mode !== null && (
          <div className="nhsuk-grid-row">
            <div className="nhsuk-grid-column-one-quarter no-print">
              <StepIndicator
                steps={STEPS}
                currentStep={step}
                maxReachedStep={maxReachedStep}
                onStepClick={index => {
                  if (index <= maxReachedStep) setStep(index);
                }}
              />
            </div>

            <div className="nhsuk-grid-column-three-quarters">
              <div className="nhsuk-card">
                <div className="nhsuk-card__content">
                  {step === 0 && mode === "QUICK" && (
                    <SetupPage
                      programme={programme}
                      pastChanges={pastChanges}
                      proposed={proposed}
                      onProgrammeChange={setProgramme}
                      onPastChangesChange={setPastChanges}
                      onProposedChange={setProposed}
                      onContinue={() => goTo(1)}
                    />
                  )}

                  {step === 0 && mode === "FULL" && (
                    <SetupFullPage
                      programme={programme}
                      timeline={timeline}
                      onProgrammeChange={setProgramme}
                      onTimelineChange={setTimeline}
                      onContinue={() => goTo(1)}
                    />
                  )}

                  {step === 1 && mode === "QUICK" && programme && proposed && (
                    <SummaryPage
                      programme={programme}
                      pastChanges={pastChanges}
                      proposed={proposed}
                    />
                  )}

                  {step === 1 && mode === "FULL" && programme && (
                    <FullModeSummaryPage
                      programme={programme}
                      timeline={timeline}
                    />
                  )}
                </div>
              </div>

              {step > 0 && (
                <div className="nhsuk-u-margin-top-4 no-print">
                  <BackLink onClick={() => setStep(step - 1)}>
                    Back to {STEPS[step - 1].title}
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
