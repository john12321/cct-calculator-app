# CCT Calculator: Calculation Reference

A reference for how this calculator works internally, and where each piece of
logic maps back to the original Excel sheet it's based on.

> Sibling document: [`READ_ME.md`](READ_ME.md) holds the original
> high-level product spec for the build. This file is the deeper
> implementation/Excel-mapping reference.

---

## 1. Source: NHS North West Training End Date Calculator v2.17 (Excel)

All specialty data and most of the calculation logic in this app are derived
from an Excel sheet titled **"Training End Date Calculator v2.17"**. Thanks to Ashley Barrett (NW Programme Support Manager) for sharing this unprotected workbook. The workbook has two sheets that matter:

| Sheet        | Purpose                                                                                                                                                                                                      |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Lists`      | Reference data: 173 specialties with their school, dual/triple-CCT flag, default programme length, entry grade, optional 24-month grade, and additional info. Also the Start Grade dropdown list (column M). |
| `Calculator` | The user-facing calculator. Has the programme inputs (specialty, start date, start grade, length) and a long worked-out table of grades, end dates and accruals (rows 9-17 and rows 23-46).                  |

The columns we use from the `Lists` sheet:

| Column | Header          | What it is                                                       | Where it ends up in this app                               |
| ------ | --------------- | ---------------------------------------------------------------- | ---------------------------------------------------------- |
| C      | Specialties     | Programme name                                                   | `Specialty.name`                                           |
| D      | School          | Grouping (e.g. "Medicine", "Surgery")                            | `Specialty.school` (used for the dropdown's group headers) |
| E      | Dual/Triple     | "Dual-CCT", "Triple CCT", or blank                               | `Specialty.dual`                                           |
| F      | Length (months) | Default programme length                                         | `Specialty.lengthMonths`                                   |
| G      | 24 months       | The grade-year (if any) that lasts 24 months instead of 12       | `Specialty.twentyFourMonthGrade`                           |
| H      | Entry Grade     | The starting grade for this programme (e.g. "ST3", "CT1", "FY1") | `Specialty.entryGrade`                                     |
| I      | Additional info | Free-text note shown to the user                                 | `Specialty.info`                                           |
| M      | Start grade     | Dropdown values: FY1, FY2, CT1-CT4, ST1-ST9                      | `TRAINING_GRADES` (used as the override dropdown)          |

All of this is extracted once and lives in [`specialties.ts`](specialties.ts).
If the Excel sheet changes, re-extract that file rather than editing it by
hand.

---

## 2. Data model overview

Four central types power the whole calculator. They live in
[`calculationTypes.ts`](calculationTypes.ts):

| Type               | What it represents                                                                                                                                 |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ProgrammeDetails` | The user's programme: specialty, start date, baseline length, start grade, and optional training-time adjustments with required reasons when used. |
| `PastChange`       | A historical LTFT period or absence (OOPC, parental, sickness, etc.).                                                                              |
| `ProposedChange`   | The "next post" the user wants the project completion date for. Either a full-time post or an LTFT post.                                           |
| `Specialty`        | Reference data from the Excel `Lists` sheet (in [`specialties.ts`](specialties.ts), distinct from `calculationTypes.ts`).                          |

---

## 3. Programme details

The form for these fields lives in
[`ProgrammeDetailsSection.tsx`](../components/ProgrammeDetailsSection.tsx).

### 3.1 Specialty

The user picks from 173 specialties using a custom **type-to-filter combobox**
([`SpecialtyCombobox.tsx`](../components/SpecialtyCombobox.tsx)). The dropdown
is grouped by School with sticky headers, and each option shows the Dual-CCT
or Triple-CCT marker if applicable.

The combobox is a custom W3C ARIA combobox rather than a native `<select>` or
`<datalist>` because:

- 173 entries are awkward in a native `<select>` (no real search on most
  browsers).
- `<datalist>` is rendered fully by the OS on mobile (black background,
  fullscreen-ish picker that obscures the input).

### 3.2 Programme start date

Plain date input. Acts as the reference point for every other calculation.

### 3.3 Programme length

When a specialty is picked, the **default length** from `Specialty.lengthMonths`
auto-fills. The field is read-only, with a hint
("Default for X is N months.").

This remains the baseline programme length. Changes to the required training
duration are recorded explicitly under **Other training time adjustments**,
so summaries and exports can state why the CCT date differs from the
specialty default.

### 3.4 Start grade

In the original Excel this is `Calculator!B10`, and the formula is:

```
=IF(ISBLANK(B4), " ", XLOOKUP(B4, Lists!C:C, Lists!H:H, " ", 0, 1))
```

i.e. When you pick a specialty, the cell auto-fills with that
specialty's entry grade (Lists column H). The user can override it because the
cell also has a data-validation dropdown sourced from `Lists!M`.

This app does the same:

- Picking a specialty auto-fills the start grade from `Specialty.entryGrade`.
- A read-only text field shows the value with hint "Default for X is Y."
- "I am overriding default start grade because..." swaps the field to a
  `<select>` of all training grades (FY1, FY2, CT1-CT4, ST1-ST9, DFT).
- The view-mode shows "(overridden — default X)" annotation when applicable.
- A reason field is required when the start grade override checkbox is checked,
  and is shown with the changed grade in the summary and CSV export.

