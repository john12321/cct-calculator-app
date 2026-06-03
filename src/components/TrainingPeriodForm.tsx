import { useState, type FC, type FormEvent } from "react";
import dayjs from "dayjs";
import {
  TRAINING_GRADES,
  getGradePeriodTagLabel,
  getTrainingPeriodTypeLabel,
  validateTrainingPeriod,
  validateTrainingPeriodFields,
  type GradePeriodTag,
  type ProgrammeDetails,
  type TrainingPeriod,
  type TrainingPeriodType
} from "../core";
import { formatDate } from "../utils/format";
import { DateInput } from "./DateInput";

type TrainingPeriodFormProps = {
  formId?: string;
  programme: ProgrammeDetails;
  priorPeriods: TrainingPeriod[];
  editing: TrainingPeriod | null;
  // Note: may this period project forward (open-ended)? Only the final row can.
  allowProjectForward: boolean;
  // Note: lock the start to follow on contiguously; false lets the user insert to fill a gap.
  lockStart: boolean;
  // Note: pre-filled start when inserting to fill a gap.
  startSuggestion: string | null;
  onAdd: (period: TrainingPeriod) => void;
  onUpdate: (period: TrainingPeriod) => void;
  onCancelEdit: () => void;
};

const TYPE_GROUPS: { label: string; options: TrainingPeriodType[] }[] = [
  { label: "Training", options: ["GRADE"] },
  {
    label: "Out of programme",
    options: ["OOPC", "OOPE", "OOPP", "OOPR", "OOPT"]
  },
  { label: "Leave", options: ["PARENTAL", "SICK", "ACCRUED_LEAVE"] }
];

const TAG_OPTIONS: GradePeriodTag[] = [
  "REGULAR",
  "ACF",
  "ACL",
  "ADDITIONAL_TRAINING_TIME"
];

