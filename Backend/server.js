const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { initializeDatabase } = require('./db-connection');
const studentsRoute = require('./routes/students');
const paymentsRoute = require('./routes/payments');
const receiptsRoute = require('./routes/receipts');
const reportsRoute = require('./routes/reports');
const feesRoute = require('./routes/fees');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/api/students', studentsRoute);
app.use('/api/payments', paymentsRoute);
app.use('/api/receipts', receiptsRoute);
app.use('/api/fees', feesRoute);
app.use('/api/reports', reportsRoute);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Initialize database and start server
initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`\n✓ PTA Cashiering System Backend running on http://localhost:${PORT}`);
      console.log(`\nAvailable endpoints:`);
      console.log(`  GET  /api/health`);
      console.log(`  GET  /api/students`);
      console.log(`  POST /api/students`);
      console.log(`  GET  /api/students/:id`);
      console.log(`  PUT  /api/students/:id`);
      console.log(`  DELETE /api/students/:id`);
      console.log(`  POST /api/payments`);
      console.log(`  GET  /api/payments/student/:studentId`);
      console.log(`  POST /api/receipts`);
      console.log(`  GET  /api/receipts`);
      console.log(`  GET  /api/reports/summary`);
      console.log(`  GET  /api/reports/by-category`);
    });
  })
  .catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });
