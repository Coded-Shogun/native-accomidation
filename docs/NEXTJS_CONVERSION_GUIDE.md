# Converting to Next.js - Complete Guide

## Current Architecture

The application currently uses:
- **Frontend**: Create React App (React 18) with React Router
- **Backend**: Express.js with SQLite
- **Structure**: Separate frontend (`/client`) and backend (`/server`)

## Conversion Options

### Option 1: Full Next.js Conversion (Recommended)

Convert both frontend and backend to a unified Next.js application.

**Pros:**
- Server-Side Rendering (SSR) for better performance
- Better SEO capabilities
- Simplified deployment (single app)
- Built-in API routes
- Automatic code splitting
- Image optimization
- TypeScript support

**Cons:**
- Significant refactoring required
- Learning curve for Next.js patterns
- Migration time: 2-3 weeks

### Option 2: Next.js Frontend + Keep Express Backend

Only convert the frontend to Next.js, keep Express backend.

**Pros:**
- Less refactoring (backend unchanged)
- Still get SSR and Next.js benefits
- Gradual migration possible
- Migration time: 1 week

**Cons:**
- Still need to deploy two apps
- More complex architecture

---

## Option 1: Full Next.js Conversion

### Step 1: Create Next.js Project

```bash
# In project root
npx create-next-app@latest accommodation-nextjs --typescript --tailwind --app
cd accommodation-nextjs
```

Or without TypeScript:
```bash
npx create-next-app@latest accommodation-nextjs --app
```

### Step 2: Project Structure

```
accommodation-nextjs/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.js
│   │   └── register/
│   │       └── page.js
│   ├── (management)/
│   │   ├── layout.js          # Management portal layout with navbar
│   │   ├── page.js            # Dashboard
│   │   ├── properties/
│   │   │   ├── page.js
│   │   │   ├── [id]/page.js
│   │   │   └── new/page.js
│   │   ├── students/
│   │   │   └── page.js
│   │   ├── bursary/
│   │   │   ├── page.js        # Bursary dashboard
│   │   │   ├── providers/
│   │   │   │   ├── page.js
│   │   │   │   ├── [id]/page.js
│   │   │   │   └── new/page.js
│   │   │   ├── student-bursaries/
│   │   │   │   ├── page.js
│   │   │   │   └── [id]/page.js
│   │   │   ├── verification/
│   │   │   │   └── page.js
│   │   │   └── reports/
│   │   │       ├── page.js
│   │   │       └── [id]/page.js
│   │   ├── maintenance/
│   │   │   └── page.js
│   │   ├── compliance/
│   │   │   └── page.js
│   │   └── access/
│   │       └── page.js
│   ├── student/
│   │   ├── layout.js          # Student portal layout
│   │   ├── page.js            # Student dashboard
│   │   ├── maintenance/
│   │   │   └── page.js
│   │   ├── laundry/
│   │   │   └── page.js
│   │   └── visitors/
│   │       └── page.js
│   ├── api/
│   │   ├── students/
│   │   │   ├── route.js
│   │   │   └── [id]/route.js
│   │   ├── properties/
│   │   │   └── route.js
│   │   ├── management/
│   │   │   ├── bursary-providers/
│   │   │   │   ├── route.js
│   │   │   │   └── [id]/route.js
│   │   │   ├── student-bursaries/
│   │   │   │   ├── route.js
│   │   │   │   ├── [id]/route.js
│   │   │   │   └── stats/
│   │   │   │       └── summary/route.js
│   │   │   └── bursary-reports/
│   │   │       ├── route.js
│   │   │       └── generate/route.js
│   │   └── student/
│   │       ├── accommodation/route.js
│   │       └── maintenance-requests/route.js
│   ├── layout.js              # Root layout
│   └── globals.css
├── components/
│   ├── management/
│   │   ├── BursaryDashboard.jsx
│   │   ├── ProviderCard.jsx
│   │   └── ComplianceTable.jsx
│   ├── student/
│   │   └── NoticeCard.jsx
│   └── shared/
│       ├── Navbar.jsx
│       └── Button.jsx
├── lib/
│   ├── db.js                  # Database connection
│   ├── auth.js                # Authentication helpers
│   └── utils.js
├── middleware.js              # Auth middleware
├── public/
└── package.json
```

### Step 3: Convert React Components to Next.js Pages

#### Example: Bursary Management Dashboard

**Current (React Router):**
```javascript
// client/src/components/management/BursaryManagement.js
import { Routes, Route } from 'react-router-dom';

function BursaryManagement() {
  return (
    <Routes>
      <Route path="/" element={<BursaryDashboard />} />
      <Route path="/providers/*" element={<BursaryProviders />} />
    </Routes>
  );
}
```

