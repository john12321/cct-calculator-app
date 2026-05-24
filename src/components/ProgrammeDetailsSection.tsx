import { useEffect, useState, type FC, type FormEvent } from "react";
import dayjs from "dayjs";
import {
  TRAINING_GRADES,
  findSpecialty,
  programmeAdjustedEndDate,
  programmeOriginalEndDate,
  validateProgrammeDetails,
  type ProgrammeDetails
} from "../core";
import { formatDate, formatMonths } from "../utils/format";
import { SpecialtyCombobox } from "./SpecialtyCombobox";

type ProgrammeDetailsSectionProps = {
  programme: ProgrammeDetails | null;
  onChange: (programme: ProgrammeDetails) => void;
};

export const ProgrammeDetailsSection: FC<ProgrammeDetailsSectionProps> = ({
  programme,
  onChange
}) => {
  const initialSpecialty = findSpecialty(programme?.specialty ?? "");
  const initialGradeOverride =
    programme !== null &&
    initialSpecialty !== undefined &&
    programme.startGrade !== initialSpecialty.entryGrade;
  const initialHasAdditionalTraining =
    programme !== null && programme.additionalMonths > 0;
  const initialHasAcceleratedTraining =
    programme !== null && programme.acceleratedMonths > 0;
  const initialHasEighteenMonthFinalYear =
    programme !== null && programme.eighteenMonthFinalGrade !== "";
  const initialHasSkippedGrade =
    programme !== null && programme.skippedGrade !== "";

  const [editing, setEditing] = useState(programme === null);
  const [specialty, setSpecialty] = useState(programme?.specialty ?? "");
  const [startDate, setStartDate] = useState(programme?.startDate ?? "");
  const [overrideGrade, setOverrideGrade] = useState(initialGradeOverride);
  const [startGrade, setStartGrade] = useState(programme?.startGrade ?? "");
  const [startGradeOverrideNotes, setStartGradeOverrideNotes] = useState(
    initialGradeOverride ? (programme?.startGradeOverrideNotes ?? "") : ""
  );
  const [hasAdditionalTraining, setHasAdditionalTraining] = useState(
    initialHasAdditionalTraining
  );
  const [additionalMonthsText, setAdditionalMonthsText] = useState(
    initialHasAdditionalTraining ? String(programme.additionalMonths) : ""
  );
  const [additionalMonthsNotes, setAdditionalMonthsNotes] = useState(
    initialHasAdditionalTraining ? programme.additionalMonthsNotes : ""
  );
  const [hasAcceleratedTraining, setHasAcceleratedTraining] = useState(
    initialHasAcceleratedTraining
  );
  const [acceleratedMonthsText, setAcceleratedMonthsText] = useState(
    initialHasAcceleratedTraining ? String(programme.acceleratedMonths) : ""
  );
  const [acceleratedMonthsNotes, setAcceleratedMonthsNotes] = useState(
    initialHasAcceleratedTraining ? programme.acceleratedMonthsNotes : ""
  );
  const [hasEighteenMonthFinalYear, setHasEighteenMonthFinalYear] = useState(
    initialHasEighteenMonthFinalYear
  );
  const [eighteenMonthFinalGrade, setEighteenMonthFinalGrade] = useState(
    initialHasEighteenMonthFinalYear ? programme.eighteenMonthFinalGrade : ""
  );
  const [eighteenMonthFinalGradeNotes, setEighteenMonthFinalGradeNotes] =
    useState(
      initialHasEighteenMonthFinalYear
        ? programme.eighteenMonthFinalGradeNotes
        : ""
    );
  const [hasSkippedGrade, setHasSkippedGrade] = useState(initialHasSkippedGrade);
  const [skippedGrade, setSkippedGrade] = useState(
    initialHasSkippedGrade ? programme.skippedGrade : ""
  );
  const [skippedGradeNotes, setSkippedGradeNotes] = useState(
    initialHasSkippedGrade ? programme.skippedGradeNotes : ""
  );
  const [error, setError] = useState<string | null>(null);

  const selectedSpecialty = findSpecialty(specialty);

  useEffect(() => {
    if (programme === null) {
      setEditing(true);
      setSpecialty("");
      setStartDate("");
      setOverrideGrade(false);
      setStartGrade("");
      setStartGradeOverrideNotes("");
      setHasAdditionalTraining(false);
      setAdditionalMonthsText("");
      setAdditionalMonthsNotes("");
      setHasAcceleratedTraining(false);
      setAcceleratedMonthsText("");
      setAcceleratedMonthsNotes("");
      setHasEighteenMonthFinalYear(false);
      setEighteenMonthFinalGrade("");
      setEighteenMonthFinalGradeNotes("");
      setHasSkippedGrade(false);
      setSkippedGrade("");
      setSkippedGradeNotes("");
      setError(null);
      return;
    }

    const nextSpecialty = findSpecialty(programme.specialty);
    setEditing(false);
    setSpecialty(programme.specialty);
    setStartDate(programme.startDate);
    setOverrideGrade(
      nextSpecialty !== undefined &&
        programme.startGrade !== nextSpecialty.entryGrade
    );
    setStartGrade(programme.startGrade);
    setStartGradeOverrideNotes(
      nextSpecialty !== undefined &&
        programme.startGrade !== nextSpecialty.entryGrade
        ? programme.startGradeOverrideNotes
        : ""
    );
    setHasAdditionalTraining(programme.additionalMonths > 0);
    setAdditionalMonthsText(
      programme.additionalMonths > 0 ? String(programme.additionalMonths) : ""
    );
    setAdditionalMonthsNotes(
      programme.additionalMonths > 0 ? programme.additionalMonthsNotes : ""
    );
    setHasAcceleratedTraining(programme.acceleratedMonths > 0);
    setAcceleratedMonthsText(
      programme.acceleratedMonths > 0 ? String(programme.acceleratedMonths) : ""
    );
    setAcceleratedMonthsNotes(
      programme.acceleratedMonths > 0 ? programme.acceleratedMonthsNotes : ""
    );
    setHasEighteenMonthFinalYear(programme.eighteenMonthFinalGrade !== "");
    setEighteenMonthFinalGrade(programme.eighteenMonthFinalGrade);
    setEighteenMonthFinalGradeNotes(
      programme.eighteenMonthFinalGrade !== ""
        ? programme.eighteenMonthFinalGradeNotes
        : ""
    );
    setHasSkippedGrade(programme.skippedGrade !== "");
    setSkippedGrade(programme.skippedGrade);
    setSkippedGradeNotes(
      programme.skippedGrade !== "" ? programme.skippedGradeNotes : ""
    );
    setError(null);
  }, [programme]);

  const handleSpecialtyChange = (next: string) => {
    setSpecialty(next);
    const found = findSpecialty(next);
    if (found) {
      setOverrideGrade(false);
      setStartGrade(found.entryGrade);
      setStartGradeOverrideNotes("");
    } else {
      setStartGrade("");
      setStartGradeOverrideNotes("");
    }
    setHasEighteenMonthFinalYear(false);
    setEighteenMonthFinalGrade("");
    setEighteenMonthFinalGradeNotes("");
    setHasSkippedGrade(false);
    setSkippedGrade("");
    setSkippedGradeNotes("");
  };

  const handleGradeOverrideToggle = (checked: boolean) => {
    setOverrideGrade(checked);
    if (!checked) {
      setStartGradeOverrideNotes("");
      if (selectedSpecialty) {
        setStartGrade(selectedSpecialty.entryGrade);
      }
    }
  };

  const handleAdditionalTrainingToggle = (checked: boolean) => {
    setHasAdditionalTraining(checked);
    if (!checked) {
      setAdditionalMonthsText("");
      setAdditionalMonthsNotes("");
    }
  };

  const handleAcceleratedTrainingToggle = (checked: boolean) => {
    setHasAcceleratedTraining(checked);
    if (!checked) {
      setAcceleratedMonthsText("");
      setAcceleratedMonthsNotes("");
    }
  };

  const handleEighteenMonthFinalYearToggle = (checked: boolean) => {
    setHasEighteenMonthFinalYear(checked);
    if (!checked) {
      setEighteenMonthFinalGrade("");
      setEighteenMonthFinalGradeNotes("");
    }
  };

  const handleSkippedGradeToggle = (checked: boolean) => {
    setHasSkippedGrade(checked);
    if (!checked) {
      setSkippedGrade("");
      setSkippedGradeNotes("");
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const lengthMonths = selectedSpecialty?.lengthMonths ?? Number.NaN;
    const additionalMonths = hasAdditionalTraining
      ? Number.parseFloat(additionalMonthsText)
      : 0;
    const acceleratedMonths = hasAcceleratedTraining
      ? Number.parseFloat(acceleratedMonthsText)
      : 0;
    const isGradeOverridden =
      overrideGrade &&
      selectedSpecialty !== undefined &&
      startGrade.trim() !== selectedSpecialty.entryGrade;
    if (
      hasAdditionalTraining &&
      (!Number.isFinite(additionalMonths) || additionalMonths <= 0)
    ) {
      setError("Additional training time must be greater than zero.");
      return;
    }
    if (
      hasAcceleratedTraining &&
      (!Number.isFinite(acceleratedMonths) || acceleratedMonths <= 0)
    ) {
      setError("Accelerated training time must be greater than zero.");
      return;
    }
    if (overrideGrade && !startGradeOverrideNotes.trim()) {
      setError("Please enter a reason for overriding the default start grade.");
      return;
    }
    if (hasAdditionalTraining && !additionalMonthsNotes.trim()) {
      setError("Please enter a reason for additional training time.");
      return;
    }
    if (hasAcceleratedTraining && !acceleratedMonthsNotes.trim()) {
      setError("Please enter a reason for accelerated training time.");
      return;
    }
    if (hasEighteenMonthFinalYear && !eighteenMonthFinalGrade) {
      setError("Please choose the grade with an 18-month final year.");
      return;
    }
    if (hasEighteenMonthFinalYear && !eighteenMonthFinalGradeNotes.trim()) {
      setError("Please enter a reason for the 18-month final year.");
      return;
    }
    if (hasSkippedGrade && !skippedGrade) {
      setError("Please choose the grade year to skip.");
      return;
    }
    if (hasSkippedGrade && !skippedGradeNotes.trim()) {
      setError("Please enter a reason for skipping a grade year.");
      return;
    }
    const next: ProgrammeDetails = {
      specialty: specialty.trim(),
      startDate,
      lengthMonths,
      additionalMonths,
      additionalMonthsNotes: hasAdditionalTraining
        ? additionalMonthsNotes.trim()
        : "",
      acceleratedMonths,
      acceleratedMonthsNotes: hasAcceleratedTraining
        ? acceleratedMonthsNotes.trim()
        : "",
      eighteenMonthFinalGrade: hasEighteenMonthFinalYear
        ? eighteenMonthFinalGrade
        : "",
      eighteenMonthFinalGradeNotes: hasEighteenMonthFinalYear
        ? eighteenMonthFinalGradeNotes.trim()
        : "",
      skippedGrade: hasSkippedGrade ? skippedGrade : "",
      skippedGradeNotes: hasSkippedGrade ? skippedGradeNotes.trim() : "",
      startGrade: startGrade.trim(),
      startGradeOverrideNotes: isGradeOverridden
        ? startGradeOverrideNotes.trim()
        : ""
    };
    const result = validateProgrammeDetails(next);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setError(null);
    onChange(next);
    setEditing(false);
  };

  const handleCancel = () => {
    if (!programme) return;
    setSpecialty(programme.specialty);
    setStartDate(programme.startDate);
    setStartGrade(programme.startGrade);
    setOverrideGrade(initialGradeOverride);
    setStartGradeOverrideNotes(
      initialGradeOverride ? programme.startGradeOverrideNotes : ""
    );
    setHasAdditionalTraining(initialHasAdditionalTraining);
    setAdditionalMonthsText(
      initialHasAdditionalTraining ? String(programme.additionalMonths) : ""
    );
    setAdditionalMonthsNotes(
      initialHasAdditionalTraining ? programme.additionalMonthsNotes : ""
    );
    setHasAcceleratedTraining(initialHasAcceleratedTraining);
    setAcceleratedMonthsText(
      initialHasAcceleratedTraining ? String(programme.acceleratedMonths) : ""
    );
    setAcceleratedMonthsNotes(
      initialHasAcceleratedTraining ? programme.acceleratedMonthsNotes : ""
    );
    setHasEighteenMonthFinalYear(initialHasEighteenMonthFinalYear);
    setEighteenMonthFinalGrade(
      initialHasEighteenMonthFinalYear ? programme.eighteenMonthFinalGrade : ""
    );
    setEighteenMonthFinalGradeNotes(
      initialHasEighteenMonthFinalYear
        ? programme.eighteenMonthFinalGradeNotes
        : ""
    );
    setHasSkippedGrade(initialHasSkippedGrade);
    setSkippedGrade(initialHasSkippedGrade ? programme.skippedGrade : "");
    setSkippedGradeNotes(
      initialHasSkippedGrade ? programme.skippedGradeNotes : ""
    );
    setError(null);
    setEditing(false);
  };

  return (
    <section className="nhsuk-u-margin-bottom-6">
      <h2 className="nhsuk-heading-l nhsuk-u-color-blue">Programme details</h2>

      {editing ? (
        <form onSubmit={handleSubmit} noValidate>
          <p className="nhsuk-body">
            Pick your specialty to auto-fill the standard programme length.
          </p>

          <div className="nhsuk-form-group">
            <label className="nhsuk-label" htmlFor="programme-specialty">
              Specialty
            </label>
            <SpecialtyCombobox
              inputId="programme-specialty"
              value={specialty}
              onChange={handleSpecialtyChange}
            />
            {selectedSpecialty?.dual && (
              <p className="nhsuk-hint nhsuk-u-margin-top-1">
                {selectedSpecialty.dual}
              </p>
            )}
          </div>

          <div className="nhsuk-form-group">
            <label className="nhsuk-label" htmlFor="programme-length">
              Programme length (months)
            </label>
            {selectedSpecialty && (
              <p className="nhsuk-hint nhsuk-u-margin-top-1">
                Default for {selectedSpecialty.name} is{" "}
                {selectedSpecialty.lengthMonths} months.
              </p>
            )}
            <input
              className="nhsuk-input nhsuk-input--width-5"
              id="programme-length"
              type="number"
              step="0.1"
              min="0"
              value={selectedSpecialty?.lengthMonths ?? ""}
              readOnly
            />
            {selectedSpecialty?.info && (
              <p className="nhsuk-hint nhsuk-u-margin-top-2">
                {selectedSpecialty.info}
              </p>
            )}
          </div>

          <div className="nhsuk-form-group">
            <label className="nhsuk-label" htmlFor="programme-start">
              Programme start date
            </label>
            <input
              className="nhsuk-input nhsuk-input--width-10"
              id="programme-start"
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
            />
          </div>

          <div className="nhsuk-form-group">
            <label className="nhsuk-label" htmlFor="programme-start-grade">
              Start grade
            </label>
            {selectedSpecialty && !overrideGrade && (
              <p className="nhsuk-hint nhsuk-u-margin-top-1">
                Default for {selectedSpecialty.name} is{" "}
                {selectedSpecialty.entryGrade}.
              </p>
            )}
            {overrideGrade || !selectedSpecialty ? (
              <select
                className="nhsuk-select"
                id="programme-start-grade"
                value={startGrade}
                onChange={e => setStartGrade(e.target.value)}
              >
                <option value="" disabled>
                  Select a start grade
                </option>
                {TRAINING_GRADES.map(g => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            ) : (
              <input
                className="nhsuk-input nhsuk-input--width-5"
                id="programme-start-grade"
                type="text"
                value={startGrade}
                readOnly
              />
            )}
            {selectedSpecialty && (
              <div
                className="nhsuk-checkboxes__item nhsuk-u-margin-top-2"
                style={{ paddingLeft: "32px" }}
              >
                <input
                  className="nhsuk-checkboxes__input"
                  id="programme-start-grade-override"
                  type="checkbox"
                  checked={overrideGrade}
                  onChange={e => handleGradeOverrideToggle(e.target.checked)}
                />
                <label
                  className="nhsuk-label nhsuk-checkboxes__label"
                  htmlFor="programme-start-grade-override"
                >
                  I am overriding default start grade because...
                </label>
              </div>
            )}
            {selectedSpecialty && overrideGrade && (
              <div className="nhsuk-u-margin-top-3">
                <label
                  className="nhsuk-label"
                  htmlFor="programme-start-grade-override-notes"
                >
                  Reason for start grade override
                </label>
                <input
                  className="nhsuk-input nhsuk-input--width-30"
                  id="programme-start-grade-override-notes"
                  type="text"
                  value={startGradeOverrideNotes}
                  onChange={e => setStartGradeOverrideNotes(e.target.value)}
                  placeholder="e.g. Entering programme at ST4"
                  required
                />
              </div>
            )}
          </div>

          <h3 className="nhsuk-heading-m nhsuk-u-color-blue nhsuk-u-margin-top-5">
            Other training time adjustments (optional)
          </h3>

          <div className="nhsuk-form-group">
            <div
              className="nhsuk-checkboxes__item"
              style={{ paddingLeft: "32px" }}
            >
              <input
                className="nhsuk-checkboxes__input"
                id="programme-additional-training-toggle"
                type="checkbox"
                checked={hasAdditionalTraining}
                onChange={e => handleAdditionalTrainingToggle(e.target.checked)}
              />
              <label
                className="nhsuk-label nhsuk-checkboxes__label"
                htmlFor="programme-additional-training-toggle"
              >
                Add additional training time
              </label>
            </div>
            {hasAdditionalTraining && (
              <div className="nhsuk-u-margin-top-3">
                <label
                  className="nhsuk-label"
                  htmlFor="programme-additional-months"
                >
                  Additional training time (months)
                </label>
                <p className="nhsuk-hint">
                  For example, additional time required following an ARCP
                  outcome.
                </p>
                <input
                  className="nhsuk-input nhsuk-input--width-5"
                  id="programme-additional-months"
                  type="number"
                  step="0.1"
                  min="0"
                  value={additionalMonthsText}
                  onChange={e => setAdditionalMonthsText(e.target.value)}
                />
                <label
                  className="nhsuk-label nhsuk-u-margin-top-3"
                  htmlFor="programme-additional-months-notes"
                >
                  Reason for additional training time
                </label>
                <input
                  className="nhsuk-input nhsuk-input--width-30"
                  id="programme-additional-months-notes"
                  type="text"
                  value={additionalMonthsNotes}
                  onChange={e => setAdditionalMonthsNotes(e.target.value)}
                  placeholder="e.g. Outcome 3 following ARCP"
                  required
                />
              </div>
            )}
          </div>

          <div className="nhsuk-form-group">
            <div
              className="nhsuk-checkboxes__item"
              style={{ paddingLeft: "32px" }}
            >
              <input
                className="nhsuk-checkboxes__input"
                id="programme-accelerated-training-toggle"
                type="checkbox"
                checked={hasAcceleratedTraining}
                onChange={e =>
                  handleAcceleratedTrainingToggle(e.target.checked)
                }
              />
              <label
                className="nhsuk-label nhsuk-checkboxes__label"
                htmlFor="programme-accelerated-training-toggle"
              >
                Add accelerated training time (reduce programme length)
              </label>
            </div>
            {hasAcceleratedTraining && (
              <div className="nhsuk-u-margin-top-3">
                <label
                  className="nhsuk-label"
                  htmlFor="programme-accelerated-months"
                >
                  Accelerated training time (months)
                </label>
                <p className="nhsuk-hint">
                  For example, recognised prior learning that reduces the
                  remaining training requirement.
                </p>
                <input
                  className="nhsuk-input nhsuk-input--width-5"
                  id="programme-accelerated-months"
                  type="number"
                  step="0.1"
                  min="0"
                  value={acceleratedMonthsText}
                  onChange={e => setAcceleratedMonthsText(e.target.value)}
                />
                <label
                  className="nhsuk-label nhsuk-u-margin-top-3"
                  htmlFor="programme-accelerated-months-notes"
                >
                  Reason for accelerated training time
                </label>
                <input
                  className="nhsuk-input nhsuk-input--width-30"
                  id="programme-accelerated-months-notes"
                  type="text"
                  value={acceleratedMonthsNotes}
                  onChange={e => setAcceleratedMonthsNotes(e.target.value)}
                  placeholder="e.g. Recognised prior learning"
                  required
                />
              </div>
            )}
          </div>

          <div className="nhsuk-form-group">
            <div
              className="nhsuk-checkboxes__item"
              style={{ paddingLeft: "32px" }}
            >
              <input
                className="nhsuk-checkboxes__input"
                id="programme-eighteen-month-final-year-toggle"
                type="checkbox"
                checked={hasEighteenMonthFinalYear}
                onChange={e =>
                  handleEighteenMonthFinalYearToggle(e.target.checked)
                }
              />
              <label
                className="nhsuk-label nhsuk-checkboxes__label"
                htmlFor="programme-eighteen-month-final-year-toggle"
              >
                Set an 18-month final year
              </label>
            </div>
            {hasEighteenMonthFinalYear && (
              <div className="nhsuk-u-margin-top-3">
                <label
                  className="nhsuk-label"
                  htmlFor="programme-eighteen-month-final-grade"
                >
                  Final grade lasting 18 months
                </label>
                <p className="nhsuk-hint">
                  For specialties with an 18-month final year, for example
                  intensive care medicine with a dual specialty. This changes
                  grade progression, not total training time.
                </p>
                <select
                  className="nhsuk-select"
                  id="programme-eighteen-month-final-grade"
                  value={eighteenMonthFinalGrade}
                  onChange={e => setEighteenMonthFinalGrade(e.target.value)}
                  required
                >
                  <option value="" disabled>
                    Select the final grade
                  </option>
                  {TRAINING_GRADES.map(g => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
                <label
                  className="nhsuk-label nhsuk-u-margin-top-3"
                  htmlFor="programme-eighteen-month-final-grade-notes"
                >
                  Reason for 18-month final year
                </label>
                <input
                  className="nhsuk-input nhsuk-input--width-30"
                  id="programme-eighteen-month-final-grade-notes"
                  type="text"
                  value={eighteenMonthFinalGradeNotes}
                  onChange={e =>
                    setEighteenMonthFinalGradeNotes(e.target.value)
                  }
                  placeholder="e.g. ICM dual-specialty final year"
                  required
                />
              </div>
            )}
          </div>

          <div className="nhsuk-form-group">
            <div
              className="nhsuk-checkboxes__item"
              style={{ paddingLeft: "32px" }}
            >
              <input
                className="nhsuk-checkboxes__input"
                id="programme-skipped-grade-toggle"
                type="checkbox"
                checked={hasSkippedGrade}
                onChange={e => handleSkippedGradeToggle(e.target.checked)}
              />
              <label
                className="nhsuk-label nhsuk-checkboxes__label"
                htmlFor="programme-skipped-grade-toggle"
              >
                Skip one grade year
              </label>
            </div>
            {hasSkippedGrade && (
              <div className="nhsuk-u-margin-top-3">
                <label
                  className="nhsuk-label"
                  htmlFor="programme-skipped-grade"
                >
                  Grade year to skip
                </label>
                <p className="nhsuk-hint">
                  This moves later displayed grades on by one year. Record any
                  shorter programme duration separately as accelerated
                  training time.
                </p>
                <select
                  className="nhsuk-select"
                  id="programme-skipped-grade"
                  value={skippedGrade}
                  onChange={e => setSkippedGrade(e.target.value)}
                  required
                >
                  <option value="" disabled>
                    Select the grade to skip
                  </option>
                  {TRAINING_GRADES.map(g => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
                <label
                  className="nhsuk-label nhsuk-u-margin-top-3"
                  htmlFor="programme-skipped-grade-notes"
                >
                  Reason for skipping a grade year
                </label>
                <input
                  className="nhsuk-input nhsuk-input--width-30"
                  id="programme-skipped-grade-notes"
                  type="text"
                  value={skippedGradeNotes}
                  onChange={e => setSkippedGradeNotes(e.target.value)}
                  placeholder="e.g. Progression from ST1 to ST3 after core competencies"
                  required
                />
              </div>
            )}
          </div>

          {error && (
            <div className="nhsuk-error-summary" role="alert">
              <p className="nhsuk-error-summary__body">{error}</p>
            </div>
          )}

          <div className="nhsuk-button-group">
            <button
              type="submit"
              className="nhsuk-button nhsuk-u-margin-right-3"
            >
              {programme ? "Save programme details" : "Save and continue"}
            </button>
            {programme && (
              <button
                type="button"
                className="nhsuk-button nhsuk-button--secondary"
                onClick={handleCancel}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      ) : (
        programme && (
          <>
            <dl className="nhsuk-summary-list">
              <div className="nhsuk-summary-list__row">
                <dt className="nhsuk-summary-list__key">Specialty</dt>
                <dd className="nhsuk-summary-list__value">
                  {programme.specialty}
                  {initialSpecialty?.dual && (
                    <span className="nhsuk-u-margin-left-2">
                      <strong>({initialSpecialty.dual})</strong>
                    </span>
                  )}
                </dd>
              </div>
              <div className="nhsuk-summary-list__row">
                <dt className="nhsuk-summary-list__key">Length</dt>
                <dd className="nhsuk-summary-list__value">
                  {formatMonths(programme.lengthMonths)}
                </dd>
              </div>
              {programme.additionalMonths > 0 && (
                <div className="nhsuk-summary-list__row">
                  <dt className="nhsuk-summary-list__key">
                    Additional training time
                  </dt>
                  <dd className="nhsuk-summary-list__value">
                    {formatMonths(programme.additionalMonths)}
                    {programme.additionalMonthsNotes && (
                      <div className="nhsuk-hint nhsuk-u-margin-top-1">
                        {programme.additionalMonthsNotes}
                      </div>
                    )}
                  </dd>
                </div>
              )}
              {programme.acceleratedMonths > 0 && (
                <div className="nhsuk-summary-list__row">
                  <dt className="nhsuk-summary-list__key">
                    Accelerated training time
                  </dt>
                  <dd className="nhsuk-summary-list__value">
                    {formatMonths(programme.acceleratedMonths)}
                    {programme.acceleratedMonthsNotes && (
                      <div className="nhsuk-hint nhsuk-u-margin-top-1">
                        {programme.acceleratedMonthsNotes}
                      </div>
                    )}
                  </dd>
                </div>
              )}
              {programme.eighteenMonthFinalGrade && (
                <div className="nhsuk-summary-list__row">
                  <dt className="nhsuk-summary-list__key">
                    18-month final year
                  </dt>
                  <dd className="nhsuk-summary-list__value">
                    {programme.eighteenMonthFinalGrade}
                    {programme.eighteenMonthFinalGradeNotes && (
                      <div className="nhsuk-hint nhsuk-u-margin-top-1">
                        {programme.eighteenMonthFinalGradeNotes}
                      </div>
                    )}
                  </dd>
                </div>
              )}
              {programme.skippedGrade && (
                <div className="nhsuk-summary-list__row">
                  <dt className="nhsuk-summary-list__key">
                    Skipped grade year
                  </dt>
                  <dd className="nhsuk-summary-list__value">
                    {programme.skippedGrade}
                    {programme.skippedGradeNotes && (
                      <div className="nhsuk-hint nhsuk-u-margin-top-1">
                        {programme.skippedGradeNotes}
                      </div>
                    )}
                  </dd>
                </div>
              )}
              <div className="nhsuk-summary-list__row">
                <dt className="nhsuk-summary-list__key">Start grade</dt>
                <dd className="nhsuk-summary-list__value">
                  {programme.startGrade}
                  {initialGradeOverride && initialSpecialty && (
                    <span className="nhsuk-hint nhsuk-u-margin-left-2">
                      (overridden — default {initialSpecialty.entryGrade})
                    </span>
                  )}
                  {initialGradeOverride &&
                    programme.startGradeOverrideNotes && (
                      <div className="nhsuk-hint nhsuk-u-margin-top-1">
                        {programme.startGradeOverrideNotes}
                      </div>
                    )}
                </dd>
              </div>
              {initialSpecialty?.info && (
                <div className="nhsuk-summary-list__row">
                  <dt className="nhsuk-summary-list__key">Notes</dt>
                  <dd className="nhsuk-summary-list__value">
                    {initialSpecialty.info}
                  </dd>
                </div>
              )}
              <div className="nhsuk-summary-list__row">
                <dt className="nhsuk-summary-list__key">Start date</dt>
                <dd className="nhsuk-summary-list__value">
                  {formatDate(programme.startDate)}
                </dd>
              </div>
              <div className="nhsuk-summary-list__row">
                <dt className="nhsuk-summary-list__key">Original CCT date</dt>
                <dd className="nhsuk-summary-list__value">
                  {dayjs(programmeOriginalEndDate(programme)).format(
                    "DD/MM/YYYY"
                  )}
                </dd>
              </div>
              {(programme.additionalMonths > 0 ||
                programme.acceleratedMonths > 0) && (
                <div className="nhsuk-summary-list__row">
                  <dt className="nhsuk-summary-list__key">
                    Adjusted full-time CCT date
                  </dt>
                  <dd className="nhsuk-summary-list__value">
                    {formatDate(programmeAdjustedEndDate(programme))}
                    <span className="nhsuk-hint nhsuk-u-margin-left-2">
                      (reflects the other training-time adjustments shown above)
                    </span>
                  </dd>
                </div>
              )}
            </dl>
            <button
              type="button"
              className="nhsuk-button nhsuk-button--secondary"
              onClick={() => setEditing(true)}
            >
              Edit programme details
            </button>
          </>
        )
      )}
    </section>
  );
};
