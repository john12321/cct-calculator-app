# Completion of Training Date Calculator: Calculation Reference

A reference for how this calculator works internally, and where each piece of
logic maps back to the original Excel sheet it's based on.

> Related document: the root [`README.md`](../../README.md) describes the
> public app workflow. This file records the current implementation and policy
> decisions; where greater calculation detail is required, use this
> implementation/Excel-mapping reference.

The app now ships with two calculation modes selected by the user up-front on
a mode picker:

- **Quick mode** — the exception-based workflow. The user records completed
  or hypothetical completed LTFT periods and absences in one Changes section,
  with one optional LTFT change used to project the remaining training time;
  any unrecorded calendar gaps are inferred as full-time. Designed for
  resident doctors who want a projected Completion of Training Date with
  minimal data entry.
- **Full mode** — a contiguous-timeline workflow that mirrors the Excel
  workbook's `A24:E46` input grid. The user records every training, OOP and
  leave period as a connected sequence. Designed for admin staff building an
  authoritative training record.

Sections 1–9 describe the source data and calculation rules, with
mode-specific notes where the workflows differ. Section 10 records the
implemented parity position, OOP policy sources and remaining follow-up work;
section 11 maps the implementation files for both modes.

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

The central calculation types live in
[`calculationTypes.ts`](calculationTypes.ts):

| Type               | What it represents                                                                                                                                 |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CalculationMode`  | The selected workflow: `QUICK` or `FULL`.                                                                                                          |
| `ProgrammeDetails` | The user's programme: specialty, start date, baseline length, start grade, and optional training-time adjustments with required reasons when used. |
| `PastChange`       | A completed Quick-mode LTFT or absence period, including any OOPT/OOPR training-credit decision and optional LTFT remaining-time projection flag.  |
| `ProposedChange`   | The internally derived Quick-mode projection: either full-time or an LTFT WTE selected from a projected LTFT change.                               |
| `TrainingPeriod`   | A Full-mode contiguous timeline row: grade, OOP or leave, with training-credit and WTE fields where supported.                                     |
| `Specialty`        | Reference data from the Excel `Lists` sheet (in [`specialties.ts`](specialties.ts), distinct from `calculationTypes.ts`).                          |

---

## 3. Programme details

The form for these fields lives in
[`ProgrammeDetailsSection.tsx`](../components/ProgrammeDetailsSection.tsx).

### 3.1 Specialty

The user picks from 173 specialties using a progressively enhanced
**autocomplete select**
([`SpecialtyAutocompleteSelect.tsx`](../components/SpecialtyAutocompleteSelect.tsx)). A native
`<select>` with school `<optgroup>`s is rendered first as the fallback, then
enhanced with GOV.UK's `accessible-autocomplete` so users can type to filter or
open the full alphabetically sorted specialty list.

Once a specialty is selected, the form shows the long selected name and school
metadata in wrapped hint text below the control rather than forcing the input
itself to become multiline.

### 3.2 Programme start date

Date entry uses an NHS/GOV.UK-style day/month/year component
([`DateInput.tsx`](../components/DateInput.tsx)) rather than native
`<input type="date">`, because browser-native date controls vary in
appearance and behaviour. The component stores ISO `YYYY-MM-DD` values for the
calculation engine while presenting separate numeric day, month and year fields
to users.

The fields auto-advance focus from day to month, and from month to year, once
the user has entered the required two digits. Auto-advance is skipped during
delete/backspace edits so corrections remain under the user's control. Users
entering single-digit days or months can still tab or click to move on.

The programme start date acts as the reference point for every other
calculation.

### 3.3 Programme length

When a specialty is picked, the **default length** from `Specialty.lengthMonths`
auto-fills. The field is read-only, with a hint
("Default for X is N months.").

This remains the baseline programme length. Changes to the required training
duration are recorded explicitly under **Other training time adjustments**,
so summaries and exports can state why the Completion of Training Date differs from the
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
- "Check this box if you want to choose a different start grade" swaps the field to a
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

As far as I understand, a doctor in **Foundation** training is in **FY1** or **FY2**. That is a separate early stage from **Core** training, which starts at **CT1**. Different specialties then start at different points:

- some specialties begin after foundation, so they start in **CT1** (core training);
- some run-through specialties start directly in **ST1** after foundation, without a separate core stage;
- some specialties start later, in **ST3** or **ST4**, after core training has already been completed.

### 3.5 Other training time adjustments

The **Other training time adjustments** subsection separates programme-level
adjustments from the core programme inputs.

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

The original programme length and original Completion of Training Date remain visible as the
baseline. When additional or accelerated training time is recorded, the
summary also shows an **Adjusted programme end date before changes** with an explanation that
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
but not the programme duration or adjusted Completion of Training Date. The extra 6 months are
already contained within the specialty's baseline length, as in the workbook.
Skipping a grade year also changes only the displayed progression; any
shorter programme duration must be entered separately as accelerated time.

---

## 4. Quick-mode completed changes

Quick-mode completed changes are completed LTFT periods or absences. They may
also be hypothetical completed periods in the future for what-if scenarios.
They live in [`PastChangeForm.tsx`](../components/PastChangeForm.tsx) and
[`PastChangesList.tsx`](../components/PastChangesList.tsx); types are in
[`calculationTypes.ts`](calculationTypes.ts).

### 4.1 Types

| Type            | Label                         | WTE for accrual                                                                          |
| --------------- | ----------------------------- | ---------------------------------------------------------------------------------------- |
| `LTFT`          | Less Than Full-time           | User-specified WTE % (1–99)                                                              |
| `OOPT`          | Out of Programme Training     | 100% if marked counted as training, up to 12 months                                      |
| `OOPR`          | Out of Programme Research     | Prospectively approved Certificate of Completion of Training (CCT) credit % when counted |
| `OOPC`          | Out of Programme Career Break | 0%                                                                                       |
| `OOPP`          | Out of Programme Pause        | 0%                                                                                       |
| `OOPE`          | Out of Programme Experience   | 0%                                                                                       |
| `PARENTAL`      | Parental Leave                | 0%                                                                                       |
| `SICKNESS`      | Sickness                      | 0%                                                                                       |
| `ACCRUED_LEAVE` | Accrued annual leave          | 0%                                                                                       |
| `SHIELDING`     | COVID-19 Shielding            | 0%                                                                                       |
| `PHASED`        | Phased Return                 | 0%                                                                                       |

LTFT, counted OOPT and approved counted OOPR may contribute non-zero WTE
months. All other recorded Quick-mode change types consume calendar time but
contribute 0% WTE.

### 4.2 The WTE accrual model

The accrual model is:

```
Total WTE time completed = Σ(Calendar time × WTE)

