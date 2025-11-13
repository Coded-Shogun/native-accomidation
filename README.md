# Student Accommodation Management System

A comprehensive NSFAS-compliant student accommodation management system designed to help property owners manage student housing, track maintenance, monitor compliance, and qualify for NSFAS funding.

## Features

### Core Functionality

- **Student Account Management**
  - Student registration and profile management
  - NSFAS beneficiary tracking
  - Eligibility verification (20km distance rule)
  - Emergency contact information

- **Property Management**
  - Multi-property support
  - Room allocation and occupancy tracking
  - Bed registration and availability
  - NSFAS accreditation status

- **Lease Management**
  - Digital lease agreements
  - NSFAS cap compliance (R45,000 annual limit)
  - Lease expiration tracking
  - Payment history

- **Access Control System**
  - Entry/exit logging
  - Multiple access methods (key card, PIN, biometric, manual)
  - Real-time occupancy tracking
  - Access history reports

- **Maintenance Management**
  - Maintenance request tracking
  - Washing machine-specific tracking
  - Priority-based workflow
  - Cost tracking and reporting
  - Status updates (open, in progress, completed)

- **NSFAS Compliance Tracking**
  - Comprehensive compliance checklist
  - Facility ratio monitoring (sinks, showers)
  - Room size verification
  - Document management
  - Inspection scheduling
  - Compliance reporting

- **Bursary Management System** ⭐ NEW
  - Manage funding organizations (NSFAS, corporate sponsors, NGOs)
  - Assign and track student bursaries
  - Record residence verifications for NSFAS compliance
  - Automated compliance calculation (attendance, academic, conduct)
  - Generate compliance reports for bursary providers
  - Real-time compliance alerts and monitoring
  - Support for multiple bursary providers per student

- **Student Portal**
  - View accommodation and lease details
  - Submit and track maintenance requests
  - Access notices and announcements
  - Manage laundry bookings
  - Register visitors
  - Lodge complaints
  - View WiFi access information
  - Track parcel deliveries
  - Self-service kiosk management

- **Dashboard & Reporting**
  - Real-time statistics
  - Occupancy rates
  - Maintenance summaries
  - Compliance scores
  - Upcoming lease expirations
  - Bursary compliance dashboard

## NSFAS Requirements Addressed

This system helps you meet all NSFAS accreditation requirements:

1. **Documentation** - Track proof of ownership, bed registration, lease agreements
2. **Health & Safety** - Monitor fire safety, security systems, emergency equipment
3. **Facilities** - Ensure 1:4 sink ratio and 1:7 shower ratio compliance
4. **Room Specifications** - Verify single rooms > 8 sqm
5. **Security** - Log access control and security measures
6. **Annual Cap** - Automatic compliance checking for R45,000 limit
7. **Distance Rule** - Automatic eligibility calculation for 20km requirement

## Technology Stack

### Backend
- **Node.js** with Express.js
- **SQLite** database
- RESTful API architecture
- JWT authentication support

### Frontend
- **React** 18
- **React Router** for navigation
- **Axios** for API calls
- Responsive design

## Installation & Setup

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Step 1: Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd native-accomidation

# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### Step 2: Configure Environment

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```
PORT=5000
NODE_ENV=development
JWT_SECRET=your-secret-key-change-this-in-production
DB_PATH=./database/accommodation.db
UPLOAD_PATH=./uploads
```

### Step 3: Initialize Database

The database will be automatically created when you start the server for the first time.

### Step 4: Start the Application

#### Development Mode (Both servers)

```bash
# Terminal 1 - Start backend server
npm run dev

# Terminal 2 - Start frontend server
cd client
npm start
```

Or use concurrently to run both:
```bash
npm run dev:full
```

#### Production Mode

```bash
# Build frontend
npm run build

# Start backend (serves built frontend)
npm start
```

### Step 5: Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## API Documentation

### Students

- `GET /api/students` - Get all students
- `GET /api/students/:id` - Get student by ID
- `POST /api/students` - Create new student
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student

### Properties

- `GET /api/properties` - Get all properties
- `GET /api/properties/:id` - Get property by ID
- `POST /api/properties` - Create new property
- `PUT /api/properties/:id` - Update property
- `DELETE /api/properties/:id` - Delete property

### Rooms

- `GET /api/rooms` - Get all rooms
- `GET /api/rooms/:id` - Get room by ID
- `POST /api/rooms` - Create new room
- `PUT /api/rooms/:id` - Update room
- `DELETE /api/rooms/:id` - Delete room

### Leases

- `GET /api/leases` - Get all leases
- `GET /api/leases/:id` - Get lease by ID
- `POST /api/leases` - Create new lease
- `PUT /api/leases/:id` - Update lease
- `DELETE /api/leases/:id` - Delete lease

