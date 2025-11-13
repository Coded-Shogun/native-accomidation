-- Extended Schema for Student Portal and Management Features
-- ISO 27001 & SOC 2 Compliant Design

-- Notice Board / Announcements
CREATE TABLE IF NOT EXISTS notices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT CHECK(category IN ('general', 'maintenance', 'event', 'urgent', 'wifi')) NOT NULL,
    priority TEXT CHECK(priority IN ('low', 'normal', 'high', 'urgent')) DEFAULT 'normal',
    property_id INTEGER,
    target_audience TEXT CHECK(target_audience IN ('all', 'property', 'specific_students')) DEFAULT 'all',
    is_active BOOLEAN DEFAULT 1,
    posted_by INTEGER,
    posted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    attachment_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    FOREIGN KEY (posted_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Visitor/Guest Registration
CREATE TABLE IF NOT EXISTS visitors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    property_id INTEGER NOT NULL,
    visitor_name TEXT NOT NULL,
    visitor_id_number TEXT NOT NULL,
    visitor_phone TEXT NOT NULL,
    visit_date DATE NOT NULL,
    visit_time_start TIME NOT NULL,
    visit_time_end TIME,
    visit_purpose TEXT,
    status TEXT CHECK(status IN ('pending', 'approved', 'rejected', 'checked_in', 'checked_out')) DEFAULT 'pending',
    access_code TEXT UNIQUE,
    approved_by INTEGER,
    approved_at DATETIME,
    checked_in_at DATETIME,
    checked_out_at DATETIME,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Laundry/Washing Machines
CREATE TABLE IF NOT EXISTS laundry_machines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    property_id INTEGER NOT NULL,
    machine_number TEXT NOT NULL,
    machine_type TEXT CHECK(machine_type IN ('washer', 'dryer', 'combo')) NOT NULL,
    location TEXT NOT NULL,
    capacity_kg REAL NOT NULL,
    status TEXT CHECK(status IN ('available', 'in_use', 'maintenance', 'out_of_order')) DEFAULT 'available',
    current_user_id INTEGER,
    cycle_start_time DATETIME,
    estimated_end_time DATETIME,
    last_maintenance_date DATE,
    iot_device_id TEXT UNIQUE,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    FOREIGN KEY (current_user_id) REFERENCES students(id) ON DELETE SET NULL,
    UNIQUE(property_id, machine_number)
);

-- Laundry Queue/Reservations
CREATE TABLE IF NOT EXISTS laundry_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    machine_id INTEGER NOT NULL,
    queue_position INTEGER NOT NULL,
    reserved_time DATETIME NOT NULL,
    status TEXT CHECK(status IN ('waiting', 'notified', 'active', 'completed', 'cancelled')) DEFAULT 'waiting',
    notified_at DATETIME,
    started_at DATETIME,
    completed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (machine_id) REFERENCES laundry_machines(id) ON DELETE CASCADE
);

-- WiFi Access Management
CREATE TABLE IF NOT EXISTS wifi_credentials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    property_id INTEGER,
    network_name TEXT NOT NULL,
    password TEXT NOT NULL, -- Should be encrypted
    valid_from DATE NOT NULL,
    valid_until DATE NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Complaints/Feedback System
CREATE TABLE IF NOT EXISTS complaints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    property_id INTEGER NOT NULL,
    category TEXT CHECK(category IN ('accommodation', 'maintenance', 'security', 'noise', 'cleanliness', 'staff', 'facilities', 'other')) NOT NULL,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    severity TEXT CHECK(severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    status TEXT CHECK(status IN ('submitted', 'under_review', 'in_progress', 'resolved', 'closed', 'rejected')) DEFAULT 'submitted',
    is_anonymous BOOLEAN DEFAULT 0,
    assigned_to INTEGER,
    resolution TEXT,
    resolved_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
);

-- Kiosk/Shop Items
CREATE TABLE IF NOT EXISTS kiosk_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    property_id INTEGER,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT CHECK(category IN ('snacks', 'beverages', 'toiletries', 'stationery', 'laundry', 'electronics', 'other')) NOT NULL,
    price REAL NOT NULL,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 10,
    image_url TEXT,
    is_available BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

-- Kiosk Orders
CREATE TABLE IF NOT EXISTS kiosk_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    property_id INTEGER NOT NULL,
    total_amount REAL NOT NULL,
    status TEXT CHECK(status IN ('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled')) DEFAULT 'pending',
    payment_method TEXT CHECK(payment_method IN ('cash', 'card', 'account', 'mobile')) DEFAULT 'account',
    payment_status TEXT CHECK(payment_status IN ('unpaid', 'paid', 'refunded')) DEFAULT 'unpaid',
    pickup_time DATETIME,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

