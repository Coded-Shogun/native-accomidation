const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const DB_PATH = process.env.DB_PATH || './database/accommodation.db';
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');
const SCHEMA_EXTENSIONS_PATH = path.join(__dirname, 'schema-extensions.sql');

// Ensure database directory exists
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

// Initialize database
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database');
    }
});

// Initialize schema
const initDatabase = () => {
    return new Promise((resolve, reject) => {
        const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');

        // First, run base schema
        db.exec(schema, (err) => {
            if (err) {
                console.error('Error initializing database schema:', err.message);
                reject(err);
            } else {
                console.log('Base database schema initialized successfully');

                // Then, run schema extensions if file exists
                if (fs.existsSync(SCHEMA_EXTENSIONS_PATH)) {
                    const schemaExtensions = fs.readFileSync(SCHEMA_EXTENSIONS_PATH, 'utf8');
                    db.exec(schemaExtensions, (extErr) => {
                        if (extErr) {
                            console.error('Error initializing schema extensions:', extErr.message);
                            reject(extErr);
                        } else {
                            console.log('Schema extensions initialized successfully');
                            resolve();
                        }
                    });
                } else {
                    resolve();
                }
            }
        });
    });
};

// Helper function to run queries
const runQuery = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) {
                reject(err);
            } else {
                resolve({ id: this.lastID, changes: this.changes });
            }
        });
    });
};

// Helper function to get single row
const getOne = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
};

// Helper function to get all rows
const getAll = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
};

module.exports = {
    db,
    initDatabase,
    runQuery,
    getOne,
    getAll
};
