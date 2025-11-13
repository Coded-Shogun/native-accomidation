require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDatabase } = require('./database/init');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/students', require('./routes/students'));
app.use('/api/properties', require('./routes/properties'));
app.use('/api/rooms', require('./routes/rooms'));
app.use('/api/leases', require('./routes/leases'));
app.use('/api/access', require('./routes/access'));
app.use('/api/maintenance', require('./routes/maintenance'));
app.use('/api/compliance', require('./routes/compliance'));
app.use('/api/facilities', require('./routes/facilities'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/auth', require('./routes/auth'));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Student Accommodation Management System API' });
});

// Initialize database and start server
initDatabase()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
        });
    })
    .catch((err) => {
        console.error('Failed to initialize database:', err);
        process.exit(1);
    });

module.exports = app;