#### What do the grades mean?

Foundation and core training feed into specialty training. A typical career (to the best of my limited knowledge!)
looks like:

```
FY1 → FY2     (Foundation, 24 months)
CT1 → CT2 [→ CT3]     (Core training)        ─┐
                                              ├─→ ST3/ST4 → ST5 → ... → ST7/ST8  (Higher specialty training)
ST1 → ST2     (Run-through specialty)        ─┘
```

Each programme in our specialty list is **one** of those stages, with its own
entry grade. So:

- _Foundation_ starts at **FY1**.
- _ACCS / Core medical / Core surgical / Core anaesthetics / Core psychiatry_
  programmes start at **CT1**.
- _GP, Paediatrics, Ophthalmology, Obs & Gynae_ and `(run-through)` variants
  start at **ST1** (post-foundation, no core training).
- _Cardiology, Acute internal medicine, Geriatrics_ and most mainstream
  specialties start at **ST3** or **ST4** (post-core).

Again, as far as I know, a Foundation doctor does **not** always begin at CT1 — they begin at FY1.
Where they go next depends on the next programme they choose.

### 3.5 Other training time adjustments

The **Other training time adjustments** subsection separates programme-level
adjustments from the core programme inputs and provides space for later Excel
features.

The optional **"Add additional training time"** checked checkbox reveals a months input
for programme-level extensions, for example extra training required following
an ARCP outcome. This is stored as `ProgrammeDetails.additionalMonths`,
defaulting to `0`, with an `additionalMonthsNotes` reason required whenever
additional time is recorded. Stored values are validated from `0` to `24`
months, matching Excel validation for `I9:I10`; when the optional checkbox is
checked in the form, a positive value is required.

The optional **"Add accelerated training time (reduce programme length)"**
checkbox captures recognised prior learning or other approved reductions in
training time. This is stored as `ProgrammeDetails.acceleratedMonths`,
defaulting to `0`, with an `acceleratedMonthsNotes` reason required whenever
accelerated time is recorded. Stored values are validated from `0` to `12`
months, following Excel's on-screen prompt for `I11`; when the optional
toggle is used in the form, a positive value is required.

The optional **"Set an 18-month final year"** checkbox records a specialty whose
final grade uses 18 months rather than 12, for example intensive care medicine
with a dual specialty. The user selects the final grade and enters a required
reason; these are stored as `eighteenMonthFinalGrade` and
`eighteenMonthFinalGradeNotes`.

The optional **"Skip one grade year"** checkbox records a grade which should be
omitted from the displayed progression. The user selects the skipped grade
and enters a required reason; these are stored as `skippedGrade` and
`skippedGradeNotes`.

The original programme length and original CCT date remain visible as the
baseline. When additional or accelerated training time is recorded, the
summary also shows an **Adjusted full-time CCT date** with an explanation that
it reflects those duration adjustments.

Both adjustment inputs must contain a positive number and a reason when their
toggle is selected, and the number may use at most 1 decimal place. The net
adjusted duration:

```
Programme length + additional training time - accelerated training time
```

must remain greater than zero. Reasons do not affect the calculation; they
are shown alongside their adjustment in the saved programme details, summary
page, and CSV export so the justification for an adjusted date remains
visible.

The 18-month final year is different: it changes the grade progression table
but not the programme duration or adjusted CCT date. The extra 6 months are
already contained within the specialty's baseline length, as in the workbook.
Skipping a grade year also changes only the displayed progression; any
shorter programme duration must be entered separately as accelerated time.

---

## 4. Past changes

Past changes are completed LTFT periods or absences the user has already had.
They live in [`PastChangeForm.tsx`](../components/PastChangeForm.tsx) and
[`PastChangesList.tsx`](../components/PastChangesList.tsx); types are in
[`calculationTypes.ts`](calculationTypes.ts).

### 4.1 Types

| Type        | Label                         | WTE for accrual             |
| ----------- | ----------------------------- | --------------------------- |
| `LTFT`      | Less Than Full-time           | User-specified WTE % (1–99) |
| `OOPC`      | Out of Programme Career Break | 0%                          |
| `OOPP`      | Out of Programme Pause        | 0%                          |
| `OOPE`      | Out of Programme Experience   | 0%                          |
| `PARENTAL`  | Parental Leave                | 0%                          |
| `SICKNESS`  | Sickness                      | 0%                          |
| `UNPAID`    | Unpaid Leave                  | 0%                          |
| `SHIELDING` | COVID-19 Shielding            | 0%                          |
| `PHASED`    | Phased Return                 | 0%                          |

Only LTFT contributes a non-zero WTE fraction; every absence counts as 0%.

### 4.2 The WTE accrual model

Per the original spec (READ_ME.md):

```
Total WTE time completed = Σ(Calendar time × WTE)
Training time remaining  = (Programme length + additional training time − accelerated training time) − Total WTE time completed
```

The "implicit 100% gap" rule: any calendar time between programme start and
the proposed change start that is **not** covered by a recorded past change is
assumed to be normal full-time training at 100% WTE. The user only has to
record changes (LTFT periods, absences), not the in-between full-time work.
This differs from the Excel sheet, where the user types every period
(including full-time) into the rows 24–46 table.

