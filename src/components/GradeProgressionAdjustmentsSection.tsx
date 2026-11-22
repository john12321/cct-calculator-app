import { useState, type FC, type FormEvent } from "react";
import {
  eighteenMonthFinalGradeFor,
  gradeProgressionAdjustmentIssues,
  skippableGrades,
  validateProgrammeDetails,
  type ProgrammeDetails
} from "../core";

type GradeProgressionAdjustmentsSectionProps = {
  programme: ProgrammeDetails;
  onChange: (programme: ProgrammeDetails) => void;
  onFormOpenChange: (open: boolean) => void;
};

export const GradeProgressionAdjustmentsSection: FC<
  GradeProgressionAdjustmentsSectionProps
> = ({ programme, onChange, onFormOpenChange }) => {
  const [editing, setEditing] = useState(false);
  const [hasEighteenMonthFinalYear, setHasEighteenMonthFinalYear] =
    useState(false);
  const [eighteenMonthFinalGradeNotes, setEighteenMonthFinalGradeNotes] =
    useState("");
  const [hasSkippedGrade, setHasSkippedGrade] = useState(false);
  const [skippedGrade, setSkippedGrade] = useState("");
  const [skippedGradeNotes, setSkippedGradeNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const issues = gradeProgressionAdjustmentIssues(programme);
  const invalidLabels = new Set(issues.map(issue => issue.label));
  const hasAdjustment =
    programme.eighteenMonthFinalGrade !== "" || programme.skippedGrade !== "";
  const skipOptions = skippableGrades(programme);
  const eighteenMonthFinalGrade =
    eighteenMonthFinalGradeFor({
      ...programme,
      skippedGrade: hasSkippedGrade ? skippedGrade : ""
    }) ?? programme.eighteenMonthFinalGrade;
  const keepsEighteenMonthFinalYear =
    hasEighteenMonthFinalYear && eighteenMonthFinalGrade !== "";

  const startEditing = () => {
    setHasEighteenMonthFinalYear(programme.eighteenMonthFinalGrade !== "");
    setEighteenMonthFinalGradeNotes(programme.eighteenMonthFinalGradeNotes);
    setHasSkippedGrade(programme.skippedGrade !== "");
    setSkippedGrade(programme.skippedGrade);
    setSkippedGradeNotes(programme.skippedGradeNotes);
    setError(null);
    setEditing(true);
    onFormOpenChange(true);
  };

  const stopEditing = () => {
    setEditing(false);
    onFormOpenChange(false);
  };

  const handleEighteenMonthFinalYearToggle = (checked: boolean) => {
    setHasEighteenMonthFinalYear(checked);
    if (!checked) {
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
    if (keepsEighteenMonthFinalYear && !eighteenMonthFinalGradeNotes.trim()) {
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
      ...programme,
      eighteenMonthFinalGrade: keepsEighteenMonthFinalYear
        ? eighteenMonthFinalGrade
        : "",
      eighteenMonthFinalGradeNotes: keepsEighteenMonthFinalYear
        ? eighteenMonthFinalGradeNotes.trim()
        : "",
      skippedGrade: hasSkippedGrade ? skippedGrade : "",
      skippedGradeNotes: hasSkippedGrade ? skippedGradeNotes.trim() : ""
    };
    const issue = gradeProgressionAdjustmentIssues(next)[0];
    if (issue) {
      setError(issue.message);
      return;
    }
    const result = validateProgrammeDetails(next);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    onChange(next);
    stopEditing();
  };

  const flag = (label: string) =>
    invalidLabels.has(label) && (
      <span
        className="nhsuk-u-margin-left-2"
        style={{ color: "#d5281b", fontWeight: 600 }}
      >
        ⚠ invalid
      </span>
    );

  return (
    <section
      id="grade-progression-adjustments-section"
      className="nhsuk-u-margin-bottom-6"
    >
      <h2 className="nhsuk-heading-l nhsuk-u-color-blue">
        Grade progression adjustments
      </h2>
      <p className="nhsuk-body">
        These change how your grades progress, not your total training time.
      </p>

      {issues.length > 0 && (
        <div
          className="nhsuk-error-summary"
          aria-labelledby="grade-progression-error-title"
          role="alert"
        >
          <h3
            className="nhsuk-error-summary__title"
            id="grade-progression-error-title"
          >
            These choices are no longer valid against the current programme
            details
          </h3>
          <div className="nhsuk-error-summary__body">
            <ul className="nhsuk-list nhsuk-list--bullet nhsuk-error-summary__list">
              {issues.map(issue => (
                <li key={issue.label}>
                  <strong>{issue.label}</strong> - {issue.message}
                </li>
              ))}
            </ul>
            <p className="nhsuk-u-margin-top-2">
              Edit the affected choices to continue.
            </p>
          </div>
        </div>
      )}

      {editing ? (
        <form onSubmit={handleSubmit} noValidate>
          {eighteenMonthFinalGrade && (
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
                  <p className="nhsuk-body nhsuk-u-margin-bottom-1">
                    Final grade lasting 18 months:{" "}
                    <strong>{eighteenMonthFinalGrade}</strong>
                  </p>
                  <p className="nhsuk-hint">
                    For specialties with an 18-month final year, for example
                    intensive care medicine with a dual specialty. This changes
                    grade progression, not total training time.
                  </p>
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
          )}

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
                  shorter programme duration separately as accelerated training
                  time.
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
                  {skipOptions.map(g => (
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
              Save grade progression adjustments
            </button>
            <button
              type="button"
              className="nhsuk-button nhsuk-button--secondary"
              onClick={stopEditing}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <>
          {hasAdjustment ? (
            <dl className="nhsuk-summary-list">
              {programme.eighteenMonthFinalGrade && (
                <div className="nhsuk-summary-list__row">
                  <dt className="nhsuk-summary-list__key">
                    18-month final year
                  </dt>
                  <dd className="nhsuk-summary-list__value">
                    {programme.eighteenMonthFinalGrade}
                    {flag("18-month final year")}
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
                    {flag("Skipped grade year")}
                    {programme.skippedGradeNotes && (
                      <div className="nhsuk-hint nhsuk-u-margin-top-1">
                        {programme.skippedGradeNotes}
                      </div>
                    )}
                  </dd>
                </div>
              )}
            </dl>
          ) : (
            <p className="nhsuk-hint">
              No grade progression adjustments recorded.
            </p>
          )}
          <button
            type="button"
            className="nhsuk-button nhsuk-button--secondary"
            onClick={startEditing}
          >
            {hasAdjustment
              ? "Edit grade progression adjustments"
              : "Add grade progression adjustments"}
          </button>
        </>
      )}
    </section>
  );
};
