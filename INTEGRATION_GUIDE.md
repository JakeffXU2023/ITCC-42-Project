# PTA Cashiering System - Frontend Integration Guide

This guide helps you integrate the Backend API with your Frontend JavaScript files.

## Setup

1. Ensure the Backend is running on `http://localhost:3001`
2. Update your API base URL in the Frontend files

## Key Integration Points

### 1. Authentication (auth.js)
Verify credentials against the backend:

```javascript
async function doLogin() {
  const username = document.getElementById('login-user').value;
  const password = document.getElementById('login-pass').value;
  
  // For now, using hardcoded check
  // In production, call: POST /api/auth/login
  if (username === 'admin' && password === '1234') {
    localStorage.setItem('user', JSON.stringify({ username, role: 'admin' }));
    window.location.href = 'dashboard.html';
  }
}
```

### 2. Students Data (students.js)
Replace in-memory data with API calls:

```javascript
const API_BASE = 'http://localhost:3001/api';

async function loadStudents() {
  try {
    const response = await fetch(`${API_BASE}/students`);
    const students = await response.json();
    return students;
  } catch (error) {
    console.error('Error loading students:', error);
    return [];
  }
}

async function addStudent(studentData) {
  try {
    const response = await fetch(`${API_BASE}/students`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(studentData)
    });
    return await response.json();
  } catch (error) {
    console.error('Error adding student:', error);
  }
}

async function updateStudent(id, studentData) {
  try {
    const response = await fetch(`${API_BASE}/students/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(studentData)
    });
    return await response.json();
  } catch (error) {
    console.error('Error updating student:', error);
  }
}

async function deleteStudent(id) {
  try {
    const response = await fetch(`${API_BASE}/students/${id}`, {
      method: 'DELETE'
    });
    return await response.json();
  } catch (error) {
    console.error('Error deleting student:', error);
  }
}
```

### 3. Payments (data.js)
Record and retrieve payment statuses:

```javascript
async function recordPayment(studentId, feeType, status, amountPaid = 0) {
  try {
    const response = await fetch(`${API_BASE}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: studentId,
        fee_type: feeType,
        status: status,
        amount_paid: amountPaid
      })
    });
    return await response.json();
  } catch (error) {
    console.error('Error recording payment:', error);
  }
}

async function getStudentPayments(studentId) {
  try {
    const response = await fetch(`${API_BASE}/payments/student/${studentId}`);
    const payments = await response.json();
    return payments;
  } catch (error) {
    console.error('Error fetching payments:', error);
    return [];
  }
}
```

### 4. Receipts (receipts.js)
Generate and manage receipts:

```javascript
async function createReceipt(studentId, feeType, amount, notes = '') {
  try {
    const response = await fetch(`${API_BASE}/receipts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: studentId,
        fee_type: feeType,
        amount: amount,
        notes: notes
      })
    });
    return await response.json();
  } catch (error) {
    console.error('Error creating receipt:', error);
  }
}

async function getReceipts(studentId = null) {
  try {
    let url = `${API_BASE}/receipts`;
    if (studentId) {
      url = `${API_BASE}/receipts/student/${studentId}`;
    }
    const response = await fetch(url);
    return await response.json();
  } catch (error) {
    console.error('Error fetching receipts:', error);
    return [];
  }
}
```

### 5. Reports (reports.js)
Fetch various reports:

```javascript
async function getReportSummary() {
  try {
    const response = await fetch(`${API_BASE}/reports/summary`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching report:', error);
  }
}

async function getReportByCategory() {
  try {
    const response = await fetch(`${API_BASE}/reports/by-category`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching category report:', error);
  }
}

async function getReportByGrade() {
  try {
    const response = await fetch(`${API_BASE}/reports/by-grade`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching grade report:', error);
  }
}

async function getDetailedStudentReport() {
  try {
    const response = await fetch(`${API_BASE}/reports/students/detailed`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching detailed report:', error);
  }
}
```

## Example: Updating Dashboard

Replace the hardcoded data in `dashboard.html`:

```javascript
async function initializeDashboard() {
  const summary = await getReportSummary();
  
  document.getElementById('totalStudents').textContent = summary.totalStudents;
  document.getElementById('totalCollection').textContent = peso(summary.totalReceiptsAmount);
  document.getElementById('pendingPayments').textContent = calculatePendingPayments(summary);
  document.getElementById('netAmount').textContent = peso(summary.netAmount);
}

function calculatePendingPayments(summary) {
  return summary.paymentSummary
    .filter(p => p.status === 'unpaid')
    .reduce((sum, p) => sum + p.count, 0);
}

// Call on page load
initializeDashboard();
```

## Error Handling

Always include error handling in your API calls:

```javascript
async function apiCall(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error);
    showErrorMessage('An error occurred. Please try again.');
    return null;
  }
}
```

## Validation

Validate data before sending to backend:

```javascript
function validateStudentData(data) {
  if (!data.first_name || !data.last_name) {
    throw new Error('First name and last name are required');
  }
  if (!data.grade || !data.section) {
    throw new Error('Grade and section are required');
  }
  return true;
}

async function saveStudent(studentData) {
  try {
    validateStudentData(studentData);
    const result = await addStudent(studentData);
    if (result && result.id) {
      showSuccessMessage('Student saved successfully');
    }
  } catch (error) {
    showErrorMessage(error.message);
  }
}
```
