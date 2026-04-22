import { useState, useCallback, type ComponentType } from "react";
import {
  useForm,
  FormProvider,
  type UseFormReturn,
  type FieldPath
} from "react-hook-form";
import { ProgrammeDetails } from "./components/ProgrammeDetails";
import { CctCalculations } from "./components/CctCalculations";
import { FinalSummary } from "./components/FinalSummary";
import { StepIndicator } from "./components/StepIndicator";
import { ProgrammeInfoInset } from "./components/ProgrammeInfoInset";
import { BackLink } from "./components/BackLink";
import type { CctFormValues } from "./components/types";

type Step = {
  id: string;
  component: ComponentType;
  title: string;
  validate?: (methods: UseFormReturn<CctFormValues>) => Promise<boolean>;
};

const steps: Step[] = [
  {
    id: "programme-details",
    component: ProgrammeDetails,
    title: "Programme Details",
    validate: async methods =>
      methods.trigger([
        "programmeName",
        "programmeStartDate",
        "programmeEndDate"
      ])
  },
  {
    id: "cct-calculations",
    component: CctCalculations,
    title: "CCT Calculations",
    validate: async ({ getValues, trigger }) => {
      if (!getValues("calculationPerformed")) return false;
      const draftType = getValues("draftType");
      if (!draftType) return true;

      const draft = getValues("draftCalculation");
      const fields: FieldPath<CctFormValues>[] = [
        "draftCalculation.changeDate"
      ];
      if (!draft.untilEndOfProgramme) {
        fields.push("draftCalculation.endDate");
      }
      if (draftType === "LTFT") {
        fields.push("draftCalculation.endWte");
      }
      return trigger(fields);
    }
  },
  { id: "summary", component: FinalSummary, title: "Summary of changes" }
];

const defaultValues: CctFormValues = {
  programmeName: "",
  programmeStartDate: "",
  programmeEndDate: "",
  cctDate: "",
  calculationPerformed: false,
  calculationChanges: [],
  editingIndex: null,
  draftCalculation: {},
  draftType: null
};

export const App = () => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [maxReachedStepIndex, setMaxReachedStepIndex] = useState(0);

  const methods = useForm<CctFormValues>({
    defaultValues,
    mode: "onChange"
  });

  const currentStep = steps[currentStepIndex];

  const [
    programmeName,
    programmeStartDate,
    programmeEndDate,
    cctDate,
    calculationPerformed
  ] = methods.watch([
    "programmeName",
    "programmeStartDate",
    "programmeEndDate",
    "cctDate",
    "calculationPerformed"
  ]);

  const goToNextStep = useCallback(async () => {
    const step = steps[currentStepIndex];
    if (step.validate) {
      const isValid = await step.validate(methods);
      if (!isValid) return;
    }
    if (currentStepIndex < steps.length - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      setMaxReachedStepIndex(prev => Math.max(prev, nextIndex));
    }
  }, [currentStepIndex, methods]);

  const goToPreviousStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  }, [currentStepIndex]);

  const goToStep = useCallback(
    (index: number) => {
      if (index >= 0 && index <= maxReachedStepIndex && index < steps.length) {
        setCurrentStepIndex(index);
      }
    },
    [maxReachedStepIndex]
  );

  const resetForm = useCallback(() => {
    if (
      globalThis.confirm(
        "Are you sure you want to start over? All data will be lost."
      )
    ) {
      methods.reset(defaultValues);
      setCurrentStepIndex(0);
      setMaxReachedStepIndex(0);
    }
  }, [methods]);

  const StepComponent = currentStep.component;

  return (
    <div className="nhsuk-width-container">
      <main className="nhsuk-main-wrapper" id="main-content">
        <h1 className="nhsuk-heading-xl">CCT Calculator</h1>

        <StepIndicator
          steps={steps}
          currentStep={currentStepIndex}
          maxReachedStep={maxReachedStepIndex}
          onStepClick={goToStep}
        />

        {currentStepIndex > 0 && currentStepIndex !== steps.length - 1 && (
          <ProgrammeInfoInset
            programmeName={programmeName}
            programmeStartDate={programmeStartDate}
            programmeEndDate={programmeEndDate}
            showCctDate={calculationPerformed}
            cctDate={cctDate}
          />
        )}

        <FormProvider {...methods}>
          <form onSubmit={e => e.preventDefault()}>
            <div className="nhsuk-card">
              <div className="nhsuk-card__content">
                <h2 className="nhsuk-card__heading nhsuk-u-color-blue">
                  {currentStep.title}
                </h2>

                <StepComponent />
              </div>
            </div>

            <div className="nhsuk-grid-row no-print">
              <div className="nhsuk-grid-column-full">
                <div className="nhsuk-button-group nhsuk-u-margin-top-2">
                  {currentStepIndex < steps.length - 1 && (
                    <button
                      type="button"
                      className="nhsuk-button nhsuk-u-margin-right-4"
                      onClick={goToNextStep}
                    >
                      {`Continue to ${steps[currentStepIndex + 1].title}`}
                    </button>
                  )}
                  <button
                    type="button"
                    className="nhsuk-button nhsuk-button--secondary"
                    onClick={resetForm}
                  >
                    Start Over
                  </button>
                </div>
              </div>
              <div className="nhsuk-grid-row no-print">
                <div className="nhsuk-grid-column-full">
                  <div className="nhsuk-button-group nhsuk-u-margin-top-2">
                    {currentStepIndex > 0 && (
                      <BackLink onClick={goToPreviousStep}>
                        Back to {steps[currentStepIndex - 1].title}
                      </BackLink>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </form>
        </FormProvider>
      </main>
    </div>
  );
};
