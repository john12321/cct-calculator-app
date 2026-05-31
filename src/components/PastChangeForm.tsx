import { useState, type FC, type FormEvent } from "react";
import {
  getCalculationTypeLabel,
  validatePastChange,
  type CalculationType,
  type PastChange,
  type ProgrammeDetails
} from "../core";
import { AutocompleteSelect } from "./AutocompleteSelect";
import { DateInput } from "./DateInput";

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

const CHANGE_TYPE_OPTIONS = TYPE_GROUPS.flatMap(group =>
  group.options.map(value => ({
    value,
    label: getCalculationTypeLabel(value, "full")
  }))
).sort((a, b) => a.label.localeCompare(b.label));

const newId = () =>
  `past-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

type LtftDurationChoice = "END_DATE" | "REMAINDER" | null;

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
  const [ltftDurationChoice, setLtftDurationChoice] =
    useState<LtftDurationChoice>(
      editing?.type === "LTFT"
        ? editing.projectsRemainingTraining
          ? "REMAINDER"
          : "END_DATE"
        : null
    );
  const [notes, setNotes] = useState(editing?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const projectsRemainingTraining = ltftDurationChoice === "REMAINDER";
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
      ltftDurationChoice !== null ||
      notes.trim() !== "");

  const resetForAdd = () => {
    setType("");
    setStartDate("");
    setEndDate("");
    setWte("");
    setCountedAsTraining(false);
    setLtftDurationChoice(null);
    setNotes("");
    setError(null);
  };

  const handleTypeChange = (nextType: CalculationType) => {
    setType(nextType);
    setCountedAsTraining(nextType === "LTFT" || nextType === "OOPT");
    setLtftDurationChoice(null);
    setWte("");
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!type) {
      setError("Please choose a change type.");
      return;
    }
    if (type === "LTFT" && ltftDurationChoice === null) {
      setError("Please choose how long this LTFT change lasts.");
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

      <div className="nhsuk-grid-row">
        <div className="nhsuk-grid-column-one-half">
          <div className="nhsuk-form-group">
            <label className="nhsuk-label" htmlFor="past-type">
              Change type
            </label>
            <AutocompleteSelect
              id="past-type"
              value={type}
              placeholder="Select a change type"
              options={CHANGE_TYPE_OPTIONS}
              onChange={next => handleTypeChange(next as CalculationType)}
              noResultsText="No change types found"
              resultName="change type"
              resultPluralName="change types"
              width={30}
            />
          </div>
        </div>
        {type === "LTFT" && (
          <div className="nhsuk-grid-column-one-quarter">
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
        <>
          <div className="nhsuk-grid-row">
            <div className="nhsuk-grid-column-one-half">
              <DateInput
                id="past-start"
                label="Start date"
                value={startDate}
                onChange={setStartDate}
              />
            </div>
          </div>
          <div className="nhsuk-form-group">
            <fieldset className="nhsuk-fieldset">
              <legend className="nhsuk-fieldset__legend">
                How long does this LTFT change last?
              </legend>
              <div className="nhsuk-radios">
                <div className="nhsuk-radios__item">
                  <input
                    className="nhsuk-radios__input"
                    id="past-duration-end-date"
                    type="radio"
                    name="past-duration"
                    value="END_DATE"
                    checked={ltftDurationChoice === "END_DATE"}
                    onChange={() => setLtftDurationChoice("END_DATE")}
                  />
                  <label
                    className="nhsuk-label nhsuk-radios__label"
                    htmlFor="past-duration-end-date"
                  >
                    It ends on a specific date
                  </label>
                </div>
                {ltftDurationChoice === "END_DATE" && (
                  <div className="nhsuk-radios__conditional">
                    <DateInput
                      id="past-end"
                      label="End date"
                      value={endDate}
                      onChange={setEndDate}
                    />
                  </div>
                )}
                <div className="nhsuk-radios__item">
                  <input
                    className="nhsuk-radios__input"
                    id="past-duration-remainder"
                    type="radio"
                    name="past-duration"
                    value="REMAINDER"
                    checked={ltftDurationChoice === "REMAINDER"}
                    disabled={otherProjectedChange !== undefined}
                    onChange={() => {
                      setLtftDurationChoice("REMAINDER");
                      setEndDate("");
                    }}
                  />
                  <label
                    className="nhsuk-label nhsuk-radios__label"
                    htmlFor="past-duration-remainder"
                  >
                    It lasts for the remainder of my training
                  </label>
                </div>
              </div>
            </fieldset>
          </div>
        </>
      )}

      {type !== "LTFT" && (
        <>
          <div className="nhsuk-grid-row">
            <div className="nhsuk-grid-column-one-half">
              <DateInput
                id="past-start"
                label="Start date"
                value={startDate}
                onChange={setStartDate}
              />
            </div>
          </div>
          <div className="nhsuk-grid-row">
            <div className="nhsuk-grid-column-one-half">
              <DateInput
                id="past-end"
                label="End date"
                value={endDate}
                onChange={setEndDate}
              />
            </div>
          </div>
        </>
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
