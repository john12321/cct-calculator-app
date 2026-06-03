# Calculation Logic Summary

This is a brief summary of the logic and rules mapping from the excel calculators to this [proof-of-concept web app](https://cct-calculator.com/) used to calculate a projected completion of training date.

**Note**
The `NW` and `RCEM` excel calculators were the primary "sources of truth" but the app logic was also tested against other NHS calculators (e.g. `JRCPTB`, `RCoA`, `RCPCH`, `Severn Secondary Care`) and the results were the same for most of them!
Further testing of the basic and more complex use cases is needed by a domain knowldge expert.

For the full Excel mapping, policy decisions and edge cases, please refer to
the web app's [Calculation reference document](https://github.com/john12321/cct-calculator-app/blob/main/src/core/CALCULATION_REFERENCE.md).

## Main calculations

The app first calculates the required training duration:

```text
Required WTE months =
  programme length + additional training time - accelerated training time
```

Note: following the excel logic (in the NW calculator via excel lookup), the baseline `programme length` comes from the selected specialty name.

Completed periods are then converted to whole-time-equivalent (WTE) months:

```text
Calendar months = inclusive calendar days / (365 / 12)
WTE months      = calendar months x WTE fraction
Months remaining = required WTE months - total completed WTE months
```

This mirrors the standard excel workbook training-grid calculations and as with the workbook's
control, periods not counted as training contribute `0` WTE months.

Finally, remaining training is projected forward:

```text
Projected days = floor(months remaining / forward WTE fraction x 30.4)
Projected Completion of Training Date = projection start + projected days
```

This maps to the excel workbook's future-completion calculation. The
app uses `365 / 12` days per month for completed historical periods and `30.4`
days per month for future projection, matching the workbook's two conventions.

## Web app modes

| Mode  | How completed WTE is supplied                                                                                                     | How the forward WTE is supplied                                                              |
| ----- | --------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Quick | The user records LTFT, OOP and leave changes. Unrecorded gaps are inferred as 100% WTE training.                                  | 100% WTE by default, or the WTE from one selected LTFT projection change.                    |
| Full  | The user records every training, OOP and leave period in a contiguous timeline, corresponding to the typical excel workbook grid. | The app uses the WTE from the most recent Grade row. A final Grade row can be left open-ended to record the planned WTE for the remainder of training. |

Both modes apply the same required-duration and WTE-accrual model. They differ
only in how the recorded history and future projection rate are entered.
Full mode gives more control over the grade information (e.g. start and end dates).

## Out of programme (OOP) rules

The app can record time spent out of programme and whether any of that time
has been approved to count towards training. It does not decide whether an OOP
period should be approved; users should enter the decision confirmed by the
relevant training programme or specialty.

| OOP type                                 | How the app treats it                                                                                                                                                           |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **OOPT** (Out of Programme Training)     | Approved clinical training can be marked as counting towards training, usually for up to 12 months. When it counts, the app treats it as full-time training.                    |
| **OOPR** (Out of Programme Research)     | Research time can only be marked as counting towards training where CCT credit has been approved. The user enters the approved percentage.                                      |
| **OOPE** (Out of Programme Experience)   | Does not count towards training in the calculator.                                                                                                                              |
| **OOPC** (Out of Programme Career Break) | Does not count towards training in the calculator.                                                                                                                              |
| **OOPP** (Out of Programme Pause)        | Does not count towards training in the calculator. Competencies may be considered when the doctor returns, but the period is not recorded as approved training time in advance. |

For OOPR, guidance describes a usual maximum of three years, or four years in
exceptional circumstances. OOPR undertaken less than full-time is normally
considered on a pro-rata basis, so the app records the approved credit rather
than applying an automatic time limit.

In this section, **CCT credit** means an approved contribution towards a
Certificate of Completion of Training. It is different from the projected
Completion of Training Date calculated by the app.

These rules are based on the
[NHS England North West Time Out of Programme guidance](https://www.nwpgmd.nhs.uk/time-out-programme#Colleges)
and the
[Gold Guide v10, August 2024](https://www.copmed.org.uk/publications/gold-guide),
paragraphs 3.156 to 3.170.