All completed time before the proposed next post, including implicit
full-time gaps, is converted from calendar days to months using Excel's
historical-period convention of `365 / 12` days per month. Forward projection
from the next-post start continues to use `30.4` days per month, matching
Excel's separate `I47` projection formula.

### 4.3 Validation

Performed in [`validation.ts`](validation.ts) on every "Add change" or "Save
changes" click, **and** re-run on every render of the page so an upstream
change (e.g. adding accelerated training time) flags any now-invalid past
change.

Rules:

- Start date and end date are required.
- Start ≤ end.
- Start cannot be in the future.
- End cannot be in the future.
- Start cannot be before the programme start date.
- End cannot be after the applicable full-time programme end date (programme
  start + (length + additional training time − accelerated training time) ×
  30.4 days).
- LTFT WTE must be a whole number between 1 and 99.
- No overlap with any other past change.

Regression tests cover adjacent and overlapping periods, LTFT WTE boundaries,
and absence entries that correctly contribute 0% WTE without needing a WTE
value.

---

## 5. Proposed change (Next post)

Lives in [`ProposedChangeForm.tsx`](../components/ProposedChangeForm.tsx).

### 5.1 Two kinds

| Kind        | Meaning        | WTE used in formula         |
| ----------- | -------------- | --------------------------- |
| `FULL_TIME` | Full-time post | 100%                        |
| `LTFT`      | LTFT post      | User-specified WTE % (1–99) |

