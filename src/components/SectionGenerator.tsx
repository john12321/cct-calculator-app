import type { FC, ComponentType } from "react";
import { BackLink } from "./BackLink";
import type { FormState, StepState } from "./types";

type Step = {
  component: ComponentType<{
    onUpdate?: (updates: Partial<StepState>) => void;
  }>;
  title: string;
};

type SectionGeneratorProps = {
  currentStep: number;
  steps: Step[];
  formState: FormState;
  onNext: () => void;
  onBack: (stepIndex: number) => void;
  onStartOver: () => void;
  onStepUpdate: (stepIndex: number, updates: Partial<StepState>) => void;
};

export const SectionGenerator: FC<SectionGeneratorProps> = ({
  currentStep,
  steps,
  formState,
  onNext,
  onBack,
  onStartOver,
  onStepUpdate
}) => {
  const CurrentComponent = steps[currentStep].component;
  const currentStepState = formState[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  return (
    <>
      <div className="nhsuk-card">
        <div className="nhsuk-card__content">
          <h2 className="nhsuk-card__heading nhsuk-u-color-blue">
            {steps[currentStep].title}
          </h2>

          <CurrentComponent
            onUpdate={(updates: Partial<StepState>) =>
              onStepUpdate(currentStep, updates)
            }
          />
        </div>
      </div>

      <div className="nhsuk-grid-row no-print">
        <div className="nhsuk-button-group nhsuk-u-margin-top-4">
          {!isLastStep && (
            <button
              type="button"
              className="nhsuk-button nhsuk-u-margin-right-4"
              onClick={onNext}
            >
              {currentStepState.continueToText}
            </button>
          )}
          <button
            type="button"
            className="nhsuk-button nhsuk-button--secondary "
            onClick={onStartOver}
          >
            Start Over
          </button>

          {currentStep > 0 && (
            <BackLink onClick={() => onBack(currentStep - 1)}>
              Back to {steps[currentStep - 1].title}
            </BackLink>
          )}
        </div>
      </div>
    </>
  );
};