Training time remaining  = (Programme length + additional training time − accelerated training time) − Total WTE time completed
```

The "implicit 100% gap" rule: any calendar time between programme start and
the projection start that is **not** covered by a recorded past change is
assumed to be normal full-time training at 100% WTE. The user only has to
record changes (LTFT periods, absences), not the in-between full-time work.
This differs from the Excel sheet, where the user types every period
(including full-time) into the rows 24–46 table.

Quick mode makes those inferred gaps visible on demand. The Changes table and
the final Summary completed-changes table both expose a **Show assumed
full-time periods** toggle when at least one gap exists. These inferred rows
are read-only, styled separately, labelled as not added by the user, and count
as 100% WTE training. When the rows are hidden, the tables show separate
totals for entered changes and for entered changes plus hidden assumed
full-time periods; when the rows are visible, one combined total is shown.
CSV export is unchanged for now and continues to export the entered Quick-mode
changes and derived projection rather than these display-only inferred rows.

All completed time before the projection start, including implicit
full-time gaps, is converted from calendar days to months using Excel's
historical-period convention of `365 / 12` days per month. Forward projection
from the projection start continues to use `30.4` days per month, matching
Excel's separate `I47` projection formula.

### 4.3 Validation

Performed in [`validation.ts`](validation.ts) on every "Add change" or "Save
changes" click, **and** re-run on every render of the page so an upstream
change (e.g. adding accelerated training time) flags any now-invalid past
change.

Rules:

- Start date is required.
- End date is required unless the row is an LTFT change marked to project
  remaining training.
- Start ≤ end.
- Start cannot be before the programme start date.
- Start and end cannot be after the current projected Completion of Training
  Date generated by changes that already finish before this change starts.
- LTFT WTE must be a whole number between 1 and 99.
- OOPT may be marked counted as training at fixed 100% for no more than 12
  months.
- OOPR may be marked counted as training only where it contributes to CCT and
  then requires a whole-number approved CCT credit percentage from 1 to 100.
- All other Quick-mode change types cannot be marked counted as training.
- Only one LTFT change can be marked to project remaining training.
- The projected LTFT change must be the latest change.
- No overlap with any other past change.

Regression tests cover adjacent and overlapping periods, LTFT WTE boundaries,
approved OOPT/OOPR accrual and absence entries that correctly contribute 0%
WTE without needing a WTE value.

---

## 5. Quick-mode projection

### 5.1 Two kinds

| Kind        | Meaning                                                                                                                      | WTE used in formula        |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| `FULL_TIME` | Default projection from the day after the latest completed change, or programme start when no changes exist.                 | 100%                       |
| `LTFT`      | Projection from the projected LTFT change's start date when it is open-ended, or the day after its end date when it has one. | Selected LTFT WTE % (1–99) |

The projection is derived by `deriveQuickProjection`. If no LTFT change is
marked for projection, Quick mode projects remaining training at full-time.
If an LTFT change is marked, that WTE is used for remaining training.

### 5.2 Validation

- Projection starts at programme start when there are no changes.
- Otherwise, the default full-time projection starts the day after the latest
  completed change.
- LTFT projection WTE comes from the single selected projected LTFT change.
- An open-ended projected LTFT change is not counted as completed historical
  time; it supplies the forward WTE from its start date.

---

## 6. Projected Completion of Training Date

The headline output of the calculator: when will this training programme
finish, given the recorded changes and the derived forward projection?

The Quick-mode projection formula is:

```
New Completion of Training Date = Projection start + Months remaining × (1 / Projection WTE) × 30.4
```

Where `Months remaining = (Programme length + additional training time −
accelerated training time) − Total WTE time completed`.

Implemented in [`calculations.ts`](calculations.ts) as
`projectedCompletionDate(proposed, monthsRemaining)`, with the WTE accrual
computed by `computeWteAccrual(programme, pastChanges, proposed.startDate)`.

This formula describes **Quick mode**, where the changes list derives the
forward WTE. In **Full mode**,
[`projectedCompletionDateForTimeline`](fullModeCalculations.ts) operates on
the contiguous `TrainingPeriod` timeline: a completed timeline that already
covers required WTE ends on its last recorded date; an under-covered completed
timeline projects forward from the following day at the latest recorded grade
WTE; and an open-ended project-forward grade period supplies its own forward
WTE.

Both modes **truncate** the projected day count to whole days with
`Math.floor`, matching Excel's fractional date-serial display — the same
convention used for calculated grade end dates (section 7.3). This keeps the
two engines in agreement. A parity regression test
([`modeParity.test.ts`](modeParity.test.ts)) runs equivalent scenarios —
including a sweep across programme lengths — through both engines and asserts
the projected dates match.

The workbook uses two closely related month-to-day conventions:

| Calculation area                                           | Excel workbook                   | This app                         | Status  |
| ---------------------------------------------------------- | -------------------------------- | -------------------------------- | ------- |
| Completed periods entered in the training grid (`F24:G46`) | `(end - start + 1) / (365 / 12)` | `(end - start + 1) / (365 / 12)` | Aligned |
| Future projection after recorded training (`I47`)          | `months remaining / WTE * 30.4`  | `months remaining / WTE * 30.4`  | Aligned |

In [`calculations.ts`](calculations.ts), `COMPLETED_PERIOD_DAYS_PER_MONTH` is
`365 / 12` for completed historical accrual and `DAYS_PER_MONTH` remains
`30.4` for programme-end and future projection formulas. Comparison tests
demonstrate why both are needed: a five-year period at 50% LTFT changes the
projected full-time Completion of Training Date by one day compared with the
former all-`30.4` implementation, and a three-year absence followed by a 50%
LTFT projection also changes the projected date by one day.

---

## 7. Grade progression

The original Excel sheet computes, for each year of training, the grade the
doctor is in and the calendar date that grade-year ends. Rows 9–17 of the
Calculator sheet hold this: column K is the grade, column L is the end date.

The shared grade-row logic lives in [`grades.ts`](grades.ts) and is rendered
by [`GradeTable.tsx`](../components/GradeTable.tsx). Quick mode calls
`computeGradeProgression`; Full mode calls
`computeGradeProgressionForTimeline` in
[`fullModeCalculations.ts`](fullModeCalculations.ts) so recorded grade rows
can supply Excel-style end dates.

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

Our implementation generates the same ordinary grade sequence, with one
deliberate guardrail described below:

```ts
const parsed = parseGrade(programme.startGrade); // { prefix: "ST", year: 3 }
// for year N (1-indexed)
const { grade } = gradeLabelForParsedGrade(parsed, yearNumber - 1);
```

`DFT` (Dental Foundation Training) has no numeric suffix, so it's treated as
a single non-progressing grade — programmes that use it are only 12 months
long anyway.

When a skipped grade is selected, the implementation first calculates this
ordinary grade, compares it with `skippedGrade`, and applies a carried `+1`
offset to the displayed grade from the matching row onwards. This mirrors
Excel's `N` and `O` helper columns without altering dates by itself.

### 7.2 Maximum generated specialty grade

The source workbook can mathematically concatenate grades beyond the official
list, for example `ST10`, when a long or shifted programme starts at `ST3`.
The web app does **not** automatically invent specialty training grades above
`ST9`.

Decision:

- `ST9` remains an allowed training grade in `TRAINING_GRADES`.
- Generated ST progression displays ordinary labels up to and including
  `ST9`.
- If the calculated progression would go past `ST9`, the row label becomes
  **"Additional training after ST9"** and `GradeTable` shows a warning that no
  grade label has been assigned automatically.
- Full mode can still record explicit `ST9` grade periods. The recorded-grade
  lookup can use those periods for the `ST9` row, but rows beyond that are not
  matched to an invented `ST10`.

Rationale and sources:

- The [GMC ARCP 2024/25 data collection instructions](https://www.gmc-uk.org/-/media/documents/arcp-outcomes---instructions-for-the-collection-of-arcp-data-2025-112338556.pdf)
  include `ST9` as a valid training level and state that GMC allows one
  additional training level for dual training programmes.
- The [GMC approved dual CCT pairings list, August 2024](https://www.gmc-uk.org/-/media/gmc-site/education/downloads/curricula/dual-specialty-pairing-website-master-28-08-24.pdf)
  includes several 8-year programmes and some intensive-care triple pairings
  with indicative lengths of 8.5-9.5 years, supporting the need to recognise
  late dual/triple-training progression.
- The [NHS Employers medical and dental pay circular](https://www.nhsemployers.org/system/files/2024-09/Pay-and-Conditions-Circular-MD-5-2024-R.pdf)
  lists pay scale codes to `ST8` / `SpR8`, which is a pay-code ceiling rather
  than a complete ARCP training-level list.

### 7.3 Grade end date (Excel L9–L17)

The Excel formula is long but the idea is:

> For each year N, find the calendar date at which cumulative WTE-months reach
> N × 12, shifted by any training-time adjustments and any 24-month-grade
> extension.

For calculated dates, this becomes (see `dateAtCumulativeWteMonths` in
[`grades.ts`](grades.ts)):

1. Build WTE-rated **segments** from programme start onwards. Quick mode uses
   recorded past changes, inferred 100% gaps and the derived projection. Full
   mode uses its entered contiguous training timeline and, where needed, a
   forward projection at the latest grade WTE. Completed segments use
   `365 / 12`; projected segments use `30.4`.
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

#### Mode-specific date source

Excel stores calculated grade dates as fractional date serials and displays
the whole-date portion. The app matches this presentation by using
`Math.floor` for calculated grade-date interpolation. This matters because a
blanket one-day adjustment is not correct: for a `2026-01-01` start, the
displayed 12- and 24-month dates already fall on `2026-12-31` and
`2027-12-31`, while the 36-month date is `2028-12-30`.

Quick mode does not capture named grade-period rows. It therefore calculates
grade end dates from its WTE segments and uses the derived projection as its
forward rate.

Full mode captures named grade periods. Once completed WTE reaches a grade
row's Excel threshold, `computeGradeProgressionForTimeline` uses the final
recorded period end date for the matching grade, reproducing the workbook's
`L9:L17` lookup branch. Dates not yet supported by recorded grade rows remain
calculated from the WTE-rated timeline.

Tests cover projected whole-date truncation, mixed Quick-mode history and the
Full-mode per-grade recorded-date switch.

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
increases the required training total for the projected Completion of Training Date,
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
reduces the required training total for the projected Completion of Training Date,
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

| Cell / range | Formula / behaviour                         | Purpose                                                                                 |
| ------------ | ------------------------------------------- | --------------------------------------------------------------------------------------- |
| `K20`        | User-entered final grade                    | Identifies the grade which lasts 18 months.                                             |
| `P9:P17`     | Shared formula `=IF(K[row]=$K$20,6,0)`      | Applies +6 only on the selected final-grade row.                                        |
| `K10:K17`    | Gate includes the preceding row's `P` value | Suppresses the following grade when the final grade has consumed +6.                    |
| `L9:L17`     | Threshold includes that row's `P` value     | Moves the selected final grade's end-date threshold six months later.                   |
| `I13`        | `=I7+I9-I11`                                | Confirms +6 is not added to total training duration or the Completion of Training Date. |

Implemented as `eighteenMonthFinalGrade` with required
`eighteenMonthFinalGradeNotes` when selected on `ProgrammeDetails`, entered
behind a checkbox in the programme details form. In `grades.ts`, the selected
row receives a 6-month threshold extension and its immediately following row
uses the preceding +6 in its visibility gate, matching the workbook. The
grade table marks and explains the 18-month final year; summaries and CSV
export surface the selected grade and reason without presenting it as an
adjusted training duration used for the Completion of Training Date.

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

This does **not** automatically shorten the training duration used for the Completion of Training Date: as the workbook
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

### 9.5 Grade-lookup branch (L formula Branch B) — modelled in Full mode

In Excel, once recorded WTE reaches a displayed grade row's baseline
threshold, the `L` formula looks up that grade in training-table rows `24–46`
and uses its recorded end date instead of extrapolating. This switch occurs
independently per grade row; it does not wait for the complete programme to
have been recorded.

This **does not apply to Quick mode** because past changes there are typed
by absence/LTFT (e.g. `LTFT`, `OOPC`), not by grade name. The Quick-mode
`GradeTable` always computes end dates by walking the WTE-rated segments.

In **Full mode**, the timeline grid records every period including grades and
their tags, so the lookup branch is implemented in
[`computeGradeProgressionForTimeline`](fullModeCalculations.ts).

#### Verified workbook dependency scope

The case for reproducing the free-form Excel grid is limited by what its label
column actually drives. Re-inspection of
`Training End Date Calculator v2.17 - unprotected.xlsx` found:

| Grid input                                                   | Workbook formula use                                                     | Calculation consequence                                                                                                                                       |
| ------------------------------------------------------------ | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `A24:A46` Grade / Period Type, validated from `Lists!K2:K55` | `L9:L17` use `XLOOKUP("*"&K[row]&"*", A24:A46, D24:D46, "N/A", 2, -1)`.  | For a completed matching grade, the displayed grade end date can come from the last matching recorded row.                                                    |
| `B24:B46` WTE percentage                                     | `G24:G46`, `I47` and the extrapolation branch of `L9:L17`.               | The raw sheet accepts it for every row; Full mode exposes editable WTE for grade periods and approved OOPR credit.                                            |
| `C24:D46` period dates                                       | `F24:G46`, `G47`, `I47`, `B13` and `L9:L17`.                             | Affects calendar/WTE accrual, remaining training, projected Completion of Training Date and recorded grade-date lookup.                                       |
| `E24:E46` Counted as training?                               | `G24:G46` sets WTE months to zero unless the row is counted as training. | The raw sheet is permissive; Full mode supports `GRADE`, fixed-100% credited `OOPT`, and prospectively approved `OOPR` at its approved CCT credit percentage. |

`A24:A46` therefore does **not** feed total WTE completed, training remaining,
or projected Completion of Training Date. Its formula value is confined to retrieving a recorded
end date for a matching displayed grade. The grade/period list is broad
enough to include named grades, variants such as `ST3 ACF`, `ST3 ACL` and
`ST3 additional training time`, as well as leave types.

#### Implemented Quick and Full workflows

The Excel training grid is a free-form timeline: a user can enter each
full-time, LTFT or non-training period and may associate a row with a named
grade. Where a grade-tagged row exists, Excel can use its entered end date
for the corresponding displayed grade.

Quick mode deliberately asks for less data. A user records completed LTFT or
absence exceptions, gaps are inferred as full-time training, and one optional
LTFT change can set the future projection rate. It therefore does not collect
recorded grade-period end dates.

Full mode provides the fuller Excel-style workflow. A user records a
contiguous sequence of grade, OOP and leave periods; grade-labelled rows can
feed the named-grade end-date lookup. The app does not provide a separate
manual grade-date override outside this timeline.

#### Trade-offs

Advantages of Full mode:

- It can act as a fuller administrative history, recording ordinary
  full-time periods as well as exceptions.
- It can carry confirmed grade-period end dates and faithfully reproduce
  Excel's named-grade lookup display.
- It can represent complex grade-tagged history, including ACF/ACL or
  grade-specific additional training rows.
- It avoids inferring that all unentered gaps were full-time training.

Costs of Full mode:

- It asks users to enter ordinary periods that Quick mode does not require,
  increasing time and opportunity for missing, overlapping or inconsistent
  records.
- It uses a separate timeline data model, validation path, summary and CSV
  export from Quick mode.
- Grade labels add no accuracy to the primary Completion of Training Date projection formula: dates,
  WTE and whether time counts as training are the inputs that drive that
  calculation.
- Quick mode's projection control is intentionally limited to one LTFT change
  so the intended future WTE remains explicit.

Current position: **Quick mode keeps the exception-based workflow**, and a
note with the Quick-mode `GradeTable` reminds users that grade end dates are
calculated rather than confirmed.

For users who need the fuller administrative workflow — recording every
ordinary full-time post as well as exceptions, with grade-tagged rows that
feed the named-grade lookup — **Full mode is now available** as an opt-in
parallel flow. Both modes share `ProgrammeDetails` and the grade-segment
calculation utilities; their recorded-history models and projection entry
workflows differ.

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
changing it does not alter the calculated Completion of Training Date, remaining training time,
or grade progression.

This is not present in the web app. It is a low-priority enhancement unless
administrative recording of the field is required for exported or printed
summaries.

---

## 10. Excel parity checkpoint and next steps

### 10.1 Confirmed in the web app

The following workbook behaviours have a corresponding implementation. Where
behaviour differs between modes, both are noted:

| Workbook capability                                                                                            | Web app status                                                                                                                                                                                                                                                                                                                                                                                                                       |
| -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Specialty lookup, school grouping, dual/triple marker, length, entry grade, additional info and 24-month grade | Implemented from all 173 `Lists` rows in `specialties.ts`; the workbook's `St4` entry is normalised to `ST4`. Shared by both modes.                                                                                                                                                                                                                                                                                                  |
| Start-grade default and user override                                                                          | Implemented, with an added mandatory reason for auditability. Shared by both modes.                                                                                                                                                                                                                                                                                                                                                  |
| `I9` additional training time                                                                                  | Implemented, with mandatory reason and Excel-aligned `0..24` month validation. Shared by both modes.                                                                                                                                                                                                                                                                                                                                 |
| `I11` accelerated training time                                                                                | Implemented, with mandatory reason and `0..12` month validation following Excel's on-screen prompt. Shared by both modes.                                                                                                                                                                                                                                                                                                            |
| `I17` / `Q9:Q17` 24-month grade rule                                                                           | Implemented for the three DRE-EM specialties. Shared by both modes.                                                                                                                                                                                                                                                                                                                                                                  |
| `K20` / `P9:P17` 18-month final year rule                                                                      | Implemented, with mandatory reason and clear summary display. Shared by both modes.                                                                                                                                                                                                                                                                                                                                                  |
| `K50` / `O9:O17` skip one grade year rule                                                                      | Implemented, with mandatory reason, carried display offset and clear summary display. Shared by both modes.                                                                                                                                                                                                                                                                                                                          |
| Generated grade labels beyond `ST9`                                                                            | Deliberately differs from the workbook's raw string-concatenation behaviour: the app allows `ST9` but displays later generated rows as "Additional training after ST9" with a warning, rather than inventing `ST10+` labels.                                                                                                                                                                                                         |
| Completed LTFT/absence recording                                                                               | Quick mode: typed by LTFT/OOP/leave exceptions, with implicit 100% gaps. Full mode: contiguous timeline of grade/OOP/leave rows (mirrors `A24:E46`).                                                                                                                                                                                                                                                                                 |
| `B13` / `I47` future completion projection                                                                     | Quick mode: projection starts after the latest completed change, using 100% WTE by default or the WTE from one projected LTFT change, which can be open-ended. Full mode: uses the recorded end date once required training is covered; while under-covered it projects at the latest grade WTE, with a project-forward grade row used to record a planned future rate.                                                              |
| `A24:A46` Grade / Period Type label                                                                            | Quick mode: not modelled (Quick uses absence/LTFT typing instead). Full mode: 9 period types (`GRADE`, `OOPC/E/P/R/T`, `PARENTAL`, `SICK`, `ACCRUED_LEAVE`) plus a `gradeTag` of `REGULAR`/`ACF`/`ACL`/`ADDITIONAL_TRAINING_TIME` on GRADE rows.                                                                                                                                                                                     |
| `E24:E46` Counted as training?                                                                                 | Full mode mirrors the row-level control; Quick mode applies the same policy through its completed-change form. OOPT may be credited at fixed 100% for up to 12 months; OOPR accrues only when approved to contribute towards CCT and records the approved credit percentage. OOPR is normally limited to 3 years, or 4 years exceptionally, with duration normally pro rata for LTFT OOPR. Other OOP/leave periods are non-training. |
| `L9:L17` branch B grade-name lookup                                                                            | Quick mode: not modelled (no grade-tagged rows). Full mode: each grade row switches to the last matching recorded timeline end date as soon as its own baseline WTE threshold is recorded, ignoring `gradeTag`, matching the per-row Excel formula.                                                                                                                                                                                  |

#### OOP policy sources for both modes

The Excel grid provides the calculation mechanics, but it does not determine
which OOP categories may count towards CCT. The OOP rules in both modes are based
on:

- [NHS England North West: Time Out of Programme](https://www.nwpgmd.nhs.uk/time-out-programme),
  section **Categories of OOP**. This is the operational source of truth used
  for OOPT, OOPR, OOPE, OOPC and OOPP eligibility in this app.
- [Gold Guide v10, August 2024 (PDF)](https://medical.hee.nhs.uk/binaries/content/assets/medical-trainee-recruitment/medical-specialty-training/gold-guide/gold-guide-10th-edition/gold-guide-10th-edition-august-2024.pdf),
  paragraphs `3.168` to `3.170`. For LTFT OOPR, paragraph `3.168` states:
  "For postgraduate doctors in training undertaking OOPR on a LTFT basis,
  this would normally be pro rata."

In this policy subsection, `CCT` retains its formal meaning of Certificate of
Completion of Training credit or eligibility; it is distinct from the
projected **Completion of Training Date** displayed by the calculator.

| OOP category | Guidance reflected in both modes                                                                                                                                | Calculator treatment                                                                                                                               |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OOPT`       | Approved clinical training may count towards CCT, generally for up to 12 months for UK OOPT.                                                                    | May be marked counted as training for up to 12 months. It is recorded as fully credited training and does not expose a separate credit percentage. |
| `OOPR`       | Time may count only where approved for the relevant curriculum/specialty; normally up to 3 years, or 4 years exceptionally; LTFT duration is normally pro rata. | May be marked counted only where approved and requires the user to enter the prospectively approved CCT credit percentage.                         |
| `OOPE`       | Clinical experience is not approved for CCT.                                                                                                                    | Cannot be marked counted as training.                                                                                                              |
| `OOPC`       | A career break does not count towards training.                                                                                                                 | Cannot be marked counted as training.                                                                                                              |
| `OOPP`       | Competencies may be considered on return, but the period is not prospectively approved as counted training.                                                     | Cannot be marked counted as training.                                                                                                              |

