import { WarningCallout } from "nhsuk-react-components";

export const CompletionDateWarning = () => (
  <WarningCallout className="nhsuk-u-margin-bottom-5">
    <WarningCallout.Label>Projected completion date</WarningCallout.Label>
    <p className="nhsuk-u-margin-bottom-0">
      The projected completion date is an estimate only and should not be
      considered your official completion date. Your official completion date
      will be agreed at ARCP.
    </p>
  </WarningCallout>
);
