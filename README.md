# NHS Completion of Training Date Calculator

A client-side calculator for working out a **Completion of Training Date** for an NHS specialty training programme. Built for Resident Doctors and NHS admin support staff who need to understand how training patterns and periods away from programme affect a projected Completion of Training Date.

> **Live site:** [cct-calculator.com](https://cct-calculator.com/)

## Features

- **Quick and Full modes** — choose a short change-based calculation or build an Excel-style contiguous training timeline
- **Programme and grade calculations** — specialty-driven programme length, grade progression, training-time adjustments and projected Completion of Training Date
- **Training-credit controls** — records approved counted OOPT and OOPR using the applicable credit rules
- **Period recording** — supports LTFT, OOP and leave periods, including accrued annual leave
- **Assumed full-time transparency** — Quick mode can show inferred 100% WTE gaps alongside entered changes and totals
- **Edit & remove** — amend or remove entered changes or any Full-mode timeline period
- **Export CSV** — download a summary table of all calculations
- **Print / PDF** — print-friendly layout for sharing at ARCP or with colleagues
- **Fully client-side** — no data is sent to a server; everything runs in the browser
- **NHS UK Design System** — styled with [nhsuk-frontend](https://github.com/nhsuk/nhsuk-frontend) for a familiar, accessible interface

## Calculation Modes

| Mode      | Entry model                                                                                                                                            | Suitable for                                                                                        |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| **Quick** | Record completed or hypothetical completed LTFT or absence changes, with one optional LTFT change used to project remaining training. Unrecorded gaps are assumed to be training at 100% WTE and can be shown in the changes and summary tables. | A faster projected Completion of Training Date calculation.                                         |
| **Full**  | Record every training, OOP and leave period as a contiguous timeline, with grade-labelled training rows.                                               | A fuller administrative record and the closest in-app equivalent to the source Excel training grid. |

Both modes use the same programme details, adjustments, underlying grade rules and OOP training-credit rules; Full mode additionally uses its recorded timeline for grade-date lookup and projection.

### Quick Mode Flow

1. Select **Quick mode** and enter programme and specialty details.
2. Record completed or hypothetical completed changes that affect training-time accrual.
3. Optionally mark one LTFT change to project the remaining training time; this can be open-ended and does not need an end date. Otherwise the calculator projects from the latest change at 100% WTE.
4. Use the changes table toggle, when available, to show inferred full-time 100% WTE periods that fill gaps between entered changes. These rows are read-only and flagged as not added by the user.
5. Review grade progression, the projected Completion of Training Date and the exportable summary. The summary table offers the same assumed full-time toggle and shows totals for entered changes and totals including hidden full-time periods.

Quick mode completed-change choices are:

| Group             | Period options                                                                                   |
| ----------------- | ------------------------------------------------------------------------------------------------ |
| Work pattern      | Less Than Full-time (`LTFT`)                                                                     |
| Out of programme  | Career Break (`OOPC`), Experience (`OOPE`), Pause (`OOPP`), Research (`OOPR`), Training (`OOPT`) |
| Leave             | Parental Leave, Sickness, Accrued annual leave                                                   |
| Health and return | COVID-19 Shielding, Phased Return                                                                |

### Full Mode Flow

1. Select **Full mode** and enter programme and specialty details.
2. Add connected timeline rows covering all periods of training or absence.
3. Use **Grade** rows to record the training grade, tag and WTE; an open-ended final Grade row can project forward at its WTE.
4. Edit or remove any row when correcting the record. Gaps, overlaps and other issues are highlighted; use **Add period to fill gap** when needed.
5. Resolve all timeline issues, then review timeline accrual, grade progression, the projected Completion of Training Date and the exportable summary.

Full mode period choices are:

| Group            | Period options                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------------ |
| Training         | Grade                                                                                            |
| Out of programme | Career Break (`OOPC`), Experience (`OOPE`), Pause (`OOPP`), Research (`OOPR`), Training (`OOPT`) |
| Leave            | Parental Leave, Sick leave, Accrued annual leave                                                 |

## Out Of Programme Credit

The following controls are applied in both modes:

| OOP period             | Calculator treatment                                                                                                                                                                      |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OOPT`                 | May be marked **Counted as training** for up to 12 months. Counted OOPT contributes training at a fixed 100% WTE in the calculator.                                                       |
| `OOPR`                 | May be marked **Counted as training** only where Certificate of Completion of Training (CCT) credit has been approved. When counted, the user records the approved CCT credit percentage. |
| `OOPC`, `OOPE`, `OOPP` | Cannot be marked as counted training.                                                                                                                                                     |

OOPR approval is specialty-dependent. Guidance describes a usual maximum of three years, or four years exceptionally, and states that LTFT OOPR duration is normally pro rata; the calculator therefore records approved credit rather than applying an automatic calendar-duration cap.

In this policy context, **CCT credit** retains its formal meaning: approved contribution towards a Certificate of Completion of Training.

The policy sources are the [NHS England North West Time Out of Programme guidance](https://www.nwpgmd.nhs.uk/time-out-programme#Colleges) and the [Gold Guide v10, August 2024](https://www.copmed.org.uk/publications/gold-guide), paragraphs 3.156 to 3.170. For a short formula overview, see [`Calculation_logic_summary.md`](Calculation_logic_summary.md); for the full Excel mapping, see [`src/core/CALCULATION_REFERENCE.md`](src/core/CALCULATION_REFERENCE.md).

## Tech Stack

| Layer           | Technology                                                                                                                                 |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Framework       | [React 19](https://react.dev/)                                                                                                             |
| Build tool      | [Vite](https://vite.dev/)                                                                                                                  |
| Language        | [TypeScript](https://www.typescriptlang.org/)                                                                                              |
| Date handling   | [Day.js](https://day.js.org/)                                                                                                              |
| UI components   | [nhsuk-frontend](https://github.com/nhsuk/nhsuk-frontend) / [nhsuk-react-components](https://github.com/NHSDigital/nhsuk-react-components) |
| Styling         | SCSS (via `sass-embedded`)                                                                                                                 |

## Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9 (or any compatible package manager)

## Getting Started

```bash
# Clone the repository
git clone https://github.com/john12321/cct-calculator-app.git
cd cct-calculator-app

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at **http://localhost:5173** by default.

## Available Scripts

| Command           | Description                                     |
| ----------------- | ----------------------------------------------- |
| `npm run dev`     | Start the Vite development server with HMR      |
| `npm run build`   | Type-check with `tsc` then build for production |
| `npm run preview` | Preview the production build locally            |
| `npm run lint`    | Run ESLint across the project                   |

## Project Structure

```
src/
├── App.tsx                            # Mode picker and setup-to-summary routing
├── main.tsx                           # Entry point
├── pages/
│   ├── SetupPage.tsx                  # Quick-mode entry flow
│   ├── SummaryPage.tsx                # Quick-mode output and export
│   ├── SetupFullPage.tsx              # Full-mode timeline entry, correction and validation
│   └── FullModeSummaryPage.tsx        # Full-mode output and export
├── components/
│   ├── ModePicker.tsx                 # Quick / Full selection
│   ├── ProgrammeDetailsSection.tsx    # Shared programme inputs and adjustments
│   ├── PastChangeForm.tsx             # Quick-mode change and projection entry
│   ├── PastChangesList.tsx            # Quick-mode changes table with assumed full-time toggle
│   ├── TrainingPeriodForm.tsx         # Full-mode timeline row entry and editing
│   ├── TimelineGrid.tsx               # Full-mode timeline display and invalid-row highlighting
│   └── GradeTable.tsx                 # Grade-progression display
├── core/
│   ├── calculations.ts                # Quick-mode calculation logic
│   ├── fullModeCalculations.ts        # Full-mode timeline insertion and calculation logic
│   ├── grades.ts                      # Shared grade-progression logic
│   ├── validation.ts                  # Entry and whole-timeline validation
│   └── CALCULATION_REFERENCE.md       # Excel mapping and policy reference
└── styles/
    └── main.scss                      # Global NHS design system overrides
```

## Licence

This project is provided as-is. See the repository for licence details.
