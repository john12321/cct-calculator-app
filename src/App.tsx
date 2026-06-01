import { useState } from "react";
import { ModePicker } from "./components/ModePicker";
import { StepIndicator } from "./components/StepIndicator";
import { BackLink } from "./components/BackLink";
import { SetupPage } from "./pages/SetupPage";
import { SetupFullPage } from "./pages/SetupFullPage";
import { SummaryPage } from "./pages/SummaryPage";
import { FullModeSummaryPage } from "./pages/FullModeSummaryPage";
import packageJson from "../package.json";
import type {
  CalculationMode,
  PastChange,
  ProgrammeDetails,
  TrainingPeriod
} from "./core";
import { deriveQuickProjection } from "./core";
import { scrollTo } from "./utils/scroll";

const STEPS = [{ title: "Setup" }, { title: "Summary" }];

export const App = () => {
  const [mode, setMode] = useState<CalculationMode | null>(null);
  const [step, setStep] = useState(0);
  const [maxReachedStep, setMaxReachedStep] = useState(0);
  const [programme, setProgramme] = useState<ProgrammeDetails | null>(null);
  const [pastChanges, setPastChanges] = useState<PastChange[]>([]);
  const [timeline, setTimeline] = useState<TrainingPeriod[]>([]);
  const quickProjection =
    programme === null ? null : deriveQuickProjection(programme, pastChanges);

  const goTo = (next: number) => {
    setStep(next);
    setMaxReachedStep(prev => Math.max(prev, next));
    scrollTo({ top: 0 });
  };

  const handleStartOver = () => {
    if (!globalThis.confirm("Start over? This will clear all entered data."))
      return;
    setMode(null);
    setProgramme(null);
    setPastChanges([]);
    setTimeline([]);
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
                steps={STEPS}
                currentStep={step}
                maxReachedStep={maxReachedStep}
                onStepClick={index => {
                  if (index <= maxReachedStep) goTo(index);
                }}
              />
            </div>

            <div className="app-step-layout__content">
              <div className="nhsuk-card">
                <div className="nhsuk-card__content">
                  {step === 0 && mode === "QUICK" && (
                    <SetupPage
                      programme={programme}
                      pastChanges={pastChanges}
                      onProgrammeChange={setProgramme}
                      onPastChangesChange={setPastChanges}
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

                  {step === 1 &&
                    mode === "QUICK" &&
                    programme &&
                    quickProjection && (
                      <SummaryPage
                        programme={programme}
                        pastChanges={pastChanges}
                        proposed={quickProjection}
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
                  <BackLink onClick={() => goTo(step - 1)}>
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
