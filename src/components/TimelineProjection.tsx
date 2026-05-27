import type { FC } from "react";
import dayjs from "dayjs";
import { Table } from "nhsuk-react-components";
import {
  computeTimelineAccrual,
  programmeAdjustedLengthMonths,
  projectedCompletionDateForTimeline,
  type ProgrammeDetails,
  type TrainingPeriod
} from "../core";
import { formatDate, formatMonths } from "../utils/format";

const lastGradeWtePercent = (timeline: TrainingPeriod[]): number | null => {
  for (let i = timeline.length - 1; i >= 0; i -= 1) {
    const period = timeline[i];
    if (period.type === "GRADE" && period.wte !== null) {
      return period.wte;
    }
  }
  return null;
};

type TimelineProjectionProps = {
  programme: ProgrammeDetails;
  timeline: TrainingPeriod[];
};

export const TimelineProjection: FC<TimelineProjectionProps> = ({
  programme,
  timeline
}) => {
  if (timeline.length === 0) return null;

  const accrual = computeTimelineAccrual(programme, timeline);
  const cct = projectedCompletionDateForTimeline(programme, timeline);
  const adjustedLength = programmeAdjustedLengthMonths(programme);
  const last = timeline.at(-1);
  const isOpenEnded = last?.endDate === null;
  const isOverPlanned =
    !isOpenEnded && Number(accrual.monthsRemaining.toFixed(2)) <= 0.009;

  let regimeNote: string;
  if (isOpenEnded && last) {
    const openEndedWte =
      last.type === "GRADE" && last.wte !== null
        ? `${last.wte}% WTE`
        : "the last recorded grade WTE";
    regimeNote = `The last period projects forward at ${openEndedWte} from ${formatDate(last.startDate)}. Edit it to change the rate or add a new period if your plan changes.`;
  } else if (isOverPlanned && last && last.endDate !== null) {
    regimeNote = `The timeline already covers the required training, so the Completion of Training Date is the last recorded end date (${formatDate(last.endDate)}).`;
  } else if (last && last.endDate !== null) {
    const wtePct = lastGradeWtePercent(timeline);
    const wteLabel = wtePct === null ? "100% WTE (no grade recorded)" : `${wtePct}% WTE`;
    const fromDate = dayjs(last.endDate).add(1, "day").format("YYYY-MM-DD");
    regimeNote = `The timeline does not yet cover the required training. The Completion of Training Date extrapolates from ${formatDate(fromDate)} at ${wteLabel} - the most recent grade WTE in the timeline. Add a project-forward grade period to change the rate (e.g. switch to a higher WTE).`;
  } else {
    regimeNote = "";
  }

  return (
    <div className="nhsuk-u-margin-top-3">
      <div className="table-wrapper">
        <Table>
          <Table.Head>
            <Table.Row>
              <Table.Cell>Required training</Table.Cell>
              <Table.Cell>WTE months recorded</Table.Cell>
              <Table.Cell>Months remaining</Table.Cell>
              <Table.Cell>Projected Completion of Training Date</Table.Cell>
            </Table.Row>
          </Table.Head>
          <Table.Body>
            <Table.Row>
              <Table.Cell>{formatMonths(adjustedLength)}</Table.Cell>
              <Table.Cell>
                {formatMonths(accrual.totalWteMonthsCompleted)}
              </Table.Cell>
              <Table.Cell>
                {formatMonths(Math.max(0, accrual.monthsRemaining))}
              </Table.Cell>
              <Table.Cell>
                <strong>{formatDate(cct)}</strong>
              </Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table>
      </div>
      <p className="nhsuk-hint nhsuk-u-margin-top-1">{regimeNote}</p>
    </div>
  );
};
