# NHS CCT Calculator

A client-side calculator for working out **Certificate of Completion of Training (CCT)** dates for NHS specialist training programmes. Built for Resident Doctors and NHS admin support staff who need to understand how in-programme changes (LTFT, OOP, maternity leave, etc.) affect a trainee's CCT date.

> **Live site:** [cct-calculator.com](https://cct-calculator.com/)

## Features

- **Multi-step form** — guided three-step workflow (Programme Details → CCT Calculations → Summary)
- **Multiple calculation types** — supports LTFT, OOPC (Career Break), OOPE (Experience), Maternity, Paternity, Shared Parental Leave, Sickness, Unpaid Leave, COVID-19 Shielding, and Phased Return
- **Cumulative calculations** — chain multiple changes together; each one builds on the previous CCT date
- **Edit & remove** — amend or remove the last calculation at any time
- **Export CSV** — download a summary table of all calculations
- **Print / PDF** — print-friendly layout for sharing at ARCP or with colleagues
- **Fully client-side** — no data is sent to a server; everything runs in the browser
- **NHS UK Design System** — styled with [nhsuk-frontend](https://github.com/nhsuk/nhsuk-frontend) for a familiar, accessible interface

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
git clone https://github.com/john12321/cct-admin-app.git
cd cct-admin-app

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
├── App.tsx                  # Root component — multi-step form orchestration
├── main.tsx                 # Entry point
├── components/
│   ├── ProgrammeDetails.tsx # Step 1 — programme name & date inputs
│   ├── CctCalculations.tsx  # Step 2 — add/edit/remove CCT changes
│   ├── FinalSummary.tsx     # Step 3 — summary table, CSV export, print
│   ├── CalculationRow.tsx   # Individual calculation form row
│   ├── CctCalcSelector.tsx  # Calculation-type dropdown selector
│   ├── StepIndicator.tsx    # Step progress indicator / navigation
│   ├── ProgrammeInfoInset.tsx # Programme info banner
│   ├── BackLink.tsx         # Back navigation link
│   └── types.ts             # Shared TypeScript types
├── utils/
│   ├── cctCalcUtils.ts      # Core CCT calculation logic
│   └── selectFieldUtils.ts  # react-select style configuration
└── styles/
    └── main.scss            # Global styles (NHS design system + overrides)
```

## How It Works

1. **Programme Details** — enter the programme name, start date, and end date (which doubles as the original CCT date).
2. **CCT Calculations** — select a change type, enter dates and (for LTFT) a WTE percentage, then calculate. Each calculation adds days to the CCT date. Multiple calculations can be chained sequentially.
3. **Summary** — review all changes in a table, export to CSV, or print a PDF-ready summary to share at ARCP.

## Licence

This project is provided as-is. See the repository for licence details.