-- Kiosk Order Items
CREATE TABLE IF NOT EXISTS kiosk_order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    item_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price REAL NOT NULL,
    subtotal REAL NOT NULL,
    FOREIGN KEY (order_id) REFERENCES kiosk_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES kiosk_items(id) ON DELETE CASCADE
);

-- Package/Delivery Tracking
CREATE TABLE IF NOT EXISTS deliveries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    property_id INTEGER NOT NULL,
    tracking_number TEXT UNIQUE NOT NULL,
    courier TEXT,
    sender_name TEXT,
    package_description TEXT,
    status TEXT CHECK(status IN ('in_transit', 'delivered', 'ready_for_pickup', 'picked_up', 'returned')) DEFAULT 'in_transit',
    delivered_at DATETIME,
    picked_up_at DATETIME,
    pickup_location TEXT,
    received_by INTEGER,
    signature_url TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    FOREIGN KEY (received_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Scheduled Events/Maintenance
CREATE TABLE IF NOT EXISTS scheduled_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    property_id INTEGER,
    title TEXT NOT NULL,
    description TEXT,
    event_type TEXT CHECK(event_type IN ('maintenance', 'inspection', 'cleaning', 'meeting', 'delivery', 'other')) NOT NULL,
    scheduled_date DATE NOT NULL,
    scheduled_time TIME,
    duration_minutes INTEGER,
    status TEXT CHECK(status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'rescheduled')) DEFAULT 'scheduled',
    assigned_to INTEGER,
    affected_areas TEXT, -- JSON array of room numbers or areas
    notify_students BOOLEAN DEFAULT 0,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- IoT Device Management
CREATE TABLE IF NOT EXISTS iot_devices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    property_id INTEGER NOT NULL,
    device_id TEXT UNIQUE NOT NULL,
    device_type TEXT CHECK(device_type IN ('washing_machine', 'dryer', 'smart_lock', 'sensor_water', 'sensor_electricity', 'security_camera', 'thermostat', 'other')) NOT NULL,
    device_name TEXT NOT NULL,
    location TEXT NOT NULL,
    status TEXT CHECK(status IN ('online', 'offline', 'error', 'maintenance')) DEFAULT 'offline',
    last_seen DATETIME,
    firmware_version TEXT,
    battery_level INTEGER,
    configuration TEXT, -- JSON configuration data
    metrics TEXT, -- JSON metrics data
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

-- IoT Device Readings/Telemetry
CREATE TABLE IF NOT EXISTS iot_readings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id INTEGER NOT NULL,
    reading_type TEXT NOT NULL, -- e.g., 'water_usage', 'electricity', 'temperature', 'status'
    reading_value TEXT NOT NULL, -- Flexible storage for different data types
    unit TEXT, -- e.g., 'kWh', 'liters', 'celsius'
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (device_id) REFERENCES iot_devices(id) ON DELETE CASCADE
);

-- Student Sessions (for security tracking)
CREATE TABLE IF NOT EXISTS student_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    session_token TEXT UNIQUE NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    device_type TEXT,
    login_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
    logout_at DATETIME,
    is_active BOOLEAN DEFAULT 1,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Common Area Bookings (optional - for meeting rooms, study areas)
CREATE TABLE IF NOT EXISTS common_area_bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    property_id INTEGER NOT NULL,
    area_name TEXT NOT NULL,
    student_id INTEGER NOT NULL,
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    purpose TEXT,
    status TEXT CHECK(status IN ('pending', 'confirmed', 'cancelled', 'completed')) DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notices_property ON notices(property_id);
