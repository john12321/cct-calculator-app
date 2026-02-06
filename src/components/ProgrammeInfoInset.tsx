import React from "react";
import dayjs from "dayjs";

type ProgrammeInfoInsetProps = {
  programmeName: string;
  programmeStartDate: string;
  programmeEndDate: string;
  showCctDate: boolean;
  cctDate: string;
};

export const ProgrammeInfoInset: React.FC<ProgrammeInfoInsetProps> = ({
  programmeName,
  programmeStartDate,
  programmeEndDate,
  showCctDate = false,
  cctDate
}) => {
  const progEndDate = dayjs(programmeEndDate).format("DD/MM/YYYY");
  return (
    <div className="nhsuk-inset-text no-print">
      <p>
        Programme: {programmeName || "Unnamed programme"}
        <br />
        Period: {dayjs(programmeStartDate).format("DD/MM/YYYY")} to{" "}
        {progEndDate}
        <br />
        Original CCT date: {progEndDate}
        {showCctDate && cctDate && (
          <>
            <br />
            <strong>{`New CCT date (indicative): ${dayjs(cctDate).format(
              "DD/MM/YYYY"
            )}`}</strong>
          </>
        )}
      </p>
    </div>
  );
};
