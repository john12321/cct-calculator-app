import { useState, type FC, type FormEvent } from "react";
import {
  getCalculationTypeLabel,
  validatePastChange,
  type CalculationType,
  type PastChange,
  type ProgrammeDetails
} from "../core";

type PastChangeFormProps = {
  formId?: string;
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
    label: "Out of programme",
    options: ["OOPC", "OOPE", "OOPP", "OOPR", "OOPT"]
  },
  { label: "Leave types", options: ["PARENTAL", "SICKNESS", "ACCRUED_LEAVE"] },
  { label: "Health & return", options: ["SHIELDING", "PHASED"] }
];

const newId = () =>
  `past-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export const PastChangeForm: FC<PastChangeFormProps> = ({
  formId,
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
  const [countedAsTraining, setCountedAsTraining] = useState(
    editing?.countedAsTraining ?? false
  );
  const [projectsRemainingTraining, setProjectsRemainingTraining] = useState(
    editing?.projectsRemainingTraining ?? false
  );
  const [notes, setNotes] = useState(editing?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const otherProjectedChange = existing.find(
    change =>
      change.id !== editing?.id &&
      change.type === "LTFT" &&
      change.projectsRemainingTraining
  );

  const hasNewEntryData =
    !isEditing &&
    (type !== "" ||
      startDate !== "" ||
      endDate !== "" ||
      wte !== "" ||
      projectsRemainingTraining ||
      notes.trim() !== "");

  const resetForAdd = () => {
    setType("");
    setStartDate("");
    setEndDate("");
    setWte("");
    setCountedAsTraining(false);
    setProjectsRemainingTraining(false);
    setNotes("");
    setError(null);
  };

  const handleTypeChange = (nextType: CalculationType) => {
    setType(nextType);
    setCountedAsTraining(nextType === "LTFT" || nextType === "OOPT");
    setProjectsRemainingTraining(false);
    setWte("");
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!type) {
      setError("Please choose a change type.");
      return;
    }
    const acceptsWte =
      type === "LTFT" || (type === "OOPR" && countedAsTraining);
    const wteValue = acceptsWte && wte.trim() !== "" ? Number(wte) : null;
    const candidate: PastChange = {
      id: editing?.id ?? newId(),
      type,
      startDate,
      endDate: type === "LTFT" && projectsRemainingTraining ? "" : endDate,
      wte: wteValue !== null && !Number.isNaN(wteValue) ? wteValue : null,
      countedAsTraining:
        (type === "LTFT" || type === "OOPT" || type === "OOPR") &&
        countedAsTraining,
      notes: notes.trim(),
      projectsRemainingTraining: type === "LTFT" && projectsRemainingTraining
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
      id={formId}
      onSubmit={handleSubmit}
      noValidate
      className="nhsuk-u-margin-bottom-4"
    >
      {isEditing && (
        <h3 className="nhsuk-heading-s">Editing completed change</h3>
      )}

      <div className="change-type-row">
        <div className="change-type-row__type">
          <div className="nhsuk-form-group">
            <label className="nhsuk-label" htmlFor="past-type">
              Change type
            </label>
            <select
              className="nhsuk-select"
              id="past-type"
              value={type}
              onChange={e =>
                handleTypeChange(e.target.value as CalculationType)
              }
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
        {type === "LTFT" && (
          <div className="change-type-row__wte">
            <div className="nhsuk-form-group">
              <label className="nhsuk-label" htmlFor="past-wte">
                WTE % (1-99)
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

      {type === "LTFT" && (
        <div className="nhsuk-form-group">
          <div className="ltft-date-projection-row">
            <div className="ltft-date-projection-row__date">
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
            <div className="ltft-projection-choice__end-date">
              <label className="nhsuk-label" htmlFor="past-end">
                End date
              </label>
              <input
                className="nhsuk-input nhsuk-input--width-10"
                id="past-end"
                type="date"
                value={endDate}
                disabled={projectsRemainingTraining}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>
            <div className="ltft-projection-choice__or">
              <span className="nhsuk-body">or</span>
            </div>
            <div className="ltft-projection-choice__project">
              <div className="nhsuk-checkboxes">
                <div className="nhsuk-checkboxes__item">
                  <input
                    className="nhsuk-checkboxes__input"
                    id="past-projects-remaining"
                    type="checkbox"
                    checked={projectsRemainingTraining}
                    disabled={otherProjectedChange !== undefined}
                    onChange={e => {
                      setProjectsRemainingTraining(e.target.checked);
                      if (e.target.checked) setEndDate("");
                    }}
                  />
                  <label
                    className="nhsuk-label nhsuk-checkboxes__label"
                    htmlFor="past-projects-remaining"
                  >
                    For the remainder of my training programme
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {type !== "LTFT" && (
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
        </div>
      )}

      {(type === "OOPT" || type === "OOPR") && (
        <div className="nhsuk-form-group">
          <div className="nhsuk-checkboxes">
            <div className="nhsuk-checkboxes__item">
              <input
                className="nhsuk-checkboxes__input"
                id="past-counted"
                type="checkbox"
                checked={countedAsTraining}
                onChange={e => setCountedAsTraining(e.target.checked)}
              />
              <label
                className="nhsuk-label nhsuk-checkboxes__label"
                htmlFor="past-counted"
              >
                Counted as training
              </label>
            </div>
          </div>
          {type === "OOPT" ? (
            <p className="nhsuk-hint">
              OOPT counted as training is credited at 100% and can be recorded
              for up to 12 months.
            </p>
          ) : (
            <p className="nhsuk-hint">
              Only approved OOPR time contributing towards a Certificate of
              Completion of Training (CCT) should be counted. OOPR is normally
              up to 3 years, or 4 years in exceptional circumstances; LTFT OOPR
              duration is normally pro rata.
            </p>
          )}
        </div>
      )}

      {type === "OOPR" && countedAsTraining && (
        <div className="nhsuk-grid-row">
          <div className="nhsuk-grid-column-one-half">
            <div className="nhsuk-form-group">
              <label className="nhsuk-label" htmlFor="past-oopr-wte">
                Approved CCT credit % (1-100)
              </label>
              <input
                className="nhsuk-input nhsuk-input--width-5"
                id="past-oopr-wte"
                type="number"
                min="1"
                max="100"
                step="1"
                value={wte}
                onChange={e => setWte(e.target.value)}
              />
              <p className="nhsuk-hint">
                Enter the proportion of this OOPR period prospectively approved
                to count towards CCT. For LTFT OOPR, this may match your WTE.
              </p>
            </div>
          </div>
        </div>
      )}

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
        <button type="submit" className="nhsuk-button nhsuk-u-margin-right-3">
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
        {hasNewEntryData && (
          <button
            type="button"
            className="nhsuk-button nhsuk-button--secondary"
            onClick={resetForAdd}
          >
            Reset
          </button>
        )}
      </div>
    </form>
  );
};
