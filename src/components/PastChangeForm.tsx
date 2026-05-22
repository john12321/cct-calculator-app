import { useState, type FC, type FormEvent } from "react";
import {
  getCalculationTypeLabel,
  validatePastChange,
  type CalculationType,
  type PastChange,
  type ProgrammeDetails
} from "../core";

type PastChangeFormProps = {
  programme: ProgrammeDetails;
  existing: PastChange[];
  editing: PastChange | null;
  onAdd: (change: PastChange) => void;
  onUpdate: (change: PastChange) => void;
  onCancelEdit: () => void;
};

const TYPE_GROUPS: { label: string; options: CalculationType[] }[] = [
  { label: "Work pattern changes", options: ["LTFT"] },
  {
    label: "Leave types",
    options: ["OOPC", "OOPE", "OOPP", "PARENTAL", "SICKNESS", "UNPAID"]
  },
  { label: "Health & return", options: ["SHIELDING", "PHASED"] }
];

const newId = () =>
  `past-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export const PastChangeForm: FC<PastChangeFormProps> = ({
  programme,
  existing,
  editing,
  onAdd,
  onUpdate,
  onCancelEdit
}) => {
  const isEditing = editing !== null;

  const [type, setType] = useState<CalculationType | "">(editing?.type ?? "");
  const [startDate, setStartDate] = useState(editing?.startDate ?? "");
  const [endDate, setEndDate] = useState(editing?.endDate ?? "");
  const [wte, setWte] = useState(String(editing?.wte ?? ""));
  const [notes, setNotes] = useState(editing?.notes ?? "");
  const [error, setError] = useState<string | null>(null);

  const resetForAdd = () => {
    setType("");
    setStartDate("");
    setEndDate("");
    setWte("");
    setNotes("");
    setError(null);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!type) {
      setError("Please choose a change type.");
      return;
    }
    const wteValue = type === "LTFT" ? Number.parseInt(wte, 10) : null;
    const candidate: PastChange = {
      id: editing?.id ?? newId(),
      type,
      startDate,
      endDate,
      wte: Number.isNaN(wteValue as number) ? null : wteValue,
      notes: notes.trim()
    };
    const result = validatePastChange(candidate, programme, existing);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    if (isEditing) {
      onUpdate(candidate);
    } else {
      onAdd(candidate);
      resetForAdd();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="nhsuk-u-margin-bottom-4"
    >
      {isEditing && (
        <h3 className="nhsuk-heading-s">Editing past change</h3>
      )}

      <div className="nhsuk-grid-row">
        <div className="nhsuk-grid-column-one-half">
          <div className="nhsuk-form-group">
            <label className="nhsuk-label" htmlFor="past-type">
              Change type
            </label>
            <select
              className="nhsuk-select"
              id="past-type"
              value={type}
              onChange={e => setType(e.target.value as CalculationType)}
            >
              <option value="" disabled>
                Select a change type
              </option>
              {TYPE_GROUPS.map(group => (
                <optgroup key={group.label} label={group.label}>
                  {group.options.map(opt => (
                    <option key={opt} value={opt}>
                      {getCalculationTypeLabel(opt, "full")}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="nhsuk-grid-row">
        <div className="nhsuk-grid-column-one-quarter">
          <div className="nhsuk-form-group">
            <label className="nhsuk-label" htmlFor="past-start">
              Start date
            </label>
            <input
              className="nhsuk-input nhsuk-input--width-10"
              id="past-start"
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
            />
          </div>
        </div>
        <div className="nhsuk-grid-column-one-quarter">
          <div className="nhsuk-form-group">
            <label className="nhsuk-label" htmlFor="past-end">
              End date
            </label>
            <input
              className="nhsuk-input nhsuk-input--width-10"
              id="past-end"
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
            />
          </div>
        </div>
        {type === "LTFT" && (
          <div className="nhsuk-grid-column-one-quarter">
            <div className="nhsuk-form-group">
              <label className="nhsuk-label" htmlFor="past-wte">
                WTE % (1–99)
              </label>
              <input
                className="nhsuk-input nhsuk-input--width-5"
                id="past-wte"
                type="number"
                min="1"
                max="99"
                step="1"
                value={wte}
                onChange={e => setWte(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      <div className="nhsuk-grid-row">
        <div className="nhsuk-grid-column-one-half">
          <div className="nhsuk-form-group">
            <label className="nhsuk-label" htmlFor="past-notes">
              Notes (optional)
            </label>
            <input
              className="nhsuk-input"
              id="past-notes"
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Cardiology, St Mary's"
            />
          </div>
        </div>
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
          {isEditing ? "Save changes" : "Add change"}
        </button>
        {isEditing && (
          <button
            type="button"
            className="nhsuk-button nhsuk-button--secondary"
            onClick={onCancelEdit}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};
