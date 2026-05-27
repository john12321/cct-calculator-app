import { WarningCallout } from "nhsuk-react-components";

export const CompletionDateWarning = () => (
  <WarningCallout className="nhsuk-u-margin-bottom-5">
    <WarningCallout.Label>
      Projected Completion of Training Date
    </WarningCallout.Label>
    <p className="nhsuk-u-margin-bottom-0">
      The projected Completion of Training Date is an estimate only and should
      not be considered your official Certificate of Completion of Trainging
      (CCT) Date. This will be agreed at ARCP.
    </p>
  </WarningCallout>
);
