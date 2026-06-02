# PTA Cashiering System - Backend

SQLite-based backend for the PTA Cashiering System with RESTful API endpoints.

## Features

- **Student Management**: Add, edit, delete, and retrieve student information
- **Payment Tracking**: Track payment status for all fees (SPTA, School Paper, School Org, Sports, Insurance, Graduation) with paid, unpaid, partial, and exempt states
- **Receipt Management**: Generate, view, delete, and summarize payment receipts by student and date range
- **Comprehensive Reports**: Generate detailed reports by grade, section, fee category, student, disbursement activity, and sibling list
- **Fee Configuration**: Customizable fee amounts and fee category management
- **School Year Management**: Keep separate databases by school year and switch the active year
- **Section Settings**: Configure the number of sections per grade and preserve student assignment integrity
- **Disbursement Tracking**: Record and review PTA disbursements and include them in financial summaries
- **User Authentication**: Register, log in, check account status, and list users
- **Sibling Tracking**: Track students with siblings for discount or exemption purposes

## Database Schema

### Tables
- **students**: Student information with fee amounts
- **payment_status**: Payment tracking for each fee type per student
- **receipts**: Payment receipts
- **fees**: Fee configuration
- **disbursements**: Fund disbursements
- **users**: User authentication

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm

### Setup Steps

1. Navigate to the Backend folder:
```bash
cd Backend
```

2. Install dependencies:
```bash
npm install
```

3. Initialize the database:
```bash
npm run init-db
```
This will create the SQLite database with all tables, default fees, and a default admin user.

4. Start the server:
```bash
npm start
```
Or with auto-reload during development:
```bash
npm run dev
```

The server will run on `http://localhost:3001`

## API Endpoints

### Students
- `GET /api/students` - Get all students
- `POST /api/students` - Create a new student
- `GET /api/students/:id` - Get student details
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student
- `GET /api/students/grade/:grade` - Get students by grade
- `GET /api/students/grade/:grade/section/:section` - Get students by grade and section

### Payments
- `GET /api/payments` - Get all payments
- `POST /api/payments` - Record a payment
- `GET /api/payments/student/:studentId` - Get payments for specific student
- `GET /api/payments/summary/by-status` - Get payment summary by status
- `GET /api/payments/grade/:grade/summary` - Get payment summary for a grade

### Receipts
- `GET /api/receipts` - Get all receipts
- `POST /api/receipts` - Create a receipt
- `GET /api/receipts/:id` - Get receipt details
- `GET /api/receipts/student/:studentId` - Get receipts for a student
- `GET /api/receipts/range/:startDate/:endDate` - Get receipts by date range
- `GET /api/receipts/summary/by-type` - Get receipt summary by type

### Reports
- `GET /api/reports/summary` - Get overall summary
- `GET /api/reports/by-category` - Get report by fee category
- `GET /api/reports/by-grade` - Get report by grade
- `GET /api/reports/by-section/:grade` - Get report by section
- `GET /api/reports/students/detailed` - Get detailed student payment report
- `GET /api/reports/disbursements` - Get disbursement report
- `GET /api/reports/siblings/list` - Get list of students with siblings

## Data Structure

### Student Object
```javascript
{
  id: number,
  first_name: string,
  last_name: string,
  grade: string,
  section: string,
  has_sibling: boolean,
  spta: decimal,
  school_paper: decimal,
  school_org: decimal,
  sports: decimal,
  insurance_amount: decimal,
  insurance_choice: 'paid' | 'cut_off' | 'partial' | 'unpaid',
  graduation: decimal,
  created_at: datetime,
  updated_at: datetime
}
```

### Payment Status Object
```javascript
{
  id: number,
  student_id: number,
  fee_type: 'spta' | 'school_paper' | 'school_org' | 'sports' | 'insurance' | 'graduation',
  status: 'paid' | 'unpaid' | 'partial' | 'exempt',
  amount_paid: decimal,
  date_paid: datetime,
  created_at: datetime
}
```

## Default Fees

- SPTA Membership: ₱150
- School Paper: ₱50
- School Organization: ₱100
- Sports: ₱200
- Insurance: ₱75
- Graduation Fee: ₱500 (Grade 10 & 12 only)

## Default Admin User

- Username: `admin`
- Password: `1234`

## Frontend Integration

Update your Frontend files to use the API endpoints. Example:

```javascript
// Fetch all students
fetch('http://localhost:3001/api/students')
  .then(res => res.json())
  .then(data => console.log(data));

// Create a student
fetch('http://localhost:3001/api/students', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    first_name: 'Juan',
    last_name: 'Dela Cruz',
    grade: 'Grade 7',
    section: '1',
    has_sibling: false,
    spta: 150,
    school_paper: 50,
    school_org: 100,
    sports: 200,
    insurance_amount: 75,
    insurance_choice: 'unpaid',
    graduation: 0
  })
})
.then(res => res.json())
.then(data => console.log(data));
```

## Troubleshooting

### Database file not found
- Run `npm run init-db` to create the database

### Port already in use
- Change the PORT in `server.js` or set the environment variable: `PORT=3002 npm start`

### CORS errors
- The backend is configured with CORS enabled. Make sure your frontend is making requests to `http://localhost:3001`

## License

ISC
