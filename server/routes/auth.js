const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { runQuery, getOne } = require('../database/init');
const { JWT_SECRET } = require('../middleware/auth');

// Register new user
router.post('/register', async (req, res) => {
    try {
        const { username, password, email, role, full_name } = req.body;

        // Check if user already exists
        const existingUser = await getOne(
            'SELECT id FROM users WHERE username = ? OR email = ?',
            [username, email]
        );

        if (existingUser) {
            return res.status(400).json({
                error: 'Username or email already exists'
            });
        }

        // Hash password
        const password_hash = await bcrypt.hash(password, 10);

        // Create user
        const sql = `
            INSERT INTO users (username, password_hash, email, role, full_name)
            VALUES (?, ?, ?, ?, ?)
        `;

        const result = await runQuery(sql, [
            username,
            password_hash,
            email,
            role || 'viewer',
            full_name
        ]);

        const newUser = await getOne('SELECT id, username, email, role, full_name FROM users WHERE id = ?', [result.id]);

        res.status(201).json({
            message: 'User created successfully',
            user: newUser
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Find user
        const user = await getOne(
            'SELECT * FROM users WHERE username = ?',
            [username]
        );

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password_hash);

        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                id: user.id,
                username: user.username,
                role: user.role
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                full_name: user.full_name
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create default admin user (for initial setup)
router.post('/setup-admin', async (req, res) => {
    try {
        // Check if any admin already exists
        const existingAdmin = await getOne(
            'SELECT id FROM users WHERE role = "admin"'
        );

        if (existingAdmin) {
            return res.status(400).json({
                error: 'Admin user already exists'
            });
        }

        // Create default admin
        const password_hash = await bcrypt.hash('admin123', 10);

        const sql = `
            INSERT INTO users (username, password_hash, email, role, full_name)
            VALUES ('admin', ?, 'admin@accommodation.local', 'admin', 'System Administrator')
        `;

        await runQuery(sql, [password_hash]);

        res.json({
            message: 'Default admin user created successfully',
            credentials: {
                username: 'admin',
                password: 'admin123',
                note: 'Please change this password immediately after first login'
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
