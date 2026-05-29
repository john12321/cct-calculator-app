import { type FC } from "react";
import type { CalculationMode } from "../core";

type ModePickerProps = {
  onSelect: (mode: CalculationMode) => void;
};

export const ModePicker: FC<ModePickerProps> = ({ onSelect }) => {
  return (
    <section>
      <h2 className="nhsuk-heading-l nhsuk-u-color-blue">
        Choose how you want to use the calculator
      </h2>

      <div className="nhsuk-grid-row">
        <div className="nhsuk-grid-column-one-half">
          <div className="nhsuk-card">
            <div className="nhsuk-card__content">
              <h3 className="nhsuk-card__heading">
                I want a quick Completion of Training Date calculation
              </h3>
              <p className="nhsuk-body">
                Record completed or "what if?" LTFT change periods and absences,
                with gaps assumed to be full-time training. Fastest route to a
                projected Completion of Training Date.
              </p>
              <button
                type="button"
                className="nhsuk-button"
                onClick={() => onSelect("QUICK")}
              >
                Use Quick mode
              </button>
            </div>
          </div>
        </div>

        <div className="nhsuk-grid-column-one-half">
          <div className="nhsuk-card">
            <div className="nhsuk-card__content">
              <h3 className="nhsuk-card__heading">
                I'm building a training record plus Completion of Training Date
                calculation
              </h3>
              <p className="nhsuk-body">
                Record every period of training and absence as a contiguous
                timeline. Ideal for admin staff who need to create an
                authoritative training record.
              </p>
              <button
                type="button"
                className="nhsuk-button"
                onClick={() => onSelect("FULL")}
              >
                Use Full mode
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