The `OOPR` credit input deliberately records the approved CCT contribution,
not an assumed entitlement arising merely from working LTFT. The forms state
the usual three-year / exceptional four-year OOPR rule but do not enforce it
as a calendar-duration ceiling, because an approved LTFT OOPR duration may be
pro rata. The fixed-100% `OOPT` treatment is the app's recording convention
because the North West guidance describes eligible OOPT as approved clinical
training and does not identify a separate OOPT credit-percentage input.

### 10.2 Full-mode workflow detail

Full mode stores a contiguous array of `TrainingPeriod` rows rather than
Quick mode's list of exceptions plus a derived projection:

| Area        | Full-mode implementation                                                                                                                                                                              |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Entry       | [`TrainingPeriodForm.tsx`](../components/TrainingPeriodForm.tsx) records grade, OOP and leave rows; [`TimelineGrid.tsx`](../components/TimelineGrid.tsx) displays the resulting sequence.             |
| Continuity  | `validateTrainingPeriod` requires the first row to start at programme start and each later row to begin the day after the preceding completed row ends.                                               |
| Grade rows  | Record grade, grade tag and WTE. A final counted grade row can be set to project forward at its WTE.                                                                                                  |
| OOP rows    | Apply the OOPT/OOPR credit policy above; other OOP and leave rows consume calendar time without contributing WTE months.                                                                              |
| Projection  | `computeTimelineAccrual` and `projectedCompletionDateForTimeline` calculate total recorded WTE, training remaining and the projected Completion of Training Date.                                     |
| Grade dates | `computeGradeProgressionForTimeline` uses the shared grade calculation, then applies Excel's recorded named-grade lookup when the relevant WTE threshold has been met.                                |
| Output      | [`FullModeCalculationSummary.tsx`](../components/FullModeCalculationSummary.tsx) and [`FullModeSummaryPage.tsx`](../pages/FullModeSummaryPage.tsx) render and export the timeline and derived values. |

