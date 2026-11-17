import { useState, type FC } from "react";
import { Table } from "nhsuk-react-components";
import {
  additionalTrainingTimeIssues,
  MAX_ADDITIONAL_TRAINING_TIME_ENTRIES,
  programmeGrades,
  totalAdditionalMonths,
  type AdditionalTrainingTime,
  type ProgrammeDetails
} from "../core";
import { formatMonths } from "../utils/format";
import { scrollTo } from "../utils/scroll";
import { AdditionalTrainingTimeForm } from "./AdditionalTrainingTimeForm";

type AdditionalTrainingTimeSectionProps = {
  programme: ProgrammeDetails;
  onChange: (programme: ProgrammeDetails) => void;
  onFormOpenChange: (open: boolean) => void;
};

export const AdditionalTrainingTimeSection: FC<
  AdditionalTrainingTimeSectionProps
> = ({ programme, onChange, onFormOpenChange }) => {
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const entries = programme.additionalTrainingTime;
  const grades = programmeGrades(programme);
  // Note: grades no longer in the progression sort last.
  const gradeOrder = (grade: string) => {
    const index = grades.indexOf(grade);
    return index === -1 ? grades.length : index;
  };
  const sortedEntries = [...entries].sort(
    (a, b) => gradeOrder(a.grade) - gradeOrder(b.grade)
  );
  const issues = additionalTrainingTimeIssues(programme);
  const errorsById = Object.fromEntries(
    issues.map(issue => [issue.entry.id, issue.message])
  );
  const editingEntry = entries.find(entry => entry.id === editingId) ?? null;

  const openForm = (id: string | null) => {
    setEditingId(id);
    setFormOpen(true);
    onFormOpenChange(true);
    scrollTo({ id: "additional-training-time-form" });
  };

  const closeForm = () => {
    setEditingId(null);
    setFormOpen(false);
    onFormOpenChange(false);
    scrollTo({ id: "additional-training-time-section" });
  };

  const handleSave = (saved: AdditionalTrainingTime) => {
    const exists = entries.some(entry => entry.id === saved.id);
    onChange({
      ...programme,
      additionalTrainingTime: exists
        ? entries.map(entry => (entry.id === saved.id ? saved : entry))
        : [...entries, saved]
    });
    closeForm();
  };

  const handleRemove = (id: string) => {
    onChange({
      ...programme,
      additionalTrainingTime: entries.filter(entry => entry.id !== id)
    });
  };

  const addControl =
    entries.length < MAX_ADDITIONAL_TRAINING_TIME_ENTRIES ? (
      <button
        type="button"
        className="nhsuk-button nhsuk-button--secondary nhsuk-u-margin-top-3"
        onClick={() => openForm(null)}
      >
        Add additional training time
      </button>
    ) : (
      <div className="nhsuk-inset-text nhsuk-u-margin-top-3">
        <p>
          You have added the maximum of {MAX_ADDITIONAL_TRAINING_TIME_ENTRIES}{" "}
          additional training time entries. To add another, edit or remove an
          existing entry.
        </p>
      </div>
    );

  return (
    <section
      id="additional-training-time-section"
      className="nhsuk-u-margin-bottom-5"
    >
      <h3 className="nhsuk-heading-m nhsuk-u-color-blue">
        Additional training time
      </h3>
      <p className="nhsuk-body">
        Record any extra training time you have been given, for example after an
        ARCP outcome 3, against the grade it applies to. It makes that grade
        longer and moves later grades on. You can add time to as many grades as
        you need, up to 24 months in total.
      </p>

      {issues.length > 0 && (
        <div
          className="nhsuk-error-summary"
          aria-labelledby="additional-time-error-title"
          role="alert"
        >
          <h3
            className="nhsuk-error-summary__title"
            id="additional-time-error-title"
          >
            These entries are no longer valid against the current programme
            details
          </h3>
          <div className="nhsuk-error-summary__body">
            <ul className="nhsuk-list nhsuk-list--bullet nhsuk-error-summary__list">
              {issues.map(issue => (
                <li key={issue.entry.id}>
                  <strong>
                    {issue.entry.grade} ({formatMonths(issue.entry.months)})
                  </strong>{" "}
                  - {issue.message}
                </li>
              ))}
            </ul>
            <p className="nhsuk-u-margin-top-2">
              Edit or remove the affected entries to continue.
            </p>
          </div>
        </div>
      )}

      {entries.length === 0 ? (
        <p className="nhsuk-hint">No additional training time recorded.</p>
      ) : (
        <div className="table-wrapper">
          <Table>
            <Table.Head>
              <Table.Row>
                <Table.Cell>Grade</Table.Cell>
                <Table.Cell>Additional time</Table.Cell>
                <Table.Cell>Reason</Table.Cell>
                <Table.Cell aria-label="Actions" />
              </Table.Row>
            </Table.Head>
            <Table.Body>
              {sortedEntries.map(entry => {
                const error = errorsById[entry.id];
                return (
                  <Table.Row
                    key={entry.id}
                    style={error ? { backgroundColor: "#fdf1f1" } : undefined}
                  >
                    <Table.Cell>
                      {entry.grade}
                      {error && (
                        <span
                          className="nhsuk-u-margin-left-2"
                          style={{ color: "#d5281b", fontWeight: 600 }}
                        >
                          ⚠ invalid
                        </span>
                      )}
                    </Table.Cell>
                    <Table.Cell>{formatMonths(entry.months)}</Table.Cell>
                    <Table.Cell>{entry.notes}</Table.Cell>
                    <Table.Cell>
                      <div className="table-actions">
                        <button
                          type="button"
                          className="nhsuk-button nhsuk-button--secondary nhsuk-button--small"
                          onClick={() => openForm(entry.id)}
                          disabled={formOpen}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="nhsuk-button nhsuk-button--secondary nhsuk-button--small"
                          onClick={() => handleRemove(entry.id)}
                          disabled={formOpen}
                        >
                          Remove
                        </button>
                      </div>
                    </Table.Cell>
                  </Table.Row>
                );
              })}
              <Table.Row className="changes-total-row">
                <Table.Cell>
                  <strong>Total</strong>
                </Table.Cell>
                <Table.Cell>
                  <strong>
                    {formatMonths(totalAdditionalMonths(programme))}
                  </strong>
                </Table.Cell>
                <Table.Cell />
                <Table.Cell />
              </Table.Row>
            </Table.Body>
          </Table>
        </div>
      )}

      {formOpen ? (
        <AdditionalTrainingTimeForm
          key={editingId ?? "new"}
          formId="additional-training-time-form"
          programme={programme}
          editing={editingEntry}
          onSave={handleSave}
          onCancel={closeForm}
        />
      ) : (
        addControl
      )}
    </section>
  );
};
