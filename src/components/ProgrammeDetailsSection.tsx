import { useEffect, useRef, useState, type FC, type FormEvent } from "react";
import { flushSync } from "react-dom";
import dayjs from "dayjs";
import {
  TRAINING_GRADES,
  findSpecialty,
  programmeOriginalEndDate,
  validateProgrammeDetails,
  type ProgrammeDetails
} from "../core";
import { formatDate } from "../utils/format";
import { DateInput } from "./DateInput";
import { SpecialtyAutocompleteSelect } from "./SpecialtyAutocompleteSelect";

type ProgrammeDetailsSectionProps = {
  programme: ProgrammeDetails | null;
  onChange: (programme: ProgrammeDetails) => void;
  onSaved?: () => void;
};

const sortedTrainingGrades = [...TRAINING_GRADES].sort((a, b) =>
  a.localeCompare(b)
);

export const ProgrammeDetailsSection: FC<ProgrammeDetailsSectionProps> = ({
  programme,
  onChange,
  onSaved
}) => {
  const initialSpecialty = findSpecialty(programme?.specialty ?? "");
  const initialLengthOverride =
    programme !== null &&
    initialSpecialty !== undefined &&
    programme.lengthMonths !== initialSpecialty.lengthMonths;
  const initialGradeOverride =
    programme !== null &&
    initialSpecialty !== undefined &&
    programme.startGrade !== initialSpecialty.entryGrade;

  const [editing, setEditing] = useState(programme === null);
  const [specialty, setSpecialty] = useState(programme?.specialty ?? "");
  const [startDate, setStartDate] = useState(programme?.startDate ?? "");
  const [lengthMonths, setLengthMonths] = useState(
    programme ? String(programme.lengthMonths) : ""
  );
  const [lengthOverrideNotes, setLengthOverrideNotes] = useState(
    initialLengthOverride ? (programme?.lengthOverrideNotes ?? "") : ""
  );
  const [overrideGrade, setOverrideGrade] = useState(initialGradeOverride);
  const [startGrade, setStartGrade] = useState(programme?.startGrade ?? "");
  const [startGradeOverrideNotes, setStartGradeOverrideNotes] = useState(
    initialGradeOverride ? (programme?.startGradeOverrideNotes ?? "") : ""
  );
  const [error, setError] = useState<string | null>(null);
  const startGradeSelectRef = useRef<HTMLSelectElement>(null);
  const shouldFocusStartGradeSelect = useRef(false);

  const selectedSpecialty = findSpecialty(specialty);
  const isLengthOverridden =
    selectedSpecialty !== undefined &&
    lengthMonths.trim() !== "" &&
    Number(lengthMonths) !== selectedSpecialty.lengthMonths;

  useEffect(() => {
    if (!overrideGrade || !shouldFocusStartGradeSelect.current) return;
    shouldFocusStartGradeSelect.current = false;
    startGradeSelectRef.current?.focus();
  }, [overrideGrade]);

  const handleSpecialtyChange = (next: string) => {
    setSpecialty(next);
    const found = findSpecialty(next);
    setLengthOverrideNotes("");
    if (found) {
      setLengthMonths(String(found.lengthMonths));
      setOverrideGrade(false);
      setStartGrade(found.entryGrade);
      setStartGradeOverrideNotes("");
    } else {
      setLengthMonths("");
      setStartGrade("");
      setStartGradeOverrideNotes("");
    }
  };

  const handleGradeOverrideToggle = (checked: boolean) => {
    shouldFocusStartGradeSelect.current = checked;
    setOverrideGrade(checked);
    if (!checked) {
      shouldFocusStartGradeSelect.current = false;
      setStartGradeOverrideNotes("");
      if (selectedSpecialty) {
        setStartGrade(selectedSpecialty.entryGrade);
      }
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const isGradeOverridden =
      overrideGrade &&
      selectedSpecialty !== undefined &&
      startGrade.trim() !== selectedSpecialty.entryGrade;
    if (overrideGrade && !startGradeOverrideNotes.trim()) {
      setError("Please enter a reason for overriding the default start grade.");
      return;
    }
    const next: ProgrammeDetails = {
      specialty: specialty.trim(),
      startDate,
      lengthMonths: lengthMonths.trim() === "" ? Number.NaN : Number(lengthMonths),
      lengthOverrideNotes: isLengthOverridden ? lengthOverrideNotes.trim() : "",
      // Note: edited in their own sections, so carried over unchanged.
      additionalTrainingTime: programme?.additionalTrainingTime ?? [],
      acceleratedTrainingTime: programme?.acceleratedTrainingTime ?? [],
      eighteenMonthFinalGrade: programme?.eighteenMonthFinalGrade ?? "",
      eighteenMonthFinalGradeNotes:
        programme?.eighteenMonthFinalGradeNotes ?? "",
      skippedGrade: programme?.skippedGrade ?? "",
      skippedGradeNotes: programme?.skippedGradeNotes ?? "",
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
    flushSync(() => {
      onChange(next);
      setEditing(false);
    });
    onSaved?.();
  };

  const handleCancel = () => {
    if (!programme) return;
    setSpecialty(programme.specialty);
    setStartDate(programme.startDate);
    setLengthMonths(String(programme.lengthMonths));
    setLengthOverrideNotes(
      initialLengthOverride ? programme.lengthOverrideNotes : ""
    );
    setStartGrade(programme.startGrade);
    setOverrideGrade(initialGradeOverride);
    setStartGradeOverrideNotes(
      initialGradeOverride ? programme.startGradeOverrideNotes : ""
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
            <SpecialtyAutocompleteSelect
              inputId="programme-specialty"
              value={specialty}
              onChange={handleSpecialtyChange}
            />
            {selectedSpecialty && (
              <div className="nhsuk-hint nhsuk-u-margin-top-2">
                <p className="nhsuk-u-margin-bottom-1">
                  Selected specialty: {selectedSpecialty.name}
                </p>
                <p className="nhsuk-u-margin-bottom-0">
                  School: {selectedSpecialty.school}
                  {selectedSpecialty.dual && `, ${selectedSpecialty.dual}`}
                </p>
                {selectedSpecialty.info && (
                  <p className="nhsuk-u-margin-bottom-0">
                    {selectedSpecialty.info}
                  </p>
                )}
              </div>
            )}
          </div>

          {selectedSpecialty && (
            <>
              <div className="nhsuk-form-group">
                <label className="nhsuk-label" htmlFor="programme-length">
                  Programme length (months)
                </label>
                <p
                  className="nhsuk-hint nhsuk-u-margin-top-1"
                  id="programme-length-hint"
                >
                  Default for {selectedSpecialty.name} is{" "}
                  {selectedSpecialty.lengthMonths} months. Change it if your
                  programme length is different (1-120 months).
                </p>
                <input
                  className="nhsuk-input nhsuk-input--width-3"
                  id="programme-length"
                  type="text"
                  inputMode="numeric"
                  maxLength={3}
                  aria-describedby="programme-length-hint"
                  value={lengthMonths}
                  onChange={e => setLengthMonths(e.target.value)}
                />
                {selectedSpecialty.info && (
                  <p className="nhsuk-hint nhsuk-u-margin-top-2">
                    {selectedSpecialty.info}
                  </p>
                )}
                {isLengthOverridden && (
                  <div className="nhsuk-u-margin-top-3">
                    <label
                      className="nhsuk-label"
                      htmlFor="programme-length-override-notes"
                    >
                      Reason for a different programme length
                    </label>
                    <input
                      className="nhsuk-input nhsuk-input--width-30"
                      id="programme-length-override-notes"
                      type="text"
                      value={lengthOverrideNotes}
                      onChange={e => setLengthOverrideNotes(e.target.value)}
                      placeholder="e.g. Programme length agreed with my local office"
                      required
                    />
                  </div>
                )}
              </div>

              <DateInput
                id="programme-start"
                label="Programme start date"
                value={startDate}
                onChange={setStartDate}
                hint=""
              />

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
                {(overrideGrade || !selectedSpecialty) && (
                  <p
                    className="nhsuk-hint nhsuk-u-margin-top-1"
                    id="programme-start-grade-hint"
                  >
                    Choose a different start grade
                  </p>
                )}
                {overrideGrade || !selectedSpecialty ? (
                  <select
                    ref={startGradeSelectRef}
                    className="nhsuk-select nhsuk-input--width-3"
                    id="programme-start-grade"
                    aria-describedby="programme-start-grade-hint"
                    value={startGrade}
                    onChange={e => setStartGrade(e.target.value)}
                  >
                    <option value="" hidden />
                    {sortedTrainingGrades.map(g => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    className="nhsuk-input nhsuk-input--width-3"
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
                      onChange={e =>
                        handleGradeOverrideToggle(e.target.checked)
                      }
                    />
                    <label
                      className="nhsuk-label nhsuk-checkboxes__label"
                      htmlFor="programme-start-grade-override"
                    >
                      Check this box if you want to choose a different start
                      grade
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
            </>
          )}

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
                  {programme.lengthMonths} months
                  {initialLengthOverride && initialSpecialty && (
                    <span className="nhsuk-hint nhsuk-u-margin-left-2">
                      (default for this specialty is{" "}
                      {initialSpecialty.lengthMonths} months)
                    </span>
                  )}
                  {initialLengthOverride && programme.lengthOverrideNotes && (
                    <div className="nhsuk-hint nhsuk-u-margin-top-1">
                      {programme.lengthOverrideNotes}
                    </div>
                  )}
                </dd>
              </div>
              <div className="nhsuk-summary-list__row">
                <dt className="nhsuk-summary-list__key">Start grade</dt>
                <dd className="nhsuk-summary-list__value">
                  {programme.startGrade}
                  {initialGradeOverride && initialSpecialty && (
                    <span className="nhsuk-hint nhsuk-u-margin-left-2">
                      (default for this specialty is {initialSpecialty.entryGrade})
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
                <dt className="nhsuk-summary-list__key">
                  Original programme end date
                </dt>
                <dd className="nhsuk-summary-list__value">
                  {dayjs(programmeOriginalEndDate(programme)).format(
                    "DD/MM/YYYY"
                  )}
                </dd>
              </div>
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