**Next.js Version:**
```javascript
// app/(management)/bursary/page.js
import { BursaryDashboard } from '@/components/management/BursaryDashboard';

export const metadata = {
  title: 'Bursary Management - Student Accommodation',
  description: 'NSFAS-compliant bursary tracking and reporting',
};

export default function BursaryPage() {
  return <BursaryDashboard />;
}
```

#### Example: Bursary Dashboard Component

```javascript
// components/management/BursaryDashboard.jsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export function BursaryDashboard() {
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, alertsRes] = await Promise.all([
        fetch('/api/management/student-bursaries/stats/summary'),
        fetch('/api/management/bursary-compliance-alerts?status=open&limit=5'),
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (alertsRes.ok) setAlerts(await alertsRes.json());
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="bursary-dashboard">
      <div className="dashboard-header">
        <h2>Bursary Management Dashboard</h2>
        <p>NSFAS-compliant tracking and reporting system</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats?.total_bursaries || 0}</div>
          <div className="stat-label">Total Bursaries</div>
        </div>
        {/* More stats... */}
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <Link href="/bursary/student-bursaries/assign" className="btn btn-primary">
          Assign Bursary
        </Link>
        <Link href="/bursary/verification" className="btn btn-success">
          Record Verification
        </Link>
      </div>

      {/* Recent Alerts */}
      <div className="alerts-section">
        <h3>Recent Compliance Alerts</h3>
        {alerts.map(alert => (
          <div key={alert.id} className={`alert alert-${alert.severity}`}>
            <div className="alert-title">{alert.title}</div>
            <div className="alert-description">{alert.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Step 4: Convert Express API Routes to Next.js API Routes

#### Example: Bursary Providers API

**Current (Express):**
```javascript
// server/routes/management/bursary-providers.js
router.get('/', async (req, res) => {
  const { is_active } = req.query;
  let sql = 'SELECT * FROM bursary_providers';
  // ... query logic
  res.json(providers);
});

