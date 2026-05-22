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
            {index <= maxReachedStep ? (
              <button
                type="button"
                onClick={() => onStepClick(index)}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  width: "100%",
                  textAlign: "left",
                  fontWeight: index === currentStep ? "bold" : "normal",
                  fontSize: index === currentStep ? "1.25rem" : "inherit",
                  color: index === currentStep ? "#005eb8" : "inherit"
                }}
              >
                <span
                  className="nhsuk-tag"
                  style={{
                    borderRadius: "50%",
                    backgroundColor: getStepBackgroundColor(index),
                    flexShrink: 0
                  }}
                >
                  {index + 1}
                </span>
                <span
                  className="nhsuk-u-margin-left-2"
                  style={{ whiteSpace: "nowrap" }}
                >
                  {step.title}
                </span>
              </button>
            ) : (
              <div style={{ display: "flex", alignItems: "center" }}>
                <span
                  className="nhsuk-tag"
                  style={{
                    borderRadius: "50%",
                    backgroundColor: getStepBackgroundColor(index),
                    color: "white",
                    border: "none",
                    flexShrink: 0
                  }}
                >
                  {index + 1}
                </span>
                <span
                  className="nhsuk-u-margin-left-2"
                  style={{ whiteSpace: "nowrap" }}
                >
                  {step.title}
                </span>
              </div>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
};
