import { useState, type FC, type FormEvent } from "react";
import dayjs from "dayjs";
import {
  programmeOriginalEndDate,
  validateProgrammeDetails,
  type ProgrammeDetails
} from "../core";
import { formatDate, formatMonths } from "../utils/format";

type ProgrammeDetailsSectionProps = {
  programme: ProgrammeDetails | null;
  onChange: (programme: ProgrammeDetails) => void;
};

export const ProgrammeDetailsSection: FC<ProgrammeDetailsSectionProps> = ({
  programme,
  onChange
}) => {
  const [editing, setEditing] = useState(programme === null);
  const [name, setName] = useState(programme?.name ?? "");
  const [startDate, setStartDate] = useState(programme?.startDate ?? "");
  const [lengthText, setLengthText] = useState(
    programme ? String(programme.lengthMonths) : ""
  );
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const lengthMonths = Number.parseFloat(lengthText);
    const next: ProgrammeDetails = {
      name: name.trim(),
      startDate,
      lengthMonths
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
    setName(programme.name);
    setStartDate(programme.startDate);
    setLengthText(String(programme.lengthMonths));
    setError(null);
    setEditing(false);
  };

  return (
    <section className="nhsuk-u-margin-bottom-6">
      <h2 className="nhsuk-heading-l nhsuk-u-color-blue">Programme details</h2>

      {editing ? (
        <form onSubmit={handleSubmit} noValidate>
          <p className="nhsuk-body">
            Enter the original details of your training programme. These act as
            the reference point for all calculations.
          </p>

          <div className="nhsuk-form-group">
            <label className="nhsuk-label" htmlFor="programme-name">
              Programme name
            </label>
            <input
              className="nhsuk-input nhsuk-input--width-30"
              id="programme-name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
            />
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

          <div className="nhsuk-form-group">
            <label className="nhsuk-label" htmlFor="programme-length">
              Programme length (months)
            </label>
            <div className="nhsuk-hint" id="programme-length-hint">
              Decimals allowed to one place (e.g. 60.0, 36.5).
            </div>
            <input
              className="nhsuk-input nhsuk-input--width-5"
              id="programme-length"
              type="number"
              step="0.1"
              min="0"
              value={lengthText}
              onChange={e => setLengthText(e.target.value)}
              aria-describedby="programme-length-hint"
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
                <dt className="nhsuk-summary-list__key">Name</dt>
                <dd className="nhsuk-summary-list__value">{programme.name}</dd>
              </div>
              <div className="nhsuk-summary-list__row">
                <dt className="nhsuk-summary-list__key">Start date</dt>
                <dd className="nhsuk-summary-list__value">
                  {formatDate(programme.startDate)}
                </dd>
              </div>
              <div className="nhsuk-summary-list__row">
                <dt className="nhsuk-summary-list__key">Length</dt>
                <dd className="nhsuk-summary-list__value">
                  {formatMonths(programme.lengthMonths)}
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