CREATE INDEX IF NOT EXISTS idx_notices_active ON notices(is_active);
CREATE INDEX IF NOT EXISTS idx_visitors_student ON visitors(student_id);
CREATE INDEX IF NOT EXISTS idx_visitors_status ON visitors(status);
CREATE INDEX IF NOT EXISTS idx_laundry_machines_status ON laundry_machines(status);
CREATE INDEX IF NOT EXISTS idx_laundry_queue_student ON laundry_queue(student_id);
CREATE INDEX IF NOT EXISTS idx_complaints_student ON complaints(student_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_kiosk_orders_student ON kiosk_orders(student_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_student ON deliveries(student_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries(status);
CREATE INDEX IF NOT EXISTS idx_iot_devices_property ON iot_devices(property_id);
CREATE INDEX IF NOT EXISTS idx_iot_readings_device ON iot_readings(device_id);
CREATE INDEX IF NOT EXISTS idx_student_sessions_student ON student_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_student_sessions_active ON student_sessions(is_active);

-- ============================================================================
-- BURSARY MANAGEMENT & REPORTING SYSTEM
-- ============================================================================

-- Bursary Providers (NSFAS and other funding organizations)
CREATE TABLE IF NOT EXISTS bursary_providers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    type TEXT CHECK(type IN ('government', 'corporate', 'ngo', 'university', 'private', 'other')) NOT NULL,
    contact_person TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    requirements TEXT, -- JSON: list of requirements/metrics to track
    reporting_frequency TEXT CHECK(reporting_frequency IN ('weekly', 'monthly', 'quarterly', 'semester', 'annual')) DEFAULT 'monthly',
    report_template TEXT, -- JSON: template configuration
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Student Bursaries (links students to their funding sources)
CREATE TABLE IF NOT EXISTS student_bursaries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    bursary_provider_id INTEGER NOT NULL,
    bursary_reference TEXT UNIQUE NOT NULL,
    amount REAL NOT NULL,
    currency TEXT DEFAULT 'ZAR',
    academic_year TEXT NOT NULL, -- e.g., '2025'
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT CHECK(status IN ('pending', 'active', 'suspended', 'completed', 'cancelled')) DEFAULT 'active',
    conditions TEXT, -- JSON: specific conditions for this bursary
    payment_schedule TEXT, -- JSON: payment schedule/milestones
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (bursary_provider_id) REFERENCES bursary_providers(id) ON DELETE CASCADE
);

-- Bursary Requirements (metrics that need to be tracked)
CREATE TABLE IF NOT EXISTS bursary_requirements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bursary_provider_id INTEGER NOT NULL,
    requirement_type TEXT NOT NULL, -- e.g., 'attendance', 'academic_performance', 'conduct', 'residence_verification'
    requirement_name TEXT NOT NULL,
    description TEXT,
    metric_type TEXT CHECK(metric_type IN ('percentage', 'count', 'boolean', 'grade', 'text')) NOT NULL,
    threshold_value TEXT, -- Minimum acceptable value
    frequency TEXT CHECK(frequency IN ('daily', 'weekly', 'monthly', 'semester', 'annual')) NOT NULL,
    is_mandatory BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bursary_provider_id) REFERENCES bursary_providers(id) ON DELETE CASCADE
);

-- Residence Verification (proof of staying at accommodation)
CREATE TABLE IF NOT EXISTS residence_verifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    property_id INTEGER NOT NULL,
    verification_date DATE NOT NULL,
    verification_type TEXT CHECK(verification_type IN ('checkin', 'weekly', 'monthly', 'random', 'audit')) NOT NULL,
    verified_by INTEGER,
    verification_method TEXT CHECK(verification_method IN ('physical', 'biometric', 'access_log', 'photo', 'video', 'other')) NOT NULL,
    is_present BOOLEAN NOT NULL,
    notes TEXT,
    evidence_url TEXT, -- URL to photo/video evidence
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Academic Performance Tracking (for bursary requirements)
CREATE TABLE IF NOT EXISTS academic_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    academic_year TEXT NOT NULL,
    semester TEXT NOT NULL,
    course_name TEXT NOT NULL,
    course_code TEXT,
    credits INTEGER,
    grade TEXT,
    percentage REAL,
    status TEXT CHECK(status IN ('passed', 'failed', 'in_progress', 'dropped', 'deferred')) NOT NULL,
    submitted_date DATE,
    verified_by INTEGER,
    verification_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Student Conduct Records (disciplinary issues for bursary compliance)