The proposed change only models a return-to-work post, not an absence. This
keeps the projection formula well-defined (you can't divide by a 0% WTE).

### 5.2 Validation

- Start date required.
- Start ≥ programme start.
- Start ≤ the applicable full-time programme end (programme start +
  (length + additional training time − accelerated training time) × 30.4
  days).
- Start strictly after the latest past change's end date.
- LTFT WTE: whole number 1–99.

---

## 6. Projected completion date

The headline output of the calculator: when will this training programme
finish, given everything that has happened and the planned next post?

From the spec ([`READ_ME.md`](READ_ME.md)):

```
New completion date = Proposed start + Months remaining × (1 / Proposed WTE) × 30.4
```

Where `Months remaining = (Programme length + additional training time −
accelerated training time) − Total WTE time completed`.

Implemented in [`calculations.ts`](calculations.ts) as
`projectedCompletionDate(proposed, monthsRemaining)`, with the WTE accrual
computed by `computeWteAccrual(programme, pastChanges, proposed.startDate)`.

The workbook uses two closely related month-to-day conventions:

| Calculation area                                           | Excel workbook                   | This app                         | Status  |
| ---------------------------------------------------------- | -------------------------------- | -------------------------------- | ------- |
| Completed periods entered in the training grid (`F24:G46`) | `(end - start + 1) / (365 / 12)` | `(end - start + 1) / (365 / 12)` | Aligned |
| Future projection after recorded training (`I47`)          | `months remaining / WTE * 30.4`  | `months remaining / WTE * 30.4`  | Aligned |

In [`calculations.ts`](calculations.ts), `COMPLETED_PERIOD_DAYS_PER_MONTH` is
`365 / 12` for completed historical accrual and `DAYS_PER_MONTH` remains
`30.4` for programme-end and future projection formulas. Comparison tests
demonstrate why both are needed: a five-year period at 50% LTFT changes the
projected full-time completion date by one day compared with the former
all-`30.4` implementation, and a three-year absence followed by a 50% LTFT
next post also changes the projected date by one day.

---

## 7. Grade progression

The original Excel sheet computes, for each year of training, the grade the
doctor is in and the calendar date that grade-year ends. Rows 9–17 of the
Calculator sheet hold this: column K is the grade, column L is the end date.

This app produces the same in [`grades.ts`](grades.ts), rendered by
[`GradeTable.tsx`](../components/GradeTable.tsx).

### 7.1 Year-by-year grade (Excel K9–K17)

Excel splits the start grade into a prefix and a year-number:

```
D10 = MID(B10, 1, 2)   // "ST", "CT", "FY"
D11 = MID(B10, 3, 1)   // "1", "3", "4"

K9  = D10 & (D11 + 0 + adjustments)  // year 1
K10 = D10 & (D11 + 1 + adjustments)  // year 2
K11 = D10 & (D11 + 2 + adjustments)  // year 3
...
```

So if the start grade is "ST3", the year-1 grade is `ST3`, year-2 is `ST4`,
year-3 is `ST5`, and so on. Each row's `IF (n ≤ I7, ...)` gate means a year
only appears if the programme is at least `n` months long.

Our implementation:

```ts
const parsed = parseGrade(programme.startGrade); // { prefix: "ST", year: 3 }
// for year N (1-indexed)
const grade = `${parsed.prefix}${parsed.year + (yearNumber - 1)}`;
```

`DFT` (Dental Foundation Training) has no numeric suffix, so it's treated as
a single non-progressing grade — programmes that use it are only 12 months
long anyway.

When a skipped grade is selected, the implementation first calculates this
ordinary grade, compares it with `skippedGrade`, and applies a carried `+1`
offset to the displayed grade from the matching row onwards. This mirrors
Excel's `N` and `O` helper columns without altering dates by itself.

### 7.2 Grade end date (Excel L9–L17)

The Excel formula is long but the idea is:

> For each year N, find the calendar date at which cumulative WTE-months reach
> N × 12, shifted by any training-time adjustments and any 24-month-grade
> extension.

In this app it becomes (see `dateAtCumulativeWteMonths` in
[`grades.ts`](grades.ts)):

1. Build a timeline of WTE-rated **segments** from programme start onwards:
   past changes at their actual WTE, gaps between them at 100%, then the
   proposed change extending forward at its WTE (or 100% if no proposed yet).
   Completed segments use `365 / 12`; projected segments use `30.4`, in line
   with the workbook's split between historical accrual and future
   extrapolation.
2. For each year N, walk the segments accumulating WTE-months until the
   running total reaches that year's adjusted threshold.
3. Interpolate the calendar date at which the threshold is hit. For a
   calculated grade date, retain parity with the Excel doc by truncating the
   fractional serial-day result: in code this is
   `startDate + Math.floor(months × daysPerMonth)` days.

For the ordinary case without a 24-month grade, the target is:

```
N × 12 + additional training time - accelerated training time
```

Additional time therefore shifts each displayed grade end date later;
accelerated time shifts it earlier. The final threshold is wide but is capped at the net
adjusted programme duration, while the standard specialty length continues
to determine which grade rows exist.

If an 18-month final grade is selected, its own target includes another `+ 6`,
and the following row's appearance gate includes that preceding `+ 6`. This
uses part of the existing programme duration for the selected final grade and
suppresses the otherwise-following grade row.

#### Deliberate workflow difference from Excel

Excel stores calculated grade dates as fractional date serials and displays
the whole-date portion. The app matches this presentation by using
`Math.floor` for calculated grade-date interpolation. This matters because a
blanket one-day adjustment is not correct: for a `2026-01-01` start, the
displayed 12- and 24-month dates already fall on `2026-12-31` and
`2027-12-31`, while the 36-month date is `2028-12-30`.

One workflow difference remains: Excel extrapolates from the most recent
non-empty WTE in its free-form training table, whereas this app uses the
proposed change's WTE if set, otherwise 100%. The proposed change in this app
fulfils the same practical role for its simpler exception-based workflow.
Tests cover both the projected whole-date truncation sequence and a mixed
absence/LTFT history followed by a proposed full-time post.

---

## 8. The +12 (24-month grade) special case

Affects 3 specialties in the EM DRE-EM family.

### 8.1 What it does

In DRE-EM training, the **ST3 year lasts 24 months instead of 12** —
the doctor stays at ST3 for two years, then progresses through subsequent
grades normally. The standard programme length stays the same (60 / 72 / 90
months depending on dual variant), so without any separate training-time
adjustments the doctor will finish one grade lower than they otherwise would.

Specialties in this group (per `Lists!G`):

| Specialty                                                    | Entry grade | 24-month grade | Programme length |
| ------------------------------------------------------------ | ----------- | -------------- | ---------------- |
| Emergency medicine DRE-EM                                    | ST3         | **ST3**        | 60 months        |
| Emergency medicine DRE-EM with Intensive Care Medicine       | ST3         | **ST3**        | 90 months        |
| Emergency medicine DRE-EM with Paediatric Emergency Medicine | ST3         | **ST3**        | 72 months        |

### 8.2 Excel implementation

| Cell / range | Formula                                                             | Purpose                                                                               |
| ------------ | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `I17`        | `=XLOOKUP(B4, Table2[Specialties], Table2[24 months], "N/A", 0, 1)` | Looks up the 24-month grade for the chosen specialty.                                 |
| `Q9`         | `=IF(K9 = $I$17, 12, 0)`                                            | +12 for year 1 if year 1's grade matches the 24-month grade.                          |
| `Q10`        | `=IF(K10 = $I$17, 12, 0 + Q9)`                                      | +12 if year 2 matches, **or** carry-forward from year 1.                              |
| `Q11`–`Q17`  | same pattern                                                        | Cascading +12 through subsequent years.                                               |
| `K10`–`K17`  | `=IF(13 + P9 + Q9 ≤ I7, ..., " ")` etc.                             | Year N's appearance gate. Once carry-forward kicks in, this can suppress later years. |
| `L9`–`L17`   | threshold includes `+ Q_N`                                          | The year's WTE end-date threshold shifts by the accumulated +12.                      |

### 8.3 Worked example: Emergency medicine DRE-EM, 60 months, start ST3

| Year | Grade | This year's +12? | Carry-in | Threshold = N·12 + carry + this | Gate = (N−1)·12 + 1 + carry           |
| ---- | ----- | ---------------- | -------- | ------------------------------- | ------------------------------------- |
| 1    | ST3   | **+12**          | 0        | 12 + 0 + 12 = **24**            | 1 ≤ 60 ✓                              |
| 2    | ST4   | —                | 12       | 24 + 12 + 0 = **36**            | 13 + 12 = 25 ≤ 60 ✓                   |
| 3    | ST5   | —                | 12       | 36 + 12 + 0 = **48**            | 25 + 12 = 37 ≤ 60 ✓                   |
| 4    | ST6   | —                | 12       | 48 + 12 + 0 = **60**            | 37 + 12 = 49 ≤ 60 ✓                   |
| 5    | ST7   | —                | 12       | —                               | 49 + 12 = 61 > 60 ✗ — year suppressed |

The user sees 4 rows in the grade table, with ST3 lasting 24 months and a
final grade of ST6 (not ST7).

### 8.4 Our implementation

In [`grades.ts`](grades.ts):

```ts
let carriedExtension = 0;
let previousEighteenMonthExtension = 0;
let skippedGradeOffset = 0;
for (let yearNumber = 1; yearNumber <= maxYears; yearNumber += 1) {
  // gate
  const gate =
    (yearNumber - 1) * 12 +
    1 +
    previousEighteenMonthExtension +
    carriedExtension;
  if (gate > programme.lengthMonths) {
    previousEighteenMonthExtension = 0;
    continue;
  }

  // ordinary and displayed grade for this year
  const ordinaryGrade = parsed
    ? `${parsed.prefix}${parsed.year + yearNumber - 1}`
    : programme.startGrade;
  if (
    parsed !== null &&
    programme.skippedGrade !== "" &&
    ordinaryGrade === programme.skippedGrade
  ) {
    skippedGradeOffset = 1;
  }
  const grade = parsed
    ? `${parsed.prefix}${parsed.year + yearNumber - 1 + skippedGradeOffset}`
    : programme.startGrade;

  // +12 if this year's grade matches the specialty's 24-month grade
  const isTwentyFourMonth =
    twentyFourMonthGrade !== null && grade === twentyFourMonthGrade;
  const thisYearExtension = isTwentyFourMonth ? 12 : 0;
  const finalYearExtension =
    grade === programme.eighteenMonthFinalGrade ? 6 : 0;

  // WTE-month threshold for this year-end
  const targetMonths = Math.min(
    yearNumber * 12 +
      carriedExtension +
      thisYearExtension +
      finalYearExtension +
      programme.additionalMonths -
      programme.acceleratedMonths,
    programmeAdjustedLengthMonths(programme)
  );

  const endDate = dateAtCumulativeWteMonths(segments, targetMonths);
  rows.push({
    yearNumber,
    grade,
    endDate,
    extendedToTwentyFourMonths: isTwentyFourMonth
  });

  previousEighteenMonthExtension = finalYearExtension;
  carriedExtension += thisYearExtension;
}
```

Key behaviour:

- The match is on **grade name**, not year position. If the user overrides the
  start grade (e.g. to ST5), the year-by-year grades may never produce "ST3",
  so the +12 never triggers. This is intentional and matches Excel.
- When a skipped grade is selected, the ordinary unadjusted grade starts the
  carried `+1` offset and the resulting displayed grade is used for the
  24-month and 18-month rule checks. For example, if `ST5` is skipped and
  the resulting displayed `ST6` is selected as an 18-month final year, the
  `ST6` row receives the +6 extension.
- The `carriedExtension` accumulates as each 24-month year passes, so its
  effect persists for every subsequent year (both in the threshold and the
  appearance gate).
- The 18-month final-year `+6` is intentionally not carried: it is read by the
  selected row's threshold and the immediately following row's appearance
  gate, matching the workbook's shared `P9:P17` formula behaviour.
- Additional or accelerated training time shifts the WTE threshold for each
  existing grade row but does not create or remove rows. The +12 rule and the
  selected 18-month final-year rule can change row suppression.

Regression coverage includes an Emergency medicine DRE-EM progression in
which ST3 consumes 24 months and its carried extension determines the final
displayed grade and end date.

### 8.5 UI explanation

[`GradeTable.tsx`](../components/GradeTable.tsx) marks the affected row
inline with a `(24-month year)` tag next to the grade name, and renders an
NHS inset box under the table when any year is affected, explaining why the
schedule looks the way it does and what grade the programme finishes at.

---

## 9. Additional Excel logic

### 9.1 I9 — Additional training time (months) — implemented

User-entered. Excel adds it to every year's WTE-month threshold, extending
the whole programme. Common scenario: ARCP outcome adds 6 months for missed
competencies.

Implemented as `additionalMonths` with required `additionalMonthsNotes` when
used on `ProgrammeDetails`, entered behind a checkbox in the programme details form. It
increases the required training total for the projected completion date,
extends the valid date range for recorded changes, and is added directly to
each grade threshold in `grades.ts` without creating an extra grade row.

Excel validation for `I9:I10` accepts values from `0` to `24` months. The app
now validates that same stored range and presents `24` as the maximum in the
programme-details input. Because the input is behind an optional checkbox, the
form is required once additional time is selected.

### 9.2 I11 — Accelerated training time (months) — implemented

User-entered. Excel subtracts it from every year's threshold — used for
recognised prior learning that shortens training.

Implemented as `acceleratedMonths` with required `acceleratedMonthsNotes` when
used on `ProgrammeDetails`, entered behind a checkbox in the programme details form. It
reduces the required training total for the projected completion date,
shortens the valid date range for recorded changes, and is subtracted directly
from each grade threshold in `grades.ts` without suppressing a grade row.

The Excel source is internally inconsistent for this input: its on-screen
prompt says a maximum of `12` months, while the data-validation rule for
`I11:I12` accepts values from `0` to `36` months. The app follows the
user-facing prompt: stored accelerated time is validated from `0` to `12`
months and the programme-details input presents `12` as its maximum. Because
the input is behind an optional checkbox, the form field is required
once accelerated time is selected.

### 9.3 P9–P17 — +6 for an 18-month final year — implemented

For triple-CCT specialties (e.g. ICM with a dual specialty), the final year
can be 18 months long instead of 12. The user picks **which** grade-year gets
the +6 from a dropdown (Excel cell K20).

Verified directly against `Training End Date Calculator v2.17 - unprotected.xlsx`:

| Cell / range | Formula / behaviour                         | Purpose                                                               |
| ------------ | ------------------------------------------- | --------------------------------------------------------------------- |
| `K20`        | User-entered final grade                    | Identifies the grade which lasts 18 months.                           |
| `P9:P17`     | Shared formula `=IF(K[row]=$K$20,6,0)`      | Applies +6 only on the selected final-grade row.                      |
| `K10:K17`    | Gate includes the preceding row's `P` value | Suppresses the following grade when the final grade has consumed +6.  |
| `L9:L17`     | Threshold includes that row's `P` value     | Moves the selected final grade's end-date threshold six months later. |
| `I13`        | `=I7+I9-I11`                                | Confirms +6 is not added to total training duration or the CCT date.  |

Implemented as `eighteenMonthFinalGrade` with required
`eighteenMonthFinalGradeNotes` when selected on `ProgrammeDetails`, entered
behind a checkbox in the programme details form. In `grades.ts`, the selected
row receives a 6-month threshold extension and its immediately following row
uses the preceding +6 in its visibility gate, matching the workbook. The
grade table marks and explains the 18-month final year; summaries and CSV
export surface the selected grade and reason without presenting it as an
adjusted CCT duration.

### 9.4 K50 and O9:O17 — skipping one grade year — implemented

The workbook includes an additional visible control below the grade table:

```
Select grade year to skip:
```

It is described in Excel as allowing **one full grade year** to be skipped,
for example in run-through OMFS where a doctor can move from ST1 to ST3 after
completion of core competencies. The workbook also reminds the user to
reduce programme length separately.

Verified Excel behaviour:

| Cell / range | Formula / behaviour                   | Purpose                                                                                       |
| ------------ | ------------------------------------- | --------------------------------------------------------------------------------------------- |
| `K50`        | User selects the grade year to skip   | Identifies the grade which should be omitted from subsequent grade display.                   |
| `N9:N17`     | Ordinary unadjusted grade progression | Provides the grade to compare with `K50`.                                                     |
| `O9`         | `=IF(N9=K50,1,0)`                     | Begins a one-grade numeric offset if the first ordinary grade is skipped.                     |
| `O10:O17`    | `=IF(N[row]=K50,1,O[previous row])`   | Carries the `+1` grade offset forward once the selected grade is reached.                     |
| `K9:K17`     | Grade number includes `+ O[row]`      | Displays the next grade in place of the skipped grade and all later grades one number higher. |

This does **not** automatically shorten CCT duration: as the workbook
instruction says, any shorter programme duration is entered separately
through accelerated training time (`I11`). This is implemented in the app as `skippedGrade` with
required `skippedGradeNotes`, entered behind a checkbox in programme details.
In `grades.ts`, the ordinary grade triggers a carried `+1` displayed-grade
offset; the table identifies the affected row and explains that dates are
unchanged unless accelerated time is recorded separately. Summaries and CSV
export surface the selected grade and reason.

App coverage for this control:

- `ProgrammeDetails` stores `skippedGrade` and `skippedGradeNotes`; the
  optional form checkbox requires both a selected grade and a reason.
- `computeGradeProgression` sets `skippedGradeBeforeThisRow` on the first
  affected display row so `GradeTable` can label where the omitted grade
  takes effect and render its explanatory inset text.
- Saved programme details, the calculation summary and CSV export all report
  the skipped grade and the entered reason.
- Unit tests verify the carried display offset, confirm that selecting a skip
  alone does not change end dates or adjusted length, enforce the required
  reason, and cover interaction with an 18-month displayed grade.

### 9.5 Grade-lookup branch (L formula Branch B) — intentionally not modelled

In Excel, if the training table at rows 24–46 contains a row tagged with a
specific grade name, the L formula uses that row's recorded end date for the
matching grade-year instead of extrapolating.

This **doesn't apply to our current model** because past changes are typed by
absence/LTFT (e.g. `LTFT`, `OOPC`), not by grade name. `GradeTable` always
computes end dates by walking the WTE-rated segments.

#### Verified workbook dependency scope

The case for reproducing the free-form Excel grid is limited by what its label
column actually drives. Re-inspection of
`Training End Date Calculator v2.17 - unprotected.xlsx` found:

| Grid input                                                   | Workbook formula use                                                     | Calculation consequence                                                                                    |
| ------------------------------------------------------------ | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `A24:A46` Grade / Period Type, validated from `Lists!K2:K55` | `L9:L17` use `XLOOKUP("*"&K[row]&"*", A24:A46, D24:D46, "N/A", 2, -1)`.  | For a completed matching grade, the displayed grade end date can come from the last matching recorded row. |
| `B24:B46` WTE percentage                                     | `G24:G46`, `I47` and the extrapolation branch of `L9:L17`.               | Affects WTE accrual and the future completion projection.                                                  |
| `C24:D46` period dates                                       | `F24:G46`, `G47`, `I47`, `B13` and `L9:L17`.                             | Affects calendar/WTE accrual, remaining training, projected completion and recorded grade-date lookup.     |
| `E24:E46` Counted as training?                               | `G24:G46` sets WTE months to zero unless the row is counted as training. | Affects completed WTE and projected completion.                                                            |

`A24:A46` therefore does **not** feed total WTE completed, training remaining,
or projected CCT date. Its formula value is confined to retrieving a recorded
end date for a matching displayed grade. The grade/period list is broad
enough to include named grades, variants such as `ST3 ACF`, `ST3 ACL` and
`ST3 additional training time`, as well as leave types.

#### What an expanded workflow would mean

The Excel training grid is a free-form timeline: a user can enter each
full-time, LTFT or non-training period and may associate a row with a named
grade. Where a grade-tagged row exists, Excel can treat its entered end date
as the grade end date rather than relying on extrapolation alone.

The web app deliberately asks for less data. A user records completed LTFT or
absence exceptions, any gaps are inferred as full-time training, and one next
post is used for the future projection. The app therefore says "tell me the
exceptions and I will calculate the timeline"; it does not currently let a
user supply an authoritative date for a particular grade.

An expanded workflow could introduce either or both of:

- **Manual grade end-date overrides**, where a user selects a grade such as
  `ST4`, records its confirmed end date and reason, and the displayed grade
  progression uses that entered date in place of the computed date.
- **Full timeline entry**, where a user records ordinary full-time posts as
  well as LTFT and absence periods, potentially with grade names, more closely
  reproducing Excel rows `24:46`.

Either option needs some more discussion: what should happen when a
manual date conflicts with the calculated WTE timeline, how overrides affect
subsequent grade dates and CCT projection, what evidence/reason is required,
and how the data should appear in summaries and exports.

#### Decision and trade-offs

There are advantages to full timeline entry:

- It can act as a fuller administrative history, recording ordinary
  full-time periods as well as exceptions.
- It can carry confirmed grade-period end dates and faithfully reproduce
  Excel's named-grade lookup display.
- It can represent complex grade-tagged history, including ACF/ACL or
  grade-specific additional training rows.
- It avoids inferring that all unentered gaps were full-time training.

There are also significant disadvantages:

- It asks users to enter ordinary periods that currently require no input,
  increasing time and opportunity for missing, overlapping or inconsistent
  records.
- It requires new data modelling, entry/edit screens, validation, conflict
  resolution and summary/export decisions.
- Grade labels add no accuracy to the primary CCT projection formula: dates,
  WTE and whether time counts as training are the inputs that drive that
  calculation.
- Replacing the separate Next post input with Excel-style last-WTE
  extrapolation would make the intended future scenario less explicit for
  users.

Current position: **do not implement mandatory full timeline entry** for now until we discuss the pros and cons some more.

The app instead displays a note with `GradeTable` wherever grade progression
is shown: grade end dates are calculated from the entered information and do
not replace confirmed grade-period dates held in an authoritative training
record. A future optional confirmed-grade-end-date override could be
considered only if that administrative requirement emerges (e.g. this app is to be used by TIS Admins etc. as the authoritative training record).

### 9.6 D16:D17 — additional training time awarded during core training

The workbook displays a field labelled **Additional Training Time Awarded
During Core Training** and validates an entry from `0` to `24` months or
`N/A`.

Re-verified directly against
`Training End Date Calculator v2.17 - unprotected.xlsx`:

| Item                         | Workbook evidence                                                                                                                                                 |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Display and input cells      | `A16:C17` is the merged label area; `D16:D17` is the merged input area, whose stored value is anchored at `D16`.                                                  |
| Data validation              | `D16:D17` uses `OR(AND(D16>=0,D16<=24),D16="N/A")`.                                                                                                               |
| Direct formula references    | None of the workbook's 133 stored worksheet formulas reference `D16` or `D17`.                                                                                    |
| Range or indirect references | No formula range contains `D16:D17`, no defined name points to it, and the workbook contains no `INDIRECT` or `OFFSET` formula that could retrieve it indirectly. |
| Related calculated totals    | Total and remaining training formulas use `I7+I9-I11` and `(I7+I9-I11)-G47`; grade date formulas reference `D24:D46` for the training grid, not `D16:D17`.        |

Therefore, in this workbook version the field is a recording/reporting input:
changing it does not alter the calculated CCT date, remaining training time,
or grade progression.

This is not present in the web app. It is a low-priority enhancement unless
administrative recording of the field is required for exported or printed
summaries.

---

## 10. Excel parity checkpoint and next steps

### 10.1 Confirmed in the web app

The following workbook behaviours have a corresponding implementation:

| Workbook capability                                                                                            | Web app status                                                                                                                             |
| -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Specialty lookup, school grouping, dual/triple marker, length, entry grade, additional info and 24-month grade | Implemented from all 173 `Lists` rows in `specialties.ts`; the workbook's `St4` entry is normalised to `ST4`.                              |
| Start-grade default and user override                                                                          | Implemented, with an added mandatory reason for auditability.                                                                              |
| Completed LTFT/absence recording and future completion projection                                              | Implemented through past changes and next post, using the web app's exception-based workflow and Excel's historical `365 / 12` conversion. |
| `I9` additional training time                                                                                  | Implemented, with mandatory reason and Excel-aligned `0..24` month validation.                                                             |
| `I11` accelerated training time                                                                                | Implemented, with mandatory reason and `0..12` month validation following Excel's on-screen prompt.                                        |
| `I17` / `Q9:Q17` 24-month grade rule                                                                           | Implemented for the three DRE-EM specialties.                                                                                              |
| `K20` / `P9:P17` 18-month final year rule                                                                      | Implemented, with mandatory reason and clear summary display.                                                                              |
| `K50` / `O9:O17` skip one grade year rule                                                                      | Implemented, with mandatory reason, carried display offset and clear summary display.                                                      |

### 10.2 Deliberate workflow differences

These differences are intentional unless product requirements change:

| Excel workflow                                                                                        | Web app approach                                                                                                                                        | Implication                                                                           |
| ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Rows `24:46` let users type every full-time, LTFT or non-training period and may include grade names. | Users record only completed LTFT/absence exceptions; gaps are treated as full-time, followed by one next-post projection.                               | Faster data entry, but not a cell-for-cell replacement for arbitrary Excel timelines. |
| Grade end dates can use a matching named-grade row from the training grid.                            | Grade end dates are derived by walking WTE segments, with a user-facing note to check confirmed completed-grade dates against the authoritative record. | A manual grade end-date override would be a new feature.                              |
| Excel can extrapolate from the most recent WTE row in its free-form grid.                             | The web table extrapolates from the proposed next post, or 100% if none is recorded.                                                                    | Equivalent intent within the simpler workflow, but not arbitrary-row entry parity.    |

### 10.3 Prioritised next steps

| Priority                                 | Change                                                                                                                                           | Why it matters                                                                                                                           | Likely implementation area                                           |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| 1 - optional administrative enhancement  | Decide whether to record Excel's `D16:D17` additional training time awarded during core training field.                                          | Verified not to affect v2.17 workbook calculations, but may matter for reporting or record completeness.                                 | Programme details and summary/export only unless requirements change |
| 2 - optional expanded workflow, deferred | Consider an optional confirmed named-grade/end-date override only if a requirement emerges; do not add mandatory full timeline entry at present. | Workbook investigation confirms grade labels affect displayed grade end dates, not projected CCT; the app now disclaims this difference. | New product/design work only if requirements change                  |

### 10.4 Release position

The web app implements the primary CCT projection workflow and the identified
duration/final-year/skip-grade adjustments added for this release, with the
identified numeric accrual alignment resolved. The remaining items above are
optional reporting or workflow expansions rather than identified formula
parity gaps.

---

## 11. File map

| Path                                                   | What it holds                                                                                                                                 |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| [`calculationTypes.ts`](calculationTypes.ts)           | Core types: `ProgrammeDetails`, `PastChange`, `ProposedChange`, change-type union                                                             |
| [`calculations.ts`](calculations.ts)                   | Historical `COMPLETED_PERIOD_DAYS_PER_MONTH`, projected `DAYS_PER_MONTH`, WTE helpers, completion-date and duration helpers                   |
| [`grades.ts`](grades.ts)                               | `parseGrade`, `gradeForYearOffset`, segment-builder, `dateAtCumulativeWteMonths`, `computeGradeProgression`                                   |
| [`specialties.ts`](specialties.ts)                     | `Specialty` type, 173-entry `SPECIALTIES` array, `findSpecialty`, `specialtiesGroupedBySchool`, `TrainingGrade` / `TRAINING_GRADES`           |
| [`calculationTypeLabels.ts`](calculationTypeLabels.ts) | Display labels for each change type                                                                                                           |
| [`validation.ts`](validation.ts)                       | `validateProgrammeDetails`, `validatePastChange`, `validateProposedChange`                                                                    |
| `../components/ProgrammeDetailsSection.tsx`            | Programme details form (specialty, dates, baseline length, start grade, training-time, final-year and skipped-grade adjustments with reasons) |
| `../components/SpecialtyCombobox.tsx`                  | Custom W3C ARIA combobox for picking specialty                                                                                                |
| `../components/PastChangeForm.tsx`                     | Add/edit a past change                                                                                                                        |
| `../components/PastChangesList.tsx`                    | Table of past changes with Edit/Remove                                                                                                        |
| `../components/ProposedChangeForm.tsx`                 | Next-post form                                                                                                                                |
| `../components/NextPostSummary.tsx`                    | Read-only next-post table (Type / Start / WTE / Projected completion)                                                                         |
| `../components/GradeTable.tsx`                         | Year-by-year grade progression with end dates and special-duration/skipped-grade explanations                                                 |
| `../components/CalculationSummary.tsx`                 | The full summary block, including adjustments and explanatory notes, used on the summary page                                                 |
| `../components/StepIndicator.tsx`, `BackLink.tsx`      | Wizard chrome                                                                                                                                 |
| `../pages/SetupPage.tsx`                               | The single setup page (programme details, grade progression, past changes, next post)                                                         |
| `../pages/SummaryPage.tsx`                             | The final summary page with CSV / print export, including recorded adjustments and override notes                                             |
| `../App.tsx`                                           | 2-step wizard (Setup → Summary)                                                                                                               |
