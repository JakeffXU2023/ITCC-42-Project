const fs = require('fs');

function initializeTables(db) {
  return new Promise((resolve, reject) => {
    try {
      db.serialize(() => {
        // Students table
        db.run(`
          CREATE TABLE IF NOT EXISTS students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            grade TEXT NOT NULL,
            section TEXT NOT NULL,
            has_sibling INTEGER NOT NULL DEFAULT 0,
            spta DECIMAL(10, 2) DEFAULT 0,
            school_paper DECIMAL(10, 2) DEFAULT 0,
            school_org DECIMAL(10, 2) DEFAULT 0,
            sports DECIMAL(10, 2) DEFAULT 0,
            insurance_amount DECIMAL(10, 2) DEFAULT 0,
            insurance_choice TEXT,
            graduation DECIMAL(10, 2) DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `, (err) => {
          if (err) console.error('Error creating students table:', err);
          else console.log('✓ Students table ensured');
        });

        // Payment status table
        db.run(`
          CREATE TABLE IF NOT EXISTS payment_status (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER NOT NULL,
            fee_type TEXT NOT NULL,
            status TEXT NOT NULL,
            amount_paid DECIMAL(10, 2) DEFAULT 0,
            date_paid DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
          )
        `, (err) => {
          if (err) console.error('Error creating payment_status table:', err);
          else console.log('✓ Payment status table ensured');
        });

        // Receipts table
        db.run(`
          CREATE TABLE IF NOT EXISTS receipts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            receipt_number TEXT UNIQUE NOT NULL,
            student_id INTEGER NOT NULL,
            fee_type TEXT NOT NULL,
            amount DECIMAL(10, 2) NOT NULL,
            payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            notes TEXT,
            fees TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
          )
        `, (err) => {
          if (err) console.error('Error creating receipts table:', err);
          else console.log('✓ Receipts table ensured');
        });

        db.all(`PRAGMA table_info(receipts)`, (err, columns) => {
          if (!err && columns && !columns.find((col) => col.name === 'fees')) {
            db.run(`ALTER TABLE receipts ADD COLUMN fees TEXT`, (alterErr) => {
              if (alterErr) console.error('Error adding fees column to receipts:', alterErr);
              else console.log('✓ Added missing fees column to receipts table');
            });
          }
        });

        // Fees table
        db.run(`
          CREATE TABLE IF NOT EXISTS fees (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            amount DECIMAL(10, 2) NOT NULL,
            scope TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `, (err) => {
          if (err) console.error('Error creating fees table:', err);
          else console.log('✓ Fees table ensured');
        });

        // Disbursements table
        db.run(`
          CREATE TABLE IF NOT EXISTS disbursements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            purpose TEXT NOT NULL,
            category TEXT NOT NULL,
            amount DECIMAL(10, 2) NOT NULL,
            disbursement_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            created_by TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `, (err) => {
          if (err) console.error('Error creating disbursements table:', err);
          else console.log('✓ Disbursements table ensured');
        });

        // Users table for authentication
        db.run(`
          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'cashier',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `, (err) => {
          if (err) console.error('Error creating users table:', err);
          else console.log('✓ Users table ensured');
        });

        // Insert default fees
        const defaultFees = [
          { name: 'SPTA Membership', amount: 150, scope: 'All' },
          { name: 'School Paper', amount: 50, scope: 'All' },
          { name: 'School Organization', amount: 100, scope: 'All' },
          { name: 'Sports', amount: 200, scope: 'All' },
          { name: 'Insurance', amount: 75, scope: 'All' },
          { name: 'Graduation Fee', amount: 500, scope: 'Grade 10 & 12' }
        ];

        const stmt = db.prepare(`INSERT OR IGNORE INTO fees (name, amount, scope) VALUES (?, ?, ?)`);
        defaultFees.forEach(fee => {
          stmt.run(fee.name, fee.amount, fee.scope);
        });
        stmt.finalize((err) => {
          if (err) console.error('Error inserting default fees:', err);
          else console.log('✓ Default fees ensured');
        });

        // Insert default admin user
        db.run(`INSERT OR IGNORE INTO users (username, password, role) VALUES ('admin', '1234', 'admin')`, (err) => {
          if (err) console.error('Error inserting default user:', err);
          else console.log('✓ Default admin user ensured (username: admin, password: 1234)');
        });

        // Allow a short delay for all statements to complete
        setTimeout(() => resolve(), 300);
      });
    } catch (e) {
      reject(e);
    }
  });
}

module.exports = { initializeTables };
