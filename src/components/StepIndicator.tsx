import React from "react";

type StepIndicatorProps = {
  steps: { title: string }[];
  currentStep: number;
  maxReachedStep: number;
  onStepClick: (index: number) => void;
};

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  steps,
  currentStep,
  maxReachedStep,
  onStepClick
}) => {
  const getStepBackgroundColor = (index: number) => {
    if (index < currentStep) return "#007f3b"; // completed
    if (index === currentStep) return "#005eb8"; // current
    return "#6c757d"; // future
  };

  return (
    <nav className="nhsuk-pagination no-print">
      <ul className="nhsuk-list">
        {steps.map((step, index) => (
          <li
            key={`step-${step.title.replace(/\s+/g, "-").toLowerCase()}`}
            className="nhsuk-u-margin-bottom-3"
          >
            <div className="nhsuk-grid-row nhsuk-u-padding-bottom-2">
              <div className="nhsuk-grid-column-one-half">
                {index <= maxReachedStep ? (
                  <button
                    type="button"
                    onClick={() => onStepClick(index)}
                    // move inline styles later
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      fontWeight: index === currentStep ? "bold" : "normal",
                      fontSize: index === currentStep ? "1.25rem" : "inherit",
                      color: index === currentStep ? "#005eb8" : "inherit"
                    }}
                  >
                    <span
                      className="nhsuk-tag"
                      style={{
                        borderRadius: "50%",
                        backgroundColor: getStepBackgroundColor(index)
                      }}
                    >
                      {index + 1}
                    </span>
                    <span className="nhsuk-u-margin-left-2">{step.title}</span>
                  </button>
                ) : (
                  <>
                    <span
                      className="nhsuk-tag"
                      style={{
                        borderRadius: "50%",
                        backgroundColor: getStepBackgroundColor(index),
                        color: "white",
                        border: "none"
                      }}
                    >
                      {index + 1}
                    </span>
                    <span className="nhsuk-u-margin-left-2">{step.title}</span>
                  </>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </nav>
  );
};