router.post('/', async (req, res) => {
  const { name, type } = req.body;
  // ... insert logic
  res.status(201).json({ message: 'Created', id: result.lastID });
});
```

**Next.js Version:**
```javascript
// app/api/management/bursary-providers/route.js
import { NextResponse } from 'next/server';
import { getAll, runQuery } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function GET(request) {
  // Check authentication
  const user = await verifyAuth(request);
  if (!user || !['manager', 'admin'].includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const is_active = searchParams.get('is_active');

    let sql = 'SELECT * FROM bursary_providers';
    const params = [];

    if (is_active !== null) {
      sql += ' WHERE is_active = ?';
      params.push(is_active === 'true' ? 1 : 0);
    }

    sql += ' ORDER BY name';

    const providers = await getAll(sql, params);
    return NextResponse.json(providers);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const user = await verifyAuth(request);
  if (!user || !['manager', 'admin'].includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, type, contact_person, contact_email } = body;

    if (!name || !type) {
      return NextResponse.json(
        { error: 'Name and type are required' },
        { status: 400 }
      );
    }

    const result = await runQuery(
      `INSERT INTO bursary_providers (name, type, contact_person, contact_email)
       VALUES (?, ?, ?, ?)`,
      [name, type, contact_person || null, contact_email || null]
    );

    return NextResponse.json(
      { message: 'Provider created successfully', id: result.lastID },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

### Step 5: Database Connection

```javascript
// lib/db.js
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

let db = null;

export async function getDb() {
  if (!db) {
    db = await open({
      filename: process.env.DB_PATH || './database/accommodation.db',
      driver: sqlite3.Database,
    });
  }
  return db;
}

export async function getAll(sql, params = []) {
  const database = await getDb();
  return database.all(sql, params);
}

export async function getOne(sql, params = []) {
  const database = await getDb();
  return database.get(sql, params);
}

export async function runQuery(sql, params = []) {
  const database = await getDb();
  return database.run(sql, params);
}
```

### Step 6: Authentication Middleware

```javascript
// lib/auth.js
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

export async function verifyAuth(request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return null;
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    return payload;
  } catch (error) {
    return null;
  }
}

export function requireAuth(roles = []) {
  return async (request) => {
    const user = await verifyAuth(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (roles.length > 0 && !roles.includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return user;
  };
}
```

```javascript
// middleware.js - Route protection
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request) {
  // Protect management routes
  if (request.nextUrl.pathname.startsWith('/bursary') ||
      request.nextUrl.pathname.startsWith('/properties') ||
      request.nextUrl.pathname.startsWith('/students')) {

    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      await jwtVerify(token, secret);
      return NextResponse.next();
    } catch (error) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/bursary/:path*',
    '/properties/:path*',
    '/students/:path*',
    '/maintenance/:path*',
  ],
};
```

### Step 7: Layout Structure

```javascript
// app/layout.js - Root layout
export const metadata = {
  title: 'Student Accommodation Management',
  description: 'NSFAS-compliant accommodation management system',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

```javascript
// app/(management)/layout.js - Management portal layout
import Link from 'next/link';
import './styles.css';

export default function ManagementLayout({ children }) {
  return (
    <div className="management-portal">
      <nav className="navbar">
        <div className="navbar-brand">
          <h1>Student Accommodation Manager</h1>
          <p className="navbar-subtitle">NSFAS Compliant System</p>
        </div>
        <div className="navbar-links">
          <Link href="/">Dashboard</Link>
          <Link href="/properties">Properties</Link>
          <Link href="/students">Students</Link>
          <Link href="/bursary">Bursary Management</Link>
          <Link href="/maintenance">Maintenance</Link>
          <Link href="/compliance">NSFAS Compliance</Link>
          <Link href="/access">Access Control</Link>
          <Link href="/student">Student Portal</Link>
        </div>
      </nav>

      <main className="main-content">
        {children}
      </main>

      <footer className="footer">
        <p>© 2025 Student Accommodation Management System | ISO 27001 & SOC 2 Compliant</p>
      </footer>
    </div>
  );
}
```

### Step 8: Environment Variables

```bash
# .env.local
DATABASE_URL=./database/accommodation.db
JWT_SECRET=your-secret-key-change-in-production
NODE_ENV=development
```

### Step 9: Package.json

```json
{
  "name": "accommodation-nextjs",
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "sqlite": "^5.1.1",
    "sqlite3": "^5.1.7",
    "jose": "^5.1.3",
    "bcryptjs": "^2.4.3",
    "nodemailer": "^6.9.7"
  },
  "devDependencies": {
    "eslint": "^8",
    "eslint-config-next": "^14.0.0"
  }
}
```

### Step 10: Migration Checklist

- [ ] Create Next.js project structure
- [ ] Convert all React components to Next.js pages/components
- [ ] Convert Express routes to Next.js API routes
- [ ] Set up database connection
- [ ] Implement authentication middleware
- [ ] Create layouts for management and student portals
- [ ] Migrate all CSS files
- [ ] Update all navigation (React Router → Next.js Link/useRouter)
- [ ] Test all API endpoints
- [ ] Test all pages and functionality
- [ ] Update documentation
- [ ] Deploy to Vercel/other hosting

---

## Option 2: Next.js Frontend + Express Backend

Keep your Express backend, only convert frontend to Next.js.

### Quick Conversion Steps:

1. **Create Next.js App:**
```bash
npx create-next-app@latest client-nextjs
cd client-nextjs
```

2. **Convert Components:**
   - Move components to `/components` folder
   - Add 'use client' directive to interactive components
   - Replace `useNavigate` with `useRouter` from 'next/navigation'
   - Replace `<Link>` from react-router with next/link

3. **API Calls:**
   - Keep all API calls pointing to Express backend
   - Use environment variable for API URL

```javascript
// .env.local
NEXT_PUBLIC_API_URL=http://localhost:5000
```

```javascript
// lib/api.js
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function fetchBursaries(filters) {
  const response = await fetch(`${API_URL}/api/management/student-bursaries`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return response.json();
}
```

4. **Deployment:**
   - Deploy Next.js frontend to Vercel
   - Deploy Express backend separately
   - Configure CORS on backend

---

## Recommendation

**For Your Project**: I recommend **Option 1 (Full Next.js)** because:

1. **Better Performance**: SSR improves load times
2. **Simpler Deployment**: One application instead of two
3. **Better SEO**: Important for marketing your accommodation
4. **Modern Stack**: Next.js is the industry standard for React apps
5. **Built-in Optimization**: Automatic image optimization, code splitting

**Timeline**: 2-3 weeks for full conversion

**Alternative**: Start with Option 2 (Next.js frontend only) for quicker migration, then migrate backend later.

---

## Need Help with Conversion?

I can help you:
1. Create the Next.js project structure
2. Convert specific components/routes
3. Set up the database layer
4. Implement authentication
5. Test and deploy

Would you like me to start the conversion process?
