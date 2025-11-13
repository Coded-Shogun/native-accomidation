# Quick Setup Guide

## Step-by-Step Installation

### 1. Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client && npm install && cd ..
```

### 2. Create Environment File

```bash
cp .env.example .env
```

Edit `.env` if needed (defaults work for development).

### 3. Start the System

#### Option A: Run Both Servers Separately

```bash
# Terminal 1: Backend
npm run dev

# Terminal 2: Frontend
cd client && npm start
```

#### Option B: Run Both Together (Recommended)

```bash
npm run dev:full
```

### 4. Access the Application

- Open browser to: **http://localhost:3000**
- Backend API: **http://localhost:5000**

### 5. Initial Setup

1. **Add Your First Property**
   - Click "Properties" in navigation
   - Click "+ Add Property"
   - Enter property details
   - Click "Add Property"

2. **Initialize NSFAS Compliance**
   - After adding property, click "Initialize Compliance"
   - This creates a complete checklist

3. **Add Students**
   - Click "Students" in navigation
   - Click "+ Add Student"
   - Fill in required fields
   - System automatically checks eligibility

4. **Start Managing**
   - Log maintenance requests
   - Track access control
   - Monitor compliance
   - View dashboard statistics

## Quick Tips

### NSFAS Eligibility
Students are automatically eligible if:
- They live ≥20km from campus
- They are NSFAS beneficiaries (optional but preferred)

### Compliance Tips
- Initialize compliance checklist for each property
- Update compliance items as you complete inspections
- Monitor facility ratios (1:4 sinks, 1:7 showers)
- Ensure single rooms are >8 sqm

### Washing Machine Maintenance
- Category specifically tracks washing machine issues
- Priority system helps manage urgent repairs
- Track costs for budgeting

## Common Commands

```bash
# Start development
npm run dev

# Start frontend only
cd client && npm start

# Build for production
npm run build

# Start production server
npm start

# Reset database (deletes all data)
rm database/accommodation.db && npm start
```

## Need Help?

- Check the main README.md for detailed documentation
- Review API documentation for integration
- Check the browser console for frontend errors
- Check terminal output for backend errors

## System Requirements

- Node.js v14 or higher
- 100MB free disk space
- Modern web browser (Chrome, Firefox, Safari, Edge)

---

**You're all set! Start managing your student accommodation properties with NSFAS compliance.**
