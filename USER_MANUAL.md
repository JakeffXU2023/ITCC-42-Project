# PTA Cashiering System - User Manual

## Table of Contents
1. [Introduction](#introduction)
2. [System Requirements](#system-requirements)
3. [Getting Started](#getting-started)
4. [Dashboard](#dashboard)
5. [Student Records](#student-records)
6. [Payment Processing](#payment-processing)
7. [Receipts](#receipts)
8. [Reports & Settings](#reports--settings)
9. [Troubleshooting](#troubleshooting)
10. [FAQ](#faq)

---

## Introduction

The **PTA Cashiering System** is a web-based application designed to help Parent-Teacher Associations (PTAs) manage student fees, track payments, and generate financial reports. The system maintains records of all students by grade and section, manages multiple fee categories, and provides a transparent accounting system for PTA funds.

### Key Features
- **Student Management**: Organize students by grade and section
- **Fee Management**: Create and manage different fee categories
- **Payment Tracking**: Track individual student payments for each fee
- **Receipt Generation**: Automatic receipt creation for payment records
- **Financial Reports**: View summaries and detailed breakdowns of collections
- **Multi-Grade Support**: Full support for grades 7-12 with customizable sections
- **Sibling Exemptions**: Automatically apply fee exemptions for sibling students

---

## System Requirements

### Software Requirements
- **Web Browser**: Modern browser (Chrome, Firefox, Safari, or Edge)
- **Internet Connection**: Required only when using the browser-based frontend to connect to the backend remotely. If using the Electron desktop client with a local backend, an internet connection is not required.
- **Backend Server**: Must be running on `http://localhost:3001`

### Browser Compatibility
- Chrome/Chromium 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Hardware Requirements
- CPU: 1.5 GHz or higher
- RAM: 512 MB minimum
- Storage: 100 MB available space

---

## Getting Started

### Starting the System

#### Step 1: Start the Backend Server
```bash
cd Backend
npm install    # (First time only)
npm start
```
You should see:
```
✓ PTA Cashiering System Backend running on http://localhost:3001
```

#### Step 2: Open the Frontend
1. Open your web browser
2. Navigate to: `http://127.0.0.1:5500/Frontend/dashboard.html`
   - Or use your local server address if running via Live Server or similar tool

### Electron Integration
If you are using the Electron desktop version of the app, you can open the packaged client instead of a browser page. The Electron client connects to the same backend server at `http://localhost:3001`.

- No internet connection is required when both the Electron client and backend are running locally.
- Ensure the backend is started before launching the Electron client.
- If the Electron client is configured to use a remote backend, it will require internet access.

#### Step 3: Login (if authentication is enabled)
- Enter your credentials on the login page
- Click "Login"

### Initial Setup

On your first use, the system comes with sample data:
- 10 sample students across grades 7-12
- 5 standard fee categories
- 3 sample disbursements

You can delete this sample data and start fresh, or use it to become familiar with the system.

---

## Dashboard

The **Dashboard** is your home screen showing key financial metrics and recent activity.

### Dashboard Sections

#### 1. Summary Cards (Top)
- **Total Collections**: Total amount collected from all receipts
- **Total Students**: Total number of students in the system
- **Collection Rate**: Percentage of students who have paid any fees
- **Account Balance**: Total collections minus disbursements

#### 2. Grade-Based Collection Chart
Shows the payment collection rate for each grade:
- Grades 7-12 are displayed
- Each bar shows the percentage of students in that grade who have completed payment
- Hover over bars to see exact percentages

#### 3. Fee Summary Grid
Displays revenue collected by fee category:
- Shows each fee type with total collected
- Displays number of students who paid for each category
- Helps identify which fees have strong collection

#### 4. Recent Transactions Table
Shows the last 5 receipts created:
- Receipt ID and date
- Student name and grade/section
- Amount collected
- Payment status (paid/partial)

### Navigating from Dashboard
- Click **Student Records** tab to manage student data
- Click **Payments** tab to process new payments
- Click **Receipts** tab to view all receipt history
- Click **Reports** tab for detailed analysis
- Click **Settings** tab to manage fees and disbursements

---

## Student Records

The **Student Records** module allows you to manage all student information and track individual fee payments.

### Viewing Students

1. Click the **Student Records** tab
2. Select a **Grade** (tabs at top: Grade 7, 8, 9, 10, 11, 12)
3. Select a **Section** (pills below grade tabs)
4. The spreadsheet displays all students in that grade/section

### Student Information Display

Each student row shows:
- **Student Name**: First and last name
- **Parent/Guardian Name**: Contact person for the account
- **Fee Columns**: Individual columns for each fee category
- **Status**: Payment status for each fee (Paid, Unpaid, or Partial)
- **Actions**: Buttons to edit, process payment, or delete

### Adding a New Student

1. Click **Add Student** button
2. In the modal, enter:
   - **Student Name**: Full name (first and last)
   - **Parent Name**: Parent or guardian name
   - **Sibling**: Check if this student is a sibling (applies exemptions)
3. Click **Save Student**
4. The student is added to the current grade and section

### Editing a Student

1. Click the **Edit** icon (pencil) on the student row
2. Modify the student information
3. Click **Save Changes**

### Deleting a Student

1. Click the **Delete** icon (trash) on the student row
2. Confirm the deletion
3. The student record is permanently removed

### Managing Sections

#### Add a New Section
1. Click **Add Section** button
2. New section is added to the current grade
3. Total sections for the grade increases by 1

#### Rename a Section
1. Double-click a section pill (e.g., "Sec 1")
2. Or click **Rename Section** and select the section
3. Enter a custom name (e.g., "Hope Class")
4. Leave blank to use default naming
5. Click **Save**

#### Remove a Section
1. Click **Remove Section** button
2. Select the section to remove
3. Confirm that the section has no student data
4. Click **Remove**

**Note**: Only empty sections can be removed

### Managing Fee Categories

#### View Current Fees
Fee columns in the spreadsheet show all active fees for the current grade.

#### Add a Custom Fee Column
1. Click **Add Fee Column** button
2. Enter the **Category Name** (e.g., "Library Fund")
3. Click **Save Column**
4. New column appears in the spreadsheet

#### Remove a Fee Column
1. Click the **Remove** icon on the column header
2. Confirm deletion
3. All associated fee data is removed

**Note**: Standard fees (SPTA, Paper, Organization, Sports, Insurance) cannot be removed from the column view; they're managed in Settings.

### Tracking Payment Status

Each cell in the spreadsheet shows the payment status for that student/fee combination:

- **Green/Paid**: Student has paid the full fee amount
- **Yellow/Partial**: Student has paid part of the fee
- **Red/Unpaid**: Student has not paid this fee
- **Gray/Exempt**: Sibling students exempt from certain fees (SPTA, School Paper)

### Importing Students

1. Click **Import Students** button
2. Select a CSV or Excel file with student data
3. The system validates and imports the records
4. A success message shows the number of students added

### School Year Reset

Use this to clear student records for a new school year while keeping the fee structure:

1. Click **School Year Reset** button
2. Choose the scope:
   - **Section**: Clear only the current section
   - **Grade**: Clear entire grade
   - **All Grades**: Clear all students
3. Optionally check **Also clear receipts** to remove transaction history
4. Type "RESET" to confirm
5. Click **Confirm Reset**

**Warning**: This action cannot be undone

---

## Payment Processing

The **Payments** tab is where you record when students pay their fees.

### Recording a Payment

1. Click **Student Records** tab
2. Locate the student who is making a payment
3. Click the **Pay** button on that student's row
4. The Payment Modal opens

### Payment Modal

In the payment modal, you'll see:
- **Student Name**: Display only (for reference)
- **Grade/Section**: Current student's placement
- **Fee Entry Fields**: For each unpaid or partial fee:
  - Checkbox to select the fee
  - Input field to enter amount paid
  - Current status display

### Steps to Process Payment

1. **Select Fees**: Check the boxes for fees the student is paying
2. **Enter Amounts**: Type the amount paid for each selected fee
   - For full payment, enter the full fee amount
   - For partial payment, enter the partial amount
3. **Review**: Total amount shows at the bottom
4. **Submit**: Click **Process Payment**
5. A receipt is automatically generated and displayed

### Payment Confirmation

After submitting payment:
- Receipt preview shows all paid, unpaid, and exempt fees
- Receipt number is assigned automatically
- Payment status updates in the spreadsheet immediately
- You can print the receipt directly from the preview

---

## Receipts

The **Receipts** tab displays a complete history of all transactions and payment records.

### Viewing Receipts

1. Click the **Receipts** tab
2. All receipts are displayed in a table with:
   - Receipt ID (e.g., #1001)
   - Student name
   - Grade and section
   - Fees paid (with amounts)
   - Total amount
   - Transaction date
   - Status (Paid/Partial)

### Searching Receipts

1. Use the **Search** box at the top
2. Type to search by:
   - Student name
   - Grade
   - Section
   - Fee category name
   - Date

Results filter in real-time as you type.

### Viewing Receipt Details

1. Click **View** button on a receipt row
2. A detailed receipt appears showing:
   - All paid fee categories with amounts
   - Any unpaid fees (for partial payments)
   - Exempt fees (for siblings)
   - Receipt date and ID
   - Student information

### Deleting a Receipt

1. Click **Delete** button on a receipt row
2. Confirm the deletion
3. The receipt is permanently removed
4. Collections total is adjusted

**Note**: Use with caution as this affects financial reports

### Printing Receipts

1. Open the receipt details
2. Use your browser's print function (Ctrl+P or Cmd+P)
3. Save as PDF or print to physical printer
4. Receipt will format properly for printing

---

## Reports & Settings

### Reports

The **Reports** tab provides financial analysis and insights.

#### Summary Report
- Total collections across all fees
- Total disbursements
- Current account balance
- Collection efficiency metrics

#### Fee Category Report
Shows breakdown by fee type:
- How much collected for each fee
- Number of students who paid
- Percentage collection rate per fee

#### Grade-Level Report
Shows collection status by grade:
- Payment count per grade
- Average payment per grade
- Grade-wise collection percentage

#### Student Detailed Report
Individual student breakdown:
- Student name and grade/section
- Payment history
- Outstanding balances
- Total paid amount

### Settings

The **Settings** tab manages system configuration and financial tracking.

#### Fee Management
- **View All Fees**: List of all fee categories in the system
- **Add Fee**: Create new system-wide fee categories
- **Edit Fee**: Modify fee name, amount, or scope (all grades vs. specific grades)
- **Delete Fee**: Remove unused fee categories

#### Disbursement Tracking
Disbursements represent money spent from PTA collections.

**Adding a Disbursement:**
1. Click **Add Disbursement** button
2. Enter:
   - **Purpose**: What the money was used for (e.g., "Scholarship for 10 students")
   - **Category**: Type of expense (Financial Assistance, Sports, School Paper, etc.)
   - **Amount**: How much was disbursed
   - **Authorized By**: Name of person approving the expense
3. Click **Save**

**Viewing Disbursements:**
- All disbursements are listed chronologically
- Shows date, amount, purpose, and category
- Total disbursed amount shown at bottom
- Balance = Total Collections - Total Disbursements

#### System Preferences
- **School Year**: Set the current academic year
- **Organization Name**: Name of the PTA
- **Auto-save**: Enable/disable automatic backup

---

## Troubleshooting

### "Error: Backend not running"

**Problem**: You see this message on any page
- **Solution 1**: Make sure the backend server is started
  ```bash
  cd Backend
  npm start
  ```
- **Solution 2**: Check that port 3001 is available
- **Solution 3**: Verify the browser is trying to connect to `http://localhost:3001`

### Student data not saving

**Problem**: Students I added are gone after refresh
- **Solution 1**: Ensure backend is running
- **Solution 2**: Check that your browser's developer console shows no errors (F12)
- **Solution 3**: Try clearing browser cache and refreshing

### Receipts not generating

**Problem**: Payment submitted but no receipt appears
- **Solution 1**: Check that all required amounts are entered
- **Solution 2**: Verify at least one fee is selected for payment
- **Solution 3**: Check browser console for error messages

### Can't add students to a section

**Problem**: Add Student button doesn't work
- **Solution 1**: Make sure you've selected a grade and section
- **Solution 2**: Refresh the page and try again
- **Solution 3**: Check browser console for error messages

### Search not working in Receipts

**Problem**: Search box doesn't filter results
- **Solution 1**: Clear search box completely
- **Solution 2**: Refresh the page
- **Solution 3**: Type more specific search terms

### Calculations seem incorrect

**Problem**: Totals or percentages don't match expected values
- **Solution 1**: Refresh the page to reload fresh data
- **Solution 2**: Check that all students are assigned to correct grade/section
- **Solution 3**: Verify no duplicate entries exist

---

## FAQ

### Q: Can I modify the standard fees (SPTA, Paper, etc.)?
**A**: Yes, go to **Settings** → **Fee Management** and click Edit on any standard fee. You can change the amount and which grades it applies to.

### Q: What happens if I delete a student?
**A**: The student record is permanently deleted. Any receipts associated with that student remain, but the student cannot be recovered unless you have a database backup.

### Q: How do I mark a payment as "partial" vs "full"?
**A**: In the Payment Modal, simply enter any amount less than the fee total to create a partial payment. The system automatically determines the status.

### Q: Can I edit a receipt after it's been created?
**A**: No, receipts are permanent records. If there's an error, you would need to delete the incorrect receipt and create a new one.

### Q: How many students can the system handle?
**A**: The system can handle thousands of students efficiently. Performance may vary depending on your computer specifications.

### Q: Is there a backup feature?
**A**: The system automatically saves all data to the database. For additional security, you can export your data through the backend or contact your system administrator for backup procedures.

### Q: Can I use this system offline?
**A**: No, the system requires a connection to the backend server running on `localhost:3001`. A version could be created for offline use, but that's not currently supported.

### Q: What if I accidentally reset the school year?
**A**: The reset action cannot be undone through the UI. You would need to restore from a database backup or re-enter the data manually.

### Q: How do I add a new grade level?
**A**: The system supports grades 7-12 by default. To add additional grades, contact your system administrator.

### Q: Can I export reports to Excel?
**A**: Currently, reports are displayed on-screen. You can print to PDF using your browser. Full Excel export can be requested as a feature enhancement.

### Q: What's the difference between "Paid," "Partial," and "Unpaid"?
- **Paid**: Student has paid the full fee amount
- **Partial**: Student has paid some but not all of the fee
- **Unpaid**: Student hasn't paid any amount for this fee

### Q: How do sibling exemptions work?
**A**: When you mark a student as a "Sibling" during entry, they automatically become exempt from SPTA and School Paper fees. Their amounts for these fees are set to zero and marked "Exempt."

### Q: Can I delete multiple students at once?
**A**: Currently, you must delete students individually. To delete many students at once, use the **School Year Reset** feature with the appropriate scope.

### Q: How do I contact support?
**A**: Please contact your system administrator or PTA coordinator for technical issues or feature requests.

---

## Tips & Best Practices

1. **Regular Backups**: Ask your system administrator to perform regular database backups
2. **Accurate Names**: Use consistent spelling and formatting for student names to avoid duplicates
3. **Prompt Recording**: Record payments promptly after they're received for accurate reporting
4. **Monthly Reviews**: Check reports monthly to monitor collection progress
5. **Section Organization**: Use meaningful section names (e.g., "Hope," "Charity") for easier navigation
6. **Archive Old Data**: Consider archiving previous school year data before running year-end reset
7. **Verify Amounts**: Double-check payment amounts before submitting to avoid errors

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Print | Ctrl+P (Windows) or Cmd+P (Mac) |
| Refresh | F5 or Ctrl+R (Windows) or Cmd+R (Mac) |
| Open Developer Console | F12 |
| Search in page | Ctrl+F (Windows) or Cmd+F (Mac) |

---

## Document Information

- **Version**: 1.0
- **Last Updated**: May 31, 2026
- **System Version**: PTA Cashiering System v1.0.0
- **For Support**: Contact your PTA organization or system administrator

---

**Thank you for using the PTA Cashiering System!**