const newId = () =>
  `period-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const numericInputValue = (value: string, maxLength: number) =>
  value.replace(/\D/g, "").slice(0, maxLength);

const defaultStart = (
  programme: ProgrammeDetails,
  priorPeriods: TrainingPeriod[]
): string => {
  const lastEnd = priorPeriods.at(-1)?.endDate;
  if (lastEnd === undefined || lastEnd === null) return programme.startDate;
  return dayjs(lastEnd).add(1, "day").format("YYYY-MM-DD");
};

export const TrainingPeriodForm: FC<TrainingPeriodFormProps> = ({
  formId,
  programme,
  priorPeriods,
  editing,
  allowProjectForward,
  lockStart,
  startSuggestion,
  onAdd,
  onUpdate,
  onCancelEdit
}) => {
  const isEditing = editing !== null;
  const lockedStart = defaultStart(programme, priorPeriods);
  // Note: start is editable when editing or inserting (unlocked add).
  const startEditable = isEditing || !lockStart;
  const addInitialStart = lockStart
    ? lockedStart
    : (startSuggestion ?? lockedStart);

  const [type, setType] = useState<TrainingPeriodType>(
    editing?.type ?? "GRADE"
  );
  const [grade, setGrade] = useState(editing?.grade ?? programme.startGrade);
  const [gradeTag, setGradeTag] = useState<GradePeriodTag>(
    editing?.gradeTag ?? "REGULAR"
  );
  const [wte, setWte] = useState(editing ? String(editing.wte ?? "") : "100");
  const [startDate, setStartDate] = useState(
    editing?.startDate ?? addInitialStart
  );
  const [endMode, setEndMode] = useState<"SET" | "PROJECT">(
    editing?.endDate === null && allowProjectForward ? "PROJECT" : "SET"
  );
  const [endDate, setEndDate] = useState(editing?.endDate ?? "");
  const [countedAsTraining, setCountedAsTraining] = useState(
    editing?.countedAsTraining ?? true
  );
  const [notes, setNotes] = useState(editing?.notes ?? "");
  const [error, setError] = useState<string | null>(null);

  const handleTypeChange = (nextType: TrainingPeriodType) => {
    setType(nextType);
    setCountedAsTraining(nextType === "GRADE" || nextType === "OOPT");
    setWte(nextType === "GRADE" ? "100" : "");
    if (nextType !== "GRADE") {
      setEndMode("SET");
    }
  };

  const handleCountedAsTrainingChange = (checked: boolean) => {
    setCountedAsTraining(checked);
    if (!checked) {
      setEndMode("SET");
    }
  };

  const resetForAdd = () => {
    setType("GRADE");
    setGrade(programme.startGrade);
    setGradeTag("REGULAR");
    setWte("100");
    setStartDate(addInitialStart);
    setEndMode("SET");
    setEndDate("");
    setCountedAsTraining(true);
    setNotes("");
    setError(null);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const acceptsWte =
      type === "GRADE" || (type === "OOPR" && countedAsTraining);
    const wteValue = acceptsWte && wte.trim() !== "" ? Number(wte) : null;
    const candidate: TrainingPeriod = {
      id: editing?.id ?? newId(),
      type,
      grade: type === "GRADE" ? grade : "",
      gradeTag: type === "GRADE" ? gradeTag : "REGULAR",
      wte: wteValue !== null && !Number.isNaN(wteValue) ? wteValue : null,
      startDate: startEditable ? startDate : lockedStart,
      endDate: endMode === "PROJECT" ? null : endDate,
      countedAsTraining:
        (type === "GRADE" || type === "OOPT" || type === "OOPR") &&
        countedAsTraining,
      notes: notes.trim()
    };
    // Note: locked append enforces full rules; editable start checks fields only (gaps flagged later).
    const result = startEditable
      ? validateTrainingPeriodFields(candidate)
      : validateTrainingPeriod(candidate, programme, priorPeriods);
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
      className="change-form-panel nhsuk-u-margin-bottom-4"
    >
      <h3 className="nhsuk-heading-s nhsuk-u-margin-bottom-3">
        {isEditing ? "Editing period" : "Adding a new period"}
      </h3>

      <div className="nhsuk-grid-row">
        <div className="nhsuk-grid-column-one-half">
          <div className="nhsuk-form-group">
            <label className="nhsuk-label" htmlFor="period-type">
              Grade / period type
            </label>
            <select
              className="nhsuk-select"
              id="period-type"
              value={type}
              onChange={e =>
                handleTypeChange(e.target.value as TrainingPeriodType)
              }
            >
              {TYPE_GROUPS.map(group => (
                <optgroup key={group.label} label={group.label}>
                  {group.options.map(opt => (
                    <option key={opt} value={opt}>
                      {getTrainingPeriodTypeLabel(opt, "full")}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        </div>
      </div>

      {type === "GRADE" && (
        <>
          <div className="nhsuk-grid-row">
            <div className="nhsuk-grid-column-one-half">
              <div className="nhsuk-form-group">
                <label className="nhsuk-label" htmlFor="period-grade">
                  Grade
                </label>
                <select
                  className="nhsuk-select"
                  id="period-grade"
                  value={grade}
                  onChange={e => setGrade(e.target.value)}
                >
                  <option value="" disabled>
                    Select
                  </option>
                  {TRAINING_GRADES.map(g => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
              <div className="nhsuk-form-group">
                <label className="nhsuk-label" htmlFor="period-wte">
                  WTE % (1-100)
                </label>
                <input
                  className="nhsuk-input nhsuk-input--width-3"
                  id="period-wte"
                  type="text"
                  inputMode="numeric"
                  maxLength={3}
                  value={wte}
                  onChange={e => setWte(numericInputValue(e.target.value, 3))}
                />
              </div>
            </div>
          </div>

          <div className="nhsuk-grid-row">
            <div className="nhsuk-grid-column-one-half">
              <div className="nhsuk-form-group">
                <fieldset className="nhsuk-fieldset">
                  <legend className="nhsuk-fieldset__legend">Grade tag</legend>
                  <div className="nhsuk-radios">
                    {TAG_OPTIONS.map(tag => (
                      <div className="nhsuk-radios__item" key={tag}>
                        <input
                          className="nhsuk-radios__input"
                          id={`period-tag-${tag}`}
                          type="radio"
                          name="period-tag"
                          value={tag}
                          checked={gradeTag === tag}
                          onChange={() => setGradeTag(tag)}
                        />
                        <label
                          className="nhsuk-label nhsuk-radios__label"
                          htmlFor={`period-tag-${tag}`}
                        >
                          {getGradePeriodTagLabel(tag)}
                        </label>
                      </div>
                    ))}
                  </div>
                </fieldset>
              </div>
            </div>
          </div>
        </>
      )}

      {type === "GRADE" || type === "OOPT" || type === "OOPR" ? (
        <div className="nhsuk-grid-row">
          <div className="nhsuk-grid-column-one-half">
            <div className="nhsuk-form-group">
              <div className="nhsuk-checkboxes">
                <div className="nhsuk-checkboxes__item">
                  <input
                    className="nhsuk-checkboxes__input"
                    id="period-counted"
                    type="checkbox"
                    checked={countedAsTraining}
                    onChange={e =>
                      handleCountedAsTrainingChange(e.target.checked)
                    }
                  />
                  <label
                    className="nhsuk-label nhsuk-checkboxes__label"
                    htmlFor="period-counted"
                  >
                    Counted as training
                  </label>
                </div>
              </div>
              {type === "OOPT" ? (
                <p className="nhsuk-hint">
                  OOPT counted as training is credited at 100% and can be
                  recorded for up to 12 months.
                </p>
              ) : type === "OOPR" ? (
                <p className="nhsuk-hint">
                  Only approved OOPR time contributing towards a Certificate of
                  Completion of Training (CCT) should be counted. OOPR is
                  normally up to 3 years, or 4 years in exceptional
                  circumstances; LTFT OOPR duration is normally pro rata.
                </p>
              ) : (
                <p className="nhsuk-hint">
                  When unchecked, the period still consumes calendar time but
                  does not accrue WTE months.
                </p>
              )}
            </div>
            {type === "OOPR" && countedAsTraining && (
              <div className="nhsuk-form-group">
                <label className="nhsuk-label" htmlFor="period-oopr-wte">
                  Approved CCT credit % (1-100)
                </label>
                <input
                  className="nhsuk-input nhsuk-input--width-3"
                  id="period-oopr-wte"
                  type="text"
                  inputMode="numeric"
                  maxLength={3}
                  value={wte}
                  onChange={e => setWte(numericInputValue(e.target.value, 3))}
                />
                <p className="nhsuk-hint">
                  Enter the proportion of this OOPR period prospectively
                  approved to count towards CCT. For LTFT OOPR, this may match
                  your WTE.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="nhsuk-grid-row">
          <div className="nhsuk-grid-column-one-half">
            <p className="nhsuk-hint">
              This absence consumes calendar time but is not counted as
              training.
            </p>
          </div>
        </div>
      )}

      <div className="nhsuk-grid-row">
        <div className="nhsuk-grid-column-one-half">
          {startEditable ? (
            <DateInput
              id="period-start"
              label="Start date"
              value={startDate}
              onChange={setStartDate}
              hint={
                isEditing
                  ? "Editing the start date may leave a gap or overlap with the period before this one. This is flagged on the timeline above."
                  : "Set the start date for the period you are inserting. Any gap or overlap it leaves is flagged on the timeline above."
              }
            />
          ) : (
            <DateInput
              id="period-start"
              label="Start date"
              value={lockedStart}
              disabled
              readOnly
              hint={`Follows on from ${formatDate(lockedStart)} to keep the record contiguous.`}
            />
          )}
        </div>
      </div>

      <div className="nhsuk-grid-row">
        <div className="nhsuk-grid-column-one-half">
          <div className="nhsuk-form-group">
            <fieldset className="nhsuk-fieldset">
              <legend className="nhsuk-fieldset__legend">End date</legend>
              <div className="nhsuk-radios">
                <div className="nhsuk-radios__item">
                  <input
                    className="nhsuk-radios__input"
                    id="period-end-set"
                    type="radio"
                    name="period-end-mode"
                    value="SET"
                    checked={endMode === "SET"}
                    onChange={() => setEndMode("SET")}
                  />
                  <label
                    className="nhsuk-label nhsuk-radios__label"
                    htmlFor="period-end-set"
                  >
                    Set an end date
                  </label>
                </div>
                {endMode === "SET" && (
                  <div className="nhsuk-radios__conditional">
                    <DateInput
                      id="period-end"
                      label="End date"
                      value={endDate}
                      onChange={setEndDate}
                    />
                  </div>
                )}
                {type === "GRADE" &&
                  countedAsTraining &&
                  allowProjectForward && (
                    <div className="nhsuk-radios__item">
                      <input
                        className="nhsuk-radios__input"
                        id="period-end-project"
                        type="radio"
                        name="period-end-mode"
                        value="PROJECT"
                        checked={endMode === "PROJECT"}
                        onChange={() => setEndMode("PROJECT")}
                      />
                      <label
                        className="nhsuk-label nhsuk-radios__label"
                        htmlFor="period-end-project"
                      >
                        Project forward to find the Completion of Training Date
                      </label>
                    </div>
                  )}
              </div>
              <p className="nhsuk-hint">
                Choose <em>Project forward</em> when this is your planned next
                post and you want the calculator to work out when training
                finishes. The period must be the last on the timeline.
              </p>
            </fieldset>
          </div>
        </div>
      </div>

      <div className="nhsuk-grid-row">
        <div className="nhsuk-grid-column-one-half">
          <div className="nhsuk-form-group">
            <label className="nhsuk-label" htmlFor="period-notes">
              Notes (optional)
            </label>
            <input
              className="nhsuk-input"
              id="period-notes"
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
          {isEditing ? "Save changes" : "Add period"}
        </button>
        <button
          type="button"
          className="nhsuk-button nhsuk-button--secondary"
          onClick={onCancelEdit}
        >
          Cancel
        </button>
      </div>
    </form>
  );
};
