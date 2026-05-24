import { useEffect, useState, type FC, type FormEvent } from "react";
import dayjs from "dayjs";
import {
  TRAINING_GRADES,
  findSpecialty,
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
  const initialOverride =
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
  const [overrideLength, setOverrideLength] = useState(initialOverride);
  const [lengthText, setLengthText] = useState(
    programme ? String(programme.lengthMonths) : ""
  );
  const [overrideGrade, setOverrideGrade] = useState(initialGradeOverride);
  const [startGrade, setStartGrade] = useState(programme?.startGrade ?? "");
  const [error, setError] = useState<string | null>(null);

  const selectedSpecialty = findSpecialty(specialty);

  useEffect(() => {
    if (programme === null) {
      setEditing(true);
      setSpecialty("");
      setStartDate("");
      setOverrideLength(false);
      setLengthText("");
      setOverrideGrade(false);
      setStartGrade("");
      setError(null);
      return;
    }

    const nextSpecialty = findSpecialty(programme.specialty);
    setEditing(false);
    setSpecialty(programme.specialty);
    setStartDate(programme.startDate);
    setOverrideLength(
      nextSpecialty !== undefined &&
        programme.lengthMonths !== nextSpecialty.lengthMonths
    );
    setLengthText(String(programme.lengthMonths));
    setOverrideGrade(
      nextSpecialty !== undefined &&
        programme.startGrade !== nextSpecialty.entryGrade
    );
    setStartGrade(programme.startGrade);
    setError(null);
  }, [programme]);

  const handleSpecialtyChange = (next: string) => {
    setSpecialty(next);
    const found = findSpecialty(next);
    if (found) {
      setOverrideLength(false);
      setLengthText(String(found.lengthMonths));
      setOverrideGrade(false);
      setStartGrade(found.entryGrade);
    } else {
      setLengthText("");
      setStartGrade("");
    }
  };

  const handleOverrideToggle = (checked: boolean) => {
    setOverrideLength(checked);
    if (!checked && selectedSpecialty) {
      setLengthText(String(selectedSpecialty.lengthMonths));
    }
  };

  const handleGradeOverrideToggle = (checked: boolean) => {
    setOverrideGrade(checked);
    if (!checked && selectedSpecialty) {
      setStartGrade(selectedSpecialty.entryGrade);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const lengthMonths = Number.parseFloat(lengthText);
    const next: ProgrammeDetails = {
      specialty: specialty.trim(),
      startDate,
      lengthMonths,
      startGrade: startGrade.trim()
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
    setLengthText(String(programme.lengthMonths));
    setOverrideLength(initialOverride);
    setStartGrade(programme.startGrade);
    setOverrideGrade(initialGradeOverride);
    setError(null);
    setEditing(false);
  };

  return (
    <section className="nhsuk-u-margin-bottom-6">
      <h2 className="nhsuk-heading-l nhsuk-u-color-blue">Programme details</h2>

      {editing ? (
        <form onSubmit={handleSubmit} noValidate>
          <p className="nhsuk-body">
            Pick your specialty to auto-fill the programme length. You can
            override the length if you need to.
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
            {selectedSpecialty && !overrideLength && (
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
              value={lengthText}
              onChange={e => setLengthText(e.target.value)}
              readOnly={!overrideLength && selectedSpecialty !== undefined}
              aria-describedby="programme-length-hint"
            />
            {selectedSpecialty && (
              <div
                className="nhsuk-checkboxes__item nhsuk-u-margin-top-2"
                style={{ paddingLeft: "32px" }}
              >
                <input
                  className="nhsuk-checkboxes__input"
                  id="programme-length-override"
                  type="checkbox"
                  checked={overrideLength}
                  onChange={e => handleOverrideToggle(e.target.checked)}
                />
                <label
                  className="nhsuk-label nhsuk-checkboxes__label"
                  htmlFor="programme-length-override"
                >
                  Override default length
                </label>
              </div>
            )}
            {selectedSpecialty?.info && (
              <p className="nhsuk-hint nhsuk-u-margin-top-2">
                {selectedSpecialty.info}
              </p>
            )}
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
                  Override default start grade
                </label>
              </div>
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
                  {initialOverride && initialSpecialty && (
                    <span className="nhsuk-hint nhsuk-u-margin-left-2">
                      (overridden — default {initialSpecialty.lengthMonths})
                    </span>
                  )}
                </dd>
              </div>
              <div className="nhsuk-summary-list__row">
                <dt className="nhsuk-summary-list__key">Start grade</dt>
                <dd className="nhsuk-summary-list__value">
                  {programme.startGrade}
                  {initialGradeOverride && initialSpecialty && (
                    <span className="nhsuk-hint nhsuk-u-margin-left-2">
                      (overridden — default {initialSpecialty.entryGrade})
                    </span>
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
