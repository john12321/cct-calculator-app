import { useState, type FC, type FormEvent } from "react";
import { validateProgrammeDetails, type ProgrammeDetails } from "../core";
import { formatMonths } from "../utils/format";

type AcceleratedTrainingTimeSectionProps = {
  programme: ProgrammeDetails;
  onChange: (programme: ProgrammeDetails) => void;
  onFormOpenChange: (open: boolean) => void;
};

export const AcceleratedTrainingTimeSection: FC<
  AcceleratedTrainingTimeSectionProps
> = ({ programme, onChange, onFormOpenChange }) => {
  const [editing, setEditing] = useState(false);
  const [monthsText, setMonthsText] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const hasAcceleratedTime = programme.acceleratedMonths > 0;

  const startEditing = () => {
    setMonthsText(
      hasAcceleratedTime ? String(programme.acceleratedMonths) : ""
    );
    setNotes(programme.acceleratedMonthsNotes);
    setError(null);
    setEditing(true);
    onFormOpenChange(true);
  };

  const stopEditing = () => {
    setEditing(false);
    onFormOpenChange(false);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const months = Number.parseFloat(monthsText);
    if (!Number.isFinite(months) || months <= 0) {
      setError("Accelerated training time must be greater than zero.");
      return;
    }
    if (!notes.trim()) {
      setError("Please enter a reason for accelerated training time.");
      return;
    }
    const next: ProgrammeDetails = {
      ...programme,
      acceleratedMonths: months,
      acceleratedMonthsNotes: notes.trim()
    };
    const result = validateProgrammeDetails(next);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    onChange(next);
    stopEditing();
  };

  const handleRemove = () => {
    onChange({
      ...programme,
      acceleratedMonths: 0,
      acceleratedMonthsNotes: ""
    });
  };

  return (
    <section
      id="accelerated-training-time-section"
      className="nhsuk-u-margin-bottom-5"
    >
      <h3 className="nhsuk-heading-m nhsuk-u-color-blue">
        Accelerated training time
      </h3>
      <p className="nhsuk-body">
        Record any approved reduction in training time, for example recognised
        prior learning. It makes the programme shorter. You can record up to 12
        months.
      </p>

      {editing ? (
        <form onSubmit={handleSubmit} noValidate>
          <div className="nhsuk-form-group">
            <label
              className="nhsuk-label"
              htmlFor="programme-accelerated-months"
            >
              Accelerated training time (months)
            </label>
            <input
              className="nhsuk-input nhsuk-input--width-3"
              id="programme-accelerated-months"
              type="text"
              inputMode="decimal"
              value={monthsText}
              onChange={e => setMonthsText(e.target.value)}
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
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Recognised prior learning"
              required
            />
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
              Save accelerated training time
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
      ) : hasAcceleratedTime ? (
        <>
          <dl className="nhsuk-summary-list">
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
          </dl>
          <div className="nhsuk-button-group">
            <button
              type="button"
              className="nhsuk-button nhsuk-button--secondary nhsuk-u-margin-right-3"
              onClick={startEditing}
            >
              Edit accelerated training time
            </button>
            <button
              type="button"
              className="nhsuk-button nhsuk-button--secondary"
              onClick={handleRemove}
            >
              Remove
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="nhsuk-hint">No accelerated training time recorded.</p>
          <button
            type="button"
            className="nhsuk-button nhsuk-button--secondary"
            onClick={startEditing}
          >
            Add accelerated training time
          </button>
        </>
      )}
    </section>
  );
};
