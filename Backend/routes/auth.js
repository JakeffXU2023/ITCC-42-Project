const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const { getAsync, allAsync, runAsync } = require('../db-connection');

const HASH_ITERATIONS = 120000;

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.pbkdf2Sync(String(password), salt, HASH_ITERATIONS, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedPassword) {
  const stored = String(storedPassword || '');
  if (!stored) return false;
  if (!stored.includes(':')) {
    return String(password) === stored;
  }

  const [salt, hash] = stored.split(':');
  const nextHash = crypto.pbkdf2Sync(String(password), salt, HASH_ITERATIONS, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(nextHash));
}

router.get('/status', async (req, res) => {
  try {
    const user = await getAsync('SELECT id, username FROM users ORDER BY id ASC LIMIT 1');
    res.json({
      hasAccount: Boolean(user),
      username: user?.username || '',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/register', async (req, res) => {
  try {
    const username = String(req.body.username || '').trim();
    const password = String(req.body.password || '').trim();
    const confirmPassword = String(req.body.confirmPassword || '').trim();

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }

    const existingUser = await getAsync('SELECT id FROM users ORDER BY id ASC LIMIT 1');
    if (existingUser) {
      return res.status(409).json({ error: 'An account already exists.' });
    }

    const passwordHash = hashPassword(password);
    const result = await runAsync(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
      [username, passwordHash, 'cashier']
    );

    res.status(201).json({
      id: result.id,
      username,
      message: 'Account created successfully.',
    });
  } catch (err) {
    if (String(err.message || '').includes('UNIQUE')) {
      res.status(409).json({ error: 'Username already exists.' });
      return;
    }
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const username = String(req.body.username || '').trim();
    const password = String(req.body.password || '').trim();

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const user = await getAsync('SELECT id, username, password, role FROM users WHERE lower(trim(username)) = lower(trim(?)) LIMIT 1', [username]);
    if (!user || !verifyPassword(password, user.password)) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    res.json({
      id: user.id,
      username: user.username,
      role: user.role,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/users', async (req, res) => {
  try {
    const users = await allAsync('SELECT id, username, role, created_at FROM users ORDER BY id ASC');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
