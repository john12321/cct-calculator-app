import { Wrench, Clock } from "lucide-react";

export const LandingPage = () => {
  return (
    <div className="nhsuk-width-container">
      <main className="nhsuk-main-wrapper" id="main-content">
        <div className="nhsuk-grid-row">
          <div className="nhsuk-grid-column-two-thirds">
            <h1 className="nhsuk-heading-xl nhsuk-u-color-blue">
              NHS CCT Calculator
            </h1>
            <p className="nhsuk-lede-text">
              A quick and accurate Certificate of Completion of Training date
              calculator for NHS Resident Doctors and admin support staff.
            </p>
          </div>
        </div>

        <section
          className="nhsuk-warning-callout"
          aria-labelledby="maintenance-heading"
        >
          <h2 id="maintenance-heading" className="nhsuk-warning-callout__label">
            <span role="text">
              <span className="nhsuk-u-visually-hidden">Important:</span>{" "}
              We&rsquo;re making improvements
            </span>
          </h2>
          <p>
            The CCT Calculator is temporarily unavailable while we add new
            features and refine the existing ones. Thank you for your patience
            &mdash; please check back again soon.
          </p>
        </section>

        <div className="nhsuk-grid-row">
          <div className="nhsuk-grid-column-one-half">
            <div className="nhsuk-card">
              <div className="nhsuk-card__content">
                <h2 className="nhsuk-card__heading nhsuk-u-color-blue">
                  <Wrench
                    size={22}
                    aria-hidden="true"
                    style={{ verticalAlign: "-4px", marginRight: "8px" }}
                  />
                  What&rsquo;s being updated
                </h2>
                <ul className="nhsuk-list nhsuk-list--bullet">
                  <li>Improved calculation logic for complex changes</li>
                  <li>More features for more use cases</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="nhsuk-grid-column-one-half">
            <div className="nhsuk-card">
              <div className="nhsuk-card__content">
                <h2 className="nhsuk-card__heading nhsuk-u-color-blue">
                  <Clock
                    size={22}
                    aria-hidden="true"
                    style={{ verticalAlign: "-4px", marginRight: "8px" }}
                  />
                  In the meantime
                </h2>
                <p>
                  If you need to calculate a CCT date urgently, please refer to
                  your local Postgraduate Medical Education team or speak with
                  your Training Programme Director.
                </p>
                <p>
                  We&rsquo;ll restore full functionality as soon as the next
                  release is ready.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
