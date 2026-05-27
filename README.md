# NHS Completion of Training Date Calculator

A client-side calculator for working out a **Completion of Training Date** for an NHS specialty training programme. Built for Resident Doctors and NHS admin support staff who need to understand how training patterns and periods away from programme affect a projected Completion of Training Date.

> **Live site:** [cct-calculator.com](https://cct-calculator.com/)

## Features

- **Quick and Full modes** — choose a short change-based calculation or build an Excel-style contiguous training timeline
- **Programme and grade calculations** — specialty-driven programme length, grade progression, training-time adjustments and projected Completion of Training Date
- **Training-credit controls** — records approved counted OOPT and OOPR using the applicable credit rules
- **Period recording** — supports LTFT, OOP and leave periods, including accrued annual leave
- **Edit & remove** — amend or remove entered changes or timeline periods
- **Export CSV** — download a summary table of all calculations
- **Print / PDF** — print-friendly layout for sharing at ARCP or with colleagues
- **Fully client-side** — no data is sent to a server; everything runs in the browser
- **NHS UK Design System** — styled with [nhsuk-frontend](https://github.com/nhsuk/nhsuk-frontend) for a familiar, accessible interface

## Calculation Modes

| Mode      | Entry model                                                                                                                                            | Suitable for                                                                                        |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| **Quick** | Record completed LTFT or absence changes, then enter the next proposed full-time or LTFT post. Unrecorded gaps are assumed to be training at 100% WTE. | A faster projected Completion of Training Date calculation.                                         |
| **Full**  | Record every training, OOP and leave period as a contiguous timeline, with grade-labelled training rows.                                               | A fuller administrative record and the closest in-app equivalent to the source Excel training grid. |

Both modes use the same programme details, adjustments, underlying grade rules and OOP training-credit rules; Full mode additionally uses its recorded timeline for grade-date lookup and projection.

### Quick Mode Flow

1. Select **Quick mode** and enter programme and specialty details.
2. Record completed changes that affect training-time accrual.
3. Enter the proposed next post as full time or LTFT.
4. Review grade progression, the projected Completion of Training Date and the exportable summary.

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
4. Review timeline accrual, grade progression, the projected Completion of Training Date and the exportable summary.

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

The policy sources are the [NHS England North West Time Out of Programme guidance](https://www.nwpgmd.nhs.uk/time-out-programme#Colleges) and the [Gold Guide v10, August 2024 PDF](https://medical.hee.nhs.uk/binaries/content/assets/medical-trainee-recruitment/medical-specialty-training/gold-guide/gold-guide-10th-edition/gold-guide-10th-edition-august-2024.pdf), paragraphs 3.168 to 3.170. For formula details and Excel mapping, see [`src/core/CALCULATION_REFERENCE.md`](src/core/CALCULATION_REFERENCE.md).

## Tech Stack

| Layer           | Technology                                                                                                                                 |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Framework       | [React 19](https://react.dev/)                                                                                                             |
| Build tool      | [Vite](https://vite.dev/)                                                                                                                  |
| Language        | [TypeScript](https://www.typescriptlang.org/)                                                                                              |
| Form management | [react-hook-form](https://react-hook-form.com/)                                                                                            |
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
│   ├── SetupFullPage.tsx              # Full-mode contiguous timeline entry
│   └── FullModeSummaryPage.tsx        # Full-mode output and export
├── components/
│   ├── ModePicker.tsx                 # Quick / Full selection
│   ├── ProgrammeDetailsSection.tsx    # Shared programme inputs and adjustments
│   ├── PastChangeForm.tsx             # Quick-mode completed-change entry
│   ├── ProposedChangeForm.tsx         # Quick-mode next-post projection input
│   ├── TrainingPeriodForm.tsx         # Full-mode timeline row entry
│   ├── TimelineGrid.tsx               # Full-mode timeline display
│   └── GradeTable.tsx                 # Grade-progression display
├── core/
│   ├── calculations.ts                # Quick-mode calculation logic
│   ├── fullModeCalculations.ts        # Full-mode calculation logic
│   ├── grades.ts                      # Shared grade-progression logic
│   ├── validation.ts                  # Entry validation for both modes
│   └── CALCULATION_REFERENCE.md       # Excel mapping and policy reference
└── styles/
    └── main.scss                      # Global NHS design system overrides
```

## Licence

This project is provided as-is. See the repository for licence details.
