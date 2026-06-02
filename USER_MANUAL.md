# PTA Cashiering System - User Manual

## Table of Contents
1. [Introduction](#introduction)
2. [System Requirements](#system-requirements)
3. [Getting Started](#getting-started)
4. [Login](#login)
5. [Dashboard](#dashboard)
6. [Student Records](#student-records)
7. [New Payment](#new-payment)
8. [Receipts Log](#receipts-log)
9. [Fee Categories](#fee-categories)
10. [Fund Usage](#fund-usage)
11. [Troubleshooting](#troubleshooting)
12. [FAQ](#faq)

---

## Introduction

The **PTA Cashiering System** is a browser-based cashiering application for PTA fee collection, student tracking, and financial reporting. The current system supports:

- Grade and section-based student records for Grades 7 through 12
- Student fee tracking for SPTA, School Paper, School Organization, Sports, Insurance, and Graduation
- Receipt creation with PDF print capability
- Fee category management
- Section count settings per grade
- School year switching using separate database files
- Disbursement tracking and balance display
- Authentication with a registered user account
- Import students from Excel/CSV and export student lists to CSV

---

## System Requirements

### Software
- **Node.js** (v14 or higher) for the backend
- **npm** for installing dependencies
- **Web browser**: Chrome, Edge, Firefox, Safari, or any modern browser

### Local Setup
- Backend server must run on `http://localhost:3001`
- Frontend pages are static HTML and can be opened directly or served using a local file server

### Hardware
- CPU: 1.5 GHz or faster
- RAM: 512 MB or more
- Disk: 100 MB available space

---

## Getting Started

### Start the Backend Server

1. Open a terminal or command prompt
2. Navigate to the backend folder:

```powershell
cd "C:\Users\user\Desktop\Coding Stuff\ITCC42\PTA Cashiering System\Backend"
```

3. Install dependencies (first time only):

```powershell
npm install
```

4. Start the backend server:

```powershell
npm start
```

5. Confirm the backend is running on:

```
http://localhost:3001
```

### Open the Frontend

1. In your browser, open the frontend pages from the `Frontend` folder.
2. Recommended starting page:

```
Frontend/dashboard.html
```

If you are using a local server like Live Server, point the browser to the local address for those HTML files.

---

## Login

The system uses a registered account to protect the application.

### First-time access

- If no account exists, the login page switches to registration mode automatically.
- Create a username and password to register the first user.

### Returning user

- Enter the registered username and password.
- Click **Sign In**.

### Sign out

- Use the **Sign out** button in the top-right corner of any page.

---

## Dashboard

The dashboard is the home screen and provides a quick summary of PTA collections, payment progress, and recent activity.

### Key sections

- **Total collected** — total amount received from all payments recorded in the current school year.
- **Students enrolled** — total number of student records in the active school year database.
- **Fully paid** — percentage of students who have all tracked fee categories marked as paid or exempt.
- **Balance due** — net available funds after subtracting recorded disbursements from total collections.
- **Collection by grade level** — a bar chart showing the paid percentage for each grade from Grade 7 to Grade 12.
- **Fee category totals** — total amounts collected per fee category, based on the fee categories configured in the system.
- **Recent transactions** — the most recent receipts, with receipt number, student, grade/section, payment amount, and transaction date.

### Dashboard behavior

- The dashboard loads live data from the backend whenever the page is opened.
- Summary values are updated from reports and receipt data stored in the backend database.
- Grade and fee totals reflect actual collected amounts, not placeholder values.
- Recent transactions show the newest payment receipts available in the system.

### Navigation

Use the left sidebar to move between:
- Dashboard
- Student Records
- New Payment
- Receipts Log
- Fee Categories
- Fund Usage

---

## Student Records

The Student Records page lets you manage student entries by grade and section.

### Viewing student records

1. Click **Student Records** in the sidebar.
2. Select a grade tab at the top (Grade 7 to Grade 12).
3. Select a section pill below the tabs.
4. The student table shows records for the chosen grade/section.

### Student table columns

- Student name
- SPTA
- School Paper
- School Org
- Sports
- Insurance
- Graduation
- Total paid
- Status
- Actions

### Search and filter

- Use the **Search** box to filter students by name, grade, or section.
- Use the **All statuses** filter to show only fully paid, partial, or unpaid students.

### Add a student

1. Click **Add Student**.
2. Enter last name and first name.
3. Select the student grade and section.
4. Check **Has sibling** if the student is part of a sibling family.
5. Click **Create student**.

### Import from Excel / CSV

1. Click **Import from Excel**.
2. Upload an `.xlsx`, `.xls`, or `.csv` file.
3. Map the file columns to the system fields if needed.
4. Preview the records.
5. Confirm the import.

**Expected columns** (any order):
- Student Name
- SPTA
- School Paper
- School Org
- Sports
- Insurance
- Graduation

### Export student list

- Click **Export to CSV** to download the currently visible student list.
- The export includes the active grade, section, and current status filter.

### Notes

- Student deletion is not available from the current UI.
- The student table uses the current school year database.

---

## New Payment

The New Payment page records payments and generates receipts.

### Choose a student

1. Click **New Payment** in the sidebar.
2. Select a grade and section.
3. Click a student from the loaded list.

### Sibling discount

- Enable **Apply sibling discount** to mark SPTA Membership and School Paper fees as zero for the selected sibling family name.
- Select the sibling last name from the dropdown.

### Select fees to pay

- Check the fees the student is paying.
- Enter the payment amount for each selected fee.
- The page shows the total payment amount and the current payment outcome.

### Process payment

1. Click **Process, save & download receipt**.
2. The system saves payment status for each selected fee.
3. A receipt is created automatically.
4. The receipt opens in a new window for printing or saving as PDF.

### Payment statuses

- **Paid**: full fee amount paid
- **Partial**: some amount paid, but not full
- **Unpaid**: no amount paid
- **Exempt**: fee is waived due to sibling status or cut-off insurance

---

## Receipts Log

The Receipts Log page shows all saved receipts.

### Viewing receipts

- Use the search box to filter receipts by student name, fee category, or payment date.
- The table displays each receipt’s student name, fee amounts, total paid, and status.

### Print receipts

- Click **Print all** to print the current receipt log.
- The system opens a print window that can save to PDF or send to a physical printer.

### Notes

- Receipts are generated from payment processing.
- Receipts cannot be edited from the current UI.

---

## Fee Categories

The Fee Categories page manages the fees used throughout the system.

### Add a fee category

1. Click **Add category**.
2. Enter a fee name.
3. Set the amount.
4. Enter the scope (for example, All, Grade 10 & 12, Grade 7-10).
5. Save the category.

### Edit a fee category

1. Click **Edit** next to a fee.
2. Modify the name, amount, or scope.
3. Save your changes.

### Delete a fee category

1. Click **Delete** next to a fee.
2. Confirm the deletion.

### Standard fees

The system includes standard fees such as:
- SPTA Membership
- School Paper
- School Organization
- Sports
- Insurance
- Graduation Fee

Use this page to add custom fees or adjust existing fees.

---

## Fund Usage

The Fund Usage page contains school year, section, and disbursement settings.

### Sections per grade

- Each grade can have between 1 and 13 sections.
- Use the minus button to remove a section and the plus button to add one.
- A section can only be removed if no students are currently assigned to it.

### School year

- Enter the academic year in `YYYY-YYYY` format.
- Click **Save school year** to switch to that year’s database.
- Each school year uses a separate database file.

### Disbursements

- Click **Record disbursement** to log an expense.
- Provide the purpose, category, and amount.
- Disbursements reduce the available balance shown at the top.

### Balance display

- **Available balance** = total collections − total disbursements
- **Collected** shows the current receipts total
- **Disbursed** shows the sum of recorded disbursements

---

## Troubleshooting

### Cannot login

- Make sure the backend server is running.
- Check your username and password.
- If the system has no account yet, use the registration mode on the login page.

### Backend not running

- Start the server from the `Backend` folder:

```powershell
npm start
```

- Ensure the backend is reachable at `http://localhost:3001`.

### Receipt print window blocked

- Allow popups for the frontend page.
- If printing does not appear, try again or use the browser’s print menu.

### Imported students do not appear

- Ensure the imported file has the required columns.
- Confirm that the row data includes valid student names.
- Check the browser console for import errors.

### Section change fails

- A section can only be removed if it contains zero students.
- Move or delete students from the section before reducing the section count.

---

## FAQ

### Q: How do I create the first user?
**A**: Open the login page. If no account exists, the page shows registration fields. Enter a username, password, and confirm the password.

### Q: Can I delete a student?
**A**: The current UI supports adding students only. Student deletion is not available from the Student Records page.

### Q: Can I edit student fee amounts?
**A**: Student fee amounts are updated automatically through payment processing and fee category settings. To change the system fee amount, edit the fee category.

### Q: What happens when I switch the school year?
**A**: The system loads a separate database for the selected school year. Existing student and payment data remain in the previously active year.

### Q: Can I export reports to Excel?
**A**: The current system supports exporting visible student records to CSV and printing receipt logs. Full Excel report export is not available in the UI.

### Q: How do sibling discounts work?
**A**: When sibling discount is enabled and the selected last name matches the student, SPTA Membership and School Paper fees are set to zero for that payment session.

### Q: Where are receipts saved?
**A**: Receipts are saved in the backend database and displayed in the Receipts Log page. They are also available for print or PDF download.

---

## Notes

- This manual matches the current system scope in the `Frontend` and `Backend` folders.
- Always start the backend before using the frontend.
- The system currently supports only Grades 7–12.