### 10.3 Deliberate workflow differences (Quick mode)

These differences are intentional in **Quick mode**; Full mode is the
in-app remedy for users who need the Excel-style workflow.

| Excel workflow                                                                                        | Quick-mode approach                                                                                                                                                                             | Implication                                                                                                           |
| ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Rows `24:46` let users type every full-time, LTFT or non-training period and may include grade names. | Users record only completed or hypothetical completed LTFT/absence exceptions; gaps are treated as full-time and can be displayed as read-only inferred rows, followed by a derived projection. | Faster data entry, but not a cell-for-cell replacement for arbitrary Excel timelines. Use Full mode if that's needed. |
| Grade end dates can use a matching named-grade row from the training grid.                            | Grade end dates are derived by walking WTE segments, with a user-facing note to check confirmed completed-grade dates against the authoritative record.                                         | A manual grade end-date override is not offered in Quick mode. Full mode provides the named-grade lookup.             |
| Excel can extrapolate from the most recent WTE row in its free-form grid.                             | Quick mode uses 100% WTE by default, or one selected LTFT change as the forward rate.                                                                                                           | Full mode instead uses the latest recorded grade WTE, or an open-ended project-forward grade period.                  |

### 10.4 Prioritised next steps

| Priority                                | Change                                                                                                                                         | Why it matters                                                                                           | Likely implementation area                                                                                             |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| 1 - planned Full-mode follow-up         | Implement a Quick-to-Full mode upgrade: a user starts in Quick, then converts; the app auto-builds a contiguous timeline from existing inputs. | Lets users escalate scope without re-entering data.                                                      | New conversion helper in `fullModeCalculations.ts`, validation pass and "Convert to Full mode" action in the Quick UI. |
| 2 - optional administrative enhancement | Decide whether to record Excel's `D16:D17` additional training time awarded during core training field.                                        | Verified not to affect v2.17 workbook calculations, but may matter for reporting or record completeness. | Programme details and summary/export only unless requirements change.                                                  |
| 3 - optional cross-mode polish          | Mid-row edits / cascade adjustments in Full-mode timeline (currently only the last row can be edited or removed).                              | Avoids "delete back to the row" workflows for admins correcting older entries.                           | Validation expansion + cascade-date handling in `TimelineGrid` / `validateTrainingPeriod`.                             |

