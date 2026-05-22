import dayjs from "dayjs";
import type {
  PastChange,
  ProgrammeDetails,
  ProposedChange
} from "./calculationTypes";
import { programmeOriginalEndDate } from "./calculations";

export type ValidationResult = { ok: true } | { ok: false; message: string };

const ok: ValidationResult = { ok: true };
const err = (message: string): ValidationResult => ({ ok: false, message });

const formatDate = (date: string) => dayjs(date).format("DD/MM/YYYY");

export const validatePastChange = (
  candidate: PastChange,
  programme: ProgrammeDetails,
  existing: PastChange[]
): ValidationResult => {
  const programmeEnd = programmeOriginalEndDate(programme);
  const today = dayjs().startOf("day");

  if (!candidate.startDate || !candidate.endDate) {
    return err("Please enter both a start date and an end date.");
  }

  if (dayjs(candidate.startDate).isAfter(today)) {
    return err("Past change start date cannot be in the future.");
  }

  if (dayjs(candidate.endDate).isAfter(today)) {
    return err("Past change end date cannot be in the future.");
  }

  if (dayjs(candidate.startDate).isAfter(dayjs(candidate.endDate))) {
    return err("Start date cannot be after end date.");
  }

  if (dayjs(candidate.startDate).isBefore(dayjs(programme.startDate))) {
    return err(
      `Start date cannot be before programme start (${formatDate(programme.startDate)}).`
    );
  }

  if (dayjs(candidate.endDate).isAfter(dayjs(programmeEnd))) {
    return err(
      `End date cannot be after the original programme end (${formatDate(programmeEnd)}).`
    );
  }

  if (candidate.type === "LTFT") {
    if (
      candidate.wte == null ||
      candidate.wte < 1 ||
      candidate.wte > 99 ||
      !Number.isInteger(candidate.wte)
    ) {
      return err("LTFT WTE must be a whole number between 1 and 99.");
    }
  }

  for (const other of existing) {
    if (other.id === candidate.id) continue;
    const overlaps =
      !dayjs(candidate.endDate).isBefore(dayjs(other.startDate)) &&
      !dayjs(candidate.startDate).isAfter(dayjs(other.endDate));
    if (overlaps) {
      return err(
        `This change overlaps an existing change (${formatDate(other.startDate)} – ${formatDate(other.endDate)}).`
      );
    }
  }

  return ok;
};

export const validateProposedChange = (
  proposed: ProposedChange,
  programme: ProgrammeDetails,
  pastChanges: PastChange[]
): ValidationResult => {
  if (!proposed.startDate) {
    return err("Please enter a start date for your next post.");
  }

  if (dayjs(proposed.startDate).isBefore(dayjs(programme.startDate))) {
    return err(
      `Start date cannot be before programme start (${formatDate(programme.startDate)}).`
    );
  }

  const programmeEnd = programmeOriginalEndDate(programme);
  if (dayjs(proposed.startDate).isAfter(dayjs(programmeEnd))) {
    return err(
      `Proposed start date cannot be after the original programme end (${formatDate(programmeEnd)}).`
    );
  }

  if (pastChanges.length > 0) {
    const latest = pastChanges.reduce(
      (acc, p) => (dayjs(p.endDate).isAfter(dayjs(acc.endDate)) ? p : acc),
      pastChanges[0]
    );
    if (!dayjs(proposed.startDate).isAfter(dayjs(latest.endDate))) {
      return err(
        `Proposed start date must be after the latest past change (ends ${formatDate(latest.endDate)}).`
      );
    }
  }

  if (proposed.kind === "LTFT") {
    if (
      proposed.wte == null ||
      proposed.wte < 1 ||
      proposed.wte > 99 ||
      !Number.isInteger(proposed.wte)
    ) {
      return err("LTFT WTE must be a whole number between 1 and 99.");
    }
  }

  return ok;
};

export const validateProgrammeDetails = (
  programme: ProgrammeDetails
): ValidationResult => {
  if (!programme.name.trim()) return err("Please enter a programme name.");
  if (!programme.startDate) return err("Please enter a programme start date.");
  if (!Number.isFinite(programme.lengthMonths) || programme.lengthMonths <= 0) {
    return err("Programme length must be greater than zero.");
  }
  const rounded = Math.round(programme.lengthMonths * 10) / 10;
  if (rounded !== programme.lengthMonths) {
    return err("Programme length can have at most 1 decimal place.");
  }
  return ok;
};
