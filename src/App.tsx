import { useState } from "react";
import { StepIndicator } from "./components/StepIndicator";
import { BackLink } from "./components/BackLink";
import { SetupPage } from "./pages/SetupPage";
import { SummaryPage } from "./pages/SummaryPage";
import type { PastChange, ProgrammeDetails, ProposedChange } from "./core";

const STEPS = [{ title: "Setup" }, { title: "Summary" }];

export const App = () => {
  const [step, setStep] = useState(0);
  const [maxReachedStep, setMaxReachedStep] = useState(0);
  const [programme, setProgramme] = useState<ProgrammeDetails | null>(null);
  const [pastChanges, setPastChanges] = useState<PastChange[]>([]);
  const [proposed, setProposed] = useState<ProposedChange | null>(null);

  const goTo = (next: number) => {
    setStep(next);
    setMaxReachedStep(prev => Math.max(prev, next));
  };

  const handleStartOver = () => {
    if (!globalThis.confirm("Start over? This will clear all entered data."))
      return;
    setProgramme(null);
    setPastChanges([]);
    setProposed(null);
    setStep(0);
    setMaxReachedStep(0);
  };

  return (
    <div className="nhsuk-width-container">
      <main className="nhsuk-main-wrapper" id="main-content">
        <header className="nhsuk-u-margin-bottom-4">
          <h1 className="nhsuk-heading-xl nhsuk-u-color-blue">
            NHS CCT Calculator
          </h1>
          <p className="nhsuk-lede-text nhsuk-u-margin-bottom-1">
            Calculate a projected completion of training date by recording past
            changes and your proposed next post.
          </p>
        </header>

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
                {step === 0 && (
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

                {step === 1 && programme && proposed && (
                  <SummaryPage
                    programme={programme}
                    pastChanges={pastChanges}
                    proposed={proposed}
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
      </main>
    </div>
  );
};
