import { useState, type FC } from "react";
import { CompletionDateWarning } from "../components/CompletionDateWarning";
import { GradeTable } from "../components/GradeTable";
import { NextPostSummary } from "../components/NextPostSummary";
import { PastChangeForm } from "../components/PastChangeForm";
import { PastChangesList } from "../components/PastChangesList";
import { ProgrammeDetailsSection } from "../components/ProgrammeDetailsSection";
import {
  computeGradeProgression,
  deriveQuickProjection,
  getCalculationTypeLabel,
  isOpenProjectedLtftChange,
  validatePastChange,
  type PastChange,
  type ProgrammeDetails
} from "../core";
import { formatDate } from "../utils/format";
import { scrollTo } from "../utils/scroll";

type SetupPageProps = {
  programme: ProgrammeDetails | null;
  pastChanges: PastChange[];
  onProgrammeChange: (programme: ProgrammeDetails) => void;
  onPastChangesChange: (changes: PastChange[]) => void;
  onContinue: () => void;
};

export const SetupPage: FC<SetupPageProps> = ({
  programme,
  pastChanges,
  onProgrammeChange,
  onPastChangesChange,
  onContinue
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleAddPast = (change: PastChange) => {
    const existing = change.projectsRemainingTraining
      ? pastChanges.map(c => ({ ...c, projectsRemainingTraining: false }))
      : pastChanges;
    onPastChangesChange([...existing, change]);
    scrollTo({ id: "past-changes-table" });
  };

  const handleRemovePast = (id: string) => {
    onPastChangesChange(pastChanges.filter(c => c.id !== id));
    scrollTo({ id: "past-change-form" });
  };

  const handleStartEdit = (id: string) => {
    setEditingId(id);
    scrollTo({ id: "past-change-form" });
  };

  const handleUpdatePast = (updated: PastChange) => {
    onPastChangesChange(
      pastChanges.map(c => {
        if (c.id === updated.id) return updated;
        if (updated.projectsRemainingTraining) {
          return { ...c, projectsRemainingTraining: false };
        }
        return c;
      })
    );
    setEditingId(null);
    scrollTo({ id: "past-changes-table" });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    scrollTo({ id: "past-changes-table" });
  };

  const editingChange =
    editingId === null
      ? null
      : (pastChanges.find(c => c.id === editingId) ?? null);

  const pastChangeIssues = programme
    ? pastChanges.filter(
        change => !validatePastChange(change, programme, pastChanges).ok
      )
    : [];
  const projected = programme
    ? deriveQuickProjection(programme, pastChanges)
    : null;
  const canShowSummary =
    programme !== null && editingId === null && pastChangeIssues.length === 0;

  return (
    <>
      <CompletionDateWarning />

      <ProgrammeDetailsSection
        programme={programme}
        onChange={onProgrammeChange}
        onSaved={() => scrollTo({ id: "past-changes-section" })}
      />

      {programme && projected && (
        <ChangesSection
          programme={programme}
          pastChanges={pastChanges}
          projected={projected}
          editingId={editingId}
          editingChange={editingChange}
          onAddPast={handleAddPast}
          onUpdatePast={handleUpdatePast}
          onCancelEdit={handleCancelEdit}
          onStartEdit={handleStartEdit}
          onRemovePast={handleRemovePast}
        />
      )}
      {programme && projected && (
        <section className="nhsuk-u-margin-top-4">
          <h2 className="nhsuk-heading-l nhsuk-u-color-blue">
            Grade progression
          </h2>
          <p className="nhsuk-hint">
            Updates automatically as you add changes and set the projection.
          </p>
          <GradeTable
            programme={programme}
            rows={computeGradeProgression(programme, pastChanges, projected)}
          />
          {canShowSummary && (
            <button
              type="button"
              className="nhsuk-button nhsuk-u-margin-top-4"
              onClick={onContinue}
            >
              Show summary
            </button>
          )}
          {!canShowSummary && pastChangeIssues.length > 0 && (
            <p className="nhsuk-u-margin-top-3">
              <em>Fix the change errors above before continuing to summary.</em>
            </p>
          )}
        </section>
      )}
    </>
  );
};

type ChangesSectionProps = {
  programme: ProgrammeDetails;
  pastChanges: PastChange[];
  projected: ReturnType<typeof deriveQuickProjection>;
  editingId: string | null;
  editingChange: PastChange | null;
  onAddPast: (change: PastChange) => void;
  onUpdatePast: (change: PastChange) => void;
  onCancelEdit: () => void;
  onStartEdit: (id: string) => void;
  onRemovePast: (id: string) => void;
};

const ChangesSection: FC<ChangesSectionProps> = ({
  programme,
  pastChanges,
  projected,
  editingId,
  editingChange,
  onAddPast,
  onUpdatePast,
  onCancelEdit,
  onStartEdit,
  onRemovePast
}) => {
  const pastChangeIssues: {
    id: string;
    change: PastChange;
    message: string;
  }[] = [];
  for (const change of pastChanges) {
    const result = validatePastChange(change, programme, pastChanges);
    if (!result.ok) {
      pastChangeIssues.push({
        id: change.id,
        change,
        message: result.message
      });
    }
  }
  const errorsById = Object.fromEntries(
    pastChangeIssues.map(issue => [issue.id, issue.message])
  );

  const hasErrors = pastChangeIssues.length > 0;
  const describeChange = (change: PastChange) => {
    const endLabel = isOpenProjectedLtftChange(change)
      ? "projects forward"
      : formatDate(change.endDate);
    return `${getCalculationTypeLabel(change.type, "short")} (${formatDate(change.startDate)} - ${endLabel})`;
  };

  return (
    <section id="past-changes-section" className="nhsuk-u-margin-bottom-6">
      <h2 className="nhsuk-heading-l nhsuk-u-color-blue">Changes</h2>

      <p className="nhsuk-body nhsuk-u-margin-bottom-1">
        Add all your past or planned changes to your training (e.g. LTFT, OOP,
        parental leave).
      </p>
      <p className="nhsuk-body nhsuk-u-margin-top-0">
        Any gaps are assumed to be full-time, at 100% whole-time equivalent
        (WTE).
      </p>

      {hasErrors && (
        <div
          className="nhsuk-error-summary"
          aria-labelledby="changes-error-title"
          role="alert"
        >
          <h3 className="nhsuk-error-summary__title" id="changes-error-title">
            These entries are no longer valid against the current programme
            details
          </h3>
          <div className="nhsuk-error-summary__body">
            <ul className="nhsuk-list nhsuk-list--bullet nhsuk-error-summary__list">
              {pastChangeIssues.map(issue => (
                <li key={issue.id}>
                  <strong>{describeChange(issue.change)}</strong> -{" "}
                  {issue.message}
                </li>
              ))}
            </ul>
            <p className="nhsuk-u-margin-top-2">
              Edit or remove the affected entries to continue.
            </p>
          </div>
        </div>
      )}

      <PastChangeForm
        key={editingId ?? "new"}
        formId="past-change-form"
        programme={programme}
        existing={pastChanges}
        editing={editingChange}
        onAdd={onAddPast}
        onUpdate={onUpdatePast}
        onCancelEdit={onCancelEdit}
      />

      <PastChangesList
        programme={programme}
        changes={pastChanges}
        projected={projected}
        editingId={editingId}
        errorsById={errorsById}
        onRemove={onRemovePast}
        onEdit={onStartEdit}
      />

      {editingId === null && !hasErrors && (
        <section className="nhsuk-u-margin-top-5">
          <h3 className="nhsuk-heading-m nhsuk-u-color-blue">
            Projected Completion of Training Date
          </h3>
          <NextPostSummary
            programme={programme}
            pastChanges={pastChanges}
            proposed={projected}
          />
          <p className="nhsuk-hint nhsuk-u-margin-top-1">
            This projection updates automatically when you add, edit or remove
            changes.
          </p>
        </section>
      )}
    </section>
  );
};
