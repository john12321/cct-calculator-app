import { useState, type FC } from "react";
import { GradeTable } from "../components/GradeTable";
import { NextPostSummary } from "../components/NextPostSummary";
import { PastChangeForm } from "../components/PastChangeForm";
import { PastChangesList } from "../components/PastChangesList";
import { ProgrammeDetailsSection } from "../components/ProgrammeDetailsSection";
import { ProposedChangeForm } from "../components/ProposedChangeForm";
import {
  getCalculationTypeLabel,
  validatePastChange,
  validateProposedChange,
  type PastChange,
  type ProgrammeDetails,
  type ProposedChange
} from "../core";
import { formatDate } from "../utils/format";

type SetupPageProps = {
  programme: ProgrammeDetails | null;
  pastChanges: PastChange[];
  proposed: ProposedChange | null;
  onProgrammeChange: (programme: ProgrammeDetails) => void;
  onPastChangesChange: (changes: PastChange[]) => void;
  onProposedChange: (proposed: ProposedChange | null) => void;
  onContinue: () => void;
};

export const SetupPage: FC<SetupPageProps> = ({
  programme,
  pastChanges,
  proposed,
  onProgrammeChange,
  onPastChangesChange,
  onProposedChange,
  onContinue
}) => {
  const [showProposedForm, setShowProposedForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const clearProposed = () => {
    onProposedChange(null);
    setShowProposedForm(false);
  };

  const handleAddPast = (change: PastChange) => {
    onPastChangesChange([...pastChanges, change]);
  };

  const handleRemovePast = (id: string) => {
    onPastChangesChange(pastChanges.filter(c => c.id !== id));
    clearProposed();
  };

  const handleStartEdit = (id: string) => {
    setEditingId(id);
    clearProposed();
  };

  const handleUpdatePast = (updated: PastChange) => {
    onPastChangesChange(
      pastChanges.map(c => (c.id === updated.id ? updated : c))
    );
    setEditingId(null);
  };

  const handleCancelEdit = () => setEditingId(null);

  const editingChange =
    editingId === null
      ? null
      : (pastChanges.find(c => c.id === editingId) ?? null);

  const handleProposedSubmit = (next: ProposedChange) => {
    onProposedChange(next);
  };

  const handleEditProposed = () => {
    setShowProposedForm(true);
  };

  const summaryPastChangeIssues = programme
    ? pastChanges.filter(
        change => !validatePastChange(change, programme, pastChanges).ok
      )
    : [];
  const summaryProposedValidation =
    programme && proposed
      ? validateProposedChange(proposed, programme, pastChanges)
      : null;
  const summaryProposedError =
    summaryProposedValidation && !summaryProposedValidation.ok
      ? summaryProposedValidation.message
      : null;
  const canShowSummary =
    programme !== null &&
    proposed !== null &&
    editingId === null &&
    !showProposedForm &&
    summaryProposedError === null;

  return (
    <>
      <ProgrammeDetailsSection
        programme={programme}
        onChange={onProgrammeChange}
      />

      {programme && (
        <ChangesAndNextPost
          programme={programme}
          pastChanges={pastChanges}
          proposed={proposed}
          editingId={editingId}
          editingChange={editingChange}
          showProposedForm={showProposedForm}
          onAddPast={handleAddPast}
          onUpdatePast={handleUpdatePast}
          onCancelEdit={handleCancelEdit}
          onStartEdit={handleStartEdit}
          onRemovePast={handleRemovePast}
          onShowProposedForm={() => setShowProposedForm(true)}
          onProposedSubmit={next => {
            handleProposedSubmit(next);
            setShowProposedForm(false);
          }}
          onEditProposed={handleEditProposed}
        />
      )}
      {programme && (
        <section className="nhsuk-u-margin-top-4">
          <h2 className="nhsuk-heading-l nhsuk-u-color-blue">
            Grade progression
          </h2>
          <p className="nhsuk-hint">
            Updates automatically as you add past changes and your next post.
          </p>
          <GradeTable
            programme={programme}
            pastChanges={pastChanges}
            proposed={proposed}
          />
          {canShowSummary && (
            <>
              {summaryPastChangeIssues.length > 0 && (
                <p className="nhsuk-u-margin-top-3">
                  <em>
                    Fix the past change errors above before continuing to
                    summary.
                  </em>
                </p>
              )}
              <button
                type="button"
                className="nhsuk-button nhsuk-u-margin-top-4"
                onClick={onContinue}
                disabled={summaryPastChangeIssues.length > 0}
              >
                Show summary
              </button>
            </>
          )}
        </section>
      )}
    </>
  );
};

type ChangesAndNextPostProps = {
  programme: ProgrammeDetails;
  pastChanges: PastChange[];
  proposed: ProposedChange | null;
  editingId: string | null;
  editingChange: PastChange | null;
  showProposedForm: boolean;
  onAddPast: (change: PastChange) => void;
  onUpdatePast: (change: PastChange) => void;
  onCancelEdit: () => void;
  onStartEdit: (id: string) => void;
  onRemovePast: (id: string) => void;
  onShowProposedForm: () => void;
  onProposedSubmit: (proposed: ProposedChange) => void;
  onEditProposed: () => void;
};

const ChangesAndNextPost: FC<ChangesAndNextPostProps> = ({
  programme,
  pastChanges,
  proposed,
  editingId,
  editingChange,
  showProposedForm,
  onAddPast,
  onUpdatePast,
  onCancelEdit,
  onStartEdit,
  onRemovePast,
  onShowProposedForm,
  onProposedSubmit,
  onEditProposed
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
  const pastErrorsById = Object.fromEntries(
    pastChangeIssues.map(issue => [issue.id, issue.message])
  );

  const proposedValidation = proposed
    ? validateProposedChange(proposed, programme, pastChanges)
    : null;
  const proposedError =
    proposedValidation && !proposedValidation.ok
      ? proposedValidation.message
      : null;

  const hasErrors = pastChangeIssues.length > 0 || proposedError !== null;
  const describeChange = (change: PastChange) =>
    `${getCalculationTypeLabel(change.type, "short")} (${formatDate(change.startDate)} – ${formatDate(change.endDate)})`;

  return (
    <>
      <h2 className="nhsuk-heading-l nhsuk-u-color-blue">Past changes</h2>

      <section className="nhsuk-u-margin-bottom-6">
        <p className="nhsuk-body">
          You only need to record completed LTFT periods or absences (OOP,
          parental, sickness, etc.), as any gaps between them will be assumed
          full-time (100% WTE).
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
                    <strong>{describeChange(issue.change)}</strong> —{" "}
                    {issue.message}
                  </li>
                ))}
                {proposedError && proposed && (
                  <li>
                    <strong>
                      Next post (start {formatDate(proposed.startDate)})
                    </strong>{" "}
                    — {proposedError}
                  </li>
                )}
              </ul>
              <p className="nhsuk-u-margin-top-2">
                Edit or remove the affected entries to continue.
              </p>
            </div>
          </div>
        )}

        <PastChangeForm
          key={editingId ?? "new"}
          programme={programme}
          existing={pastChanges}
          editing={editingChange}
          onAdd={onAddPast}
          onUpdate={onUpdatePast}
          onCancelEdit={onCancelEdit}
        />

        <PastChangesList
          changes={pastChanges}
          editingId={editingId}
          errorsById={pastErrorsById}
          onRemove={onRemovePast}
          onEdit={onStartEdit}
        />
      </section>

      {editingId === null && (
        <>
          <hr className="nhsuk-section-break nhsuk-section-break--m nhsuk-section-break--visible" />
          <h2 className="nhsuk-heading-l nhsuk-u-color-blue">Next post </h2>
          <section className="nhsuk-u-margin-bottom-2">
            {!showProposedForm && !proposed && (
              <>
                <p className="nhsuk-body">
                  If you have any past changes, add them above first. Then
                  enter your next post to calculate your projected completion
                  date.
                </p>
                <button
                  type="button"
                  className="nhsuk-button"
                  onClick={onShowProposedForm}
                  disabled={pastChangeIssues.length > 0}
                >
                  Add next post
                </button>
              </>
            )}

            {showProposedForm && (
              <ProposedChangeForm
                programme={programme}
                pastChanges={pastChanges}
                initial={proposed}
                submitDisabled={pastChangeIssues.length > 0}
                submitDisabledReason="Fix the past change errors above before calculating your projected completion date."
                onSubmit={onProposedSubmit}
              />
            )}

            {proposed && !showProposedForm && proposedError === null && (
              <>
                <NextPostSummary
                  key={`${pastChanges.length}-${pastChanges.map(c => c.id + c.startDate + c.endDate + (c.wte ?? "")).join("|")}`}
                  programme={programme}
                  pastChanges={pastChanges}
                  proposed={proposed}
                />
                <p className="nhsuk-hint nhsuk-u-margin-top-1">
                  This projection updates automatically when you add, edit or
                  remove past changes.
                </p>

                <div className="nhsuk-button-group nhsuk-u-margin-top-4">
                  <button
                    type="button"
                    className="nhsuk-button nhsuk-button--secondary nhsuk-u-margin-right-3"
                    onClick={onEditProposed}
                  >
                    Edit next post
                  </button>
                </div>
              </>
            )}

            {proposed && !showProposedForm && proposedError !== null && (
              <>
                <p className="nhsuk-body">
                  The next post you entered is no longer valid against the
                  current programme details.
                </p>
                <button
                  type="button"
                  className="nhsuk-button"
                  onClick={onEditProposed}
                >
                  Edit next post
                </button>
              </>
            )}
          </section>
        </>
      )}
    </>
  );
};