### 10.5 Release position

The web app implements the primary Completion of Training Date projection workflow, the
duration/final-year/skip-grade adjustments, and (via Full mode) Excel's
contiguous training-record workflow including the named-grade lookup branch.
The remaining items above are workflow follow-ups (Quick → Full upgrade,
mid-row edits) or optional reporting enhancements rather than identified
formula parity gaps.

---

## 11. File map

| Path                                                   | What it holds                                                                                                                                 |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| [`calculationTypes.ts`](calculationTypes.ts)           | Core types: `CalculationMode`, `ProgrammeDetails`, Quick-mode `PastChange` / `ProposedChange`, and Full-mode `TrainingPeriod`                 |
| [`calculations.ts`](calculations.ts)                   | Quick-mode historical accrual, credited past-change WTE, Completion of Training Date and duration helpers                                     |
| [`fullModeCalculations.ts`](fullModeCalculations.ts)   | Full-mode timeline accrual, completion projection and recorded-grade end-date lookup                                                          |
| [`grades.ts`](grades.ts)                               | Shared grade parsing, WTE segment traversal and grade-progression construction                                                                |
| [`specialties.ts`](specialties.ts)                     | `Specialty` type, 173-entry `SPECIALTIES` array, `findSpecialty`, `specialtiesGroupedBySchool`, `TrainingGrade` / `TRAINING_GRADES`           |
| [`calculationTypeLabels.ts`](calculationTypeLabels.ts) | Display labels for each change type                                                                                                           |
| [`validation.ts`](validation.ts)                       | Programme, Quick-mode change/projection and Full-mode timeline validation                                                                     |
| `../components/ProgrammeDetailsSection.tsx`            | Programme details form (specialty, dates, baseline length, start grade, training-time, final-year and skipped-grade adjustments with reasons) |
| `../components/SpecialtyAutocompleteSelect.tsx`        | Progressively enhanced accessible-autocomplete select for picking specialty                                                                   |
| `../components/ModePicker.tsx`                         | Selects Quick or Full calculation mode                                                                                                        |
| `../components/PastChangeForm.tsx`                     | Quick-mode add/edit change form, including OOPT/OOPR credit controls and LTFT projection selection                                            |
| `../components/PastChangesList.tsx`                    | Quick-mode table of changes with Edit/Remove, optional assumed full-time rows and entered/inclusive totals                                    |
| `../components/NextPostSummary.tsx`                    | Quick-mode read-only projection summary                                                                                                       |
| `../components/TrainingPeriodForm.tsx`                 | Full-mode add/edit timeline row form, including OOPT/OOPR credit controls                                                                     |
| `../components/TimelineGrid.tsx`                       | Full-mode contiguous timeline table                                                                                                           |
| `../components/TimelineProjection.tsx`                 | Full-mode WTE totals and projected Completion of Training Date                                                                                |
| `../components/GradeTable.tsx`                         | Year-by-year grade progression with end dates and special-duration/skipped-grade explanations                                                 |
| `../components/CalculationSummary.tsx`                 | Quick-mode summary block, including optional assumed full-time rows in the completed-changes table                                            |
| `../components/FullModeCalculationSummary.tsx`         | Full-mode summary block                                                                                                                       |
| `../components/StepIndicator.tsx`, `BackLink.tsx`      | Wizard chrome                                                                                                                                 |
| `../pages/SetupPage.tsx`                               | Quick-mode setup page (programme details, changes, projection and grade progression)                                                          |
| `../pages/SummaryPage.tsx`                             | Quick-mode final summary page with CSV / print export                                                                                         |
| `../pages/SetupFullPage.tsx`                           | Full-mode setup page (programme details and contiguous timeline)                                                                              |
| `../pages/FullModeSummaryPage.tsx`                     | Full-mode final summary page with CSV / print export                                                                                          |
| `../App.tsx`                                           | Mode picker and setup-to-summary flow for Quick and Full modes                                                                                |
