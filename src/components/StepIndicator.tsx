import React from "react";

type StepIndicatorProps = {
  steps: { title: string }[];
  currentStep: number;
  maxReachedStep: number;
  onStepClick: (index: number) => void;
};

type StepStatus = "completed" | "current" | "upcoming";

const STATUS_LABEL: Record<StepStatus, string> = {
  completed: "completed",
  current: "current step",
  upcoming: "not yet started"
};

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  steps,
  currentStep,
  maxReachedStep,
  onStepClick
}) => {
  const getStatus = (index: number): StepStatus => {
    if (index < currentStep) return "completed";
    if (index === currentStep) return "current";
    return "upcoming";
  };

  const renderContent = (
    step: { title: string },
    index: number,
    status: StepStatus
  ) => (
    <>
      <span
        className={`app-step-indicator__number app-step-indicator__number--${status}`}
        aria-hidden="true"
      >
        {index + 1}
      </span>
      <span className="app-step-indicator__title">
        <span className="nhsuk-u-visually-hidden">{`Step ${index + 1}, ${STATUS_LABEL[status]}: `}</span>
        {step.title}
      </span>
    </>
  );

  return (
    <nav className="app-step-indicator no-print" aria-label="Progress">
      <ol className="nhsuk-list app-step-indicator__list">
        {steps.map((step, index) => {
          const status = getStatus(index);
          const isClickable = index <= maxReachedStep;
          const itemClassName = `app-step-indicator__item app-step-indicator__item--${status}`;

          return (
            <li
              key={`step-${step.title.replace(/\s+/g, "-").toLowerCase()}`}
              className={itemClassName}
            >
              {isClickable ? (
                <button
                  type="button"
                  className="app-step-indicator__link"
                  onClick={() => onStepClick(index)}
                  aria-current={status === "current" ? "step" : undefined}
                >
                  {renderContent(step, index, status)}
                </button>
              ) : (
                <span
                  className="app-step-indicator__static"
                  aria-current={status === "current" ? "step" : undefined}
                >
                  {renderContent(step, index, status)}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
