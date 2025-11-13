-- Student Accommodation Management System Database Schema
-- NSFAS Compliant Design

-- Properties Table
CREATE TABLE IF NOT EXISTS properties (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    total_beds INTEGER NOT NULL,
    available_beds INTEGER NOT NULL,
    proof_of_ownership TEXT,
    registration_status TEXT CHECK(registration_status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    nsfas_accredited BOOLEAN DEFAULT 0,
    accreditation_date DATE,
    contract_start_date DATE,
    contract_end_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Rooms Table
CREATE TABLE IF NOT EXISTS rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    property_id INTEGER NOT NULL,
    room_number TEXT NOT NULL,
    room_type TEXT CHECK(room_type IN ('single', 'shared', 'studio')) NOT NULL,
    size_sqm REAL NOT NULL,
    max_occupants INTEGER NOT NULL,
    current_occupants INTEGER DEFAULT 0,
    monthly_rate REAL NOT NULL,
    status TEXT CHECK(status IN ('available', 'occupied', 'maintenance')) DEFAULT 'available',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

-- Students Table
CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_number TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    id_number TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    nsfas_beneficiary BOOLEAN DEFAULT 0,
    nsfas_reference TEXT,
    institution TEXT NOT NULL,
    campus TEXT NOT NULL,
    distance_from_campus_km REAL,
    eligible_for_accommodation BOOLEAN DEFAULT 0,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Leases Table
CREATE TABLE IF NOT EXISTS leases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    room_id INTEGER NOT NULL,
    property_id INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    monthly_amount REAL NOT NULL,
    annual_amount REAL NOT NULL,
    nsfas_cap_compliant BOOLEAN DEFAULT 1,
    lease_agreement_path TEXT,
    status TEXT CHECK(status IN ('active', 'expired', 'terminated')) DEFAULT 'active',
    signed_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

-- Access Control Table
CREATE TABLE IF NOT EXISTS access_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    property_id INTEGER NOT NULL,
    access_type TEXT CHECK(access_type IN ('entry', 'exit')) NOT NULL,
    access_method TEXT CHECK(access_method IN ('key_card', 'pin', 'biometric', 'manual')) DEFAULT 'manual',
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

-- Maintenance Requests Table
CREATE TABLE IF NOT EXISTS maintenance_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    property_id INTEGER NOT NULL,
    room_id INTEGER,
    student_id INTEGER,
    category TEXT CHECK(category IN ('washing_machine', 'plumbing', 'electrical', 'security', 'cleaning', 'other')) NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    priority TEXT CHECK(priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
    status TEXT CHECK(status IN ('open', 'in_progress', 'completed', 'cancelled')) DEFAULT 'open',
    reported_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    assigned_to TEXT,
    completed_date DATETIME,
    cost REAL,
    notes TEXT,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL
);

-- NSFAS Compliance Tracking Table
CREATE TABLE IF NOT EXISTS nsfas_compliance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    property_id INTEGER NOT NULL,
    compliance_category TEXT NOT NULL,
    requirement_description TEXT NOT NULL,
    status TEXT CHECK(status IN ('compliant', 'non_compliant', 'pending_review')) DEFAULT 'pending_review',
    evidence_document_path TEXT,
    last_inspection_date DATE,
    next_inspection_date DATE,
    inspector_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

-- Facilities Table (for tracking facility ratios required by NSFAS)
CREATE TABLE IF NOT EXISTS facilities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    property_id INTEGER NOT NULL,
    facility_type TEXT CHECK(facility_type IN ('sink', 'shower', 'toilet', 'washing_machine', 'kitchen', 'study_area')) NOT NULL,
    quantity INTEGER NOT NULL,
    working_condition INTEGER NOT NULL, -- number in working condition
    last_maintenance_date DATE,
    notes TEXT,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

-- Users/Staff Table (for system access)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT CHECK(role IN ('admin', 'manager', 'maintenance', 'viewer')) DEFAULT 'viewer',
    full_name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Payments/Transactions Table
CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lease_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    payment_date DATE NOT NULL,
    payment_method TEXT CHECK(payment_method IN ('nsfas', 'cash', 'eft', 'other')) DEFAULT 'nsfas',
    reference_number TEXT,
    status TEXT CHECK(status IN ('pending', 'received', 'failed')) DEFAULT 'pending',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lease_id) REFERENCES leases(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_students_nsfas ON students(nsfas_beneficiary);
CREATE INDEX IF NOT EXISTS idx_leases_status ON leases(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON maintenance_requests(status);
CREATE INDEX IF NOT EXISTS idx_access_logs_timestamp ON access_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);
