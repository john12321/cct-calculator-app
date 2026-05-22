The refactored app should work as follows (very high level):

1. Page 1: **Programme details** User gives their programme name (free text), programme start date, and programme length in months (number - allow decimal to 1dp).
2. Page 2:
   a. **Past changes**: the user builds-up each change in a similar way to how the current app works (we will get into details of the data/ fields needed later)

I want the user to add and remove the past changes in any order that they wish i.e. no new cct date calculations are made, we are just building-up a list of previous changes (e.g. LTFT posts, OOP absences etc.), they only validation (on the 'add a new change' button click) will be to check for over-lapping days, dates before programme start date / beyond the original programme duration.

Completed posts are recorded and each change is calculated as an accrual of WTE months against the actual Calendar months they spent for that change. The sum of the WTE months will then give the deficit i.e. time remaining (Months remaining) needed to complete the training:

```
Total WTE time completed = Σ(Calendar time × WTE)

Training time remaining = Programme length - Total WTE time completed

```

Note: We need the original Programme length as a reference point that's why we ask for it on the first page.

When they are happy they've added all the previous changes (e.g. post) data then they click 'Add Next Post' (we will run the above validation again)

b. **Next Post**: the user will then provide the start date of the next change (e.g. post) and the WTE % for this change (i.e. if LTFT then this will be less than 100%; for all other types of absences e.g. OOPC they will be 100% so don't need to ask for this, we just need the change start date)

For the Next Post part of the calculation, we record the start date and new percentage and use the data we have from the cumulative past posts WTE time to calculate the projected completion date. We need the following:

Original programme length

Months remaining i.e. the sum of all the accrued completed WTE durations

Proposed start date of next post

Proposed WTE % (decimal)

```
New completion date = Proposed start date + Months remaining * 1/proposed WTE * 30.4
```

c. **Summary table**: this shows the following:
i. past changes: each row will have change type (e.g. LTFT, OOPC), start date, end date, calendar months, WTE months. below the last change row will be the total calendar months completed and the months remaining.
ii. **Next Post**: this shows the start date of next change, WTE % for this change, and the Projected completion date (using the above logic)

3. Page 3 will be a summary page similar to the one we had before. We don't need to show the extension days for each change etc.