CREATE TABLE IF NOT EXISTS conduct_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    property_id INTEGER NOT NULL,
    incident_date DATE NOT NULL,
    incident_type TEXT CHECK(incident_type IN ('noise', 'damage', 'violation', 'dispute', 'safety', 'other')) NOT NULL,
    severity TEXT CHECK(severity IN ('minor', 'moderate', 'serious', 'critical')) NOT NULL,
    description TEXT NOT NULL,
    action_taken TEXT,
    resolved BOOLEAN DEFAULT 0,
    resolved_date DATE,
    reported_by INTEGER,
    notes TEXT,
    affects_bursary BOOLEAN DEFAULT 0, -- Flag if this affects bursary eligibility
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    FOREIGN KEY (reported_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Bursary Reports (generated reports for bursary providers)
CREATE TABLE IF NOT EXISTS bursary_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bursary_provider_id INTEGER NOT NULL,
    report_period_start DATE NOT NULL,
    report_period_end DATE NOT NULL,
    report_type TEXT CHECK(report_type IN ('individual', 'aggregate', 'compliance', 'financial', 'custom')) NOT NULL,
    status TEXT CHECK(status IN ('draft', 'pending_review', 'approved', 'sent', 'archived')) DEFAULT 'draft',
    total_students INTEGER,
    compliant_students INTEGER,
    non_compliant_students INTEGER,
    report_data TEXT, -- JSON: detailed report data
    report_file_url TEXT, -- URL to PDF/Excel report
    generated_by INTEGER,
    generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    reviewed_by INTEGER,
    reviewed_at DATETIME,
    sent_at DATETIME,
    notes TEXT,
    FOREIGN KEY (bursary_provider_id) REFERENCES bursary_providers(id) ON DELETE CASCADE,
    FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Bursary Report Items (individual student entries in reports)
CREATE TABLE IF NOT EXISTS bursary_report_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    student_bursary_id INTEGER NOT NULL,
    compliance_status TEXT CHECK(compliance_status IN ('compliant', 'warning', 'non_compliant')) NOT NULL,
    attendance_rate REAL, -- Percentage
    residence_verified BOOLEAN,
    academic_status TEXT,
    conduct_status TEXT CHECK(conduct_status IN ('good', 'warning', 'poor')) DEFAULT 'good',
    issues_count INTEGER DEFAULT 0,
    metrics TEXT, -- JSON: all tracked metrics for this student
    recommendations TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (report_id) REFERENCES bursary_reports(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (student_bursary_id) REFERENCES student_bursaries(id) ON DELETE CASCADE
);

-- Bursary Compliance Alerts
CREATE TABLE IF NOT EXISTS bursary_compliance_alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    student_bursary_id INTEGER NOT NULL,
    alert_type TEXT CHECK(alert_type IN ('attendance', 'residence', 'academic', 'conduct', 'payment', 'other')) NOT NULL,
    severity TEXT CHECK(severity IN ('info', 'warning', 'critical')) NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT CHECK(status IN ('open', 'acknowledged', 'resolved', 'escalated')) DEFAULT 'open',
    acknowledged_by INTEGER,
    acknowledged_at DATETIME,
    resolved_at DATETIME,
    resolution_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (student_bursary_id) REFERENCES student_bursaries(id) ON DELETE CASCADE,
    FOREIGN KEY (acknowledged_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Bursary Access Logs (who accessed which bursary reports)
CREATE TABLE IF NOT EXISTS bursary_access_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    bursary_provider_id INTEGER,
    report_id INTEGER,
    student_id INTEGER,
    action TEXT NOT NULL, -- e.g., 'view_report', 'download_report', 'view_student', 'export_data'
    ip_address TEXT,
    user_agent TEXT,
    accessed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (bursary_provider_id) REFERENCES bursary_providers(id) ON DELETE SET NULL,
    FOREIGN KEY (report_id) REFERENCES bursary_reports(id) ON DELETE SET NULL,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL
);

-- Create indexes for bursary tables
CREATE INDEX IF NOT EXISTS idx_student_bursaries_student ON student_bursaries(student_id);
CREATE INDEX IF NOT EXISTS idx_student_bursaries_provider ON student_bursaries(bursary_provider_id);
CREATE INDEX IF NOT EXISTS idx_student_bursaries_status ON student_bursaries(status);
CREATE INDEX IF NOT EXISTS idx_bursary_requirements_provider ON bursary_requirements(bursary_provider_id);
CREATE INDEX IF NOT EXISTS idx_residence_verifications_student ON residence_verifications(student_id);
CREATE INDEX IF NOT EXISTS idx_residence_verifications_date ON residence_verifications(verification_date);
CREATE INDEX IF NOT EXISTS idx_academic_records_student ON academic_records(student_id);
CREATE INDEX IF NOT EXISTS idx_academic_records_year ON academic_records(academic_year);
CREATE INDEX IF NOT EXISTS idx_conduct_records_student ON conduct_records(student_id);
CREATE INDEX IF NOT EXISTS idx_conduct_records_date ON conduct_records(incident_date);
CREATE INDEX IF NOT EXISTS idx_bursary_reports_provider ON bursary_reports(bursary_provider_id);
CREATE INDEX IF NOT EXISTS idx_bursary_reports_status ON bursary_reports(status);
CREATE INDEX IF NOT EXISTS idx_bursary_report_items_report ON bursary_report_items(report_id);
CREATE INDEX IF NOT EXISTS idx_bursary_report_items_student ON bursary_report_items(student_id);
CREATE INDEX IF NOT EXISTS idx_bursary_compliance_alerts_student ON bursary_compliance_alerts(student_id);
CREATE INDEX IF NOT EXISTS idx_bursary_compliance_alerts_status ON bursary_compliance_alerts(status);
CREATE INDEX IF NOT EXISTS idx_bursary_access_logs_user ON bursary_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_bursary_access_logs_accessed_at ON bursary_access_logs(accessed_at);
