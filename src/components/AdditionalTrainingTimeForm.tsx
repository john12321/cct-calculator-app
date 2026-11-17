import { useState, type FC, type FormEvent } from "react";
import {
  programmeGrades,
  validateAdditionalTrainingTime,
  type AdditionalTrainingTime,
  type ProgrammeDetails
} from "../core";

type AdditionalTrainingTimeFormProps = {
  formId: string;
  programme: ProgrammeDetails;
  editing: AdditionalTrainingTime | null;
  onSave: (entry: AdditionalTrainingTime) => void;
  onCancel: () => void;
};

const newId = () =>
  `additional-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export const AdditionalTrainingTimeForm: FC<AdditionalTrainingTimeFormProps> = ({
  formId,
  programme,
  editing,
  onSave,
  onCancel
}) => {
  const [grade, setGrade] = useState(editing?.grade ?? "");
  const [monthsText, setMonthsText] = useState(
    editing ? String(editing.months) : ""
  );
  const [notes, setNotes] = useState(editing?.notes ?? "");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const candidate: AdditionalTrainingTime = {
      id: editing?.id ?? newId(),
      grade,
      months: Number.parseFloat(monthsText),
      notes: notes.trim()
    };
    const result = validateAdditionalTrainingTime(
      candidate,
      programme,
      programme.additionalTrainingTime
    );
    if (!result.ok) {
      setError(result.message);
      return;
    }
    onSave(candidate);
  };

  return (
    <form
      id={formId}
      onSubmit={handleSubmit}
      noValidate
      className="change-form-panel nhsuk-u-margin-bottom-4"
    >
      <h3 className="nhsuk-heading-s nhsuk-u-margin-bottom-3">
        {editing
          ? "Editing additional training time"
          : "Adding additional training time"}
      </h3>

      <div className="nhsuk-form-group">
        <label className="nhsuk-label" htmlFor="additional-grade">
          Grade
        </label>
        <p className="nhsuk-hint" id="additional-grade-hint">
          The grade the additional time was given in.
        </p>
        <select
          className="nhsuk-select"
          id="additional-grade"
          aria-describedby="additional-grade-hint"
          value={grade}
          onChange={e => setGrade(e.target.value)}
        >
          <option value="" disabled>
            Select a grade
          </option>
          {programmeGrades(programme).map(g => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>

      <div className="nhsuk-form-group">
        <label className="nhsuk-label" htmlFor="additional-months">
          Additional training time (months)
        </label>
        <p className="nhsuk-hint" id="additional-months-hint">
          Up to 24 months in total across all grades.
        </p>
        <input
          className="nhsuk-input nhsuk-input--width-3"
          id="additional-months"
          aria-describedby="additional-months-hint"
          type="text"
          inputMode="decimal"
          value={monthsText}
          onChange={e => setMonthsText(e.target.value)}
        />
      </div>

      <div className="nhsuk-form-group">
        <label className="nhsuk-label" htmlFor="additional-notes">
          Reason
        </label>
        <input
          className="nhsuk-input nhsuk-input--width-30"
          id="additional-notes"
          type="text"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="e.g. Outcome 3 following ARCP"
        />
      </div>

      {error && (
        <div className="nhsuk-error-summary" role="alert">
          <p className="nhsuk-error-summary__body">{error}</p>
        </div>
      )}

      <div className="nhsuk-button-group">
        <button type="submit" className="nhsuk-button nhsuk-u-margin-right-3">
          {editing ? "Save changes" : "Add additional time"}
        </button>
        <button
          type="button"
          className="nhsuk-button nhsuk-button--secondary"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </form>
  );
};
