import { useState, type FC, type FormEvent } from "react";
import {
  validateProposedChange,
  type PastChange,
  type ProgrammeDetails,
  type ProposedChange,
  type ProposedChangeKind
} from "../core";

type ProposedChangeFormProps = {
  programme: ProgrammeDetails;
  pastChanges: PastChange[];
  initial: ProposedChange | null;
  submitDisabled?: boolean;
  submitDisabledReason?: string;
  onSubmit: (proposed: ProposedChange) => void;
};

export const ProposedChangeForm: FC<ProposedChangeFormProps> = ({
  programme,
  pastChanges,
  initial,
  submitDisabled = false,
  submitDisabledReason,
  onSubmit
}) => {
  const [kind, setKind] = useState<ProposedChangeKind>(
    initial?.kind ?? "FULL_TIME"
  );
  const [startDate, setStartDate] = useState(initial?.startDate ?? "");
  const [wte, setWte] = useState(
    initial?.wte != null ? String(initial.wte) : ""
  );
  const [error, setError] = useState<string | null>(null);

  const hasNewEntryData =
    initial === null &&
    (kind !== "FULL_TIME" || startDate !== "" || wte !== "");

  const resetForAdd = () => {
    setKind("FULL_TIME");
    setStartDate("");
    setWte("");
    setError(null);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const wteValue = kind === "LTFT" ? Number.parseInt(wte, 10) : null;
    const candidate: ProposedChange = {
      kind,
      startDate,
      wte: Number.isNaN(wteValue as number) ? null : wteValue
    };
    const result = validateProposedChange(candidate, programme, pastChanges);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setError(null);
    onSubmit(candidate);
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <p className="nhsuk-body-m">
        Add the details of your next post. This will be used to calculate your
        projected completion date.
      </p>

      <div className="nhsuk-form-group">
        <span className="nhsuk-label">Post type</span>
        <div className="nhsuk-radios">
          <div className="nhsuk-radios__item">
            <input
              className="nhsuk-radios__input"
              id="proposed-kind-ft"
              type="radio"
              name="proposed-kind"
              value="FULL_TIME"
              checked={kind === "FULL_TIME"}
              onChange={() => setKind("FULL_TIME")}
            />
            <label
              className="nhsuk-label nhsuk-radios__label"
              htmlFor="proposed-kind-ft"
            >
              Full-time post (100% WTE)
            </label>
          </div>
          <div className="nhsuk-radios__item">
            <input
              className="nhsuk-radios__input"
              id="proposed-kind-ltft"
              type="radio"
              name="proposed-kind"
              value="LTFT"
              checked={kind === "LTFT"}
              onChange={() => setKind("LTFT")}
            />
            <label
              className="nhsuk-label nhsuk-radios__label"
              htmlFor="proposed-kind-ltft"
            >
              LTFT post
            </label>
          </div>
        </div>
      </div>

      <div className="nhsuk-grid-row">
        <div className="nhsuk-grid-column-one-quarter">
          <div className="nhsuk-form-group">
            <label className="nhsuk-label" htmlFor="proposed-start">
              Start date
            </label>
            <input
              className="nhsuk-input nhsuk-input--width-10"
              id="proposed-start"
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
            />
          </div>
        </div>
        {kind === "LTFT" && (
          <div className="nhsuk-grid-column-one-quarter">
            <div className="nhsuk-form-group">
              <label className="nhsuk-label" htmlFor="proposed-wte">
                WTE % (1–99)
              </label>
              <input
                className="nhsuk-input nhsuk-input--width-5"
                id="proposed-wte"
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

      {error && (
        <div className="nhsuk-error-summary" role="alert">
          <p className="nhsuk-error-summary__body">{error}</p>
        </div>
      )}

      {submitDisabled && submitDisabledReason && (
        <p className="nhsuk-u-margin-top-3">
          <em>{submitDisabledReason}</em>
        </p>
      )}

      <div className="nhsuk-button-group">
        <button
          type="submit"
          className="nhsuk-button nhsuk-u-margin-right-3"
          disabled={submitDisabled}
        >
          {initial
            ? "Update Completion date calculation"
            : "Calculate projected completion date"}
        </button>
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
