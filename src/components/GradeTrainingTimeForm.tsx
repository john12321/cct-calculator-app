import { useState, type FC, type FormEvent } from "react";
import {
  programmeGrades,
  type AdditionalTrainingTime,
  type ProgrammeDetails
} from "../core";
import type { GradeTrainingTimeKind } from "./gradeTrainingTimeKinds";

type GradeTrainingTimeFormProps = {
  kind: GradeTrainingTimeKind;
  formId: string;
  programme: ProgrammeDetails;
  editing: AdditionalTrainingTime | null;
  onSave: (entry: AdditionalTrainingTime) => void;
  onCancel: () => void;
};

const newId = (label: string) =>
  `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export const GradeTrainingTimeForm: FC<GradeTrainingTimeFormProps> = ({
  kind,
  formId,
  programme,
  editing,
  onSave,
  onCancel
}) => {
  const { label } = kind;
  const [grade, setGrade] = useState(editing?.grade ?? "");
  const [monthsText, setMonthsText] = useState(
    editing ? String(editing.months) : ""
  );
  const [notes, setNotes] = useState(editing?.notes ?? "");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const candidate: AdditionalTrainingTime = {
      id: editing?.id ?? newId(label),
      grade,
      months: monthsText.trim() === "" ? Number.NaN : Number(monthsText),
      notes: notes.trim()
    };
    const result = kind.validate(candidate, programme, programme[kind.field]);
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
        {editing ? "Editing" : "Adding"} {label} training time
      </h3>

      <div className="nhsuk-form-group">
        <label className="nhsuk-label" htmlFor={`${label}-grade`}>
          Grade
        </label>
        <p className="nhsuk-hint" id={`${label}-grade-hint`}>
          {kind.gradeHint}
        </p>
        <select
          className="nhsuk-select"
          id={`${label}-grade`}
          aria-describedby={`${label}-grade-hint`}
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
        <label className="nhsuk-label" htmlFor={`${label}-months`}>
          {kind.title} (months)
        </label>
        <p className="nhsuk-hint" id={`${label}-months-hint`}>
          Whole months, up to {kind.maxTotalMonths} months in total across all
          grades.
        </p>
        <input
          className="nhsuk-input nhsuk-input--width-3"
          id={`${label}-months`}
          aria-describedby={`${label}-months-hint`}
          type="text"
          inputMode="numeric"
          maxLength={2}
          value={monthsText}
          onChange={e => setMonthsText(e.target.value)}
        />
      </div>

      <div className="nhsuk-form-group">
        <label className="nhsuk-label" htmlFor={`${label}-notes`}>
          Reason
        </label>
        <input
          className="nhsuk-input nhsuk-input--width-30"
          id={`${label}-notes`}
          type="text"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder={kind.reasonPlaceholder}
        />
      </div>

      {error && (
        <div className="nhsuk-error-summary" role="alert">
          <p className="nhsuk-error-summary__body">{error}</p>
        </div>
      )}

      <div className="nhsuk-button-group">
        <button type="submit" className="nhsuk-button nhsuk-u-margin-right-3">
          {editing ? "Save changes" : `Add ${label} time`}
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