### Access Control

- `GET /api/access` - Get access logs
- `POST /api/access` - Log access event
- `GET /api/access/stats/:property_id` - Get access statistics

### Maintenance

- `GET /api/maintenance` - Get all maintenance requests
- `GET /api/maintenance/:id` - Get maintenance request by ID
- `POST /api/maintenance` - Create maintenance request
- `PUT /api/maintenance/:id` - Update maintenance request
- `DELETE /api/maintenance/:id` - Delete maintenance request
- `GET /api/maintenance/stats/:property_id` - Get maintenance statistics

### NSFAS Compliance

- `GET /api/compliance/property/:property_id` - Get compliance records
- `GET /api/compliance/summary/:property_id` - Get compliance summary
- `GET /api/compliance/requirements` - Get NSFAS requirements template
- `POST /api/compliance` - Create compliance record
- `PUT /api/compliance/:id` - Update compliance record
- `POST /api/compliance/initialize/:property_id` - Initialize compliance checklist

### Dashboard

- `GET /api/dashboard/overview` - Get dashboard statistics
- `GET /api/dashboard/property/:property_id` - Get property-specific dashboard

### Bursary Providers

- `GET /api/management/bursary-providers` - Get all bursary providers
- `GET /api/management/bursary-providers/:id` - Get provider by ID with requirements
- `POST /api/management/bursary-providers` - Create new provider
- `PUT /api/management/bursary-providers/:id` - Update provider
- `POST /api/management/bursary-providers/:id/requirements` - Add requirement to provider

### Student Bursaries

- `GET /api/management/student-bursaries` - Get all student bursaries (filterable)
- `GET /api/management/student-bursaries/:id` - Get bursary details with alerts
- `POST /api/management/student-bursaries` - Assign new bursary to student
- `PUT /api/management/student-bursaries/:id/status` - Update bursary status
- `GET /api/management/student-bursaries/stats/summary` - Get summary statistics

### Residence Verification

- `GET /api/management/residence-verification` - Get verification history
- `GET /api/management/residence-verification/student/:id` - Get student verifications
- `POST /api/management/residence-verification` - Record single verification
- `POST /api/management/residence-verification/bulk` - Bulk verify from access logs

### Bursary Reports

- `GET /api/management/bursary-reports` - Get all reports (filterable)
- `GET /api/management/bursary-reports/:id` - Get report details
- `POST /api/management/bursary-reports/generate` - Generate new compliance report
- `PUT /api/management/bursary-reports/:id/status` - Update report status

### Student Portal

- `GET /api/student/accommodation` - Get student's accommodation details
- `GET /api/student/maintenance-requests` - Get student's maintenance requests
- `POST /api/student/maintenance-requests` - Submit new maintenance request
- `GET /api/student/notices` - Get notices for student's property
- `GET /api/student/laundry-bookings` - Get student's laundry bookings
- `POST /api/student/laundry-bookings` - Create laundry booking
- `POST /api/student/visitors` - Register visitor
- `POST /api/student/complaints` - Lodge complaint
- `GET /api/student/kiosk-orders` - Get student's kiosk orders
- `POST /api/student/kiosk-orders` - Create kiosk order
- `GET /api/student/wifi-access` - Get WiFi access information
- `GET /api/student/deliveries` - Get student's deliveries

## User Guide

### Getting Started

1. **Add Your Properties**
   - Navigate to "Properties" section
   - Click "+ Add Property"
   - Fill in property details (name, address, total beds)
   - Save the property

2. **Initialize NSFAS Compliance**
   - Select a property
   - Click "Initialize Compliance"
   - This creates a complete compliance checklist

3. **Add Students**
   - Navigate to "Students" section
   - Click "+ Add Student"
   - Enter student information
   - System automatically calculates eligibility based on distance

4. **Create Leases**
   - Use the API or extend the frontend to create leases
   - System automatically checks NSFAS cap compliance

5. **Log Maintenance**
   - Navigate to "Maintenance" section
   - Click "+ New Request"
   - Select property, category, and priority
   - Track washing machine and other maintenance

6. **Monitor Compliance**
   - Navigate to "NSFAS Compliance" section
   - Select a property to view compliance status
   - Update compliance items as inspections are completed

7. **Track Access**
   - Navigate to "Access Control" section
   - Log student entries and exits
   - Monitor real-time occupancy

8. **Manage Bursaries**
   - Navigate to "Bursary Management" section
   - Add bursary providers (NSFAS, etc.)
   - Assign bursaries to students
   - Record residence verifications for compliance
   - Generate reports for bursary providers

9. **Student Portal Access**
   - Students can access their portal at `/student`
   - View accommodation details
   - Submit maintenance requests
   - Book laundry slots
   - Register visitors
   - Track deliveries

### NSFAS Compliance Checklist

The system tracks these key compliance areas:

- **Documentation**: Ownership proof, bed registration, lease agreements
- **Health & Safety**: Fire safety, security, emergency equipment
- **Facilities**: Water, electricity, sanitation, sink/shower ratios
- **Room Specifications**: Size requirements, ventilation, lighting
- **Security**: 24/7 security, CCTV, perimeter fencing

## Database Schema

The system uses SQLite with the following main tables:

### Core Tables
- `properties` - Property information and accreditation status
- `rooms` - Individual rooms and occupancy
- `students` - Student profiles and eligibility
- `leases` - Lease agreements and payments
- `access_logs` - Entry/exit tracking
- `maintenance_requests` - Maintenance tickets
- `nsfas_compliance` - Compliance tracking
- `facilities` - Facility inventory and ratios
- `payments` - Payment history

### Bursary Management Tables
- `bursary_providers` - Funding organizations (NSFAS, sponsors)
- `bursary_requirements` - Provider-specific compliance requirements
- `student_bursaries` - Student funding assignments and tracking
- `residence_verifications` - Student attendance/residence logs
- `academic_records` - Student academic performance tracking
- `conduct_records` - Disciplinary incidents affecting bursaries
- `bursary_reports` - Generated compliance reports
- `report_student_data` - Individual student data in reports
- `bursary_compliance_alerts` - Automated compliance warnings
- `report_access_logs` - Audit trail for report access

### Student Portal Tables
- `notices` - Property announcements and notices
- `laundry_machines` - Washing machine inventory
- `laundry_bookings` - Student laundry reservations
- `visitor_registrations` - Registered visitors
- `student_complaints` - Student-submitted complaints
- `kiosk_products` - Products available for purchase
- `kiosk_orders` - Student kiosk orders
- `wifi_access_points` - WiFi network information
- `parcel_deliveries` - Student package tracking

## Troubleshooting

### Database Issues

If you encounter database errors, delete the database and restart:
```bash
rm database/accommodation.db
npm start
```

### Port Already in Use

Change the PORT in `.env` file or kill the process:
```bash
# Find process on port 5000
lsof -ti:5000

# Kill the process
kill -9 <PID>
```

### Frontend Not Connecting to Backend

Ensure the proxy is set correctly in `client/package.json`:
```json
"proxy": "http://localhost:5000"
```

## Documentation

### User Guides
- **[Bursary Management User Guide](docs/BURSARY_MANAGEMENT_USER_GUIDE.md)** - Complete guide for using the bursary management interface
- **[Bursary Reporting API Guide](docs/BURSARY_REPORTING_GUIDE.md)** - Technical API documentation for bursary reports
- **[Email Notifications Quick Start](docs/QUICK_START_EMAIL_NOTIFICATIONS.md)** - Setting up email notifications
- **[Feature Roadmap](docs/FEATURE_ROADMAP.md)** - Planned enhancements and development timeline

### Compliance Documentation
- **[ISO 27001 Compliance](docs/ISO27001_COMPLIANCE.md)** - Information security compliance details
- **[SOC 2 Compliance](docs/SOC2_COMPLIANCE.md)** - Service organization control compliance
- **[Compliance Assessment](docs/COMPLIANCE_ASSESSMENT.md)** - System compliance assessment

## Recently Completed Features ✅

- ✅ Email notification system for students and staff
- ✅ Comprehensive bursary management system
- ✅ NSFAS-compliant residence verification tracking
- ✅ Automated compliance reporting for bursary providers
- ✅ Student self-service portal with multiple features
- ✅ Laundry booking system
- ✅ Visitor registration and tracking
- ✅ Student complaints management
- ✅ Kiosk ordering system
- ✅ Parcel delivery tracking
- ✅ Real-time compliance alerts
- ✅ Academic and conduct record tracking

## Future Enhancements

- Document upload and management system
- Payment integration with NSFAS portal
- Mobile native app for students (iOS/Android)
- QR code-based access control
- AI-powered predictive analytics
- Multi-tenancy support for SaaS model
- Advanced data visualization and reporting
- Bulk student import functionality
- Multi-language support
- WhatsApp Business API integration
- Virtual property tours
- Energy and resource management
- Biometric access integration

## Contributing

This is a custom-built solution. For modifications or enhancements, please consult with the development team.

## License

Proprietary - All rights reserved

## Support

For support, please contact the system administrator or development team.

---

**Built for NSFAS Compliance - 2025**

This system helps student accommodation providers meet all NSFAS requirements and deliver the best student accommodation experience.
